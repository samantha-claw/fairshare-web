"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { forwardRef, useImperativeHandle, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import {
  Search,
  X,
  UserPlus,
  Clock,
  Sparkles,
  AtSign,
} from "lucide-react";
import type { SearchResultUser } from "@/types/friend";

// ==========================================
// 🧩 TYPES
// ==========================================
interface AddFriendSearchProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  searchResults: SearchResultUser[];
  searching: boolean;
  sendingToId: string | null;
  cancellingId: string | null;
  onSendRequest: (username: string, userId: string) => void;
  onCancelRequest: (requestId: string) => void;
  isOutgoingPending: (userId: string) => boolean;
  getOutgoingRequestId: (userId: string) => string | null;
  onClearSearch: () => void;
}

export interface AddFriendSearchHandle {
  focusSearch: () => void;
}

// ==========================================
// ⚙️ LOGIC
// ==========================================

/**
 * Safely resolve a display name from Supabase profile fields.
 * Handles null, undefined, and empty-string cases.
 */
function resolveDisplayName(user: SearchResultUser): string {
  if (user.display_name && user.display_name.trim().length > 0) {
    return user.display_name.trim();
  }
  if (user.username && user.username.trim().length > 0) {
    return user.username.trim();
  }
  return "Unknown User";
}

function resolveUsername(user: SearchResultUser): string {
  if (user.username && user.username.trim().length > 0) {
    return user.username.trim();
  }
  return "unknown";
}

const CARD_ACCENTS = [
  "hover:border-indigo-200 hover:shadow-indigo-100/40",
  "hover:border-emerald-200 hover:shadow-emerald-100/40",
  "hover:border-amber-200 hover:shadow-amber-100/40",
  "hover:border-rose-200 hover:shadow-rose-100/40",
  "hover:border-purple-200 hover:shadow-purple-100/40",
  "hover:border-cyan-200 hover:shadow-cyan-100/40",
  "hover:border-pink-200 hover:shadow-pink-100/40",
  "hover:border-blue-200 hover:shadow-blue-100/40",
];

function getCardAccent(index: number): string {
  return CARD_ACCENTS[index % CARD_ACCENTS.length];
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export const AddFriendSearch = forwardRef<
  AddFriendSearchHandle,
  AddFriendSearchProps
>(function AddFriendSearch({
  searchTerm,
  onSearchTermChange,
  searchResults,
  searching,
  sendingToId,
  cancellingId,
  onSendRequest,
  onCancelRequest,
  isOutgoingPending,
  getOutgoingRequestId,
  onClearSearch,
}, ref) {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      inputRef.current?.focus();
    },
  }));

  const hasQuery = searchTerm.trim().length > 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      {/* Decorative Background */}
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-100/60 to-purple-100/40 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-tr from-blue-100/40 to-cyan-100/30 blur-2xl" />

      {/* Header */}
      <div className="relative border-b border-gray-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20">
            <UserPlus className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Find Friends</h2>
            <p className="text-xs text-gray-500">Search by username to connect</p>
          </div>
          <Sparkles className="ml-auto h-4 w-4 text-indigo-300" />
        </div>
      </div>

      {/* Search Input */}
      <div className="relative px-6 py-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Search username…"
            className="block w-full rounded-2xl border border-gray-200 bg-gray-50/80 py-3 pl-11 pr-11 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => {
                onClearSearch();
                inputRef.current?.focus({ preventScroll: true });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Searching Indicator */}
        {searching && (
          <div className="mt-3 flex items-center justify-center gap-2 py-2 text-xs text-gray-500">
            <Spinner className="h-3.5 w-3.5" />
            Searching…
          </div>
        )}
      </div>

      {/* Results */}
      {hasQuery && !searching && (
        <div className="border-t border-gray-50 px-6 pb-5">
          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Search className="h-5 w-5 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No users found</p>
              <p className="mt-0.5 text-xs text-gray-400">
                Try a different username
              </p>
            </div>
          ) : (
            <div className="space-y-2 pt-3">
              {/* Results Count */}
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {searchResults.length} result{searchResults.length !== 1 && "s"}
              </p>

              {searchResults.map((user, index) => {
                const isPending = isOutgoingPending(user.id);
                const outgoingId = getOutgoingRequestId(user.id);
                const isSending = sendingToId === user.id;
                const isCancelling = outgoingId
                  ? cancellingId === outgoingId
                  : false;

                const displayName = resolveDisplayName(user);
                const username = resolveUsername(user);
                const cardAccent = getCardAccent(index);

                return (
                  <div
                    key={user.id}
                    className={`group relative flex items-center gap-3.5 rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${cardAccent}`}
                  >
                    {/* Avatar with Profile Link */}
                    <Link
                      href={`/dashboard/profile/${user.id}`}
                      className="relative flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                    >
                      <Avatar
                        src={user.avatar_url}
                        name={displayName}
                        size="md"
                      />
                    </Link>

                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                      {/* Display Name — always visible */}
                      <Link
                        href={`/dashboard/profile/${user.id}`}
                        className="block truncate text-sm font-bold text-gray-900 transition-colors group-hover:text-indigo-600"
                      >
                        {displayName}
                      </Link>

                      {/* Username — always visible with @ prefix */}
                      <div className="mt-0.5 flex items-center gap-1">
                        <AtSign className="h-3 w-3 flex-shrink-0 text-gray-300" />
                        <p className="truncate text-xs font-medium text-gray-400">
                          {username}
                        </p>
                      </div>
                    </div>

                    {/* Action Button — Add / Pending+Cancel */}
                    <div className="flex-shrink-0">
                      {isPending ? (
                        <button
                          onClick={() =>
                            outgoingId && onCancelRequest(outgoingId)
                          }
                          disabled={isCancelling}
                          className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isCancelling ? (
                            <>
                              <Spinner className="h-3 w-3" />
                              <span>Cancelling</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" />
                              <span className="group-hover/btn:hidden">
                                Pending
                              </span>
                              <span className="hidden group-hover/btn:inline">
                                Cancel
                              </span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            onSendRequest(username, user.id)
                          }
                          disabled={isSending}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-indigo-200/50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSending ? (
                            <>
                              <Spinner className="h-3 w-3" />
                              <span>Sending</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3 w-3" />
                              <span>Add Friend</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
});