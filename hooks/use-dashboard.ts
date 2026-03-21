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

  // hooks/use-dashboard.ts — AFTER optimization
const fetchDashboard = useCallback(async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) { router.replace("/login"); return; }

    setUserId(user.id);

    // ONE query instead of EIGHT
    const { data, error } = await supabase.rpc("get_dashboard_data");
    if (error) throw error;

    setProfile(data.profile);
    setGroups(data.groups || []);
    setRecentExpenses(data.recent_expenses || []);
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

  // Only subscribe to tables relevant to this user's groups
  const groupIds = groups.map(g => g.group_id);
  if (groupIds.length === 0) return;

  // Debounce refetch to avoid cascade
  let debounceTimer: NodeJS.Timeout;
  const debouncedFetch = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchDashboard(), 1000);
  };

  const channel = supabase
    .channel(`dashboard-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "group_members",
        filter: `user_id=eq.${userId}`,  // Only MY membership changes
      },
      debouncedFetch
    )
    .subscribe();

  return () => {
    clearTimeout(debounceTimer);
    supabase.removeChannel(channel);
  };
}, [userId, groups, supabase, fetchDashboard]);
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