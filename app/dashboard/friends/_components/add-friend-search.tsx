"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { forwardRef, useImperativeHandle, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { Search, X, UserPlus, Clock, AtSign } from "lucide-react";
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

// ==========================================
// 🎨 UI RENDER
// ==========================================
export const AddFriendSearch = forwardRef<AddFriendSearchHandle, AddFriendSearchProps>(
  function AddFriendSearch(
    {
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
    },
    ref
  ) {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focusSearch: () => {
        inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        inputRef.current?.focus();
      },
    }));

    const hasQuery = searchTerm.trim().length > 0;

    return (
      <section className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/30 backdrop-blur-md">
        {/* Header */}
        <div className="relative border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-text-primary/10">
              <UserPlus className="h-4 w-4 text-text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">Find Friends</h2>
              <p className="text-xs text-text-secondary">Search by username to connect</p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative px-5 py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              placeholder="Search username…"
              className="block w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-11 text-sm text-text-primary placeholder-muted-foreground transition-all duration-200 focus:border-border-2 focus:outline-none focus:ring-2 focus:ring-border/30"
            />
            {hasQuery && (
              <button
                type="button"
                onClick={() => {
                  onClearSearch();
                  inputRef.current?.focus({ preventScroll: true });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Searching Indicator */}
          {searching && (
            <div className="mt-3 flex items-center justify-center gap-2 py-2 text-xs text-text-secondary">
              <Spinner className="h-3.5 w-3.5" />
              Searching…
            </div>
          )}
        </div>

        {/* Results */}
        {hasQuery && !searching && (
          <div className="border-t border-border/50 px-5 pb-5">
            {searchResults.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface-2">
                  <Search className="h-5 w-5 text-text-secondary" />
                </div>
                <p className="text-sm font-medium text-text-primary">No users found</p>
                <p className="mt-0.5 text-xs text-text-secondary">Try a different username</p>
              </div>
            ) : (
              <div className="space-y-2 pt-3">
                {/* Results Count */}
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-text-secondary">
                  {searchResults.length} result{searchResults.length !== 1 && "s"}
                </p>

                {searchResults.map((user) => {
                  const isPending = isOutgoingPending(user.id);
                  const outgoingId = getOutgoingRequestId(user.id);
                  const isSending = sendingToId === user.id;
                  const isCancelling = outgoingId ? cancellingId === outgoingId : false;
                  const displayName = resolveDisplayName(user);
                  const username = resolveUsername(user);

                  return (
                    <div
                      key={user.id}
                      className="group relative flex items-center gap-3.5 rounded-xl border border-border/50 bg-surface p-4 transition-all duration-300 hover:border-border-2 hover:shadow-lg hover:shadow-sm"
                    >
                      {/* Avatar */}
                      <Link
                        href={`/dashboard/profile/${user.id}`}
                        className="relative flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                      >
                        <Avatar src={user.avatar_url} name={displayName} size="md" />
                      </Link>

                      {/* User Info */}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/profile/${user.id}`}
                          className="block truncate text-sm font-bold text-text-primary transition-colors group-hover:text-text-primary"
                        >
                          {displayName}
                        </Link>
                        <div className="mt-0.5 flex items-center gap-1">
                          <AtSign className="h-3 w-3 flex-shrink-0 text-text-secondary" />
                          <p className="truncate text-xs font-medium text-text-secondary">{username}</p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        {isPending ? (
                          <button
                            onClick={() => outgoingId && onCancelRequest(outgoingId)}
                            disabled={isCancelling}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600 transition-all duration-200 hover:border-negative hover:bg-negative-bg hover:text-negative disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isCancelling ? (
                              <>
                                <Spinner className="h-3 w-3" />
                                <span>Cancelling</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3" />
                                <span className="group-hover:hidden">Pending</span>
                                <span className="hidden group-hover:inline">Cancel</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => onSendRequest(username, user.id)}
                            disabled={isSending}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-text-primary px-3.5 py-2 text-xs font-semibold text-text-primary-foreground shadow-sm transition-all duration-200 hover:bg-text-primary/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
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
  }
);
