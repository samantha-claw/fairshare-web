"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import type { InvitableFriend, SearchResult } from "@/types/group";

// ==========================================
// 🧩 TYPES
// ==========================================
interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitableFriends: InvitableFriend[];
  loadingFriends: boolean;
  addingMember: string | null;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  searchResults: SearchResult[];
  searching: boolean;
  onAddMember: (userId: string) => void;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function AddMemberModal({
  isOpen,
  onClose,
  invitableFriends,
  loadingFriends,
  addingMember,
  searchTerm,
  onSearchTermChange,
  searchResults,
  searching,
  onAddMember,
}: AddMemberModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl sm:my-8">
          <div className="border-b border-gray-100 px-6 pb-4 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Add Member</h3>
              <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">Invite friends or search for any user</p>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
            {/* Quick Add */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                <h4 className="text-sm font-semibold text-gray-800">Quick Add</h4>
                <span className="text-xs text-gray-400">— Your friends not in this group</span>
              </div>

              {loadingFriends ? (
                <div className="flex items-center justify-center py-8"><Spinner className="h-5 w-5 text-gray-400" /></div>
              ) : invitableFriends.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center">
                  <p className="text-sm text-gray-500">All your friends are already in this group</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {invitableFriends.map((friend) => (
                    <li key={friend.friend_id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3 hover:border-blue-200 hover:bg-blue-50/30">
                      <div className="flex items-center gap-3">
                        <Avatar src={friend.friend_avatar_url} name={friend.friend_display_name || friend.friend_full_name || friend.friend_username} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{friend.friend_display_name || friend.friend_full_name}</p>
                          <p className="truncate text-xs text-gray-500">@{friend.friend_username}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onAddMember(friend.friend_id)}
                        disabled={addingMember === friend.friend_id}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {addingMember === friend.friend_id ? <Spinner className="h-3.5 w-3.5" /> : "+"}{" "}
                        {addingMember === friend.friend_id ? "Adding…" : "Add"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Divider */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">or search any user</span></div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search username…"
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {searching && <div className="absolute right-3 top-2.5"><Spinner className="h-5 w-5 text-gray-400" /></div>}
              </div>
            </div>

            {searchResults.length > 0 && (
              <ul className="space-y-2">
                {searchResults.map((user) => (
                  <li key={user.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3 hover:border-blue-200">
                    <Link href={`/dashboard/profile/${user.id}`} target="_blank" className="flex flex-1 items-center gap-3 hover:opacity-80">
                      <Avatar src={user.avatar_url} name={user.display_name || user.full_name || user.username} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 hover:text-blue-600">{user.display_name || user.full_name || user.username}</p>
                        <p className="truncate text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => onAddMember(user.id)}
                      disabled={addingMember === user.id}
                      className="ml-4 inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {addingMember === user.id ? <Spinner className="h-3.5 w-3.5" /> : "+"}{" "}
                      {addingMember === user.id ? "Adding…" : "Add"}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!searching && searchTerm.trim() && searchResults.length === 0 && (
              <p className="mt-3 text-center text-sm text-gray-400">No users found for &ldquo;{searchTerm}&rdquo;</p>
            )}
          </div>

          <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
            <button onClick={onClose} className="w-full rounded-lg py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}