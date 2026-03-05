"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useState, useMemo } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import type { Balance } from "@/types/group";
import { simplifyDebts } from "@/lib/debt-simplifier";
import { ArrowDown, ArrowRight, CheckCircle2 } from "lucide-react";

// ==========================================
// 🧩 TYPES
// ==========================================
interface BalancesCardProps {
  balances: Balance[];
  currency: string;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function BalancesCard({ balances, currency }: BalancesCardProps) {
  const [view, setView] = useState<"settlements" | "net">("settlements");

  const simplifiedDebts = useMemo(() => {
    const mappedBalances = balances.map((b: any) => ({
      userId: b.user_id,
      displayName: b.display_name,
      avatarUrl: b.avatar_url,
      amount: b.net_balance,
    }));
    return simplifyDebts(mappedBalances);
  }, [balances]);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* ── Header ── */}
      <div className="border-b border-gray-100 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-base font-bold text-gray-900">Group Balances</h2>

        {/* ── Tabs ── */}
        <div className="mt-3 flex gap-1 rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setView("settlements")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              view === "settlements"
                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Settle Up
          </button>
          <button
            onClick={() => setView("net")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              view === "net"
                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Net Balances
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* ==========================================
            🧠 SETTLEMENTS VIEW
           ========================================== */}
        {view === "settlements" && (
          <div>
            {simplifiedDebts.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-8 w-8 text-emerald-500" />}
                title="All settled up! 🎉"
                subtitle="No one owes anything."
                variant="success"
              />
            ) : (
              <ul className="space-y-3">
                {simplifiedDebts.map((debt, i) => (
                  <li key={i}>
                    {/* ── Desktop: horizontal row ── */}
                    <div className="hidden rounded-xl border border-gray-200 bg-gray-50/60 p-4 sm:block">
                      <div className="flex items-center gap-3">
                        {/* From */}
                        <Link
                          href={`/dashboard/profile/${debt.from.userId}`}
                          className="flex items-center gap-2.5 hover:opacity-80"
                        >
                          <Avatar
                            src={debt.from.avatarUrl}
                            name={debt.from.displayName}
                            size="sm"
                          />
                          <span className="max-w-[120px] truncate text-sm font-semibold text-gray-800">
                            {debt.from.displayName}
                          </span>
                        </Link>

                        {/* Arrow + Amount */}
                        <div className="flex flex-1 items-center justify-center gap-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                          <div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 ring-1 ring-inset ring-orange-200">
                            <span className="text-xs font-black text-orange-700">
                              {formatCurrency(debt.amount, currency)}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-orange-500" />
                          </div>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                        </div>

                        {/* To */}
                        <Link
                          href={`/dashboard/profile/${debt.to.userId}`}
                          className="flex items-center gap-2.5 hover:opacity-80"
                        >
                          <span className="max-w-[120px] truncate text-sm font-semibold text-gray-800">
                            {debt.to.displayName}
                          </span>
                          <Avatar
                            src={debt.to.avatarUrl}
                            name={debt.to.displayName}
                            size="sm"
                          />
                        </Link>
                      </div>
                    </div>

                    {/* ── Mobile: stacked card ── */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:hidden">
                      <div className="flex items-center gap-3">
                        {/* From */}
                        <Link
                          href={`/dashboard/profile/${debt.from.userId}`}
                          className="flex flex-1 items-center gap-2 overflow-hidden"
                        >
                          <Avatar
                            src={debt.from.avatarUrl}
                            name={debt.from.displayName}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-gray-800">
                              {debt.from.displayName}
                            </p>
                            <p className="text-[10px] font-medium text-gray-400">
                              Sender
                            </p>
                          </div>
                        </Link>

                        {/* Center badge */}
                        <div className="flex shrink-0 flex-col items-center gap-0.5">
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-black text-orange-700 ring-1 ring-inset ring-orange-200">
                            {formatCurrency(debt.amount, currency)}
                          </span>
                        </div>

                        {/* To */}
                        <Link
                          href={`/dashboard/profile/${debt.to.userId}`}
                          className="flex flex-1 items-center justify-end gap-2 overflow-hidden"
                        >
                          <div className="min-w-0 text-right">
                            <p className="truncate text-xs font-semibold text-gray-800">
                              {debt.to.displayName}
                            </p>
                            <p className="text-[10px] font-medium text-gray-400">
                              Receiver
                            </p>
                          </div>
                          <Avatar
                            src={debt.to.avatarUrl}
                            name={debt.to.displayName}
                            size="sm"
                          />
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ==========================================
            🛡️ NET BALANCES VIEW
           ========================================== */}
        {view === "net" && (
          <div>
            {balances.length === 0 ? (
              <EmptyState
                title="No balances yet"
                subtitle="Add an expense to see balances."
                variant="neutral"
              />
            ) : (
              <ul className="divide-y divide-gray-100">
                {balances.map((bal) => {
                  const isPositive = bal.net_balance > 0;
                  const isNegative = bal.net_balance < 0;
                  const isSettled = bal.net_balance === 0;

                  return (
                    <li
                      key={bal.user_id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <Link
                        href={`/dashboard/profile/${bal.user_id}`}
                        className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80"
                      >
                        <Avatar
                          src={bal.avatar_url}
                          name={bal.display_name}
                          size="sm"
                        />
                        <span className="truncate text-sm font-semibold text-gray-900">
                          {bal.display_name}
                        </span>
                      </Link>

                      <div className="shrink-0 text-right">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-400">
                            Settled
                          </span>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span
                              className={`text-sm font-bold tabular-nums ${
                                isPositive ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {isPositive ? "+" : "-"}
                              {formatCurrency(
                                Math.abs(bal.net_balance),
                                currency
                              )}
                            </span>
                            <span
                              className={`text-[10px] font-medium ${
                                isPositive
                                  ? "text-emerald-500"
                                  : "text-red-400"
                              }`}
                            >
                              {isPositive ? "is owed" : "owes"}
                            </span>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ==========================================
// 🔹 Empty State Helper
// ==========================================
function EmptyState({
  icon,
  title,
  subtitle,
  variant = "neutral",
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  variant?: "success" | "neutral";
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-10 text-center ${
        variant === "success"
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-gray-200 bg-gray-50/50"
      }`}
    >
      {icon && <div className="mb-3">{icon}</div>}
      <p
        className={`text-sm font-bold ${
          variant === "success" ? "text-emerald-600" : "text-gray-600"
        }`}
      >
        {title}
      </p>
      <p className="mt-1 text-xs font-medium text-gray-400">{subtitle}</p>
    </div>
  );
}