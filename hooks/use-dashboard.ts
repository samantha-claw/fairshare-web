"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Profile, GroupBalance, RecentExpense } from "@/types/dashboard";

// ==========================================
// ⚙️ LOGIC & STATE
// ==========================================

export function useDashboard() {
  const router = useRouter();
  const supabase = createClient();
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
  const totalNet = totalOwedToMe - totalIOwe;

  const displayName = profile?.display_name || "User";
  const avatarUrl = profile?.avatar_url || "";

  /* ── Core Fetch ──────────────────────────────────────── */

  const fetchDashboard = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      const uid = session.user.id;
      setUserId(uid);

      // 1. Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", uid)
        .single();
      if (profileData)
        setProfile({
          display_name: profileData.display_name || "User",
          avatar_url: profileData.avatar_url || "",
        });

      // 2. Fetch Groups
      const { data: memberships } = await supabase
        .from("group_members")
        .select(`group_id, groups ( id, name, currency, created_at, owner_id )`)
        .eq("user_id", uid);

      if (!memberships || memberships.length === 0) {
        setGroups([]);
        setRecentExpenses([]);
        return;
      }

      const groupIds = memberships.map((m) => m.group_id);

      // 3. Fetch all financial data
      const { data: expensesPaidByMe } = await supabase
        .from("expenses")
        .select("group_id, amount")
        .in("group_id", groupIds)
        .eq("paid_by", uid);

      const { data: mySplits } = await supabase
        .from("expense_splits")
        .select("amount, expenses(group_id)")
        .eq("user_id", uid);

      const { data: settlementsPaidByMe } = await supabase
        .from("settlements")
        .select("group_id, amount")
        .in("group_id", groupIds)
        .eq("from_user", uid)
        .eq("status", "completed");

      const { data: settlementsReceivedByMe } = await supabase
        .from("settlements")
        .select("group_id, amount")
        .in("group_id", groupIds)
        .eq("to_user", uid)
        .eq("status", "completed");

      // 4. Merge data and calculate correct net balance
      const processedGroups: GroupBalance[] = memberships.map((m: any) => {
        const groupInfo = m.groups;

        const expPaid =
          expensesPaidByMe
            ?.filter((e) => e.group_id === groupInfo.id)
            .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
        const setPaid =
          settlementsPaidByMe
            ?.filter((s) => s.group_id === groupInfo.id)
            .reduce((sum, s) => sum + Number(s.amount), 0) || 0;
        const totalPaid = expPaid + setPaid;

        const expOwed =
          mySplits
            ?.filter((s: any) => s.expenses.group_id === groupInfo.id)
            .reduce((sum, s) => sum + Number(s.amount), 0) || 0;
        const setRcvd =
          settlementsReceivedByMe
            ?.filter((s) => s.group_id === groupInfo.id)
            .reduce((sum, s) => sum + Number(s.amount), 0) || 0;
        const totalOwed = expOwed + setRcvd;

        return {
          group_id: groupInfo.id,
          group_name: groupInfo.name,
          currency: groupInfo.currency || "USD",
          owner_id: groupInfo.owner_id,
          created_at: groupInfo.created_at,
          net_balance: totalPaid - totalOwed,
        };
      });

      setGroups(
        processedGroups.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );

      // 5. Fetch recent expenses (NEW — does not modify existing queries)
      const { data: recentData } = await supabase
        .from("expenses")
        .select(
          `id, name, amount, created_at, group_id,
           paid_by_profile:paid_by(display_name, avatar_url),
           expense_group:group_id(name)`
        )
        .in("group_id", groupIds)
        .order("created_at", { ascending: false })
        .limit(8);

      if (recentData) {
        setRecentExpenses(recentData as unknown as RecentExpense[]);
      }
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
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => fetchDashboard())
      .on("postgres_changes", { event: "*", schema: "public", table: "expense_splits" }, () => fetchDashboard())
      .on("postgres_changes", { event: "*", schema: "public", table: "settlements" }, () => fetchDashboard())
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_log" }, () => fetchDashboard())
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members" }, () => fetchDashboard())
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [supabase, fetchDashboard]);

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