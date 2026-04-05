"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { FriendCard } from "./friend-card";
import { Spinner } from "@/components/ui/spinner";
import { Users } from "lucide-react";
import type { Friend } from "@/types/friend";

// ==========================================
// 🧩 TYPES
// ==========================================
interface FriendsListProps {
  friends: Friend[];
  loading: boolean;
  onRemoveFriend: (friendId: string) => void;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function FriendsList({ friends, loading, onRemoveFriend }: FriendsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="h-6 w-6 text-text-primary" />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-border bg-surface-2/30 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-text-primary/10">
          <Users className="h-8 w-8 text-text-primary" />
        </div>
        <h3 className="text-base font-bold text-text-primary">No friends yet</h3>
        <p className="mx-auto mt-1 max-w-xs text-sm text-text-secondary">
          Search for people above and send them a friend request to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      {friends.map((friend) => (
        <FriendCard
          key={friend.friend_id}
          friend={friend}
          onRemove={onRemoveFriend}
        />
      ))}
    </div>
  );
}
