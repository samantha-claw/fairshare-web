"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type {
  UserProfile,
  FriendStatus,
  ProfileGroup,
  ProfileActivity,
  ProfileStats,
} from "@/types/profile";

// ==========================================
// 🧩 TYPES
// ==========================================

interface UseProfileOptions {
  userId?: string;
}

type FriendshipDirection = "incoming" | "outgoing" | null;

// Local row interfaces for type safety
interface GroupRowFragment {
  id: string;
  name: string;
  currency: string | null;
  created_at: string;
}

interface GroupMemberRow {
  group_id: string;
  groups: GroupRowFragment;
}

interface ExpensePaidRow {
  group_id: string;
  amount: number | string;
}

interface ExpenseSplitRow {
  amount: number | string;
  expenses: {
    group_id: string;
  };
}

interface SettlementRow {
  group_id: string;
  amount: number | string;
}

interface RecentExpenseRow {
  id: string;
  name: string;
  amount: number | string;
  created_at: string;
  group_id: string;
  groups: {
    name: string;
  } | null;
}

const createDefaultStats = (): ProfileStats => ({
  totalGroups: 0,
  totalExpensesPaid: 0,
  totalOwed: 0,
  totalOwes: 0,
  netBalance: 0,
});

export function useProfile(options: UseProfileOptions = {}) {
  const { userId: targetUserId } = options;
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  /* ── Core State ──────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  /* ── Friend State ────────────────────────────────── */
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [friendshipDirection, setFriendshipDirection] =
    useState<FriendshipDirection>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  /* ── Financial State ─────────────────────────────── */
  const [groups, setGroups] = useState<ProfileGroup[]>([]);
  const [activities, setActivities] = useState<ProfileActivity[]>([]);
  const [stats, setStats] = useState<ProfileStats>(createDefaultStats);

  /* ── Share Modal State ───────────────────────────── */
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  /* ── Derived ─────────────────────────────────────── */
  const isOwnProfile = !targetUserId || currentUserId === targetUserId;

  const profileUrl =
    typeof window !== "undefined" && profile
      ? `${window.location.origin}/dashboard/profile/${profile.id}`
      : "";

  /* ── Fetch Data ──────────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (!user || authError) {
        router.replace("/login");
        return;
      }
      setCurrentUserId(user.id);
      const fetchId = targetUserId || user.id;

      if (targetUserId && targetUserId !== user.id) {
        const { data: currentUserProfile } = await supabase
          .from("profiles")
          .select("display_name, full_name, username")
          .eq("id", user.id)
          .single();

        if (currentUserProfile) {
          setCurrentUserName(
            currentUserProfile.display_name ||
              currentUserProfile.full_name ||
              currentUserProfile.username ||
              "Someone"
          );
        }
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, username, full_name, display_name, avatar_url, bio, created_at, is_public"
        )
        .eq("id", fetchId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as UserProfile);

      if (!targetUserId || targetUserId === user.id) {
        setCurrentUserName(
          profileData.display_name ||
            profileData.full_name ||
            profileData.username ||
            "Someone"
        );
      }

      if (targetUserId && targetUserId !== user.id) {
        const { data: friendshipData } = await supabase
          .from("friendships")
          .select("id, status, requester_id, receiver_id")
          .or(
            `and(requester_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${user.id})`
          )
          .maybeSingle();

        if (friendshipData) {
          if (friendshipData.status === "accepted") {
            setFriendStatus("friends");
            setFriendshipDirection(null);
          } else {
            setFriendStatus("pending");
            setFriendshipDirection(
              friendshipData.requester_id === user.id
                ? "outgoing"
                : "incoming"
            );
          }
        } else {
          setFriendStatus("none");
          setFriendshipDirection(null);
        }
      }

      const shouldFetchFinancials =
        !targetUserId || targetUserId === user.id;

      const resetFinancialState = () => {
        setGroups([]);
        setActivities([]);
        setStats(createDefaultStats());
      };

      if (shouldFetchFinancials) {
        const uid = user.id;

        const { data: memberships } = await supabase
          .from("group_members")
          .select("group_id, groups ( id, name, currency, created_at )")
          .eq("user_id", uid);

        if (!memberships || memberships.length === 0) {
          resetFinancialState();
        } else {
          const typedMemberships = memberships as GroupMemberRow[];
          const groupIds = typedMemberships.map((m) => m.group_id);

          const { data: expensesPaid } = await supabase
            .from("expenses")
            .select("group_id, amount")
            .in("group_id", groupIds)
            .eq("paid_by", uid);
          const typedExpensesPaid = (expensesPaid || []) as ExpensePaidRow[];

          const { data: mySplits } = await supabase
            .from("expense_splits")
            .select("amount, expenses(group_id)")
            .eq("user_id", uid);
          const typedMySplits = (mySplits || []) as ExpenseSplitRow[];

          const { data: settlementsSent } = await supabase
            .from("settlements")
            .select("group_id, amount")
            .in("group_id", groupIds)
            .eq("from_user", uid)
            .eq("status", "completed");
          const typedSettlementsSent = (settlementsSent || []) as SettlementRow[];

          const { data: settlementsReceived } = await supabase
            .from("settlements")
            .select("group_id, amount")
            .in("group_id", groupIds)
            .eq("to_user", uid)
            .eq("status", "completed");
          const typedSettlementsReceived = (settlementsReceived || []) as SettlementRow[];

          const processedGroups: ProfileGroup[] = typedMemberships.map(
            (m) => {
              const g = m.groups;
              const paidExp = typedExpensesPaid
                .filter((e) => e.group_id === g.id)
                .reduce((s, e) => s + Number(e.amount), 0);
              const paidSet = typedSettlementsSent
                .filter((s) => s.group_id === g.id)
                .reduce((s, e) => s + Number(e.amount), 0);
              const owedExp = typedMySplits
                .filter((s) => s.expenses.group_id === g.id)
                .reduce((s, e) => s + Number(e.amount), 0);
              const owedSet = typedSettlementsReceived
                .filter((s) => s.group_id === g.id)
                .reduce((s, e) => s + Number(e.amount), 0);

              return {
                group_id: g.id,
                group_name: g.name,
                currency: g.currency || "USD",
                net_balance: paidExp + paidSet - (owedExp + owedSet),
                created_at: g.created_at,
              };
            }
          );

          setGroups(processedGroups);

          const totalPaid = typedExpensesPaid.reduce(
            (s, e) => s + Number(e.amount),
            0
          );
          const totalOwed = processedGroups
            .filter((g) => g.net_balance > 0)
            .reduce((s, g) => s + g.net_balance, 0);
          const totalOwes = processedGroups
            .filter((g) => g.net_balance < 0)
            .reduce((s, g) => s + Math.abs(g.net_balance), 0);

          setStats({
            totalGroups: typedMemberships.length,
            totalExpensesPaid: totalPaid,
            totalOwed,
            totalOwes,
            netBalance: totalOwed - totalOwes,
          });

          const { data: recentExpenses } = await supabase
            .from("expenses")
            .select(
              "id, name, amount, created_at, group_id, groups:group_id(name)"
            )
            .in("group_id", groupIds)
            .eq("paid_by", user.id)
            .order("created_at", { ascending: false })
            .limit(10);
          const typedRecentExpenses = (recentExpenses || []) as RecentExpenseRow[];

          setActivities(
            typedRecentExpenses.map((e) => ({
              id: e.id,
              name: e.name,
              amount: Number(e.amount),
              created_at: e.created_at,
              group_name: e.groups?.name || "Unknown",
              group_id: e.group_id,
              type: "expense" as const,
            }))
          );
        }
      } else {
        resetFinancialState();
      }
    } catch (err) {
      console.error(err);
      setError("User not found or profile is private.");
    } finally {
      setLoading(false);
    }
  }, [targetUserId, supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Friend Actions ──────────────────────────────── */

  async function handleAddFriend() {
    if (!currentUserId || !profile) {
      router.push("/login");
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc("send_friend_request", {
        target_username: profile.username.toLowerCase(),
      });
      if (error) throw error;
      setFriendStatus("pending");
      setFriendshipDirection("outgoing");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to send friend request.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCancelRequest() {
    if (!currentUserId || !targetUserId) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .or(
          `and(requester_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`
        );
      if (error) throw error;
      setFriendStatus("none");
      setFriendshipDirection(null);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to cancel request.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleAcceptRequest() {
    if (!currentUserId || !targetUserId) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("requester_id", targetUserId)
        .eq("receiver_id", currentUserId)
        .eq("status", "pending");

      if (error) throw error;

      setFriendStatus("friends");
      setFriendshipDirection(null);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to accept request.");
    } finally {
      setIsProcessing(false);
    }
  }

  /* ── Navigation ──────────────────────────────────── */

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  }

  return {
    loading,
    error,
    profile,
    currentUserId,
    isOwnProfile,
    profileUrl,
    friendStatus,
    friendshipDirection,
    isProcessing,
    handleAddFriend,
    handleCancelRequest,
    handleAcceptRequest,
    groups,
    activities,
    stats,
    isShareModalOpen,
    openShareModal: () => setIsShareModalOpen(true),
    closeShareModal: () => setIsShareModalOpen(false),
    handleBack,
    navigateToEdit: () => router.push("/dashboard/profile/edit"),
  };
}