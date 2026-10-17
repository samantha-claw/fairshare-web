"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Profile, GroupBalance, RecentExpense } from "@/types/dashboard";

export function useDashboard() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroups] = useState<GroupBalance[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);

  /* ── Derived Data ────────────────────────────────────── */

  const totalOwedToMe = groups.reduce(
    (sum, g) => (g.net_balance > 0 ? sum + g.net_balance : sum),
    0
  );
  const totalIOwe = groups.reduce(
    (sum, g) => (g.net_balance < 0 ? sum + Math.abs(g.net_balance) : sum),
    0
  );
  const totalNet = Math.round((totalOwedToMe - totalIOwe) * 100) / 100;

  const displayName = profile?.display_name || "User";
  const avatarUrl = profile?.avatar_url || "";

  /* ── Core Fetch + Authoritative Balance Table Sync ──── */

  const fetchDashboard = useCallback(async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (!user || authError) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase.rpc("get_dashboard_data");
      if (error) throw error;

      setProfile(data.profile);
      const rpcGroups: GroupBalance[] = data.groups || [];
      setRecentExpenses(data.recent_expenses || []);

      if (rpcGroups.length === 0) {
        setGroups([]);
        return;
      }

      const groupIds = rpcGroups.map((g) => g.group_id);

      // Reconcile the user's rows in `public.balances` against actual expenses, splits, and settlements
      // so `public.balances` is always accurate even before running the SQL migration trigger.
      const [
        { data: expensesPaid },
        { data: mySplits },
        { data: settlementsSent },
        { data: settlementsReceived },
        { data: existingBalanceRows },
      ] = await Promise.all([
        supabase
          .from("expenses")
          .select("group_id, amount")
          .in("group_id", groupIds)
          .eq("paid_by", user.id),
        supabase
          .from("expense_splits")
          .select("amount, expenses!inner(group_id)")
          .eq("user_id", user.id),
        supabase
          .from("settlements")
          .select("group_id, amount, status")
          .in("group_id", groupIds)
          .eq("from_user", user.id)
          .in("status", ["completed", "approved"]),
        supabase
          .from("settlements")
          .select("group_id, amount, status")
          .in("group_id", groupIds)
          .eq("to_user", user.id)
          .in("status", ["completed", "approved"]),
        supabase
          .from("balances")
          .select("id, group_id, total_paid, total_owed, net_balance")
          .eq("user_id", user.id)
          .in("group_id", groupIds),
      ]);

      const existingByGroup = new Map<
        string,
        { id?: string; total_paid: number; total_owed: number; net_balance: number }
      >();
      for (const row of existingBalanceRows ?? []) {
        if (!existingByGroup.has(row.group_id)) {
          existingByGroup.set(row.group_id, {
            id: row.id,
            total_paid: Number(row.total_paid) || 0,
            total_owed: Number(row.total_owed) || 0,
            net_balance: Number(row.net_balance) || 0,
          });
        }
      }

      const nowIso = new Date().toISOString();
      const toInsert: any[] = [];
      const updatePromises: PromiseLike<unknown>[] = [];

      for (const g of rpcGroups) {
        const paidExp = (expensesPaid ?? [])
          .filter((e: any) => e.group_id === g.group_id)
          .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
        const paidSet = (settlementsSent ?? [])
          .filter((s: any) => s.group_id === g.group_id)
          .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
        const owedExp = (mySplits ?? [])
          .filter((s: any) => {
            const expGroup = Array.isArray(s.expenses)
              ? s.expenses[0]?.group_id
              : s.expenses?.group_id;
            return expGroup === g.group_id;
          })
          .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
        const owedSet = (settlementsReceived ?? [])
          .filter((s: any) => s.group_id === g.group_id)
          .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);

        const total_paid = Math.round((paidExp + paidSet) * 100) / 100;
        const total_owed = Math.round((owedExp + owedSet) * 100) / 100;
        const rawNet = Math.round((total_paid - total_owed) * 100) / 100;
        const net_balance = Object.is(rawNet, -0) ? 0 : rawNet;

        const existing = existingByGroup.get(g.group_id);
        if (!existing) {
          toInsert.push({
            group_id: g.group_id,
            user_id: user.id,
            total_paid,
            total_owed,
            net_balance,
            updated_at: nowIso,
          });
          existingByGroup.set(g.group_id, { total_paid, total_owed, net_balance });
        } else if (
          Math.abs(existing.total_paid - total_paid) > 0.005 ||
          Math.abs(existing.total_owed - total_owed) > 0.005 ||
          Math.abs(existing.net_balance - net_balance) > 0.005
        ) {
          const query = supabase.from("balances").update({
            total_paid,
            total_owed,
            net_balance,
            updated_at: nowIso,
          });
          updatePromises.push(
            existing.id
              ? query.eq("id", existing.id)
              : query.eq("group_id", g.group_id).eq("user_id", user.id)
          );
          existingByGroup.set(g.group_id, {
            id: existing.id,
            total_paid,
            total_owed,
            net_balance,
          });
        }
      }

      if (toInsert.length > 0) {
        await supabase.from("balances").insert(toInsert);
      }
      if (updatePromises.length > 0) {
        await Promise.allSettled(updatePromises);
      }

      // Read back from the synchronized `public.balances` table
      const { data: syncedBalances } = await supabase
        .from("balances")
        .select("group_id, total_paid, total_owed, net_balance")
        .eq("user_id", user.id)
        .in("group_id", groupIds);

      const finalBalanceMap = new Map<
        string,
        { total_paid: number; total_owed: number; net_balance: number }
      >();
      for (const b of syncedBalances ?? []) {
        finalBalanceMap.set(b.group_id, {
          total_paid: Number(b.total_paid) || 0,
          total_owed: Number(b.total_owed) || 0,
          net_balance: Number(b.net_balance) || 0,
        });
      }

      setGroups(
        rpcGroups.map((g) => {
          const synced =
            finalBalanceMap.get(g.group_id) ?? existingByGroup.get(g.group_id);
          return synced
            ? {
                ...g,
                total_paid: synced.total_paid,
                total_owed: synced.total_owed,
                net_balance: synced.net_balance,
              }
            : g;
        })
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  /* ── Realtime ────────────────────────────────────────── */

  useEffect(() => {
    if (!userId) return;

    let debounceTimer: NodeJS.Timeout;
    const debouncedFetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchDashboard(), 800);
    };

    const channel = supabase
      .channel(`dashboard-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_members",
          filter: `user_id=eq.${userId}`,
        },
        debouncedFetch
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "balances",
          filter: `user_id=eq.${userId}`,
        },
        debouncedFetch
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
        },
        debouncedFetch
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settlements",
        },
        debouncedFetch
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, fetchDashboard]);

  /* ── Actions ─────────────────────────────────────────── */

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  /* ── Return ──────────────────────────────────────────── */

  return {
    loading,
    userId,
    profile,
    groups,
    recentExpenses,
    totalOwedToMe,
    totalIOwe,
    totalNet,
    displayName,
    avatarUrl,
    handleSignOut,
  };
}