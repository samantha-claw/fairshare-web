"use client";

import { TrendingDown, Wallet, ArrowRight } from "lucide-react";
import type { GroupBalance } from "@/types/dashboard";

interface OverviewWidgetProps {
  totalNet: number;
  totalOwedToMe: number;
  totalIOwe: number;
  groups: GroupBalance[];
}

export function OverviewWidget({
  totalNet,
  totalOwedToMe,
  totalIOwe,
  groups,
}: OverviewWidgetProps) {
  const currency = groups[0]?.currency ?? "";

  return (
    <div className="bg-surface rounded-3xl p-6 border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-primary">Overview</h2>
        <div className="relative">
          <select className="appearance-none bg-surface-2 border-none rounded-xl pl-4 pr-10 py-2 text-sm font-medium text-text-secondary focus:ring-0 cursor-pointer">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
            <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Financial Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* You Owe Card */}
        <div className="bg-surface-2 rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 text-text-secondary mb-3">
            <TrendingDown className="h-4 w-4 text-negative" />
            <span className="text-sm font-medium">You owe</span>
          </div>
          <div className="flex items-end gap-4">
            <span className="text-3xl font-bold text-text-primary">
              {currency} {totalIOwe.toLocaleString()}
            </span>
            {totalIOwe > 0 && (
              <span className="text-xs text-text-tertiary mb-1">total outstanding</span>
            )}
          </div>
        </div>

        {/* You Are Owed Card */}
        <div className="bg-surface-2 rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 text-text-secondary mb-3">
            <Wallet className="h-4 w-4 text-positive" />
            <span className="text-sm font-medium">You are owed</span>
          </div>
          <div className="flex items-end gap-4">
            <span className="text-3xl font-bold text-text-primary">
              {currency} {totalOwedToMe > 1000 ? `${(totalOwedToMe / 1000).toFixed(1)}k` : totalOwedToMe.toLocaleString()}
            </span>
            {totalOwedToMe > 0 && (
              <span className="text-xs text-text-tertiary mb-1">total outstanding</span>
            )}
          </div>
        </div>
      </div>

      {/* Friends Section */}
      <div className="mt-4">
        <h3 className="font-semibold text-base mb-1 text-text-primary">
          {groups.length} active groups
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          View groups you&apos;ve interacted with recently
        </p>
        <div className="flex flex-wrap gap-4 items-center">
          {groups.slice(0, 5).map((group) => (
            <div key={group.group_id} className="flex flex-col items-center gap-2">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-border ${
                  group.net_balance > 0
                    ? "bg-positive-bg"
                    : group.net_balance < 0
                    ? "bg-negative-bg"
                    : "bg-surface-2"
                }`}
              >
                <span className="text-sm font-bold text-text-primary">
                  {group.group_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-text-secondary max-w-[60px] truncate text-center">
                {group.group_name}
              </span>
            </div>
          ))}

          {/* View All Button */}
          {groups.length > 5 && (
            <div className="flex flex-col items-center gap-2 ml-2">
              <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-surface-2 transition-colors">
                <ArrowRight className="h-4 w-4 text-text-secondary" />
              </button>
              <span className="text-xs text-text-secondary">View all</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
