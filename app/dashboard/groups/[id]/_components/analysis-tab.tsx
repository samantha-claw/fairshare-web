"use client";

import { useMemo } from "react";
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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  getCategoryInfo,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "@/types/group";
import type { Expense, Balance } from "@/types/group";

// ── Chart Colors (dark-mode friendly) ──
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
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-text-primary">
        {item.payload?.label || item.payload?.name || item.name}
      </p>
      <p className="text-sm font-bold text-text-primary">
        {formatCurrency(item.value, currency)}
      </p>
    </div>
  );
}

// ── Animation wrapper ──
function Card({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
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
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-text-primary">{title}</h3>
        <p className="text-xs text-text-secondary">{subtitle}</p>
      </div>
    </div>
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
  // ── Category Breakdown ──
  const categoryData = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    expenses.forEach((e) => {
      const cat = (e.category as ExpenseCategory) || "other";
      map.set(cat, (map.get(cat) || 0) + Number(e.amount));
    });
    return EXPENSE_CATEGORIES.filter((c) => (map.get(c.value) || 0) > 0).map(
      (c) => ({
        name: c.value,
        label: `${c.emoji} ${c.label}`,
        value: map.get(c.value) || 0,
        color: CATEGORY_COLORS[c.value],
      })
    );
  }, [expenses]);

  // ── Top Spenders ──
  const topSpenders = useMemo(() => {
    const map = new Map<string, { name: string; amount: number }>();
    expenses.forEach((e) => {
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
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [expenses]);

  // ── Monthly Trend ──
  const monthlyTrend = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const d = new Date(e.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + Number(e.amount));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({
        month,
        total,
        label: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
      }));
  }, [expenses]);

  // ── Split Type Distribution ──
  const splitTypeData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
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
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      label: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: colors[name] || "#6b7280",
    }));
  }, [expenses]);

  // ── Top Expenses ──
  const topExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);
  }, [expenses]);

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
          <div className="relative inline-flex mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-2">
              <BarChart3 className="h-10 w-10 text-text-tertiary" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
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
    <div className="space-y-6">
      {/* ── Category Breakdown (Pie) ── */}
      {categoryData.length > 0 && (
        <Card delay={0}>
          <CardHeader
            icon={<PieIcon className="h-5 w-5 text-text-primary" />}
            title="Spending by Category"
            subtitle="Where the money goes"
          />
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="h-52 w-52 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<ChartTooltip currency={currency} />}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-col">
              {categoryData.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-2 text-sm"
                >
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-text-secondary">{c.label}</span>
                  <span className="ml-auto font-medium text-text-primary">
                    {formatCurrency(c.value, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ── Monthly Trend (Area) ── */}
      {monthlyTrend.length > 1 && (
        <Card delay={0.1}>
          <CardHeader
            icon={<TrendingUp className="h-5 w-5 text-text-primary" />}
            title="Monthly Spending"
            subtitle="Expense trends over time"
          />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tickFormatter={(v: number) => formatCurrency(v, currency)}
                />
                <Tooltip
                  content={<ChartTooltip currency={currency} />}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#areaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ── Top Spenders (Horizontal Bar) ── */}
      {topSpenders.length > 0 && (
        <Card delay={0.2}>
          <CardHeader
            icon={<Users className="h-5 w-5 text-text-primary" />}
            title="Top Spenders"
            subtitle="Who paid the most"
          />
          <div className="space-y-3">
            {topSpenders.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="w-5 text-right text-xs font-medium text-text-tertiary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-text-primary">
                      {s.id === currentUserId ? "You" : s.name}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-text-primary">
                      {formatCurrency(s.amount, currency)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(s.amount / maxSpenderAmount) * 100}%`,
                      }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                      className="h-full rounded-full bg-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Split Type Distribution ── */}
      {splitTypeData.length > 0 && (
        <Card delay={0.3}>
          <CardHeader
            icon={<BarChart3 className="h-5 w-5 text-text-primary" />}
            title="Split Methods"
            subtitle="How expenses are divided"
          />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={splitTypeData} layout="vertical">
                <XAxis
                  type="number"
                  tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-lg">
                        <p className="text-sm font-bold text-text-primary">
                          {payload[0].value} expense
                          {payload[0].value !== 1 ? "s" : ""}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {splitTypeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ── Largest Expenses ── */}
      {topExpenses.length > 0 && (
        <Card delay={0.4}>
          <CardHeader
            icon={<Receipt className="h-5 w-5 text-text-primary" />}
            title="Largest Expenses"
            subtitle="Top 5 by amount"
          />
          <div className="space-y-2">
            {topExpenses.map((e, i) => {
              const cat = getCategoryInfo(e.category);
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl bg-surface-2/50 px-3 py-2.5"
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
