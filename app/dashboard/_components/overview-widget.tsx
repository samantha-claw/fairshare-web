"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, Activity } from "lucide-react";
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
// 🎨 UI RENDER
// ==========================================
export function OverviewWidget({
  totalNet,
  totalOwedToMe,
  totalIOwe,
  groups,
}: OverviewWidgetProps) {
  const hasData = totalOwedToMe > 0 || totalIOwe > 0;

  const pieData = hasData
    ? [
        { name: "Owed to you", value: totalOwedToMe },
        { name: "You owe", value: totalIOwe },
      ]
    : [{ name: "No data", value: 1 }];

  const PIE_COLORS = hasData ? ["#34d399", "#fb7185"] : ["#334155"];

  const barData = groups
    .filter((g) => g.net_balance !== 0)
    .slice(0, 6)
    .map((g) => ({
      name: g.group_name.length > 10 ? g.group_name.slice(0, 10) + "…" : g.group_name,
      balance: g.net_balance,
      fill: g.net_balance > 0 ? "#34d399" : "#fb7185",
    }));

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-1">
      {/* Decorative Elements */}
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="absolute right-1/3 top-1/2 h-40 w-40 rounded-full bg-blue-500/5 blur-2xl" />

      <div className="relative rounded-[22px] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 backdrop-blur-xl sm:p-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* ── Left: Balance Hero ────────────────────── */}
          <div className="lg:col-span-3">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Activity className="h-4 w-4 text-indigo-300" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300/80">
                Financial Overview
              </span>
            </div>

            <div className="mb-6 mt-4">
              <p className="mb-1 text-sm text-slate-400">Total Balance</p>
              <p
                className={`font-mono text-5xl font-black tracking-tight sm:text-6xl ${
                  totalNet > 0
                    ? "text-emerald-400"
                    : totalNet < 0
                    ? "text-rose-400"
                    : "text-white"
                }`}
              >
                {totalNet > 0 && "+"}
                {totalNet < 0 && "−"}
                {formatCurrency(totalNet)}
              </p>
            </div>

            {/* Owed / Owe Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="group rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/[0.12]">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-emerald-300/70">You are owed</span>
                </div>
                <p className="font-mono text-2xl font-bold text-emerald-400">
                  +{formatCurrency(totalOwedToMe)}
                </p>
              </div>

              <div className="group rounded-2xl border border-rose-500/20 bg-rose-500/[0.08] p-4 transition-all hover:border-rose-500/40 hover:bg-rose-500/[0.12]">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20">
                    <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                  </div>
                  <span className="text-xs font-medium text-rose-300/70">You owe</span>
                </div>
                <p className="font-mono text-2xl font-bold text-rose-400">
                  −{formatCurrency(totalIOwe)}
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: Charts ────────────────────────── */}
          <div className="flex flex-col items-center justify-center lg:col-span-2">
            {/* Donut Chart */}
            <div className="relative h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={hasData ? 6 : 0}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        className="transition-opacity hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  {hasData && (
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#e2e8f0",
                      }}
                      formatter={(value: any) => {
                        const numValue = Number(value) || 0;
                        const formatted = formatCurrency(numValue);
                        return `${numValue > 0 ? "+" : ""}${formatted}`;
                      }}
                    />
                  )}
                </PieChart>
              </ResponsiveContainer>
              {/* Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Wallet className="mb-1 h-4 w-4 text-slate-500" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  {hasData ? "Balance" : "No Data"}
                </span>
              </div>
            </div>

            {/* Legend */}
            {hasData && (
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-slate-400">Owed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="text-[11px] text-slate-400">Owe</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom: Per-Group Bar Chart ───────────── */}
        {barData.length > 0 && (
          <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Balance by Group
            </p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#e2e8f0",
                    }}
    formatter={(value: any) => {
      const numValue = Number(value) || 0;
      const formatted = formatCurrency(numValue);
      return `${numValue > 0 ? "+" : ""}${formatted}`;
    }}

                  />
                  <Bar dataKey="balance" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}