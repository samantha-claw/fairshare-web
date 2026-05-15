"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Users,
  Receipt,
  PieChart as PieIcon,
  DollarSign,
  ReceiptText,
  TrendingDown,
  Crown,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  getCategoryInfo,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "@/types/group";
import type { Expense, Balance } from "@/types/group";

// ── Time Range Types ──
type TimeRange = "week" | "2weeks" | "month" | "all";

const TIME_RANGES: { value: TimeRange; label: string; days: number }[] = [
  { value: "week", label: "7D", days: 7 },
  { value: "2weeks", label: "14D", days: 14 },
  { value: "month", label: "1M", days: 30 },
  { value: "all", label: "All", days: -1 },
];

// ── Chart Colors ──
const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: "#f97316",
  transport: "#3b82f6",
  housing: "#8b5cf6",
  entertainment: "#ec4899",
  shopping: "#14b8a6",
  health: "#ef4444",
  education: "#f59e0b",
  travel: "#06b6d4",
  utilities: "#6366f1",
  other: "#6b7280",
};

const SPENDER_COLORS = [
  "#3b82f6",
  "#f97316",
  "#8b5cf6",
  "#14b8a6",
  "#ec4899",
  "#f59e0b",
  "#06b6d4",
  "#6366f1",
];

// ── Custom Tooltip ──
function ChartTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: any[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-border bg-surface/95 backdrop-blur-sm px-3.5 py-2.5 shadow-xl shadow-black/10">
      <p className="text-xs font-medium text-text-secondary">
        {item.payload?.label || item.payload?.name || item.name}
      </p>
      <p className="text-sm font-bold text-text-primary">
        {formatCurrency(item.value, currency)}
      </p>
    </div>
  );
}

// ── Animated Counter ──
function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {prefix}
      {formatCurrency(value, "").replace("$", "").replace("£", "").replace("€", "")}
      {suffix}
    </motion.span>
  );
}

// ── Premium Card ──
function Card({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`rounded-2xl border border-border/60 bg-surface p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-md ${className}`}
    >
      {children}
    </motion.div>
  );
}

function CardHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-text-primary">{title}</h3>
        <p className="text-xs text-text-secondary">{subtitle}</p>
      </div>
    </div>
  );
}

