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
import { Receipt, HandCoins, Plus, Bell, MessageCircle, Search } from "lucide-react";

// ==========================================
// 🎨 UI RENDER - SKELETON (content only)
// ==========================================
function DashboardSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden animate-pulse">
      {/* Header placeholder */}
      <header className="h-16 flex items-center justify-between px-6 mb-8">
        <div className="h-8 w-32 rounded-lg bg-gray-200 dark:bg-surface-dark" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-surface-dark" />
          <div className="h-10 w-24 rounded-xl bg-gray-200 dark:bg-surface-dark" />
        </div>
      </header>

      {/* Main content placeholder */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
          <div className="xl:col-span-2 flex flex-col gap-6">
            <div className="h-80 w-full rounded-3xl bg-gray-200/60 dark:bg-surface-dark" />
            <div className="h-64 w-full rounded-3xl bg-gray-200/60 dark:bg-surface-dark" />
          </div>
          <div className="flex flex-col gap-6">
            <div className="h-48 w-full rounded-3xl bg-gray-200/60 dark:bg-surface-dark" />
            <div className="h-64 w-full rounded-3xl bg-gray-200/60 dark:bg-surface-dark" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🎨 UI RENDER - DASHBOARD PAGE (NEW DESIGN)
// ==========================================
export default function DashboardPage() {
  const d = useDashboard();

  if (d.loading) return <DashboardSkeleton />;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* ════════════════════════════════════════════════
          HEADER - Clean top bar matching new design
          ════════════════════════════════════════════════ */}
      <header className="h-16 flex items-center justify-between mb-8 px-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-light-primary dark:text-text-dark-primary">
          Dashboard
        </h1>

        {/* Search + Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-64 lg:w-80 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Create Button */}
          <Link
            href="/dashboard/groups/new"
            className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity whitespace-hidden"
          >
            Create
          </Link>

          {/* Notifications */}
          <button className="w-10 h-10 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm border border-border-light dark:border-border-dark">
            <Bell className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
          </button>

          {/* Messages */}
          <button className="w-10 h-10 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm border border-border-light dark:border-border-dark">
            <MessageCircle className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
          </button>

          {/* Avatar */}
          <button className="w-10 h-10 rounded-full border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
            <div className="w-full h-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              {d.displayName?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════════════
          MAIN CONTENT AREA
          ════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">

          {/* ── LEFT COLUMN (2 spans) ───────────────────── */}
          <div className="xl:col-span-2 flex flex-col gap-6">

            {/* Overview Widget - Financial summary cards */}
            <OverviewWidget
              totalNet={d.totalNet}
              totalOwedToMe={d.totalOwedToMe}
              totalIOwe={d.totalIOwe}
              groups={d.groups}
            />

            {/* Financial View - Bar chart section */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-3xl p-6 shadow-sm dark:shadow-none border border-border-light dark:border-border-dark flex-1 flex flex-col relative min-h-[350px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  Financial view
                </h2>
                <div className="relative">
                  <select className="appearance-none bg-gray-100 dark:bg-[#202020] border-none rounded-xl pl-4 pr-10 py-2 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary focus:ring-0 cursor-pointer">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                    <svg className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Chart placeholder - will integrate with real data */}
              <div className="flex-1 flex items-end justify-end gap-3 pb-6 pr-4 mt-16">
                {d.groups.slice(0, 7).map((group, index) => {
                  const height = Math.abs(group.net_balance) > 0
                    ? Math.min(Math.abs(group.net_balance) / 100, 80) + 20
                    : 30;
                  const isActive = index === 3;
                  return (
                    <div
                      key={group.group_id}
                      className={`w-12 rounded-t-lg relative group transition-all ${
                        isActive
                          ? "bg-primary"
                          : "bg-gray-200 dark:bg-[#2A2A2A]"
                      }`}
                      style={{ height: `${height}%` }}
                    >
                      {isActive && (
                        <>
                          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-200 text-black px-3 py-1 rounded-lg text-xs font-bold shadow-md whitespace-nowrap">
                            {group.net_balance > 0 ? "+" : ""}{group.net_balance.toFixed(0)}
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white dark:bg-gray-200 rotate-45" />
                          </div>
                          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full border-2 border-primary bg-surface-dark" />
                        </>
                      )}
                      <div className="absolute -bottom-6 w-full text-center text-xs text-text-light-secondary dark:text-text-dark-secondary truncate px-1">
                        {group.group_name.slice(0, 3)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total amount */}
              <div className="absolute bottom-6 left-6 flex flex-col">
                <div className="text-4xl font-bold leading-none mb-2 tracking-tight flex items-baseline">
                  <span className="text-text-light-secondary dark:text-text-dark-secondary text-2xl mr-1">$</span>
                  {Math.abs(d.totalNet).toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  {d.totalNet > 0 && (
                    <div className="flex items-center gap-1 text-primary bg-success-bg px-2 py-0.5 rounded-lg text-xs font-semibold">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      36.8%
                    </div>
                  )}
                  <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    vs last month
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN (1 span) ───────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Spending Breakdown - Donut chart */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-3xl p-6 shadow-sm dark:shadow-none border border-border-light dark:border-border-dark flex flex-col">
              <h2 className="text-xl font-bold mb-6 text-text-light-primary dark:text-text-dark-primary">
                Spending Breakdown
              </h2>

              {/* Donut Chart */}
              <div className="relative w-48 h-48 mx-auto my-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle
                    className="stroke-gray-200 dark:stroke-[#2A2A2A]"
                    cx="18"
                    cy="18"
                    fill="transparent"
                    r="15.91549430918954"
                    strokeWidth="3"
                  />
                  <circle
                    className="stroke-primary"
                    cx="18"
                    cy="18"
                    fill="transparent"
                    r="15.91549430918954"
                    strokeDasharray={`${Math.min(d.totalOwedToMe / (d.totalOwedToMe + d.totalIOwe || 1) * 100, 100)} 100`}
                    strokeDashoffset="0"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
                    {d.totalIOwe > 0
                      ? Math.round(d.totalOwedToMe / (d.totalOwedToMe + d.totalIOwe) * 100)
                      : 0}%
                  </span>
                  <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                    Recovered
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex justify-between items-end mt-auto pt-6 border-t border-border-light dark:border-border-dark">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-text-light-secondary dark:text-text-dark-secondary text-xs">
                    <HandCoins className="h-3.5 w-3.5" />
                    Owed to you
                  </div>
                  <span className="font-bold text-sm text-text-light-primary dark:text-text-dark-primary">
                    {d.totalOwedToMe > 0
                      ? Math.round(d.totalOwedToMe / (d.totalOwedToMe + d.totalIOwe) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-text-light-secondary dark:text-text-dark-secondary text-xs">
                    <Receipt className="h-3.5 w-3.5" />
                    You owe
                  </div>
                  <span className="font-bold text-sm text-text-light-primary dark:text-text-dark-primary">
                    {d.totalIOwe > 0
                      ? Math.round(d.totalIOwe / (d.totalOwedToMe + d.totalIOwe) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Popular Groups */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-3xl p-6 shadow-sm dark:shadow-none border border-border-light dark:border-border-dark flex-1 flex flex-col">
              <h2 className="text-xl font-bold mb-6 text-text-light-primary dark:text-text-dark-primary">
                Popular groups
              </h2>

              <div className="flex flex-col gap-4 flex-1">
                {d.groups.slice(0, 4).map((group) => (
                  <Link
                    key={group.group_id}
                    href={`/dashboard/groups/${group.group_id}`}
                    className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -mx-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <span className="text-lg font-bold text-primary">
                          {group.group_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm group-hover:text-primary transition-colors text-text-light-primary dark:text-text-dark-primary">
                          {group.group_name}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`font-bold text-sm ${
                        group.net_balance > 0
                          ? "text-primary"
                          : group.net_balance < 0
                            ? "text-rose-500"
                            : "text-text-light-secondary dark:text-text-dark-secondary"
                      }`}>
                        {group.net_balance > 0 ? "+" : ""}{group.net_balance.toFixed(0)}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        group.net_balance !== 0
                          ? "text-primary border border-primary/30"
                          : "text-text-light-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark"
                      }`}>
                        {group.net_balance !== 0 ? "Active" : "Settled"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              <Link
                href="/dashboard/groups"
                className="w-full mt-6 py-3 px-4 border border-border-light dark:border-border-dark rounded-xl text-sm font-semibold text-text-light-primary dark:text-text-dark-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
              >
                All groups
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
