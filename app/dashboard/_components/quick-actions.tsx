"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { Plus, UserPlus, Users, Sparkles } from "lucide-react";

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/dashboard/groups/new"
        className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r bg-text-primary px-5 py-3 text-sm font-semibold text-surface shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface/20">
          <Plus className="h-3.5 w-3.5" />
        </div>
        Create Group
        <Sparkles className="h-3.5 w-3.5 text-indigo-200 transition-transform group-hover:rotate-12" />
      </Link>

      <Link
        href="/dashboard/friends"
        className="group inline-flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-text-primary shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-border-2 hover:shadow-lg"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-2 transition-colors group-hover:bg-surface-2">
          <UserPlus className="h-3.5 w-3.5 text-text-secondary transition-colors group-hover:text-text-primary" />
        </div>
        Add Friend
      </Link>

      <Link
        href="/dashboard/friends"
        className="group inline-flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-text-primary shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-border-2 hover:shadow-lg"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-2 transition-colors group-hover:bg-surface-2">
          <Users className="h-3.5 w-3.5 text-text-secondary transition-colors group-hover:text-text-primary" />
        </div>
        Friends
      </Link>
    </div>
  );
}