// ── Stat Card ──
function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-surface p-4 shadow-sm backdrop-blur-sm"
    >
      {/* Background glow */}
      <div
        className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-xl transition-opacity duration-500 group-hover:opacity-20"
        style={{ backgroundColor: color }}
      />

      <div className="relative">
        <div
          className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          {label}
        </p>
        <p className="mt-1 text-xl font-bold text-text-primary">{value}</p>
        {subValue && (
          <p className="mt-0.5 text-xs text-text-secondary">{subValue}</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Time Range Filter ──
function TimeRangeFilter({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-surface-2/50 p-1 backdrop-blur-sm"
    >
      {TIME_RANGES.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`relative rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
            value === range.value
              ? "bg-surface text-text-primary shadow-sm"
              : "text-text-tertiary hover:text-text-secondary"
          }`}
        >
          {value === range.value && (
            <motion.div
              layoutId="timeRangeActive"
              className="absolute inset-0 rounded-lg bg-surface shadow-sm"
              style={{ backgroundColor: "var(--surface)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{range.label}</span>
        </button>
      ))}
    </motion.div>
  );
}

// ── Props ──
interface AnalysisTabProps {
  expenses: Expense[];
  balances: Balance[];
  currency: string;
  currentUserId: string | null;
}

export function AnalysisTab({
  expenses,
  balances,
  currency,
  currentUserId,
}: AnalysisTabProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  // ── Filtered Expenses by Time Range ──
  const filteredExpenses = useMemo(() => {
    if (timeRange === "all") return expenses;

    const days =
      TIME_RANGES.find((r) => r.value === timeRange)?.days ?? 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return expenses.filter(
      (e) => new Date(e.created_at) >= cutoff
    );
  }, [expenses, timeRange]);

  // ── Summary Stats ──
  const stats = useMemo(() => {
    const total = filteredExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );
    const count = filteredExpenses.length;
    const avg = count > 0 ? total / count : 0;

    // Top category
    const catMap = new Map<ExpenseCategory, number>();
    filteredExpenses.forEach((e) => {
      const cat = (e.category as ExpenseCategory) || "other";
      catMap.set(cat, (catMap.get(cat) || 0) + Number(e.amount));
    });
    let topCat: ExpenseCategory = "other";
    let topCatAmount = 0;
    catMap.forEach((amt, cat) => {
      if (amt > topCatAmount) {
        topCatAmount = amt;
        topCat = cat;
      }
    });
    const topCatInfo = getCategoryInfo(topCat);

    return { total, count, avg, topCat: topCatInfo, topCatAmount };
  }, [filteredExpenses]);

  // ── Category Breakdown ──
  const categoryData = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    filteredExpenses.forEach((e) => {
      const cat = (e.category as ExpenseCategory) || "other";
      map.set(cat, (map.get(cat) || 0) + Number(e.amount));
    });
    return EXPENSE_CATEGORIES.filter((c) => (map.get(c.value) || 0) > 0)
      .toSorted((a, b) => (map.get(b.value) || 0) - (map.get(a.value) || 0))
      .map((c) => ({
        name: c.value,
        label: `${c.emoji} ${c.label}`,
        value: map.get(c.value) || 0,
        color: CATEGORY_COLORS[c.value],
      }));
  }, [filteredExpenses]);

  // ── Top Spenders ──
  const topSpenders = useMemo(() => {
    const map = new Map<string, { name: string; amount: number }>();
    filteredExpenses.forEach((e) => {
      const name =
        e.profiles?.display_name ||
        e.profiles?.full_name ||
        e.profiles?.username ||
        "Unknown";
      const existing = map.get(e.paid_by) || { name, amount: 0 };
      existing.amount += Number(e.amount);
      map.set(e.paid_by, existing);
    });
    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .toSorted((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [filteredExpenses]);

  // ── Monthly/Period Trend ──
  const trendData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((e) => {
      const d = new Date(e.created_at);
      if (timeRange === "week" || timeRange === "2weeks") {
        // Daily for short ranges
        const day = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        map.set(day, (map.get(day) || 0) + Number(e.amount));
      } else {
        // Monthly for longer ranges
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        map.set(key, (map.get(key) || 0) + Number(e.amount));
      }
    });
    return Array.from(map.entries())
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([period, total]) => ({
        period,
        total,
        label:
          timeRange === "week" || timeRange === "2weeks"
            ? period
            : new Date(period + "-01").toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
              }),
      }));
  }, [filteredExpenses, timeRange]);

  // ── Category Trend (stacked area) ──
  const categoryTrendData = useMemo(() => {
    if (timeRange === "week" || timeRange === "2weeks") {
      // Daily breakdown by category
      const dayMap = new Map<
        string,
        Record<ExpenseCategory, number>
      >();
      filteredExpenses.forEach((e) => {
        const d = new Date(e.created_at);
        const day = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const cat = (e.category as ExpenseCategory) || "other";
        if (!dayMap.has(day)) {
          dayMap.set(day, {} as Record<ExpenseCategory, number>);
        }
        const dayData = dayMap.get(day)!;
        dayData[cat] = (dayData[cat] || 0) + Number(e.amount);
      });
      return Array.from(dayMap.entries())
        .toSorted(([a], [b]) => a.localeCompare(b))
        .map(([day, catData]) => ({
          label: day,
          ...Object.fromEntries(
            EXPENSE_CATEGORIES.map((c) => [c.value, catData[c.value] || 0])
          ),
        }));
    } else {
      // Monthly breakdown by category
      const monthMap = new Map<
        string,
        Record<ExpenseCategory, number>
      >();
      filteredExpenses.forEach((e) => {
        const d = new Date(e.created_at);
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const cat = (e.category as ExpenseCategory) || "other";
        if (!monthMap.has(month)) {
          monthMap.set(month, {} as Record<ExpenseCategory, number>);
        }
        const monthData = monthMap.get(month)!;
        monthData[cat] = (monthData[cat] || 0) + Number(e.amount);
      });
      return Array.from(monthMap.entries())
        .toSorted(([a], [b]) => a.localeCompare(b))
        .map(([month, catData]) => ({
          label: new Date(month + "-01").toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          }),
          ...Object.fromEntries(
            EXPENSE_CATEGORIES.map((c) => [c.value, catData[c.value] || 0])
          ),
        }));
    }
  }, [filteredExpenses, timeRange]);

  // ── Split Type Distribution ──
  const splitTypeData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((e) => {
      const st = (e as any).split_type || "equal";
      map.set(st, (map.get(st) || 0) + 1);
    });
    const colors: Record<string, string> = {
      equal: "#3b82f6",
      exact: "#f97316",
      custom: "#8b5cf6",
      percentage: "#14b8a6",
      shares: "#ec4899",
    };
    return Array.from(map.entries())
      .toSorted(([, a], [, b]) => b - a)
      .map(([name, value]) => ({
        name,
        label: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: colors[name] || "#6b7280",
      }));
  }, [filteredExpenses]);

  // ── Member Comparison ──
  const memberComparison = useMemo(() => {
    const memberMap = new Map<string, { paid: number; owed: number }>();
    balances.forEach((b) => {
      memberMap.set(b.user_id, {
        paid: Number(b.total_paid),
        owed: Number(b.total_owed),
      });
    });
    return Array.from(memberMap.entries())
      .map(([userId, data]) => {
        const member = balances.find((b) => b.user_id === userId);
        return {
          userId,
          name:
            userId === currentUserId
              ? "You"
              : member?.display_name || "Member",
          paid: data.paid,
          owed: data.owed,
        };
      })
      .toSorted((a, b) => b.paid - a.paid);
  }, [balances, currentUserId]);

  // ── Top Expenses ──
  const topExpenses = useMemo(() => {
    return [...filteredExpenses]
      .toSorted((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);
  }, [filteredExpenses]);

  // ── Daily breakdown for very short ranges ──
  const dailyData = useMemo(() => {
    if (timeRange !== "week" && timeRange !== "2weeks") return [];

    const dayMap = new Map<string, number>();
    filteredExpenses.forEach((e) => {
      const d = new Date(e.created_at);
      const day = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      dayMap.set(day, (dayMap.get(day) || 0) + Number(e.amount));
    });
    return Array.from(dayMap.entries())
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([day, total]) => ({ day, total }));
  }, [filteredExpenses, timeRange]);

  // ── Empty State ──
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="relative mb-6 inline-flex">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <BarChart3 className="h-10 w-10 text-text-tertiary" />
            </div>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-text-primary">
            No Data Yet
          </h3>
          <p className="text-sm text-text-secondary max-w-sm">
            Add some expenses to see spending analysis and insights.
          </p>
        </motion.div>
      </div>
    );
  }

  const maxSpenderAmount = topSpenders[0]?.amount || 1;

  return (
    <div className="space-y-5">
      {/* ── Header + Filter ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="text-lg font-bold text-text-primary">Analysis</h2>
          <p className="text-xs text-text-secondary">
            {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? "s" : ""}{" "}
            {timeRange !== "all" ? "in selected period" : "total"}
          </p>
        </div>
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      </motion.div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Total Spent"
          value={formatCurrency(stats.total, currency)}
          color="#3b82f6"
          delay={0.05}
        />
        <StatCard
          icon={<ReceiptText className="h-4 w-4" />}
          label="Expenses"
          value={stats.count.toString()}
          subValue={`Avg ${formatCurrency(stats.avg, currency)}`}
          color="#8b5cf6"
          delay={0.1}
        />
        <StatCard
          icon={<TrendingDown className="h-4 w-4" />}
          label="Top Category"
          value={`${stats.topCat.emoji} ${stats.topCat.label}`}
          subValue={formatCurrency(stats.topCatAmount, currency)}
          color={CATEGORY_COLORS[stats.topCat.value]}
          delay={0.15}
        />
        <StatCard
          icon={<Crown className="h-4 w-4" />}
          label="Top Spender"
          value={
            topSpenders[0]
              ? topSpenders[0].id === currentUserId
                ? "You"
                : topSpenders[0].name
              : "—"
          }
          subValue={
            topSpenders[0]
              ? formatCurrency(topSpenders[0].amount, currency)
              : undefined
          }
          color="#f59e0b"
          delay={0.2}
        />
      </div>

      {/* ── Two Column: Category + Trend ── */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Category Breakdown (Pie) */}
        {categoryData.length > 0 && (
          <Card delay={0.25}>
            <CardHeader
              icon={<PieIcon className="h-5 w-5 text-blue-500" />}
              title="By Category"
              subtitle="Spending distribution"
            />
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="h-44 w-44 shrink-0">
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
                    <Tooltip content={<ChartTooltip currency={currency} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 text-xs sm:flex-col">
                {categoryData.map((c) => (
                  <motion.div
                    key={c.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-text-secondary">{c.label}</span>
                    <span className="ml-1 font-medium text-text-primary">
                      {formatCurrency(c.value, currency)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Spending Trend */}
        {trendData.length > 1 && (
          <Card delay={0.3}>
            <CardHeader
              icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
              title="Spending Trend"
              subtitle={
                timeRange === "week" || timeRange === "2weeks"
                  ? "Daily breakdown"
                  : "Monthly overview"
              }
            />
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                    tickFormatter={(v: number) => formatCurrency(v, currency)}
                  />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fill="url(#areaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* ── Two Column: Top Spenders + Split Methods ── */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Top Spenders */}
        {topSpenders.length > 0 && (
          <Card delay={0.35}>
            <CardHeader
              icon={<Users className="h-5 w-5 text-orange-500" />}
              title="Top Spenders"
              subtitle="Who paid the most"
            />
            <div className="space-y-4">
              {topSpenders.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs font-medium text-text-tertiary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-text-primary">
                        {s.id === currentUserId ? "You" : s.name}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-text-primary">
                        {formatCurrency(s.amount, currency)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(s.amount / maxSpenderAmount) * 100}%`,
                        }}
                        transition={{
                          duration: 0.7,
                          delay: 0.4 + i * 0.08,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor:
                            SPENDER_COLORS[i % SPENDER_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Split Methods */}
        {splitTypeData.length > 0 && (
          <Card delay={0.4}>
            <CardHeader
              icon={<BarChart3 className="h-5 w-5 text-teal-500" />}
              title="Split Methods"
              subtitle="How expenses are divided"
            />
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={splitTypeData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-xl border border-border bg-surface/95 px-3 py-2 shadow-xl backdrop-blur-sm">
                          <p className="text-xs text-text-secondary">
                            {payload[0].payload.label}
                          </p>
                          <p className="text-sm font-bold text-text-primary">
                            {payload[0].value} expense
                            {payload[0].value !== 1 ? "s" : ""}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {splitTypeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* ── Category Over Time (Stacked Area/Bar) ── */}
      {categoryTrendData.length > 1 && (
        <Card delay={0.45}>
          <CardHeader
            icon={<ArrowUpRight className="h-5 w-5 text-emerald-500" />}
            title="Category Over Time"
            subtitle="Spending breakdown by category over time"
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryTrendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                  tickFormatter={(v: number) => formatCurrency(v, currency)}
                />
                <Tooltip content={<ChartTooltip currency={currency} />} />
                <Bar stackId="category" dataKey="food" fill={CATEGORY_COLORS.food} />
                <Bar
                  stackId="category"
                  dataKey="transport"
                  fill={CATEGORY_COLORS.transport}
                />
                <Bar
                  stackId="category"
                  dataKey="housing"
                  fill={CATEGORY_COLORS.housing}
                />
                <Bar
                  stackId="category"
                  dataKey="entertainment"
                  fill={CATEGORY_COLORS.entertainment}
                />
                <Bar
                  stackId="category"
                  dataKey="shopping"
                  fill={CATEGORY_COLORS.shopping}
                />
                <Bar stackId="category" dataKey="health" fill={CATEGORY_COLORS.health} />
                <Bar
                  stackId="category"
                  dataKey="education"
                  fill={CATEGORY_COLORS.education}
                />
                <Bar stackId="category" dataKey="travel" fill={CATEGORY_COLORS.travel} />
                <Bar
                  stackId="category"
                  dataKey="utilities"
                  fill={CATEGORY_COLORS.utilities}
                />
                <Bar stackId="category" dataKey="other" fill={CATEGORY_COLORS.other} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ── Member Comparison ── */}
      {memberComparison.length > 0 && (
        <Card delay={0.5}>
          <CardHeader
            icon={<Users className="h-5 w-5 text-pink-500" />}
            title="Member Comparison"
            subtitle="Paid vs Owed per member"
          />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberComparison}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                  tickFormatter={(v: number) => formatCurrency(v, currency)}
                />
                <Tooltip content={<ChartTooltip currency={currency} />} />
                <Bar dataKey="paid" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Paid" />
                <Bar dataKey="owed" fill="#ec4899" radius={[4, 4, 0, 0]} name="Owed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ── Largest Expenses ── */}
      {topExpenses.length > 0 && (
        <Card delay={0.55}>
          <CardHeader
            icon={<Receipt className="h-5 w-5 text-amber-500" />}
            title="Largest Expenses"
            subtitle="Top 5 by amount"
          />
          <div className="space-y-2">
            {topExpenses.map((e) => {
              const cat = getCategoryInfo(e.category);
              return (
                <div
                  key={e.id}
                  className="group flex items-center gap-3 rounded-xl bg-surface-2/40 px-3 py-2.5 transition-colors duration-200 hover:bg-surface-2/70"
                >
                  <span className="text-base">{cat.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {e.name}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {new Date(e.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      ·{" "}
                      {e.paid_by === currentUserId
                        ? "You"
                        : e.profiles?.display_name ||
                          e.profiles?.full_name ||
                          "Unknown"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-text-primary">
                    {formatCurrency(Number(e.amount), currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}