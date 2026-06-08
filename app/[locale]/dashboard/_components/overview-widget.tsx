"use client";

import { useMemo, useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import {
  TrendingDown,
  TrendingUp,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Sparkles,
  ArrowRight,
  HandCoins,
  PieChart as PieIcon,
  Plus,
} from "lucide-react";
import { motion, useSpring, useTransform, animate } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_COLORS, CategoryIcon } from "@/components/ui/category-icon";
import { getCategoryInfo } from "@/types/group";
import type { GroupBalance, RecentExpense } from "@/types/dashboard";

interface OverviewWidgetProps {
  totalNet: number;
  totalOwedToMe: number;
  totalIOwe: number;
  groups: GroupBalance[];
  recentExpenses?: RecentExpense[];
}

// ═══════════════════════════════════════════════════
//  💎 ANIMATED BALANCE CARD
// ═══════════════════════════════════════════════════
interface AnimatedBalanceCardProps {
  title: string;
  amount: number;
  currency: string;
  type: "owe" | "owed";
  isVisible: boolean;
  onToggleVisibility: () => void;
  subtitle: string;
  label: string;
}

function AnimatedBalanceCard({
  title,
  amount,
  currency,
  type,
  isVisible,
  onToggleVisibility,
  subtitle,
  label,
}: AnimatedBalanceCardProps) {
  const locale = useLocale();
  const t = useTranslations("overviewWidget");
  const springValue = useSpring(0, { damping: 100, stiffness: 100 });
  const displayValue = useTransform(springValue, (latest) => {
    if (!isVisible) return "••••••";
    if (latest >= 1000) {
      return `${(latest / 1000).toLocaleString(locale === "ar" ? "ar-SA" : "en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
    }
    return latest.toLocaleString(locale === "ar" ? "ar-SA" : "en-US");
  });

  // Animate the number (or a stable value when hidden to keep layout)
  useEffect(() => {
    const controls = animate(springValue, amount, { duration: 2, ease: "easeOut" });
    return () => controls.stop();
  }, [amount, springValue]);

  const isOwe = type === "owe";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border bg-surface p-6 relative overflow-hidden"
    >
      {/* Subtle gradient bg */}
      <div
        className={`absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-30 ${
          isOwe ? "bg-negative" : "bg-positive"
        }`}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isOwe ? "bg-negative/10" : "bg-positive/10"
              }`}
            >
              {isOwe ? (
                <TrendingDown className="w-5 h-5 text-negative" />
              ) : (
                <TrendingUp className="w-5 h-5 text-positive" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">{title}</h2>
              <p className="text-xs text-text-secondary">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onToggleVisibility}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-2 hover:bg-surface-2/80 transition-colors"
            aria-label={isVisible ? t("hideAmount") : t("showAmount")}
          >
            {isVisible ? (
              <Eye className="w-4 h-4 text-text-secondary" />
            ) : (
              <EyeOff className="w-4 h-4 text-text-secondary" />
            )}
          </button>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          {isVisible ? (
            <motion.span
              className={`text-4xl font-bold tracking-tight ${
                isOwe ? "text-negative" : "text-positive"
              }`}
            >
              {formatCurrency(amount, currency, locale)}
            </motion.span>
          ) : (
            <span className="text-4xl font-bold tracking-tight text-text-primary">
              ••••••
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`flex items-center justify-center rounded-full p-1 ${
              isOwe ? "bg-negative/20" : "bg-positive/20"
            }`}
          >
            {isOwe ? (
              <ArrowDownRight className="w-3 h-3 text-negative" />
            ) : (
              <ArrowUpRight className="w-3 h-3 text-positive" />
            )}
          </span>
          <p className="text-sm text-text-secondary">
            <span
              className={`font-semibold ${
                isOwe ? "text-negative" : "text-positive"
              }`}
            >
              {label}
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
//  🍩 CATEGORY PIE CHART (Dashboard variant)
// ═══════════════════════════════════════════════════
function DashboardCategoryChart({
  expenses,
  currency,
}: {
  expenses: RecentExpense[];
  currency: string;
}) {
  const t = useTranslations("overviewWidget");
  const locale = useLocale();

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const cat = e.category || "other";
      map.set(cat, (map.get(cat) || 0) + Number(e.amount));
    });
    return Array.from(map.entries())
      .filter(([, v]) => v > 0)
      .map(([cat, value]) => {
        const info = getCategoryInfo(cat);
        return {
          name: cat,
          label: info.label,
          value,
          color: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.other,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [expenses]);

  if (categoryData.length === 0) {
    return null;
  }

  const total = categoryData.reduce((sum, c) => sum + c.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-border bg-surface p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-blue-500" />
            {t("topCategories")}
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            {t("topCategoriesSubtitle")}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.color}
                    style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(Number(value) || 0, currency, locale)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 sm:flex-col sm:gap-y-1.5 flex-1">
          {categoryData.map((c) => {
            const pct = total > 0 ? ((c.value / total) * 100).toFixed(0) : "0";
            return (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <CategoryIcon category={c.name} className="h-3 w-3" />
                <span className="text-text-secondary truncate">{c.label}</span>
                <span className="ml-auto font-medium text-text-primary tabular-nums">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
//  🕒 RECENT ACTIVITY LIST
// ═══════════════════════════════════════════════════
function RecentActivityList({
  expenses,
  currency,
}: {
  expenses: RecentExpense[];
  currency: string;
}) {
  const t = useTranslations("overviewWidget");
  const locale = useLocale();

  if (expenses.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-border bg-surface p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {t("recentActivity")}
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            {t("recentActivitySubtitle")}
          </p>
        </div>
        <Link
          href="/dashboard/groups"
          className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
        >
          {t("viewAll")}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-1.5">
        {expenses.slice(0, 5).map((exp, i) => {
          const info = getCategoryInfo(exp.category);
          const expCurrency = exp.currency || currency;
          const date = new Date(exp.created_at);
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffHrs / 24);

          let relativeTime: string;
          if (diffHrs < 1) {
            relativeTime = t("justNow");
          } else if (diffHrs < 24) {
            relativeTime = t("hoursAgo", { hours: diffHrs });
          } else if (diffDays < 7) {
            relativeTime = t("daysAgo", { days: diffDays });
          } else {
            relativeTime = date.toLocaleDateString(
              locale === "ar" ? "ar-SA" : "en-US",
              { month: "short", day: "numeric" }
            );
          }

          return (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="group flex items-center gap-3 rounded-xl p-2 -mx-2 hover:bg-surface-2/50 transition-colors"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${CATEGORY_COLORS[info.value]}15` }}
              >
                <CategoryIcon category={info.value} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">
                  {exp.name}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                  <span className="truncate max-w-[120px]">
                    {exp.expense_group?.name || "—"}
                  </span>
                  <span>·</span>
                  <span>{relativeTime}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold tabular-nums text-text-primary">
                  {formatCurrency(Number(exp.amount), expCurrency, locale)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
//  🏠 ACTIVE GROUPS ROW
// ═══════════════════════════════════════════════════
function ActiveGroupsRow({ groups }: { groups: GroupBalance[] }) {
  const t = useTranslations("overviewWidget");
  const locale = useLocale();
  const currency = groups[0]?.currency ?? "$";

  if (groups.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-border bg-surface p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <HandCoins className="h-4 w-4 text-blue-500" />
            {t("activeGroups", { count: groups.length })}
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            {t("groupsInteracted")}
          </p>
        </div>
        <Link
          href="/dashboard/groups"
          className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
        >
          {t("viewAll")}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {groups.slice(0, 6).map((group) => {
          const isPositive = group.net_balance > 0;
          const isNegative = group.net_balance < 0;
          return (
            <Link
              key={group.group_id}
              href={`/dashboard/groups/${group.group_id}`}
              className="group flex items-center gap-3 rounded-xl border border-border bg-surface-2/30 p-3 hover:border-border-2 hover:bg-surface-2/60 transition-all"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                  isPositive
                    ? "bg-positive/15 text-positive"
                    : isNegative
                    ? "bg-negative/15 text-negative"
                    : "bg-surface text-text-secondary"
                }`}
              >
                {group.group_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">
                  {group.group_name}
                </p>
                <p
                  className={`text-xs font-semibold tabular-nums ${
                    isPositive
                      ? "text-positive"
                      : isNegative
                      ? "text-negative"
                      : "text-text-tertiary"
                  }`}
                >
                  {isPositive ? "+" : isNegative ? "-" : ""}
                  {formatCurrency(Math.abs(group.net_balance), group.currency || currency, locale)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
//  🏆 MAIN OVERVIEW WIDGET
// ═══════════════════════════════════════════════════
export function OverviewWidget({
  totalNet,
  totalOwedToMe,
  totalIOwe,
  groups,
  recentExpenses = [],
}: OverviewWidgetProps) {
  const [showOwe, setShowOwe] = useState(true);
  const [showOwed, setShowOwed] = useState(true);
  const t = useTranslations("overviewWidget");
  const currency = groups[0]?.currency ?? "$";

  // Empty state: no groups and no expenses
  if (groups.length === 0 && recentExpenses.length === 0) {
    return <DashboardEmptyState />;
  }

  return (
    <div className="space-y-5">
      {/* Financial Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatedBalanceCard
          title={t("youOwe")}
          amount={totalIOwe}
          currency={currency}
          type="owe"
          isVisible={showOwe}
          onToggleVisibility={() => setShowOwe(!showOwe)}
          subtitle={t("outstandingDebts")}
          label={t("youOweLabel")}
        />

        <AnimatedBalanceCard
          title={t("youAreOwed")}
          amount={totalOwedToMe}
          currency={currency}
          type="owed"
          isVisible={showOwed}
          onToggleVisibility={() => setShowOwed(!showOwed)}
          subtitle={t("pendingPayments")}
          label={t("youAreOwedLabel")}
        />
      </div>

      {/* Category breakdown + Recent activity side-by-side on large screens */}
      {recentExpenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <DashboardCategoryChart
            expenses={recentExpenses}
            currency={currency}
          />
          <RecentActivityList
            expenses={recentExpenses}
            currency={currency}
          />
        </div>
      )}

      {/* Active groups */}
      <ActiveGroupsRow groups={groups} />
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  🌅 EMPTY STATE
// ═══════════════════════════════════════════════════
function DashboardEmptyState() {
  const t = useTranslations("overviewWidget");
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-dashed border-border bg-surface-2/30 p-10 sm:p-16"
    >
      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="relative mb-6"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <Sparkles className="h-10 w-10 text-blue-500" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 shadow-lg"
          >
            <span className="text-xs">✨</span>
          </motion.div>
        </motion.div>

        <h2 className="text-xl font-bold text-text-primary mb-2">
          {t("emptyStateTitle")}
        </h2>
        <p className="text-sm text-text-secondary mb-6 max-w-sm">
          {t("emptyStateSubtitle")}
        </p>

        <Link
          href="/dashboard/groups/new"
          className="inline-flex items-center gap-2 rounded-xl bg-text-primary px-5 py-2.5 text-sm font-medium text-surface transition-all hover:opacity-90 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          {t("createFirstGroup")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
