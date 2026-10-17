import type { SupabaseClient } from "@supabase/supabase-js";
import type { Balance, Member, Expense, Settlement } from "@/types/group";

/**
 * Deterministically computes the exact total_paid, total_owed, and net_balance
 * for every member in a group from expenses, splits, and completed/approved settlements.
 *
 * Formula (matches use-profile.ts & authoritative ledger math):
 *   total_paid  = sum(expenses paid by user) + sum(completed settlements sent by user)
 *   total_owed  = sum(expense splits owed by user) + sum(completed settlements received by user)
 *   net_balance = total_paid - total_owed
 */
export function computeGroupBalances(
  members: Member[],
  expenses: Expense[],
  completedSettlements: Settlement[]
): Balance[] {
  const balanceMap = new Map<
    string,
    {
      display_name: string;
      avatar_url: string;
      total_paid: number;
      total_owed: number;
    }
  >();

  // Initialize all group members
  for (const m of members) {
    const uid = (m as any).user_id || m.id;
    if (!uid) continue;
    balanceMap.set(uid, {
      display_name:
        m.display_name ||
        m.profiles?.display_name ||
        m.full_name ||
        m.profiles?.full_name ||
        m.username ||
        m.profiles?.username ||
        "User",
      avatar_url: m.avatar_url || m.profiles?.avatar_url || "",
      total_paid: 0,
      total_owed: 0,
    });
  }

  // Accumulate from expenses and their splits
  for (const exp of expenses) {
    const amount = Number(exp.amount) || 0;
    if (exp.paid_by) {
      const payer = balanceMap.get(exp.paid_by) ?? {
        display_name:
          exp.profiles?.display_name ||
          exp.profiles?.full_name ||
          exp.profiles?.username ||
          "User",
        avatar_url: (exp.profiles as any)?.avatar_url || "",
        total_paid: 0,
        total_owed: 0,
      };
      payer.total_paid += amount;
      balanceMap.set(exp.paid_by, payer);
    }

    const rawSplits = (exp.expense_splits ?? []) as Array<{
      user_id?: string;
      amount?: number | string;
      owed_amount?: number | string;
      split_amount?: number | string;
      profiles?: {
        display_name?: string;
        full_name?: string;
        username?: string;
        avatar_url?: string;
      };
    }>;

    const fallbackEven =
      rawSplits.length > 0 ? amount / rawSplits.length : 0;

    for (const split of rawSplits) {
      if (!split.user_id) continue;
      const rawOwed = Number(
        split.amount ?? split.owed_amount ?? split.split_amount
      );
      const owed =
        Number.isFinite(rawOwed) && rawOwed >= 0 ? rawOwed : fallbackEven;

      const participant = balanceMap.get(split.user_id) ?? {
        display_name:
          split.profiles?.display_name ||
          split.profiles?.full_name ||
          split.profiles?.username ||
          "User",
        avatar_url: split.profiles?.avatar_url || "",
        total_paid: 0,
        total_owed: 0,
      };
      participant.total_owed += owed;
      balanceMap.set(split.user_id, participant);
    }
  }

  // Accumulate completed/approved settlements
  for (const s of completedSettlements) {
    if (
      s.status &&
      s.status !== "completed" &&
      (s.status as string) !== "approved"
    ) {
      continue;
    }
    const amt = Number(s.amount) || 0;
    if (amt <= 0) continue;

    if (s.from_user) {
      const fromEntry = balanceMap.get(s.from_user) ?? {
        display_name:
          s.from_profile?.display_name || s.from_profile?.username || "User",
        avatar_url: s.from_profile?.avatar_url || "",
        total_paid: 0,
        total_owed: 0,
      };
      fromEntry.total_paid += amt;
      balanceMap.set(s.from_user, fromEntry);
    }

    if (s.to_user) {
      const toEntry = balanceMap.get(s.to_user) ?? {
        display_name:
          s.to_profile?.display_name || s.to_profile?.username || "User",
        avatar_url: s.to_profile?.avatar_url || "",
        total_paid: 0,
        total_owed: 0,
      };
      toEntry.total_owed += amt;
      balanceMap.set(s.to_user, toEntry);
    }
  }

  return Array.from(balanceMap.entries()).map(([user_id, entry]) => {
    const total_paid = Math.round(entry.total_paid * 100) / 100;
    const total_owed = Math.round(entry.total_owed * 100) / 100;
    const rawNet = Math.round((total_paid - total_owed) * 100) / 100;
    const net_balance = Object.is(rawNet, -0) ? 0 : rawNet;

    return {
      user_id,
      display_name: entry.display_name,
      avatar_url: entry.avatar_url,
      total_paid,
      total_owed,
      net_balance,
    };
  });
}

/**
 * Synchronizes the authoritative balances for a group into `public.balances`
 * and returns the synchronized rows from `public.balances` enriched with member profiles.
 */
