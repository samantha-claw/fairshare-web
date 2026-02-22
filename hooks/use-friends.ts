"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  Friend,
  PendingRequest,
  OutgoingRequest,
  SearchResultUser,
  ToastMessage,
} from "@/types/friend";

// ==========================================
// ⚙️ LOGIC & STATE
// ==========================================

export function useFriends() {
  const supabase = createClient();
  const router = useRouter();
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

  /* ── Toast ───────────────────────────────────────────── */
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function showToast(type: "success" | "error", message: string) {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

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

    const delay = setTimeout(async () => {
      setSearching(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, display_name, full_name, avatar_url")
          .ilike("username", `%${searchTerm.trim()}%`)
          .limit(8);

        if (!error && data) {
          // Filter out: current user, existing friends, and people with pending outgoing requests
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
        showToast("error", error.message || "Failed to send request.");
        return;
      }

      showToast("success", `Request sent to @${targetUsername}`);
      await fetchOutgoingRequests();
    } catch (err) {
      showToast("error", "An unexpected error occurred.");
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
        showToast("error", "Failed to cancel request.");
        return;
      }

      setOutgoingRequests((prev) => prev.filter((r) => r.request_id !== requestId));
      showToast("success", "Request cancelled.");
    } catch (err) {
      showToast("error", "An unexpected error occurred.");
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
        showToast("error", error.message || "Failed to accept request.");
        return;
      }

      setPendingRequests((prev) => prev.filter((r) => r.request_id !== requestId));
      await fetchFriends();
      showToast("success", "Friend request accepted!");
    } catch (err) {
      showToast("error", "An unexpected error occurred.");
    } finally {
      setAcceptingId(null);
    }
  }

  /* ── Decline Incoming Request ────────────────────────── */

  async function handleDeclineRequest(requestId: string) {
    setDecliningId(requestId);
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "declined" })
        .eq("id", requestId);
      if (error) throw error;

      setPendingRequests((prev) => prev.filter((r) => r.request_id !== requestId));
      showToast("success", "Request declined.");
    } catch (err) {
      showToast("error", "Failed to decline request.");
    } finally {
      setDecliningId(null);
    }
  }

  /* ── Remove Friend ───────────────────────────────────── */

  async function handleRemoveFriend(friendId: string) {
    if (!confirm("Are you sure you want to remove this friend?")) return;
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
      showToast("success", "Friend removed.");
    } catch (err) {
      showToast("error", "Failed to remove friend.");
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

    // Toast
    toasts,
    dismissToast,

    // Navigation
    navigateToDashboard: () => router.push("/dashboard"),
  };
}