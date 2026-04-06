"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFriends } from "@/hooks/use-friends";
import { PendingRequests } from "./_components/pending-requests";
import { FriendsList } from "./_components/friends-list";
import { FriendsEmptyState } from "@/components/ui/empty-states";
import { HeartHandshake, UserCheck, UserPlus, Search, SortAsc, SortDesc } from "lucide-react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "name" | "recent";
type SortDirection = "asc" | "desc";

// ==========================================
// 🎨 UI RENDER — SKELETON
// ==========================================
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-10 sm:px-6">
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
  const router = useRouter();
  const f = useFriends();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter and sort friends
  const filteredAndSortedFriends = useMemo(() => {
    let result = [...f.friends];
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(friend => 
        (friend.friend_display_name || friend.friend_username || "").toLowerCase().includes(query) ||
        (friend.friend_username || "").toLowerCase().includes(query)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "name":
          const aName = a.friend_display_name || a.friend_username || "";
          const bName = b.friend_display_name || b.friend_username || "";
          comparison = aName.localeCompare(bName);
          break;
        case "recent":
          const aDate = (a as any).created_at || "";
          const bDate = (b as any).created_at || "";
          comparison = new Date(bDate).getTime() - new Date(aDate).getTime();
          break;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
    
    return result;
  }, [f.friends, searchQuery, sortBy, sortDirection]);

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };

  if (f.loading) return <PageSkeleton />;

  const hasFriends = f.friends.length > 0;
  const friendsLoaded = !f.loadingFriends;

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-10">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* ── Page Header ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-text-primary shadow-lg">
              <HeartHandshake className="h-7 w-7 text-surface" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
                Friends
              </h1>
              <p className="text-sm text-text-secondary">
                {hasFriends ? `${f.friends.length} connection${f.friends.length !== 1 ? "s" : ""}` : "Manage your connections"}
                {f.pendingRequests.length > 0 && ` · ${f.pendingRequests.length} pending`}
              </p>
            </div>
          </div>
          
          {/* Add Friend Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/dashboard/friends/add")}
            className="flex items-center gap-2 rounded-xl bg-text-primary px-4 py-2.5 text-sm font-semibold text-surface shadow-sm transition-all hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Friend</span>
          </motion.button>
        </motion.div>

        {/* ── Main Layout ────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left Sidebar — Pending Requests */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6 lg:col-span-2"
          >
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
            {/* Section Header with Search & Sort */}
            <div className="mb-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-positive-bg">
                    <UserCheck className="h-4 w-4 text-positive" />
                  </div>
                  <h2 className="text-base font-bold text-text-primary">
                    Your Friends
                  </h2>
                  {hasFriends && (
                    <span className="rounded-full bg-positive-bg px-2.5 py-0.5 text-xs font-bold text-positive">
                      {f.friends.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Search & Sort Controls */}
              {hasFriends && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[150px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                    <input
                      type="text"
                      placeholder="Search friends..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-2 focus:outline-none"
                    />
                  </div>

                  {/* Sort Dropdown */}
                  <Select value={sortBy} onValueChange={(v: string) => setSortBy(v as SortOption)}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">A-Z</SelectItem>
                      <SelectItem value="recent">Recent</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort Direction Toggle */}
                  <button
                    type="button"
                    onClick={toggleSortDirection}
                    className="flex h-8 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
                    title={sortDirection === "asc" ? "Ascending" : "Descending"}
                  >
                    {sortDirection === "asc" ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Friends Grid or Empty State */}
            {friendsLoaded && !hasFriends ? (
              <div className="flex min-h-[60vh] items-center justify-center">
                <FriendsEmptyState onFindFriends={() => router.push("/dashboard/friends/add")} />
              </div>
            ) : searchQuery && filteredAndSortedFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-text-tertiary mb-4" />
                <p className="text-lg font-semibold text-text-primary mb-1">
                  No friends found
                </p>
                <p className="text-sm text-text-secondary">
                  Try a different search term
                </p>
              </div>
            ) : (
              <FriendsList
                friends={filteredAndSortedFriends}
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
