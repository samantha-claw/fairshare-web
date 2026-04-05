"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useRef } from "react";
import Link from "next/link";
import { useFriends } from "@/hooks/use-friends";
import { Spinner } from "@/components/ui/spinner";
import { AddFriendSearch, type AddFriendSearchHandle, } from "./_components/add-friend-search";
import { PendingRequests } from "./_components/pending-requests";
import { FriendsList } from "./_components/friends-list";
import { FriendsEmptyState } from "@/components/ui/empty-states";
import { ArrowLeft, HeartHandshake, UserCheck, Users } from "lucide-react";
import { motion } from "framer-motion";

// ==========================================
// 🎨 UI RENDER — SKELETON
// ==========================================
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-10 sm:px-6">
        <div className="mb-6 h-5 w-40 rounded bg-surface-2" />
        <div className="mb-8 h-10 w-64 rounded-lg bg-surface-2" />
        <div className="mb-8 h-40 rounded-3xl bg-surface-2/50" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[380px] rounded-3xl bg-surface-2/40" />
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
    <div className="min-h-screen bg-surface pb-20 md:pb-10">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* ── Back Button ────────────────────────────── */}
        <motion.button
          type="button"
          onClick={f.navigateToDashboard}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-text-secondary transition-all hover:bg-surface-2 hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </motion.button>

        {/* ── Page Header ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex items-center gap-4"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <HeartHandshake className="h-7 w-7 text-surface" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
              Friends
            </h1>
            <p className="text-sm text-text-secondary">
              Manage your connections and friend requests
            </p>
          </div>
        </motion.div>

        {/* ── Main Layout ────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left Sidebar — Search + Pending */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6 lg:col-span-2"
          >
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
          </motion.div>

          {/* Right Content — Friends Grid */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            {/* Section Header */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <h2 className="text-base font-bold text-text-primary">
                  Your Friends
                </h2>
                {hasFriends && (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
                    {f.friends.length}
                  </span>
                )}
              </div>
            </div>

            {/* Friends Grid or Empty State */}
            {friendsLoaded && !hasFriends ? (
              <div className="flex min-h-[60vh] items-center justify-center">
                <FriendsEmptyState onFindFriends={() => addFriendSearchRef.current?.focusSearch()} />
              </div>
            ) : (
              <FriendsList
                friends={f.friends}
                loading={f.loadingFriends}
                onRemoveFriend={f.handleRemoveFriend}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
