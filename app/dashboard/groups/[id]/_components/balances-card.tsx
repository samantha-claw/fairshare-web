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
import { ArrowDown, ChevronRight } from "lucide-react";

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
          <div className="space-y-2">
            {balances.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-8 text-center">
                <p className="text-sm text-gray-500">
                  No balances to show yet.
                </p>
              </div>
            ) : (
              balances.map((bal) => {
                const isPositive = bal.net_balance > 0;
                const isNegative = bal.net_balance < 0;
                const isSettled = bal.net_balance === 0;

                return (
                  <Link
                    key={bal.user_id}
                    href={`/dashboard/profile/${bal.user_id}`}
                    className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 transition-colors hover:border-gray-200 hover:bg-gray-50/80 sm:p-4"
                  >
                    {/* Avatar */}
                    <div className="shrink-0">
                      <Avatar
                        src={bal.avatar_url}
                        name={bal.display_name}
                        size="sm"
                      />
                    </div>

                    {/* Name */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-indigo-600">
                        {bal.display_name}
                      </p>
                      <p className="text-[11px] font-medium text-gray-400">
                        {isPositive && "Gets back"}
                        {isNegative && "Owes"}
                        {isSettled && "All clear"}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="shrink-0 text-right">
                      {isPositive && (
                        <span className="inline-block rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-600 ring-1 ring-inset ring-emerald-200">
                          +{formatCurrency(bal.net_balance, currency)}
                        </span>
                      )}
                      {isNegative && (
                        <span className="inline-block rounded-md bg-red-50 px-2.5 py-1 text-sm font-bold text-red-600 ring-1 ring-inset ring-red-200">
                          -{formatCurrency(Math.abs(bal.net_balance), currency)}
                        </span>
                      )}
                      {isSettled && (
                        <span className="inline-block rounded-md bg-gray-50 px-2.5 py-1 text-sm font-bold text-gray-400 ring-1 ring-inset ring-gray-200">
                          Settled
                        </span>
                      )}
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="hidden h-4 w-4 shrink-0 text-gray-300 group-hover:text-gray-400 sm:block" />
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
}