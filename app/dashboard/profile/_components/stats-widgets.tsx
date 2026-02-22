"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import type { ProfileStats, ProfileGroup } from "@/types/profile";

// ==========================================
// 🧩 TYPES
// ==========================================
interface StatsWidgetsProps {
  stats: ProfileStats;
  groups: ProfileGroup[];
  isOwnProfile: boolean;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function StatsWidgets({
  stats,
  groups,
  isOwnProfile,
}: StatsWidgetsProps) {
  if (!isOwnProfile) return null;

  return (
    <div className="space-y-6">
      {/* ── Stats Cards ──────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Net Balance */}
        <div
          className={`rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md ${
            stats.netBalance > 0
              ? "border-emerald-100"
              : stats.netBalance < 0
              ? "border-rose-100"
              : "border-gray-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                stats.netBalance > 0
                  ? "bg-emerald-50 text-emerald-600"
                  : stats.netBalance < 0
                  ? "bg-rose-50 text-rose-600"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Net Balance
              </p>
              <p
                className={`font-mono text-lg font-black ${
                  stats.netBalance > 0
                    ? "text-emerald-600"
                    : stats.netBalance < 0
                    ? "text-rose-600"
                    : "text-gray-900"
                }`}
              >
                {stats.netBalance > 0 && "+"}
                {stats.netBalance < 0 && "−"}
                {formatCurrency(stats.netBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* Owed To You */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Owed to You
              </p>
              <p className="font-mono text-lg font-black text-emerald-600">
                +{formatCurrency(stats.totalOwed)}
              </p>
            </div>
          </div>
        </div>

        {/* You Owe */}
        <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                You Owe
              </p>
              <p className="font-mono text-lg font-black text-rose-600">
                −{formatCurrency(stats.totalOwes)}
              </p>
            </div>
          </div>
        </div>

        {/* Groups */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Groups
              </p>
              <p className="font-mono text-lg font-black text-gray-900">
                {stats.totalGroups}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Group Balances ───────────────────────── */}
      {groups.length > 0 && (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                <Receipt className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                Group Balances
              </h3>
            </div>
          </div>

          <div className="space-y-2">
            {groups.map((group) => (
              <Link
                key={group.group_id}
                href={`/dashboard/groups/${group.group_id}`}
                className="group flex items-center justify-between rounded-2xl border border-gray-50 bg-gray-50/50 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-600">
                    {group.group_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-indigo-600">
                      {group.group_name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {group.currency}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-sm font-bold ${
                      group.net_balance > 0
                        ? "text-emerald-600"
                        : group.net_balance < 0
                        ? "text-rose-600"
                        : "text-gray-400"
                    }`}
                  >
                    {group.net_balance > 0 && "+"}
                    {group.net_balance < 0 && "−"}
                    {formatCurrency(group.net_balance, group.currency)}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-indigo-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}