"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { useDashboard } from "@/hooks/use-dashboard";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { OverviewWidget } from "./_components/overview-widget";
import { GroupsBentoGrid } from "./_components/groups-bento-grid";
import { RecentActivityFeed } from "./_components/recent-activity-feed";
import { QuickActions } from "./_components/quick-actions";
import { Home, Users, Plus, LogOut } from "lucide-react";

// ==========================================
// 🎨 UI RENDER — SKELETON
// ==========================================
function DashboardSkeleton() {
  return (
    <div className="min-h-screen animate-pulse bg-slate-50 pb-20 md:pb-0">
      <div className="h-16 border-b bg-white" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 h-8 w-72 rounded-lg bg-gray-200" />
        <div className="mb-8 h-80 rounded-3xl bg-gray-200/60" />
        <div className="mb-6 h-6 w-40 rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-56 rounded-3xl bg-gray-200/40" />
          <div className="h-56 rounded-3xl bg-gray-200/40" />
          <div className="h-56 rounded-3xl bg-gray-200/40" />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🎨 UI RENDER — PAGE
// ==========================================
export default function DashboardPage() {
  const d = useDashboard();

  if (d.loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-0">
      {/* ── Header ───────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
              <span className="text-sm font-black text-white">F</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Fair<span className="text-indigo-600">Share</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/friends"
              className="hidden rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-indigo-600 sm:block"
            >
              <Users className="h-5 w-5" />
            </Link>
            <Link
              href="/dashboard/profile"
              className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-gray-100"
            >
              <Avatar src={d.avatarUrl} name={d.displayName} size="sm" />
              <span className="hidden text-sm font-medium text-gray-700 sm:block">
                {d.displayName}
              </span>
            </Link>
            <button
              onClick={d.handleSignOut}
              className="hidden items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 sm:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Welcome back, {d.displayName}{" "}
            <span className="inline-block origin-[70%_70%] animate-[wave_2s_ease-in-out_infinite] text-2xl">
              👋
            </span>
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s your financial overview across all groups.
          </p>
        </div>

        {/* Financial Overview (Binance Style) */}
        <div className="mb-8">
          <OverviewWidget
            totalNet={d.totalNet}
            totalOwedToMe={d.totalOwedToMe}
            totalIOwe={d.totalIOwe}
            groups={d.groups}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions />
        </div>

        {/* Groups + Activity Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Groups (Pinterest Style) — Takes 2 cols */}
          <div className="lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">Your Groups</h3>
                {d.groups.length > 0 && (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-600 ring-1 ring-inset ring-indigo-200">
                    {d.groups.length}
                  </span>
                )}
              </div>
              {d.groups.length > 0 && (
                <Link
                  href="/dashboard/groups/new"
                  className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
                >
                  + New Group
                </Link>
              )}
            </div>

            <GroupsBentoGrid groups={d.groups} userId={d.userId} />
          </div>

          {/* Recent Activity — Takes 1 col */}
          <div>
            <RecentActivityFeed expenses={d.recentExpenses} />
          </div>
        </div>
      </main>

      {/* ── Mobile Nav ───────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/90 pb-safe backdrop-blur-xl md:hidden">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 text-indigo-600">
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>
          <Link href="/dashboard/friends" className="flex flex-col items-center gap-1 text-gray-400">
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-medium">Friends</span>
          </Link>
          <Link href="/dashboard/groups/new" className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transition-transform active:scale-95">
              <Plus className="h-6 w-6" />
            </div>
          </Link>
          <Link href="/dashboard/profile" className="flex flex-col items-center gap-1 text-gray-400">
            <Avatar src={d.avatarUrl} name={d.displayName} size="sm" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </div>
      </nav>

      {/* ── Wave Animation Keyframes ─────────────────── */}
      <style jsx global>{`
        @keyframes wave {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}