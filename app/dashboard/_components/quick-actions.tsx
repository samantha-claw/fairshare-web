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
        className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20">
          <Plus className="h-3.5 w-3.5" />
        </div>
        Create Group
        <Sparkles className="h-3.5 w-3.5 text-indigo-200 transition-transform group-hover:rotate-12" />
      </Link>

      <Link
        href="/dashboard/friends"
        className="group inline-flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 transition-colors group-hover:bg-indigo-100">
          <UserPlus className="h-3.5 w-3.5 text-gray-500 transition-colors group-hover:text-indigo-600" />
        </div>
        Add Friend
      </Link>

      <Link
        href="/dashboard/friends"
        className="group inline-flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 transition-colors group-hover:bg-indigo-100">
          <Users className="h-3.5 w-3.5 text-gray-500 transition-colors group-hover:text-indigo-600" />
        </div>
        Friends
      </Link>
    </div>
  );
}