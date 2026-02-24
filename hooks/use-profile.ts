"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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

// ==========================================
// ⚙️ LOGIC & STATE
// ==========================================

export function useProfile(options: UseProfileOptions = {}) {
  const { userId: targetUserId } = options;
  const router = useRouter();
  const supabase = createClient();

  /* ── Core State ──────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  /* ── Friend State ────────────────────────────────── */
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [isProcessing, setIsProcessing] = useState(false);

  /* ── Financial State ─────────────────────────────── */
  const [groups, setGroups] = useState<ProfileGroup[]>([]);
  const [activities, setActivities] = useState<ProfileActivity[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    totalGroups: 0,
    totalExpensesPaid: 0,
    totalOwed: 0,
    totalOwes: 0,
    netBalance: 0,
  });

  /* ── Share Modal State ───────────────────────────── */
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  /* ── Derived ─────────────────────────────────────── */
  const isOwnProfile = !targetUserId || currentUserId === targetUserId;
  const profileId = targetUserId || currentUserId;

  const profileUrl =
    typeof window !== "undefined" && profile
      ? `${window.location.origin}/dashboard/profile/${profile.id}`
      : "";

  /* ── Fetch Data ──────────────────────────────────── */

  const fetchData = useCallback(async () => {
    try {
      // 1. Auth check
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }
      setCurrentUserId(session.user.id);

      const fetchId = targetUserId || session.user.id;

      // 1b. Fetch current user's name (needed for notifications when viewing others)
      if (targetUserId && targetUserId !== session.user.id) {
        const { data: currentUserProfile } = await supabase
          .from("profiles")
          .select("display_name, full_name, username")
          .eq("id", session.user.id)
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

      // 2. Profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, username, full_name, display_name, avatar_url, bio, created_at, is_public"
        )
        .eq("id", fetchId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as UserProfile);

      // If viewing own profile, set name from own profile data
      if (!targetUserId || targetUserId === session.user.id) {
        setCurrentUserName(
          profileData.display_name ||
          profileData.full_name ||
          profileData.username ||
          "Someone"
        );
      }

      // 3. Friend status (only for other users)
      if (targetUserId && targetUserId !== session.user.id) {
        const { data: friendshipData } = await supabase
          .from("friendships")
          .select("status")
          .or(
            `and(requester_id.eq.${session.user.id},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${session.user.id})`
          )
          .maybeSingle();

        if (friendshipData) {
          if (friendshipData.status === "accepted") {
            setFriendStatus("friends");
          } else {
            setFriendStatus("pending");
          }
        } else {
          setFriendStatus("none");
        }
      }

      // 4. Groups (for own profile or friends)
      const shouldFetchFinancials =
        !targetUserId || targetUserId === session.user.id;

      if (shouldFetchFinancials) {
        const uid = session.user.id;

        const { data: memberships } = await supabase
          .from("group_members")
          .select(`group_id, groups ( id, name, currency, created_at )`)
          .eq("user_id", uid);

        if (memberships && memberships.length > 0) {
          const groupIds = memberships.map((m) => m.group_id);

          // Expenses paid
          const { data: expensesPaid } = await supabase
            .from("expenses")
            .select("group_id, amount")
            .in("group_id", groupIds)
            .eq("paid_by", uid);

          // Splits owed
          const { data: mySplits } = await supabase
            .from("expense_splits")
            .select("amount, expenses(group_id)")
            .eq("user_id", uid);

          // Completed settlements
          const { data: settlementsSent } = await supabase
            .from("settlements")
            .select("group_id, amount")
            .in("group_id", groupIds)
            .eq("from_user", uid)
            .eq("status", "completed");

          const { data: settlementsReceived } = await supabase
            .from("settlements")
            .select("group_id, amount")
            .in("group_id", groupIds)
            .eq("to_user", uid)
            .eq("status", "completed");

          // Process groups
          const processedGroups: ProfileGroup[] = memberships.map(
            (m: any) => {
              const g = m.groups;
              const paidExp =
                expensesPaid
                  ?.filter((e) => e.group_id === g.id)
                  .reduce((s, e) => s + Number(e.amount), 0) || 0;
              const paidSet =
                settlementsSent
                  ?.filter((s) => s.group_id === g.id)
                  .reduce((s, e) => s + Number(e.amount), 0) || 0;
              const owedExp =
                mySplits
                  ?.filter((s: any) => s.expenses.group_id === g.id)
                  .reduce((s, e) => s + Number(e.amount), 0) || 0;
              const owedSet =
                settlementsReceived
                  ?.filter((s) => s.group_id === g.id)
                  .reduce((s, e) => s + Number(e.amount), 0) || 0;

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

          // Stats
          const totalPaid =
            expensesPaid?.reduce(
              (s, e) => s + Number(e.amount),
              0
            ) || 0;
          const totalOwed = processedGroups
            .filter((g) => g.net_balance > 0)
            .reduce((s, g) => s + g.net_balance, 0);
          const totalOwes = processedGroups
            .filter((g) => g.net_balance < 0)
            .reduce((s, g) => s + Math.abs(g.net_balance), 0);

          setStats({
            totalGroups: memberships.length,
            totalExpensesPaid: totalPaid,
            totalOwed,
            totalOwes,
            netBalance: totalOwed - totalOwes,
          });
        }

        // 5. Recent Activity
        if (memberships && memberships.length > 0) {
          const groupIds = memberships.map((m) => m.group_id);

          const { data: recentExpenses } = await supabase
            .from("expenses")
            .select("id, name, amount, created_at, group_id, groups:group_id(name)")
            .in("group_id", groupIds)
            .eq("paid_by", uid)
            .order("created_at", { ascending: false })
            .limit(10);

          if (recentExpenses) {
            setActivities(
              recentExpenses.map((e: any) => ({
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
        }
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

  /**
   * ════════════════════════════════════════════════════════
   * ADD FRIEND
   * → Sends a friend request via RPC, then notifies the
   *   target user so they see it in their notification bell.
   * ════════════════════════════════════════════════════════
   */
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

      // ── Notify the target user about the friend request ──
      const senderName = currentUserName || "Someone";

      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: profile.id,
          actor_id: currentUserId,
          type: "friend_request",
          title: "New Friend Request! 👋",
          message: `${senderName} sent you a friend request.`,
          link: `/dashboard/profile/${currentUserId}`,
        });

      if (notifError) {
        console.error("Failed to send friend request notification:", notifError);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to send request.");
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
    } catch (err: any) {
      console.error(err);
      alert("Failed to cancel request.");
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

  /* ── Return ──────────────────────────────────────── */

  return {
    // Core
    loading,
    error,
    profile,
    currentUserId,
    isOwnProfile,
    profileUrl,

    // Friend
    friendStatus,
    isProcessing,
    handleAddFriend,
    handleCancelRequest,

    // Financial
    groups,
    activities,
    stats,

    // Share modal
    isShareModalOpen,
    openShareModal: () => setIsShareModalOpen(true),
    closeShareModal: () => setIsShareModalOpen(false),

    // Navigation
    handleBack,
    navigateToEdit: () => router.push("/dashboard/profile/edit"),
  };
}