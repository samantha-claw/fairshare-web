"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { useDashboard } from "@/hooks/use-dashboard";
import { OverviewWidget } from "./_components/overview-widget";
import { GroupsBentoGrid } from "./_components/groups-bento-grid";
import { RecentActivityFeed } from "./_components/recent-activity-feed";
import { QuickActions } from "./_components/quick-actions";
import { Receipt, HandCoins } from "lucide-react";

// ==========================================
// 🎨 UI RENDER — SKELETON (content only)
// ==========================================
function DashboardSkeleton() {
  return (
    <div className="w-full animate-pulse px-4 py-8 sm:px-6">
      <div className="mb-2 h-8 w-72 rounded-lg bg-gray-200" />
      <div className="mb-8 h-4 w-56 rounded bg-gray-200/70" />
      <div className="mb-8 h-80 rounded-3xl bg-gray-200/60" />
      <div className="mb-8 flex gap-3">
        <div className="h-12 w-32 rounded-2xl bg-gray-200/50" />
        <div className="h-12 w-32 rounded-2xl bg-gray-200/50" />
        <div className="h-12 w-32 rounded-2xl bg-gray-200/50" />
      </div>
      <div className="mb-5 h-6 w-40 rounded bg-gray-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-56 rounded-3xl bg-gray-200/40" />
        <div className="h-56 rounded-3xl bg-gray-200/40" />
        <div className="h-56 rounded-3xl bg-gray-200/40" />
      </div>
    </div>
  );
}

// ==========================================
// 🎨 UI RENDER — DASHBOARD PAGE
// ==========================================
export default function DashboardPage() {
  const d = useDashboard();

  if (d.loading) return <DashboardSkeleton />;

  return (
    <>
      {/* ── Page Content ─────────────────────────── */}
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
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

        {/* Financial Overview */}
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
          <div className="lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Your Groups
                </h3>
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

          <div>
            <RecentActivityFeed expenses={d.recentExpenses} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          FLOATING ACTION BUTTONS
          
          CRITICAL FIX:
          bottom-24  → hovers well above the floating MobileNav
          right-4    → constrained within viewport (no overflow)
          z-40       → below MobileNav (z-50) but above content
          md:bottom-8 md:right-8 → normal on desktop
          ══════════════════════════════════════════════ */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3 md:bottom-8 md:right-8">
        {/* Settle Up — Secondary FAB */}
        <Link
          href="/dashboard/settle"
          className="group flex items-center gap-2.5 rounded-2xl border border-gray-200/80 bg-white/90 px-4 py-3 shadow-lg shadow-gray-900/5 backdrop-blur-sm transition-all duration-200 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-95"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
            <HandCoins className="h-[18px] w-[18px]" />
          </div>
          <span className="hidden text-sm font-semibold text-gray-700 group-hover:text-emerald-700 sm:block">
            Settle Up
          </span>
        </Link>

        {/* Add Expense — Primary FAB */}
        <Link
          href="/dashboard/expenses/new"
          className="group flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/35 active:scale-95"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
            <Receipt className="h-[18px] w-[18px]" />
          </div>
          <span className="hidden text-sm font-semibold text-white sm:block">
            Add Expense
          </span>
        </Link>
      </div>

      {/* ── Wave Animation Keyframes ─────────────── */}
      <style jsx global>{`
        @keyframes wave {
          0% {
            transform: rotate(0deg);
          }
          10% {
            transform: rotate(14deg);
          }
          20% {
            transform: rotate(-8deg);
          }
          30% {
            transform: rotate(14deg);
          }
          40% {
            transform: rotate(-4deg);
          }
          50% {
            transform: rotate(10deg);
          }
          60% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
      `}</style>
    </>
  );
}