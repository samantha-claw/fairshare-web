"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
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

  const t = useTranslations("statsWidgets");
  const locale = useLocale();

  return (
    <div className="space-y-6">
      {/* ── Stats Cards — Pure Typography ─────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Net Balance */}
        <div
          className={`flex flex-col items-center justify-center rounded-2xl border bg-surface px-5 py-6 text-center shadow-sm transition-all duration-300 hover:shadow-md ${
            stats.netBalance > 0
              ? "border-emerald-100"
              : stats.netBalance < 0
              ? "border-rose-100"
              : "border-border"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {t("netBalance")}
          </p>
          <p
            className={`mt-2 font-mono text-2xl font-bold sm:text-3xl ${
              stats.netBalance > 0
                ? "text-emerald-600"
                : stats.netBalance < 0
                ? "text-rose-600"
                : "text-text-primary"
            }`}
          >
            {stats.netBalance > 0 && "+"}
            {stats.netBalance < 0 && "−"}
            {formatCurrency(stats.netBalance, undefined, locale)}
          </p>
          <p className="mt-1.5 text-[11px] text-text-tertiary">
            {stats.netBalance > 0
              ? t("youAreOwed")
              : stats.netBalance < 0
              ? t("youOweOverall")
              : t("allSettledUp")}
          </p>
        </div>

        {/* Owed To You */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-surface px-5 py-6 text-center shadow-sm transition-all duration-300 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {t("owedToYou")}
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-600 sm:text-3xl">
            +{formatCurrency(stats.totalOwed, undefined, locale)}
          </p>
          <p className="mt-1.5 text-[11px] text-text-tertiary">
            {t("fromAllGroups")}
          </p>
        </div>

        {/* You Owe */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-surface px-5 py-6 text-center shadow-sm transition-all duration-300 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {t("youOwe")}
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-rose-600 sm:text-3xl">
            −{formatCurrency(stats.totalOwes, undefined, locale)}
          </p>
          <p className="mt-1.5 text-[11px] text-text-tertiary">
            {t("acrossAllGroups")}
          </p>
        </div>

        {/* Groups */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface px-5 py-6 text-center shadow-sm transition-all duration-300 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {t("groups")}
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-text-primary sm:text-3xl">
            {stats.totalGroups}
          </p>
          <p className="mt-1.5 text-[11px] text-text-tertiary">
            {t("activeGroups", { count: stats.totalGroups })}
          </p>
        </div>
      </div>

      {/* ── Group Balances ───────────────────────── */}
      {groups.length > 0 && (
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-5 text-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              {t("groupBalances")}
            </h3>
          </div>

          <div className="space-y-2">
            {groups.map((group) => (
              <Link
                key={group.group_id}
                href={`/dashboard/groups/${group.group_id}`}
                className="group flex items-center justify-between rounded-2xl border border-border bg-surface-2/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-surface hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-sm">
                    {group.group_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary transition-colors group-hover:text-text-primary">
                      {group.group_name}
                    </p>
                    <p className="text-[11px] text-text-tertiary">
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
                        : "text-text-tertiary"
                    }`}
                  >
                    {group.net_balance > 0 && "+"}
                    {group.net_balance < 0 && "−"}
                    {formatCurrency(group.net_balance, group.currency, locale)}
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