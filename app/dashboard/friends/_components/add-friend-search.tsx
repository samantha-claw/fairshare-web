"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import {
  Search,
  X,
  UserPlus,
  Clock,
  Sparkles,
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

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function AddFriendSearch({
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
}: AddFriendSearchProps) {
  const hasQuery = searchTerm.trim().length > 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      {/* Decorative Background */}
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-100/60 to-purple-100/40 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-tr from-blue-100/40 to-cyan-100/30 blur-2xl" />

      {/* Header */}
      <div className="relative border-b border-gray-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
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
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Search username…"
            className="block w-full rounded-2xl border border-gray-200 bg-gray-50/80 py-3 pl-11 pr-11 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          {hasQuery && (
            <button
              onClick={onClearSearch}
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
            <div className="grid gap-2 pt-2 sm:grid-cols-2">
              {searchResults.map((user) => {
                const isPending = isOutgoingPending(user.id);
                const outgoingId = getOutgoingRequestId(user.id);
                const isSending = sendingToId === user.id;
                const isCancelling = outgoingId
                  ? cancellingId === outgoingId
                  : false;
                const displayName =
                  user.display_name || user.full_name || user.username;

                return (
                  <div
                    key={user.id}
                    className="group relative flex items-center gap-3 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/40"
                  >
                    <Link
                      href={`/dashboard/profile/${user.id}`}
                      className="flex-shrink-0"
                    >
                      <Avatar
                        src={user.avatar_url}
                        name={displayName}
                        size="md"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/profile/${user.id}`}
                        className="block truncate text-sm font-semibold text-gray-900 transition-colors hover:text-indigo-600"
                      >
                        {displayName}
                      </Link>
                      <p className="truncate text-xs text-gray-500">
                        @{user.username}
                      </p>
                    </div>

                    {/* Add / Cancel Button */}
                    {isPending ? (
                      <button
                        onClick={() =>
                          outgoingId && onCancelRequest(outgoingId)
                        }
                        disabled={isCancelling}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isCancelling ? (
                          <Spinner className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {isCancelling ? "…" : "Pending"}
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          onSendRequest(user.username, user.id)
                        }
                        disabled={isSending}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSending ? (
                          <Spinner className="h-3 w-3" />
                        ) : (
                          <UserPlus className="h-3 w-3" />
                        )}
                        {isSending ? "…" : "Add"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}