"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, ArrowUpDown, SortAsc, SortDesc } from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { GroupsBentoGrid } from "@/app/dashboard/_components/groups-bento-grid";
import { GroupsEmptyState } from "@/components/ui/empty-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "name" | "activity" | "cashflow";
type SortDirection = "asc" | "desc";
type SortableGroup = {
  group_name: string;
  net_balance: number;
  updated_at?: string;
  created_at?: string;
};

function parseTimestamp(value?: string): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function GroupsPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse px-4 py-8 sm:px-6">
      <div className="mb-8 h-10 w-56 rounded-lg bg-surface-2" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-48 rounded-3xl bg-surface-2/40" />
        <div className="h-48 rounded-3xl bg-surface-2/40" />
        <div className="h-48 rounded-3xl bg-surface-2/40" />
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const router = useRouter();
  const { groups, loading, userId } = useDashboard();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const trimmedSearchQuery = searchQuery.trim();

  // Filter and sort groups
  const filteredAndSortedGroups = useMemo(() => {
    let result = [...groups];
    
    // Filter by search
    if (trimmedSearchQuery) {
      const query = trimmedSearchQuery.toLowerCase();
      result = result.filter(g => 
        g.group_name.toLowerCase().includes(query)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "name":
          comparison = a.group_name.localeCompare(b.group_name);
          break;
        case "activity": {
          // Use updated_at if available, otherwise fall back to created_at
          const aGroup = a as SortableGroup;
          const bGroup = b as SortableGroup;
          const aDate = aGroup.updated_at ?? aGroup.created_at;
          const bDate = bGroup.updated_at ?? bGroup.created_at;
          comparison = parseTimestamp(aDate) - parseTimestamp(bDate);
          break;
        }
        case "cashflow":
          comparison = Math.abs(a.net_balance) - Math.abs(b.net_balance);
          break;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
    
    return result;
  }, [groups, trimmedSearchQuery, sortBy, sortDirection]);

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };

  if (loading) {
    return <GroupsPageSkeleton />;
  }

  if (groups.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <GroupsEmptyState
          onCreateGroup={() => router.push("/dashboard/groups/new")}
          onJoinGroup={() => router.push("/join")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* ── Page Header ───────────────────────────── */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-text-primary shadow-lg">
            <Users className="h-5 w-5 text-surface" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
              Groups
            </h1>
            <p className="text-sm text-text-secondary">
              {filteredAndSortedGroups.length} group{filteredAndSortedGroups.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/groups/new")}
          className="rounded-xl bg-text-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:opacity-90"
        >
          New Group
        </button>
      </div>

      {/* ── Search & Sort Controls ────────────────── */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search groups"
            className="w-full rounded-xl border border-border bg-surface py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-2 focus:outline-none"
          />
        </div>

        {/* Sort Dropdown */}
        <Select value={sortBy} onValueChange={(v: string) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">A-Z</SelectItem>
            <SelectItem value="activity">Recent Activity</SelectItem>
            <SelectItem value="cashflow">Cash Flow</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Direction Toggle */}
        <button
          type="button"
          onClick={toggleSortDirection}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
          title={sortDirection === "asc" ? "Ascending" : "Descending"}
        >
          {sortDirection === "asc" ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {sortDirection === "asc" ? "Asc" : "Desc"}
          </span>
        </button>
      </div>

      {/* ── Groups Grid ───────────────────────────── */}
      {filteredAndSortedGroups.length === 0 && trimmedSearchQuery ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-12 w-12 text-text-tertiary mb-4" />
          <p className="text-lg font-semibold text-text-primary mb-1">
            No groups found
          </p>
          <p className="text-sm text-text-secondary">
            Try a different search term
          </p>
        </div>
      ) : (
        <GroupsBentoGrid groups={filteredAndSortedGroups} userId={userId} />
      )}
    </div>
  );
}
