"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import type { InvitableFriend, SearchResult } from "@/types/group";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitableFriends: InvitableFriend[];
  loadingFriends: boolean;
  addingMember: string | null;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  searchResults?: SearchResult[];
  searching?: boolean;
  onAddMember: (userId: string) => void;
}

export function AddMemberModal({
  isOpen,
  onClose,
  invitableFriends,
  loadingFriends,
  addingMember,
  searchTerm,
  onSearchTermChange,
  onAddMember,
}: AddMemberModalProps) {
  const normalizedTerm = searchTerm.trim().toLowerCase();

  const filteredFriends = normalizedTerm
    ? invitableFriends.filter(
        (friend) =>
          friend.friend_display_name?.toLowerCase().includes(normalizedTerm) ||
          friend.friend_full_name?.toLowerCase().includes(normalizedTerm) ||
          friend.friend_username?.toLowerCase().includes(normalizedTerm)
      )
    : invitableFriends;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Member">
      {/* ── Header ── */}
      <div className="border-b border-border px-6 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Add Member</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-tertiary transition-all duration-200 hover:bg-surface-2 hover:text-text-secondary active:scale-95"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          Search your friends to add them to this group
        </p>
      </div>

      {/* ── Body ── */}
      <div className="max-h-[70vh] overflow-y-auto overscroll-contain px-6 py-5">
        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search friends by name or username…"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-surface py-2.5 pl-10 pr-10 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            {searchTerm.trim() && (
              <button
                onClick={() => onSearchTermChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-text-tertiary transition-colors hover:bg-surface-2 hover:text-text-secondary"
                title="Clear search"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Section Label */}
        <div className="mb-3 flex items-center gap-2">
          <svg
            className="h-4 w-4 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
          <h4 className="text-sm font-semibold text-text-primary">Your Friends</h4>
          {!loadingFriends && (
            <span className="text-xs text-text-tertiary">
              —{" "}
              {normalizedTerm
                ? `${filteredFriends.length} of ${invitableFriends.length} shown`
                : `${invitableFriends.length} available`}
            </span>
          )}
        </div>

        {/* Friends List */}
        {loadingFriends ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-5 w-5 text-text-tertiary" />
          </div>
        ) : invitableFriends.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface-2/50 px-4 py-6 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
              <svg
                className="h-5 w-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-text-primary">
              All friends are already members
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              Use the Share / QR button to invite new people
            </p>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface-2/50 px-4 py-6 text-center">
            <p className="text-sm text-text-secondary">
              No friends match &ldquo;{searchTerm}&rdquo;
            </p>
            <button
              onClick={() => onSearchTermChange("")}
              className="mt-2 text-xs font-medium text-text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredFriends.map((friend) => (
              <li
                key={friend.friend_id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-2/50 p-3 transition-all hover:border-blue-200 hover:bg-blue-50/30"
              >
                <Link
                  href={`/dashboard/profile/${friend.friend_id}`}
                  target="_blank"
                  className="flex flex-1 items-center gap-3 hover:opacity-80"
                >
                  <Avatar
                    src={friend.friend_avatar_url}
                    name={
                      friend.friend_display_name ||
                      friend.friend_full_name ||
                      friend.friend_username
                    }
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {friend.friend_display_name || friend.friend_full_name}
                    </p>
                    <p className="truncate text-xs text-text-secondary">
                      @{friend.friend_username}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => onAddMember(friend.friend_id)}
                  disabled={addingMember === friend.friend_id}
                  className="ml-3 inline-flex shrink-0 items-center gap-1 rounded-md bg-text-text-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingMember === friend.friend_id ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  )}
                  {addingMember === friend.friend_id ? "Adding…" : "Add"}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Hint */}
        {!loadingFriends && invitableFriends.length > 0 && (
          <div className="mt-5 rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-center">
            <p className="text-xs text-text-primary">
              💡 Want to add someone who isn&apos;t your friend yet?
              <br />
              Use the <span className="font-semibold">Share / QR Code</span>{" "}
              button in the header to send them an invite link.
            </p>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-border bg-surface-2 px-6 py-3">
        <button
          onClick={onClose}
          className="w-full rounded-lg py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}