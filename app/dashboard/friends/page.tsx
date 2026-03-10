"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useRef } from "react";
import Link from "next/link";
import { useFriends } from "@/hooks/use-friends";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import {
  AddFriendSearch,
  type AddFriendSearchHandle,
} from "./_components/add-friend-search";
import { PendingRequests } from "./_components/pending-requests";
import { FriendsList } from "./_components/friends-list";
import { FriendsEmptyState } from "@/components/ui/empty-states";
import {
  ArrowLeft,
  HeartHandshake,
  UserCheck,
} from "lucide-react";

// ==========================================
// 🎨 UI RENDER — SKELETON
// ==========================================
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl animate-pulse px-4 py-10 sm:px-6">
        <div className="mb-6 h-5 w-40 rounded bg-gray-200" />
        <div className="mb-8 h-10 w-64 rounded-lg bg-gray-200" />
        <div className="mb-8 h-40 rounded-3xl bg-gray-200/50" />
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 rounded-3xl bg-gray-200/40"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🎨 UI RENDER — PAGE
// ==========================================
export default function FriendsPage() {
  const f = useFriends();
  const addFriendSearchRef = useRef<AddFriendSearchHandle>(null);

  if (f.loading) return <PageSkeleton />;

  const hasFriends = f.friends.length > 0;
  const friendsLoaded = !f.loadingFriends;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-10">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* ── Back Button ────────────────────────────── */}
        <button
          type="button"
          onClick={f.navigateToDashboard}
          className="mb-6 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-gray-500 transition-all hover:bg-white hover:text-gray-900 hover:shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </button>

        {/* ── Page Header ────────────────────────────── */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <HeartHandshake className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Friends
            </h1>
            <p className="text-sm text-gray-500">
              Manage your connections and friend requests
            </p>
          </div>
        </div>

        {/* ── Main Layout ────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left Sidebar — Search + Pending */}
          <div className="space-y-6 lg:col-span-2">
            <AddFriendSearch
              ref={addFriendSearchRef}
              searchTerm={f.searchTerm}
              onSearchTermChange={f.setSearchTerm}
              searchResults={f.searchResults}
              searching={f.searching}
              sendingToId={f.sendingToId}
              cancellingId={f.cancellingId}
              onSendRequest={f.handleSendRequest}
              onCancelRequest={f.handleCancelRequest}
              isOutgoingPending={f.isOutgoingPending}
              getOutgoingRequestId={f.getOutgoingRequestId}
              onClearSearch={f.clearSearch}
            />

            <PendingRequests
              incoming={f.pendingRequests}
              outgoing={f.outgoingRequests}
              loadingPending={f.loadingPending}
              acceptingId={f.acceptingId}
              decliningId={f.decliningId}
              cancellingId={f.cancellingId}
              onAccept={f.handleAcceptRequest}
              onDecline={f.handleDeclineRequest}
              onCancel={f.handleCancelRequest}
            />
          </div>

          {/* Right Content — Friends Grid or Empty State */}
          <div className="lg:col-span-3">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">
                  Your Friends
                </h2>
                {hasFriends && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-inset ring-emerald-200">
                    {f.friends.length}
                  </span>
                )}
              </div>
            </div>

            {friendsLoaded && !hasFriends ? (
              <div className="flex min-h-[60vh] items-center justify-center">
                <FriendsEmptyState
                  onFindFriends={() => addFriendSearchRef.current?.focusSearch()}
                />
              </div>
            ) : (
              <FriendsList
                friends={f.friends}
                loading={f.loadingFriends}
                onRemoveFriend={f.handleRemoveFriend}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}