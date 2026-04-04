"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, Users, ArrowRight } from "lucide-react";
import type { GroupBalance } from "@/types/dashboard";

// ==========================================
// 🧩 TYPES
// ==========================================
interface OverviewWidgetProps {
  totalNet: number;
  totalOwedToMe: number;
  totalIOwe: number;
  groups: GroupBalance[];
}

// ==========================================
// 🎨 UI RENDER — NEW DESIGN
// ==========================================
export function OverviewWidget({
  totalNet,
  totalOwedToMe,
  totalIOwe,
  groups,
}: OverviewWidgetProps) {
  // Calculate percentage changes (mock for now, can be real with historical data)
  const owedChange = totalOwedToMe > 0 ? 36.8 : 0;
  const oweChange = totalIOwe > 0 ? -15.2 : 0;

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-3xl p-6 shadow-sm dark:shadow-none border border-border-light dark:border-border-dark">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
          Overview
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

      {/* Financial Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* You Owe Card */}
        <div className="bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl p-5 border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2 text-text-light-secondary dark:text-text-dark-secondary mb-3">
            <TrendingDown className="h-4 w-4 text-rose-400" />
            <span className="text-sm font-medium">You owe</span>
          </div>
          <div className="flex items-end gap-4">
            <span className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {totalIOwe.toLocaleString()}
            </span>
            {totalIOwe > 0 && (
              <div className="flex flex-col mb-1">
                <div className="flex items-center gap-1 text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-lg text-xs font-semibold w-fit mb-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  {Math.abs(oweChange)}%
                </div>
                <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  vs last month
                </span>
              </div>
            )}
          </div>
        </div>

        {/* You Are Owed Card */}
        <div className="bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl p-5 border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2 text-text-light-secondary dark:text-text-dark-secondary mb-3">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">You are owed</span>
          </div>
          <div className="flex items-end gap-4">
            <span className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {totalOwedToMe > 1000 
                ? `${(totalOwedToMe / 1000).toFixed(0)}k` 
                : totalOwedToMe.toLocaleString()}
            </span>
            {totalOwedToMe > 0 && (
              <div className="flex flex-col mb-1">
                <div className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-lg text-xs font-semibold w-fit mb-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  {owedChange}%
                </div>
                <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  vs last month
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Friends Section */}
      <div className="mt-4">
        <h3 className="font-semibold text-base mb-1 text-text-light-primary dark:text-text-dark-primary">
          {groups.length} active groups
        </h3>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
          View groups you've interacted with recently
        </p>
        
        <div className="flex flex-wrap gap-4 items-center">
          {groups.slice(0, 5).map((group) => (
            <div key={group.group_id} className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-surface-light dark:border-surface-dark ${
                group.net_balance > 0 
                  ? "bg-gradient-to-br from-primary/30 to-emerald-500/30" 
                  : group.net_balance < 0 
                    ? "bg-gradient-to-br from-rose-500/30 to-pink-500/30"
                    : "bg-gray-200 dark:bg-gray-700"
              }`}>
                <span className="text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
                  {group.group_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary max-w-[60px] truncate text-center">
                {group.group_name}
              </span>
            </div>
          ))}
          
          {/* View All Button */}
          {groups.length > 5 && (
            <div className="flex flex-col items-center gap-2 ml-2">
              <button className="w-12 h-12 rounded-full border border-border-light dark:border-border-dark flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <ArrowRight className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
              </button>
              <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                View all
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
