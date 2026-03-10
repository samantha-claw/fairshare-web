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
import { ArrowDown, TrendingDown, TrendingUp } from "lucide-react";

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
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* ── Header & Tabs ── */}
      <div className="border-b border-gray-100 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold text-gray-900">Group Balances</h2>

          <div className="flex rounded-lg bg-gray-100 p-1 self-start sm:self-auto">
            <button
              onClick={() => setView("settlements")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                view === "settlements"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Settle Up
            </button>
            <button
              onClick={() => setView("net")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                view === "net"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Net Balance
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* ========================================= */}
        {/* 🧠 SETTLEMENTS VIEW: Simplified Debts     */}
        {/* ========================================= */}
        {view === "settlements" && (
          <div className="space-y-3">
            {simplifiedDebts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-8 text-center">
                <p className="text-sm font-bold text-emerald-600">
                  All settled up! 🎉
                </p>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  No one owes anything.
                </p>
              </div>
            ) : (
              simplifiedDebts.map((debt, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 bg-gray-50/50 shadow-sm"
                >
                  {/* ── Stacked layout: From → Amount → To ── */}
                  <div className="flex flex-col items-stretch">
                    {/* FROM person */}
                    <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                      <Link
                        href={`/dashboard/profile/${debt.from.userId}`}
                        className="shrink-0"
                      >
                        <Avatar
                          src={debt.from.avatarUrl}
                          name={debt.from.displayName}
                          size="sm"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-800">
                          {debt.from.displayName}
                        </p>
                        <p className="text-[11px] font-medium text-red-500">
                          Owes
                        </p>
                      </div>
                    </div>

                    {/* AMOUNT badge + arrow */}
                    <div className="flex items-center justify-center gap-2 py-1">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                      <div className="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-black text-orange-700 ring-1 ring-inset ring-orange-200">
                        {formatCurrency(debt.amount, currency)}
                        <ArrowDown className="h-3.5 w-3.5" />
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    </div>

                    {/* TO person */}
                    <div className="flex items-center gap-3 px-4 pb-4 pt-2">
                      <Link
                        href={`/dashboard/profile/${debt.to.userId}`}
                        className="shrink-0"
                      >
                        <Avatar
                          src={debt.to.avatarUrl}
                          name={debt.to.displayName}
                          size="sm"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-800">
                          {debt.to.displayName}
                        </p>
                        <p className="text-[11px] font-medium text-emerald-600">
                          Receives
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ========================================= */}
        {/* 🛡️ NET BALANCES VIEW                      */}
        {/* ========================================= */}
        {view === "net" && (
          <div>
            {balances.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center">
                <p className="text-sm font-bold text-gray-900">
                  No balances yet
                </p>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  Add an expense to see balances.
                </p>
              </div>
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
                              className={`inline-flex items-center gap-1 text-sm font-bold tabular-nums ${
                                isPositive ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {isPositive ? (
                                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                              ) : (
                                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
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
                              {isPositive ? "You are owed" : "You owe"}
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
