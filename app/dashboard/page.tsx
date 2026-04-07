"use client";

import Link from "next/link";
import { useDashboard } from "@/hooks/use-dashboard";
import { OverviewWidget } from "./_components/overview-widget";
import { Receipt, HandCoins } from "lucide-react";
import { useState } from "react";

function parseGroupDate(value?: string): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getGroupsInRange<T extends { created_at?: string }>(range: string, groups: T[]): T[] {
  const days = range === "30" ? 30 : 7;
  const startDate = Date.now() - days * 24 * 60 * 60 * 1000;
  return groups.filter((group) => parseGroupDate(group.created_at) >= startDate);
}

function DashboardSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden animate-pulse">
      <header className="h-16 flex items-center justify-between px-6 mb-8">
        <div className="h-8 w-32 rounded-lg bg-surface-2" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-surface-2" />
          <div className="h-10 w-24 rounded-xl bg-surface-2" />
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
          <div className="xl:col-span-2 flex flex-col gap-6">
            <div className="h-80 w-full rounded-3xl bg-surface-2" />
            <div className="h-64 w-full rounded-3xl bg-surface-2" />
          </div>
          <div className="flex flex-col gap-6">
            <div className="h-48 w-full rounded-3xl bg-surface-2" />
            <div className="h-64 w-full rounded-3xl bg-surface-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const d = useDashboard();
  const [selectedRange, setSelectedRange] = useState("7");

  if (d.loading) return <DashboardSkeleton />;

  const displayedGroups = getGroupsInRange(selectedRange, d.groups);
  const maxAbsBalance = Math.max(0, ...displayedGroups.map((g) => Math.abs(g.net_balance)));
  const denom = d.totalOwedToMe + d.totalIOwe || 1;
  const pctOwedToMe = Math.round((d.totalOwedToMe / denom) * 100);
  const pctIOwe = 100 - pctOwedToMe;

  return (
    <div className="flex-1 bg-background">
      <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-border animate-fade-up">
        <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-0.5">Your financial overview</p>
      </div>

      <div className="px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* ── LEFT COLUMN (2 spans) */}
          <div className="xl:col-span-2 flex flex-col gap-5">
            <OverviewWidget
              totalNet={d.totalNet}
              totalOwedToMe={d.totalOwedToMe}
              totalIOwe={d.totalIOwe}
              groups={d.groups}
            />

            {/* Financial View - Bar chart */}
            <div className="bg-surface rounded-2xl p-6 border border-border flex-1 flex flex-col relative min-h-[350px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold text-text-primary">Financial view</h2>
                <div className="relative">
                  <select
                    value={selectedRange}
                    onChange={(e) => setSelectedRange(e.target.value)}
                    className="appearance-none bg-surface-2 border-none rounded-xl pl-4 pr-10 py-2 text-sm font-medium text-text-secondary focus:ring-0 cursor-pointer"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                  </select>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="mt-16 flex-1 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
                <div className="flex min-w-max items-end justify-end gap-1 sm:gap-2 md:gap-3 pb-6 pr-4">
                  {displayedGroups.map((group) => {
                    const height = Math.abs(group.net_balance) > 0
                      ? Math.min(Math.abs(group.net_balance) / 100, 80) + 20
                      : 30;
                    const isActive = Math.abs(group.net_balance) === maxAbsBalance && maxAbsBalance > 0;

                    return (
                      <div
                        key={group.group_id}
                        className={`relative w-10 rounded-t-lg transition-all group sm:w-12 ${
                          isActive ? "bg-text-primary" : "bg-surface-2"
                        }`}
                        style={{ height: `${height}%` }}
                      >
                        {isActive && (
                          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-surface text-text-primary px-3 py-1 rounded-lg text-xs font-bold shadow-md whitespace-nowrap">
                            {group.net_balance > 0 ? "+" : ""}{group.net_balance.toFixed(0)}
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-surface rotate-45" />
                          </div>
                        )}
                        <div className="absolute -bottom-6 w-full truncate px-1 text-center text-xs text-text-secondary">
                          {group.group_name.slice(0, 3)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total amount */}
              <div className="absolute bottom-6 left-6 flex flex-col">
                <div className="text-3xl font-bold leading-none tracking-tight flex items-baseline">
                  <span className="text-text-secondary text-lg mr-1">$</span>
                  <span
                    className={
                      d.totalNet > 0
                        ? "text-positive"
                        : d.totalNet < 0
                        ? "text-negative"
                        : "text-text-primary"
                    }
                  >
                    {d.totalNet.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-text-tertiary mt-1">net balance</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN */}
          <div className="flex flex-col gap-5" style={{ animationDelay: '0.05s' }}>
            {/* Spending Breakdown - Donut chart */}
            <div className="bg-surface rounded-2xl p-6 border border-border flex flex-col">
              <h2 className="text-lg font-bold mb-6 text-text-primary">Spending Breakdown</h2>

              {/* Donut Chart */}
              <div className="relative w-48 h-48 mx-auto my-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle
                    className="stroke-surface-2"
                    cx="18"
                    cy="18"
                    fill="transparent"
                    r="15.91549430918954"
                    strokeWidth="3"
                  />
                  <circle
                    className="stroke-positive"
                    cx="18"
                    cy="18"
                    fill="transparent"
                    r="15.91549430918954"
                    strokeDasharray={`${pctOwedToMe} 100`}
                    strokeDashoffset="0"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-text-primary">
                    {pctOwedToMe}%
                  </span>
                  <span className="text-xs text-text-secondary mt-1">of total</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex justify-between items-end mt-auto pt-6 border-t border-border">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                    <HandCoins className="h-3.5 w-3.5" />
                    Owed to you
                  </div>
                  <span className="font-bold text-sm text-text-primary">
                    {pctOwedToMe}%
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                    <Receipt className="h-3.5 w-3.5" />
                    You owe
                  </div>
                  <span className="font-bold text-sm text-text-primary">
                    {pctIOwe}%
                  </span>
                </div>
              </div>
            </div>

            {/* Popular Groups */}
            <div className="bg-surface rounded-2xl p-6 border border-border flex-1 flex flex-col">
              <h2 className="text-lg font-bold mb-4 text-text-primary">Popular groups</h2>
              <div className="flex flex-col gap-3 flex-1">
                {d.groups.slice(0, 4).map((group) => (
                  <Link
                    key={group.group_id}
                    href={`/dashboard/groups/${group.group_id}`}
                    className="flex items-center justify-between group cursor-pointer hover:bg-surface-2 p-2 -mx-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-text-primary">
                          {group.group_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-sm group-hover:text-text-primary text-text-primary">
                        {group.group_name}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`font-bold text-sm ${
                        group.net_balance > 0 ? "text-positive" :
                        group.net_balance < 0 ? "text-negative" : "text-text-secondary"
                      }`}>
                        {group.net_balance > 0 ? "+" : ""}{group.net_balance.toFixed(0)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/dashboard/groups"
                className="w-full mt-4 py-2.5 px-4 border border-border rounded-xl text-sm font-semibold text-text-primary hover:bg-surface-2 transition-colors text-center"
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
