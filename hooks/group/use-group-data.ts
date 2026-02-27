"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  Group,
  Member,
  Expense,
  Balance,
  Settlement,
  ActivityItem,
} from "@/types/group";

/**
 * Core data hook — fetches ALL group data via a single
 * `get_group_details` RPC call instead of 7 separate queries.
 */
export function useGroupData(groupId: string) {
  const router = useRouter();
  const supabase = createClient();

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

/* ── Single RPC fetch ────────────────────────────────── */
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

    // 2. Single RPC — replaces 7 separate queries
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

    setMembers(
      (data.members || []).map((m: any) => ({
        ...m,
        profiles: m.profiles || {
          username: m.username,
          full_name: m.full_name,
          display_name: m.display_name,
          avatar_url: m.avatar_url,
        },
      }))
    );

    setExpenses((data.expenses as Expense[]) || []);
    setBalances((data.balances as Balance[]) || []);

    // إصلاح تعارض واجهة المستخدم (UI Shape Mismatch) للتسويات
    const mapSettlements = (arr: any[]) => {
      return (arr || []).map((s) => ({
        ...s,
        // نقوم بنسخ البيانات للأماكن التي قد تتوقعها واجهة المستخدم القديمة
        // لضمان عدم حدوث TypeError: Cannot read properties of undefined
        from_profile: s.from_profile,
        to_profile: s.to_profile,
        profiles_from: s.from_profile, 
        profiles_to: s.to_profile,
      }));
    };

    setPendingSettlements(mapSettlements(data.pending_settlements));
    setCompletedSettlements(mapSettlements(data.completed_settlements));
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to fetch group data.");
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
  const canLeave = myNetBalance === 0;

  const totalGroupExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses]
  );

  const allActivities: ActivityItem[] = useMemo(
    () =>
      [
        ...expenses.map((e) => ({ ...e, type: "expense" as const })),
        ...completedSettlements.map((s) => ({ ...s, type: "settlement" as const })),
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