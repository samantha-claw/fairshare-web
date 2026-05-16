"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFriends } from "@/hooks/use-friends";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { FriendsEmptyState } from "@/components/ui/empty-states";
import { ArrowLeft, UserPlus, Search, X, Clock, AtSign, Check } from "lucide-react";
import { motion } from "framer-motion";
import type { SearchResultUser } from "@/types/friend";

// ==========================================
// 🎨 UI RENDER — SKELETON
// ==========================================
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-4xl animate-pulse px-4 py-10 sm:px-6">
        <div className="mb-8 h-10 w-48 rounded-lg bg-surface-2" />
        <div className="mb-6 h-14 rounded-2xl bg-surface-2/50" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[380px] rounded-2xl bg-surface-2/40" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🧩 HELPER FUNCTIONS
// ==========================================
function resolveDisplayName(user: SearchResultUser): string {
  if (user.display_name && user.display_name.trim().length > 0) {
    return user.display_name.trim();
  }
  if (user.username && user.username.trim().length > 0) {
    return user.username.trim();
  }
  return "Unknown User";
}

function resolveUsername(user: SearchResultUser): string | null {
  if (user.username && user.username.trim().length > 0) {
    return user.username.trim();
  }
  return null;
}

// ==========================================
// 🎨 SEARCH RESULT CARD (Similar to FriendCard)
// ==========================================
interface SearchUserCardProps {
  user: SearchResultUser;
  isPending: boolean;
  outgoingId: string | null;
  isSending: boolean;
  isCancelling: boolean;
  onSendRequest: (username: string, userId: string) => void;
  onCancelRequest: (requestId: string) => void;
}

function SearchUserCard({
  user,
  isPending,
  outgoingId,
  isSending,
  isCancelling,
  onSendRequest,
  onCancelRequest,
}: SearchUserCardProps) {
  const displayName = resolveDisplayName(user);
  const username = resolveUsername(user);
  const hasValidUsername = Boolean(username);
  const avatarUrl = user.avatar_url;

  return (
    <motion.div
      data-slot="search-user-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 28, mass: 0.6 }}
      className="relative w-full aspect-[4/5] rounded-2xl border border-border/20 text-card-foreground overflow-hidden shadow-lg cursor-pointer group backdrop-blur-sm"
    >
      {/* Full Cover Image (Avatar) */}
      <motion.img
        src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
        alt={displayName}
        className="absolute inset-0 w-full h-full object-cover"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />

      {/* Smooth Blur Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 via-background/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-background/90 via-background/40 to-transparent backdrop-blur-[1px]" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 28 }}
        className="absolute bottom-0 left-0 right-0 p-5 space-y-3"
      >
        {/* Name and Icon */}
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-text-primary truncate">
            {displayName}
          </h2>
          <motion.div
            className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-2 text-text-secondary flex-shrink-0"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <AtSign className="w-3 h-3" />
          </motion.div>
        </div>

        {/* Username */}
        <p className="text-text-secondary text-sm leading-relaxed line-clamp-1">
          {hasValidUsername ? `@${username}` : "Username unavailable"}
        </p>

        {/* Action Button */}
        <div className="flex gap-2 pt-2">
          <Link
            href={`/dashboard/profile/${user.id}`}
            className="flex-1"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full cursor-pointer py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 border border-border/20 shadow-sm bg-surface-2 text-text-secondary hover:bg-surface hover:text-text-primary flex items-center justify-center gap-2"
            >
              View Profile
            </motion.div>
          </Link>

          {isPending ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => outgoingId && onCancelRequest(outgoingId)}
              disabled={isCancelling}
              className="cursor-pointer py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 border border-amber-500/50 bg-amber-500/10 text-amber-600 hover:border-negative hover:bg-negative-bg hover:text-negative disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCancelling ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>...</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  <span className="group-hover:hidden">Pending</span>
                  <span className="hidden group-hover:inline">Cancel</span>
                </>
              )}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (!username) {
                  return;
                }
                onSendRequest(username, user.id);
              }}
              disabled={isSending || !hasValidUsername}
              className="cursor-pointer py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm bg-text-primary text-surface hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Add</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==========================================
// 🎨 UI RENDER — PAGE
// ==========================================
export default function AddFriendsPage() {
  const router = useRouter();
  const f = useFriends();

  if (f.loading) return <PageSkeleton />;

  const hasQuery = f.searchTerm.trim().length > 0;

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-10">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* ── Back Button & Header ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Link
            href="/dashboard/friends"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Friends
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-text-primary shadow-lg">
              <UserPlus className="h-7 w-7 text-surface" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
                Add Friends
              </h1>
              <p className="text-sm text-text-secondary">
                Search by username to connect
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Search Input ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={f.searchTerm}
              onChange={(e) => f.setSearchTerm(e.target.value)}
              placeholder="Search by username..."
              aria-label="Search users"
              autoFocus
              className="block w-full rounded-2xl border border-border bg-surface py-4 pl-12 pr-12 text-base text-text-primary placeholder:text-text-tertiary transition-all duration-200 focus:border-border-2 focus:outline-none focus:ring-2 focus:ring-border/30"
            />
            {hasQuery && (
              <button
                type="button"
                onClick={f.clearSearch}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Searching Indicator */}
          {f.searching && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-text-secondary">
              <Spinner className="h-4 w-4" />
              Searching...
            </div>
          )}
        </motion.div>

        {/* ── Results ─────────────────────────────────── */}
        {hasQuery && !f.searching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {f.searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-2">
                  <Search className="h-8 w-8 text-text-tertiary" />
                </div>
                <p className="text-lg font-semibold text-text-primary mb-1">
                  No users found
                </p>
                <p className="text-sm text-text-secondary">
                  Try a different username
                </p>
              </div>
            ) : (
              <>
                {/* Results Count */}
                <p className="mb-4 text-sm font-medium text-text-secondary">
                  {f.searchResults.length} result{f.searchResults.length !== 1 ? "s" : ""}
                </p>

                {/* Results Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {f.searchResults.map((user) => {
                    const isPending = f.isOutgoingPending(user.id);
                    const outgoingId = f.getOutgoingRequestId(user.id);
                    const isSending = f.sendingToId === user.id;
                    const isCancelling = outgoingId ? f.cancellingId === outgoingId : false;

                    return (
                      <SearchUserCard
                        key={user.id}
                        user={user}
                        isPending={isPending}
                        outgoingId={outgoingId}
                        isSending={isSending}
                        isCancelling={isCancelling}
                        onSendRequest={f.handleSendRequest}
                        onCancelRequest={f.handleCancelRequest}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── Empty State (no search yet) ─────────────── */}
        {!hasQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-2">
              <UserPlus className="h-10 w-10 text-text-tertiary" />
            </div>
            <p className="text-lg font-semibold text-text-primary mb-1">
              Find your friends
            </p>
            <p className="text-sm text-text-secondary max-w-xs">
              Enter a username above to search for people you know
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
