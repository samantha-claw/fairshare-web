"use client";

import React, { useEffect, useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  UserPlus,
  UserCheck,
  Users,
  Search,
  Loader2,
  Inbox,
  HeartHandshake,
  ArrowLeft,
  X,
  Check,
  Clock,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════ */

interface Friend {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

interface PendingRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

/* ════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════ */

function getInitials(name: string): string {
  return name
    .split(/[\s_]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/* ════════════════════════════════════════════════════════════
   AVATAR COMPONENT
   ════════════════════════════════════════════════════════════ */

function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ring-1 ring-gray-200`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-500 ring-1 ring-gray-200`}
    >
      {getInitials(name || "?")}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SKELETON
   ════════════════════════════════════════════════════════════ */

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-8 px-4 py-10">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="h-12 w-full rounded-lg bg-gray-200" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-4"
          >
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   EMPTY STATE
   ════════════════════════════════════════════════════════════ */

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════ */

export default function FriendsPage() {
  const supabase = createClient();
  const router = useRouter();

  /* ── Core state ──────────────────────────────────────── */
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── Friends state ───────────────────────────────────── */
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  /* ── Pending requests state ──────────────────────────── */
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  /* ── Search & Send state ─────────────────────────────── */
  const [searchUsername, setSearchUsername] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  /* ── Global toast ────────────────────────────────────── */
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  /* ════════════════════════════════════════════════════════
     DATA FETCHING
     ════════════════════════════════════════════════════════ */

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

  const fetchPendingRequests = useCallback(async () => {
    if (!currentUserId) return;
    setLoadingPending(true);
    try {
      const { data, error } = await supabase
        .from("friend_requests")
        .select(
          `
          id,
          sender_id,
          receiver_id,
          status,
          created_at,
          profiles!friend_requests_sender_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `
        )
        .eq("receiver_id", currentUserId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingRequests((data as unknown as PendingRequest[]) || []);
    } catch (err) {
      console.error("Failed to load pending requests:", err);
    } finally {
      setLoadingPending(false);
    }
  }, [supabase, currentUserId]);

  /* ── Init ────────────────────────────────────────────── */
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

  useEffect(() => {
    if (!currentUserId) return;
    fetchFriends();
    fetchPendingRequests();
  }, [currentUserId, fetchFriends, fetchPendingRequests]);

  /* ════════════════════════════════════════════════════════
     ACTIONS
     ════════════════════════════════════════════════════════ */

  async function handleSendRequest(e: FormEvent) {
    e.preventDefault();
    setSendError(null);
    setSendSuccess(null);

    const trimmed = searchUsername.trim().toLowerCase();
    if (!trimmed) {
      setSendError("Please enter a username.");
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase.rpc("send_friend_request", {
        target_username: trimmed,
      });

      if (error) {
        if (error.code === "23505") {
          setSendError("Friend request already sent.");
        } else {
          setSendError(error.message || "Failed to send request.");
        }
        return;
      }

      setSendSuccess(`Friend request sent to @${trimmed}!`);
      setSearchUsername("");
      showToast("success", `Request sent to @${trimmed}`);
      setTimeout(() => setSendSuccess(null), 4000);
    } catch (err) {
      setSendError("An unexpected error occurred.");
    } finally {
      setSending(false);
    }
  }

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

      // Remove from pending, refresh friends
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      await fetchFriends();
      showToast("success", "Friend request accepted!");
    } catch (err) {
      showToast("error", "An unexpected error occurred.");
    } finally {
      setAcceptingId(null);
    }
  }

  async function handleDeclineRequest(requestId: string) {
    setDecliningId(requestId);

    try {
      const { error } = await supabase
        .from("friend_requests")
        .update({ status: "declined" })
        .eq("id", requestId)
        .eq("receiver_id", currentUserId!);

      if (error) {
        showToast("error", error.message || "Failed to decline request.");
        return;
      }

      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      showToast("success", "Request declined.");
    } catch (err) {
      showToast("error", "An unexpected error occurred.");
    } finally {
      setDecliningId(null);
    }
  }

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */

  if (loading) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Toast ──────────────────────────────────────── */}
      {toast && (
        <div className="fixed right-4 top-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === "success"
                ? "border border-green-200 bg-green-50 text-green-800"
                : "border border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {toast.message}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* ── Back ─────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        {/* ── Page Title ───────────────────────────────── */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <HeartHandshake className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Friends
            </h1>
            <p className="text-sm text-gray-500">
              Manage your connections and friend requests
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
           SECTION 1: SEARCH & ADD
           ════════════════════════════════════════════════ */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">
                Add a Friend
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              Search by username to send a friend request
            </p>
          </div>

          <form onSubmit={handleSendRequest} className="p-5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchUsername}
                  onChange={(e) => {
                    setSearchUsername(e.target.value);
                    setSendError(null);
                    setSendSuccess(null);
                  }}
                  placeholder="Enter username…"
                  disabled={sending}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={sending || !searchUsername.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {sending ? "Sending…" : "Send Request"}
              </button>
            </div>

            {sendError && (
              <p className="mt-2 text-xs text-red-600">{sendError}</p>
            )}
            {sendSuccess && (
              <p className="mt-2 text-xs text-green-600">{sendSuccess}</p>
            )}
          </form>
        </section>

        {/* ════════════════════════════════════════════════
           SECTION 2: PENDING REQUESTS
           ════════════════════════════════════════════════ */}
        <section className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-900">
                Pending Requests
              </h2>
              {pendingRequests.length > 0 && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                  {pendingRequests.length}
                </span>
              )}
            </div>

            {loadingPending && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>

          <div className="p-5">
            {!loadingPending && pendingRequests.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No pending requests"
                description="When someone sends you a friend request, it will appear here."
              />
            ) : (
              <ul className="space-y-3">
                {pendingRequests.map((request) => (
                  <li
                    key={request.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={request.profiles.avatar_url}
                        name={
                          request.profiles.full_name ||
                          request.profiles.username
                        }
                        size="md"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {request.profiles.full_name ||
                            request.profiles.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          @{request.profiles.username} ·{" "}
                          {timeAgo(request.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Accept */}
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={
                          acceptingId === request.id ||
                          decliningId === request.id
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {acceptingId === request.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Accept
                      </button>

                      {/* Decline */}
                      <button
                        onClick={() => handleDeclineRequest(request.id)}
                        disabled={
                          acceptingId === request.id ||
                          decliningId === request.id
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {decliningId === request.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                        Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════
           SECTION 3: FRIENDS LIST
           ════════════════════════════════════════════════ */}
        <section className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <h2 className="text-sm font-semibold text-gray-900">
                Your Friends
              </h2>
              {friends.length > 0 && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                  {friends.length}
                </span>
              )}
            </div>

            {loadingFriends && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>

          <div className="p-5">
            {!loadingFriends && friends.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No friends yet"
                description="Send a friend request using the search above to get started."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="group flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm"
                  >
                    <Avatar
                      src={friend.avatar_url}
                      name={friend.full_name || friend.username}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                        {friend.full_name || friend.username}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        @{friend.username}
                      </p>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 opacity-0 transition-opacity group-hover:opacity-100">
                      <UserCheck className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}