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
    <div className="w-full min-w-0 animate-pulse py-8">
      {/* Welcome placeholder */}
      <div className="mb-2 h-8 w-3/4 max-w-xs rounded-lg bg-gray-200" />
      <div className="mb-8 h-4 w-1/2 max-w-[14rem] rounded bg-gray-200/70" />

      {/* Overview placeholder */}
      <div className="mb-8 h-80 w-full rounded-3xl bg-gray-200/60" />

      {/* Quick actions placeholder */}
      <div className="mb-8 flex w-full gap-3 overflow-hidden">
        <div className="h-12 w-32 shrink-0 rounded-2xl bg-gray-200/50" />
        <div className="h-12 w-32 shrink-0 rounded-2xl bg-gray-200/50" />
        <div className="h-12 w-32 shrink-0 rounded-2xl bg-gray-200/50" />
      </div>

      {/* Groups grid placeholder */}
      <div className="mb-5 h-6 w-40 rounded bg-gray-200" />
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-56 w-full rounded-3xl bg-gray-200/40" />
        <div className="h-56 w-full rounded-3xl bg-gray-200/40" />
        <div className="hidden h-56 w-full rounded-3xl bg-gray-200/40 lg:block" />
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
      {/*
       * ════════════════════════════════════════════════
       * PAGE CONTENT
       *
       * w-full        → fill parent (main already has px padding)
       * min-w-0       → allow shrinking inside flex parent
       * max-w-6xl     → cap width on ultrawide screens
       * mx-auto       → center when capped
       * py-8          → vertical breathing room
       *
       * NOTE: Horizontal padding (px) is now handled by
       * the <main> in dashboard-shell.tsx so we DON'T
       * double-pad here. Only vertical + max-width.
       * ════════════════════════════════════════════════
       */}
      <div className="mx-auto w-full min-w-0 max-w-6xl py-8">
        {/* ── Welcome ────────────────────────────── */}
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

        {/* ── Financial Overview ──────────────────── */}
        <div className="mb-8 w-full min-w-0">
          <OverviewWidget
            totalNet={d.totalNet}
            totalOwedToMe={d.totalOwedToMe}
            totalIOwe={d.totalIOwe}
            groups={d.groups}
          />
        </div>

        {/* ── Quick Actions ──────────────────────── */}
        <div className="mb-8 w-full min-w-0">
          <QuickActions />
        </div>

        {/*
         * ════════════════════════════════════════════
         * GROUPS + ACTIVITY GRID
         *
         * grid-cols-1   → single column on mobile (CRITICAL)
         * lg:grid-cols-3 → 3 columns only on large screens
         * w-full        → never exceed parent
         * min-w-0       → allow shrinking
         * ════════════════════════════════════════════
         */}
        <div className="grid w-full min-w-0 grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Groups — 2 cols on desktop */}
          <div className="min-w-0 lg:col-span-2">
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

            {/*
             * GroupsBentoGrid wrapper:
             * w-full + min-w-0 ensures cards never push
             * past the container edge
             */}
            <div className="w-full min-w-0">
              <GroupsBentoGrid groups={d.groups} userId={d.userId} />
            </div>
          </div>

          {/* Recent Activity — 1 col */}
          <div className="w-full min-w-0">
            <RecentActivityFeed expenses={d.recentExpenses} />
          </div>
        </div>
      </div>

      {/*
       * ════════════════════════════════════════════════
       * I will likely add floating action buttons here in the future,
       * FLOATING ACTION BUTTONS
       *
       * bottom-24   → above mobile nav
       * right-4     → 1rem from right edge (safe)
       * z-40        → below nav (z-50), above content
       * md:bottom-8 md:right-8 → normal desktop position
       * ════════════════════════════════════════════════
       */}

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