"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validate } from "@/lib/validate";
import { friendSearchSchema } from "@/lib/validations";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  Friend,
  PendingRequest,
  OutgoingRequest,
  SearchResultUser,
} from "@/types/friend";

// ==========================================
// ⚙️ LOGIC & STATE
// ==========================================

export function useFriends() {
  const supabase = createClient();
  const router = useRouter();
  const toast = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);

  /* ── Core State ──────────────────────────────────────── */
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── Friends ─────────────────────────────────────────── */
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  /* ── Pending Incoming Requests ───────────────────────── */
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  /* ── Outgoing Requests (for cancel/undo) ─────────────── */
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingRequest[]>([]);

  /* ── Search State ────────────────────────────────────── */
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingToId, setSendingToId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  /* ── Auth Init ───────────────────────────────────────── */

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      setCurrentUserId(session.user.id);
      setLoading(false);
    }
    init();
  }, [supabase, router]);

  /* ── Fetch Friends ───────────────────────────────────── */

  const fetchFriends = useCallback(async () => {
    setLoadingFriends(true);
    try {
      const { data, error } = await supabase.rpc("get_my_friends");
      if (error) throw error;
      setFriends((data as Friend[]) || []);
    } catch (err) {
      console.error("Failed to load friends:", err);
    } finally {
      setLoadingFriends(false);
    }
  }, [supabase]);

  /* ── Fetch Pending Incoming Requests ─────────────────── */

  const fetchPendingRequests = useCallback(async () => {
    setLoadingPending(true);
    try {
      const { data, error } = await supabase.rpc("get_incoming_friend_requests");
      if (error) throw error;
      setPendingRequests((data as PendingRequest[]) || []);
    } catch (err) {
      console.error("Failed to load pending requests:", err);
    } finally {
      setLoadingPending(false);
    }
  }, [supabase]);

  /* ── Fetch Outgoing Requests ─────────────────────────── */

  const fetchOutgoingRequests = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const { data, error } = await supabase
        .from("friendships")
        .select(
          `id,
           receiver_id,
           created_at,
           receiver_profile:receiver_id(username, display_name, avatar_url)`
        )
        .eq("requester_id", currentUserId)
        .eq("status", "pending");

      if (error) throw error;
      if (data) {
        setOutgoingRequests(
          data.map((row: any) => ({
            request_id: row.id,
            receiver_id: row.receiver_id,
            receiver_username: row.receiver_profile?.username || "",
            receiver_display_name: row.receiver_profile?.display_name || "",
            receiver_avatar_url: row.receiver_profile?.avatar_url || "",
            created_at: row.created_at,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load outgoing requests:", err);
    }
  }, [supabase, currentUserId]);

  /* ── Load all data when authenticated ────────────────── */

  useEffect(() => {
    if (!currentUserId) return;
    fetchFriends();
    fetchPendingRequests();
    fetchOutgoingRequests();
  }, [currentUserId, fetchFriends, fetchPendingRequests, fetchOutgoingRequests]);

  /* ── Realtime ────────────────────────────────────────── */

  useEffect(() => {
    const channel = supabase
      .channel("friends-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        () => {
          fetchFriends();
          fetchPendingRequests();
          fetchOutgoingRequests();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [supabase, fetchFriends, fetchPendingRequests, fetchOutgoingRequests]);

  /* ── Debounced Search ────────────────────────────────── */

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const trimmedQuery = searchTerm.trim().toLowerCase();
    const queryValidation = validate(friendSearchSchema, { query: trimmedQuery });
    if (!queryValidation.success) {
      setSearchResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setSearching(true);
      try {
        const { data, error } = await supabase.rpc("search_users_by_username", {
          search_term: trimmedQuery,
        });

        if (!error && data) {
          const friendIds = friends.map((f) => f.friend_id);
          const filtered = data.filter(
            (user: any) =>
              user.id !== currentUserId && !friendIds.includes(user.id)
          );
          setSearchResults(filtered as SearchResultUser[]);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [searchTerm, currentUserId, friends, supabase]);

  /* ── Send Friend Request ─────────────────────────────── */

  async function handleSendRequest(targetUsername: string, targetId: string) {
    setSendingToId(targetId);
    try {
      const { error } = await supabase.rpc("send_friend_request", {
        target_username: targetUsername.toLowerCase(),
      });

      if (error) {
        toast.error(error.message || "Failed to send request.");
        return;
      }

      toast.success(`Request sent to @${targetUsername}`);
      await fetchOutgoingRequests();
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setSendingToId(null);
    }
  }

  /* ── Cancel Outgoing Request ─────────────────────────── */

  async function handleCancelRequest(requestId: string) {
    setCancellingId(requestId);
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", requestId)
        .eq("requester_id", currentUserId!)
        .eq("status", "pending");

      if (error) {
        toast.error("Failed to cancel request.");
        return;
      }

      setOutgoingRequests((prev) => prev.filter((r) => r.request_id !== requestId));
      toast.success("Request cancelled.");
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setCancellingId(null);
    }
  }

  /* ── Accept Incoming Request ─────────────────────────── */

  async function handleAcceptRequest(requestId: string) {
    setAcceptingId(requestId);
    try {
      const { error } = await supabase.rpc("accept_friend_request", {
        request_id: requestId,
      });
      if (error) {
        toast.error(error.message || "Failed to accept request.");
        return;
      }

      setPendingRequests((prev) => prev.filter((r) => r.request_id !== requestId));
      await fetchFriends();
      toast.success("Friend request accepted!");
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setAcceptingId(null);
    }
  }

  /* ── Decline Incoming Request ────────────────────────── */

  /**
   * ════════════════════════════════════════════════════════
   * FIX: Changed from .update({ status: "declined" }) to
   * .delete() — matching the working pattern in use-profile.ts.
   *
   * The old approach failed because:
   *   1. RLS policy may not allow the receiver to UPDATE
   *      a friendship row (only the requester "owns" it).
   *   2. The "declined" status may not exist as a valid
   *      enum/check value on the status column.
   *
   * The new approach:
   *   - Uses .delete() to remove the row entirely.
   *   - Filters by BOTH the friendship row ID AND
   *     receiver_id = currentUserId for RLS safety.
   *   - Adds status = "pending" guard so we only delete
   *     pending requests (never accepted friendships).
   * ════════════════════════════════════════════════════════
   */
  async function handleDeclineRequest(requestId: string) {
    if (!currentUserId) return;

    setDecliningId(requestId);
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", requestId)
        .eq("receiver_id", currentUserId)
        .eq("status", "pending");

      if (error) throw error;

      setPendingRequests((prev) => prev.filter((r) => r.request_id !== requestId));
      toast.success("Request declined.");
    } catch (err) {
      console.error("Failed to decline request:", err);
      toast.error("Failed to decline request.");
    } finally {
      setDecliningId(null);
    }
  }

  /* ── Remove Friend ───────────────────────────────────── */

  async function handleRemoveFriend(friendId: string) {
    const confirmed = await toast.confirm(
      "Are you sure you want to remove this friend?",
      {
        confirmLabel: "Remove",
        cancelLabel: "Cancel"
      }
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .or(
          `and(requester_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(requester_id.eq.${friendId},receiver_id.eq.${currentUserId})`
        )
        .eq("status", "accepted");

      if (error) throw error;
      setFriends((prev) => prev.filter((f) => f.friend_id !== friendId));
      toast.success("Friend removed.");
    } catch (err) {
      toast.error("Failed to remove friend.");
    }
  }

  /* ── Helpers ─────────────────────────────────────────── */

  function isOutgoingPending(userId: string): boolean {
    return outgoingRequests.some((r) => r.receiver_id === userId);
  }

  function getOutgoingRequestId(userId: string): string | null {
    return outgoingRequests.find((r) => r.receiver_id === userId)?.request_id || null;
  }

  function clearSearch() {
    setSearchTerm("");
    setSearchResults([]);
  }

  /* ── Return ──────────────────────────────────────────── */

  return {
    // Core
    loading,
    currentUserId,

    // Friends
    friends,
    loadingFriends,
    handleRemoveFriend,

    // Incoming Requests
    pendingRequests,
    loadingPending,
    acceptingId,
    decliningId,
    handleAcceptRequest,
    handleDeclineRequest,

    // Outgoing Requests
    outgoingRequests,
    cancellingId,
    handleCancelRequest,

    // Search
    searchTerm,
    setSearchTerm,
    searchResults,
    searching,
    sendingToId,
    handleSendRequest,
    isOutgoingPending,
    getOutgoingRequestId,
    clearSearch,

    // Navigation
    navigateToDashboard: () => router.push("/dashboard"),
  };
}