export async function syncAndReadGroupBalancesTable(
  supabase: SupabaseClient,
  groupId: string,
  members: Member[],
  computedBalances: Balance[]
): Promise<Balance[]> {
  if (!groupId) return computedBalances;

  const profileByUserId = new Map<
    string,
    { display_name: string; avatar_url: string }
  >();
  for (const m of members) {
    const uid = (m as any).user_id || m.id;
    if (!uid) continue;
    profileByUserId.set(uid, {
      display_name:
        m.display_name ||
        m.profiles?.display_name ||
        m.full_name ||
        m.profiles?.full_name ||
        m.username ||
        m.profiles?.username ||
        "User",
      avatar_url: m.avatar_url || m.profiles?.avatar_url || "",
    });
  }
  for (const b of computedBalances) {
    if (!profileByUserId.has(b.user_id)) {
      profileByUserId.set(b.user_id, {
        display_name: b.display_name || "User",
        avatar_url: b.avatar_url || "",
      });
    }
  }

  try {
    // 1. Try calling the database recalculate_group_balances RPC if installed
    await supabase.rpc("recalculate_group_balances", {
      _group_id: groupId,
    });
  } catch {
    // Ignore if RPC is not yet created by the user in Supabase SQL Editor
  }

  try {
    // 2. Read current rows from public.balances
    const { data: existingRows, error: fetchError } = await supabase
      .from("balances")
      .select("id, user_id, total_paid, total_owed, net_balance")
      .eq("group_id", groupId);

    if (fetchError) {
      return computedBalances;
    }

    const existingByUser = new Map<
      string,
      {
        id?: string;
        total_paid: number;
        total_owed: number;
        net_balance: number;
      }
    >();
    const duplicateIdsToDelete: string[] = [];

    for (const row of existingRows ?? []) {
      if (!row.user_id) continue;
      if (existingByUser.has(row.user_id)) {
        if (row.id) duplicateIdsToDelete.push(row.id);
      } else {
        existingByUser.set(row.user_id, {
          id: row.id,
          total_paid: Number(row.total_paid) || 0,
          total_owed: Number(row.total_owed) || 0,
          net_balance: Number(row.net_balance) || 0,
        });
      }
    }

    if (duplicateIdsToDelete.length > 0) {
      await supabase.from("balances").delete().in("id", duplicateIdsToDelete);
    }

    // 3. If computedBalances are provided (e.g., when we have full group expenses),
    // repair any drifted rows in public.balances so the DB table is 100% accurate.
    if (computedBalances.length > 0) {
      const nowIso = new Date().toISOString();
      const toInsert: Array<{
        group_id: string;
        user_id: string;
        total_paid: number;
        total_owed: number;
        net_balance: number;
        updated_at: string;
      }> = [];
      const updatePromises: PromiseLike<unknown>[] = [];

      for (const b of computedBalances) {
        const existing = existingByUser.get(b.user_id);
        if (!existing) {
          toInsert.push({
            group_id: groupId,
            user_id: b.user_id,
            total_paid: b.total_paid,
            total_owed: b.total_owed,
            net_balance: b.net_balance,
            updated_at: nowIso,
          });
        } else {
          const paidDiff = Math.abs(existing.total_paid - b.total_paid);
          const owedDiff = Math.abs(existing.total_owed - b.total_owed);
          const netDiff = Math.abs(existing.net_balance - b.net_balance);

          if (paidDiff > 0.005 || owedDiff > 0.005 || netDiff > 0.005) {
            const query = supabase
              .from("balances")
              .update({
                total_paid: b.total_paid,
                total_owed: b.total_owed,
                net_balance: b.net_balance,
                updated_at: nowIso,
              });

            updatePromises.push(
              existing.id
                ? query.eq("id", existing.id)
                : query.eq("group_id", groupId).eq("user_id", b.user_id)
            );
          }
        }
      }

      if (toInsert.length > 0) {
        await supabase.from("balances").insert(toInsert);
      }
      if (updatePromises.length > 0) {
        await Promise.allSettled(updatePromises);
      }
    }

    // 4. Read back the authoritative rows from public.balances
    const { data: syncedRows, error: finalReadError } = await supabase
      .from("balances")
      .select("user_id, total_paid, total_owed, net_balance")
      .eq("group_id", groupId);

    if (finalReadError || !syncedRows || syncedRows.length === 0) {
      return computedBalances;
    }

    return syncedRows.map((row) => {
      const prof = profileByUserId.get(row.user_id);
      const total_paid = Math.round((Number(row.total_paid) || 0) * 100) / 100;
      const total_owed = Math.round((Number(row.total_owed) || 0) * 100) / 100;
      const rawNet = Math.round((Number(row.net_balance) || 0) * 100) / 100;
      return {
        user_id: row.user_id,
        display_name: prof?.display_name || "User",
        avatar_url: prof?.avatar_url || "",
        total_paid,
        total_owed,
        net_balance: Object.is(rawNet, -0) ? 0 : rawNet,
      };
    });
  } catch (err) {
    console.warn("Balance table sync fallback:", err);
    return computedBalances;
  }
}
