"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { UserMinus, MessageCircle, ArrowUpRight } from "lucide-react";
import type { Friend } from "@/types/friend";

// ==========================================
// 🧩 TYPES
// ==========================================
interface FriendCardProps {
  friend: Friend;
  onRemove: (friendId: string) => void;
}

// ==========================================
// ⚙️ LOGIC
// ==========================================

const ACCENT_GRADIENTS = [
  "from-indigo-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-purple-500 to-violet-600",
  "from-cyan-500 to-blue-500",
  "from-lime-500 to-green-600",
  "from-fuchsia-500 to-purple-600",
];

function getGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ACCENT_GRADIENTS[Math.abs(hash) % ACCENT_GRADIENTS.length];
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function FriendCard({ friend, onRemove }: FriendCardProps) {
  const displayName =
    friend.friend_display_name || friend.friend_username;
  const gradient = getGradient(friend.friend_id);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-xl">
      {/* Accent Top Bar */}
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

      {/* Content */}
      <div className="flex flex-1 flex-col items-center p-5 pt-4">
        {/* Avatar */}
        <Link
          href={`/dashboard/profile/${friend.friend_id}`}
          className="relative mb-3 transition-transform duration-200 group-hover:scale-105"
        >
          <Avatar
            src={friend.friend_avatar_url}
            name={displayName}
            size="lg"
          />
          {/* Online indicator (decorative) */}
          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
        </Link>

        {/* Name */}
        <Link
          href={`/dashboard/profile/${friend.friend_id}`}
          className="mb-0.5 max-w-full truncate text-sm font-bold text-gray-900 transition-colors hover:text-indigo-600"
        >
          {displayName}
        </Link>
        <p className="max-w-full truncate text-xs text-gray-400">
          @{friend.friend_username}
        </p>

        {/* Actions */}
        <div className="mt-4 flex w-full items-center gap-2">
          <Link
            href={`/dashboard/profile/${friend.friend_id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 text-xs font-semibold text-gray-600 transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <ArrowUpRight className="h-3 w-3" />
            Profile
          </Link>
          <button
            onClick={() => onRemove(friend.friend_id)}
            className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50/80 p-2 text-gray-400 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            title="Remove friend"
          >
            <UserMinus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}