"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  computeGroupBalances,
  syncAndReadGroupBalancesTable,
} from "@/lib/balance-sync";
import type {
  Group,
  Member,
  Expense,
  Balance,
  Settlement,
  ActivityItem,
} from "@/types/group";

/**
 * Core data hook — fetches ALL group data via `get_group_details` RPC
 * and ensures `public.balances` is synchronized and used as the source of truth.
 */
export function useGroupData(groupId: string) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  /* ── State ───────────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [pendingSettlements, setPendingSettlements] = useState<Settlement[]>([]);
  const [completedSettlements, setCompletedSettlements] = useState<Settlement[]>([]);

  // Track initial load so refetches don't flash the full-page spinner
  const initialLoadDone = useRef(false);

  /* ── Single RPC fetch + Authoritative Balance Table Sync ── */
  const fetchData = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);
    setError(null);

    try {
      // 1. Auth guard
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!user || authError) {
        router.replace("/login");
        return;
      }
      setCurrentUser(user.id);

      // 2. Single RPC fetch
      const { data, error: rpcError } = await supabase.rpc("get_group_details", {
        p_group_id: groupId,
      });

      if (rpcError) throw rpcError;

      if (!data || !data.group) {
        setError("Group not found.");
        return;
      }

      // 3. Hydrate state
      setGroup(data.group as Group);

      const hydratedMembers: Member[] = (data.members || []).map((m: any) => {
        const uid = m.id || m.user_id;
        return {
          ...m,
          id: uid,
          user_id: uid,
          profiles: m.profiles || {
            username: m.username,
            full_name: m.full_name,
            display_name: m.display_name,
            avatar_url: m.avatar_url,
          },
        };
      });
      setMembers(hydratedMembers);

      const hydratedExpenses: Expense[] = (data.expenses as Expense[]) || [];
      setExpenses(hydratedExpenses);

      const mapSettlements = (arr: any[]): Settlement[] => {
        return (arr || []).map((s) => ({
          ...s,
          from_profile: s.from_profile,
          to_profile: s.to_profile,
          profiles_from: s.from_profile,
          profiles_to: s.to_profile,
        }));
      };

      const hydratedPending = mapSettlements(data.pending_settlements);
      const hydratedCompleted = mapSettlements(data.completed_settlements);

      setPendingSettlements(hydratedPending);
      setCompletedSettlements(hydratedCompleted);

      // 4. Compute exact balances from all group expenses & settlements,
      // synchronize `public.balances`, and read back from `public.balances`
      const computedBalances = computeGroupBalances(
        hydratedMembers,
        hydratedExpenses,
        hydratedCompleted
      );

      // Set immediate balances while DB table sync completes
      setBalances(
        computedBalances.length > 0
          ? computedBalances
          : ((data.balances as Balance[]) || [])
      );

      const tableBalances = await syncAndReadGroupBalancesTable(
        supabase,
        groupId,
        hydratedMembers,
        computedBalances
      );
      setBalances(tableBalances);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch group data."
      );
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [supabase, groupId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Derived values ──────────────────────────────────── */
  const isOwner = currentUser === group?.owner_id;

  const otherMembers = useMemo(
    () => members.filter((m) => m.id !== currentUser),
    [members, currentUser]
  );

  const myBalance = balances.find((b) => b.user_id === currentUser);
  const myNetBalance = myBalance?.net_balance ?? 0;
  const canLeave = Math.abs(myNetBalance) < 0.01;

  const totalGroupExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses]
  );

  const allActivities: ActivityItem[] = useMemo(
    () =>
      [
        ...expenses.map((e) => ({ ...e, type: "expense" as const })),
        ...completedSettlements.map((s) => ({
          ...s,
          type: "settlement" as const,
        })),
      ].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [expenses, completedSettlements]
  );

  /* ── Public API ──────────────────────────────────────── */
  return {
    loading,
    error,
    group,
    members,
    expenses,
    currentUser,
    balances,
    pendingSettlements,
    completedSettlements,

    // Derived
    isOwner,
    otherMembers,
    myNetBalance,
    canLeave,
    totalGroupExpenses,
    allActivities,

    refetch: fetchData,
    goBack: () => router.back(),
  };
}