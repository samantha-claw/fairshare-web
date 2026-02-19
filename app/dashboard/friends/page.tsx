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
   TYPES (Matches your RPC output exactly)
   ════════════════════════════════════════════════════════════ */

interface Friend {
  friend_id: string;
  friend_username: string;
  friend_display_name: string;
  friend_avatar_url: string;
}

interface PendingRequest {
  request_id: string; 
  sender_id: string;
  sender_username: string;
  sender_display_name: string;
  sender_avatar_url: string;
  created_at: string;
}

/* ════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════ */

function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(/[\s_]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
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
    <div className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-500 ring-1 ring-gray-200`}>
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
          <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-4">
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

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const [searchUsername, setSearchUsername] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  /* ── DATA FETCHING ── */

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
    setLoadingPending(true);
    try {
      // ✅ Now using the RPC we created
      const { data, error } = await supabase.rpc("get_incoming_friend_requests");
      if (error) throw error;
      setPendingRequests((data as PendingRequest[]) || []);
    } catch (err) {
      console.error("Failed to load pending requests:", err);
    } finally {
      setLoadingPending(false);
    }
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
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

  /* ── ACTIONS ── */

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
      const { error } = await supabase.rpc("send_friend_request", { target_username: trimmed });
      if (error) {
        setSendError(error.message || "Failed to send request.");
        return;
      }
      setSendSuccess(`Friend request sent to @${trimmed}!`);
      setSearchUsername("");
      showToast("success", `Request sent to @${trimmed}`);
    } catch (err) {
      setSendError("An unexpected error occurred.");
    } finally {
      setSending(false);
    }
  }

  async function handleAcceptRequest(requestId: string) {
    setAcceptingId(requestId);
    try {
      const { error } = await supabase.rpc("accept_friend_request", { request_id: requestId });
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

  async function handleDeclineRequest(requestId: string) {
    setDecliningId(requestId);
    try {
      const { error } = await supabase.from("friendships").update({ status: "declined" }).eq("id", requestId);
      if (error) throw error;
      setPendingRequests((prev) => prev.filter((r) => r.request_id !== requestId));
      showToast("success", "Request declined.");
    } catch (err) {
      showToast("error", "Failed to decline request.");
    } finally {
      setDecliningId(null);
    }
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed right-4 top-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${toast.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            {toast.type === "success" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {toast.message}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <button type="button" onClick={() => router.push("/dashboard")} className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </button>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <HeartHandshake className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Friends</h1>
            <p className="text-sm text-gray-500">Manage your connections and friend requests</p>
          </div>
        </div>

        {/* SECTION 1: SEARCH & ADD */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Add a Friend</h2>
            </div>
          </div>
          <form onSubmit={handleSendRequest} className="p-5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  placeholder="Enter username…"
                  className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <button disabled={sending || !searchUsername.trim()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {sending ? "Sending…" : "Send Request"}
              </button>
            </div>
            {sendError && <p className="mt-2 text-xs text-red-600">{sendError}</p>}
            {sendSuccess && <p className="mt-2 text-xs text-green-600">{sendSuccess}</p>}
          </form>
        </section>

        {/* SECTION 2: PENDING REQUESTS */}
        <section className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-900">Pending Requests</h2>
              {pendingRequests.length > 0 && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                  {pendingRequests.length}
                </span>
              )}
            </div>
          </div>
          <div className="p-5">
            {pendingRequests.length === 0 ? (
              <EmptyState icon={Inbox} title="No requests" description="No incoming requests found." />
            ) : (
              <ul className="space-y-3">
                {pendingRequests.map((request) => (
                  <li key={request.request_id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={request.sender_avatar_url} name={request.sender_display_name || request.sender_username} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{request.sender_display_name || request.sender_username}</p>
                        <p className="text-xs text-gray-500">@{request.sender_username} · {timeAgo(request.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleAcceptRequest(request.request_id)} disabled={!!acceptingId} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                        {acceptingId === request.request_id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Accept"}
                      </button>
                      <button onClick={() => handleDeclineRequest(request.request_id)} disabled={!!decliningId} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">
                        {decliningId === request.request_id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Decline"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* SECTION 3: FRIENDS LIST */}
        <section className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <h2 className="text-sm font-semibold text-gray-900">Your Friends</h2>
            </div>
          </div>
          <div className="p-5">
            {friends.length === 0 ? (
              <EmptyState icon={Users} title="No friends yet" description="Start adding connections!" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {friends.map((friend) => (
                  <div key={friend.friend_id} className="group flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-4 hover:border-blue-200 transition-all">
                    <Avatar src={friend.friend_avatar_url} name={friend.friend_display_name || friend.friend_username} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{friend.friend_display_name || friend.friend_username}</p>
                      <p className="truncate text-xs text-gray-500">@{friend.friend_username}</p>
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
