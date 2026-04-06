"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, Eye, EyeOff, Users } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { Balance } from "@/types/group";

interface OverviewTabProps {
  totalGroupExpenses: number;
  myNetBalance: number;
  balances: Balance[];
  currency: string;
  currentUserId: string | null;
}

export function OverviewTab({
  totalGroupExpenses,
  myNetBalance,
  balances,
  currency,
  currentUserId,
}: OverviewTabProps) {
  const [showBalances, setShowBalances] = useState(false);
  const isPositive = myNetBalance > 0;
  const isNegative = myNetBalance < 0;

  return (
    <div className="space-y-6">
      {/* Total Group Expenses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-border bg-surface p-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-2">
            <Wallet className="h-7 w-7 text-text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-secondary">
              Total Group Expenses
            </p>
            <p className="text-3xl font-bold text-text-primary">
              {formatCurrency(totalGroupExpenses, currency)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* My Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={`rounded-2xl border bg-surface p-6 ${
          isPositive
            ? "border-positive/30"
            : isNegative
            ? "border-negative/30"
            : "border-border"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-xl ${
              isPositive
                ? "bg-positive/10"
                : isNegative
                ? "bg-negative/10"
                : "bg-surface-2"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-7 w-7 text-positive" />
            ) : isNegative ? (
              <TrendingDown className="h-7 w-7 text-negative" />
            ) : (
              <Wallet className="h-7 w-7 text-text-secondary" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-text-secondary">
              My Balance
            </p>
            <div className="flex items-baseline gap-2">
              <p
                className={`text-3xl font-bold ${
                  isPositive
                    ? "text-positive"
                    : isNegative
                    ? "text-negative"
                    : "text-text-primary"
                }`}
              >
                {isPositive && "+"}
                {formatCurrency(myNetBalance, currency)}
              </p>
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              {isPositive
                ? "You are owed money"
                : isNegative
                ? "You owe money"
                : "All settled up"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Net Balance Section (from Group Balances) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-2xl border border-border bg-surface overflow-hidden"
      >
        {/* Header with Eye Toggle */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-text-secondary" />
            <h3 className="font-semibold text-text-primary">
              Group Balances
            </h3>
          </div>
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm font-medium text-text-secondary transition-all hover:bg-surface-2"
          >
            {showBalances ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show
              </>
            )}
          </button>
        </div>

        {/* Balances List */}
        <div className="p-5">
          {balances.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface-2/50 p-8 text-center">
              <p className="text-sm text-text-secondary">
                No balances yet. Add an expense to see balances.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {balances.map((bal, index) => {
                const balIsPositive = bal.net_balance > 0;
                const balIsNegative = bal.net_balance < 0;
                const balIsSettled = bal.net_balance === 0;
                const isCurrentUser = currentUserId === bal.user_id;

                return (
                  <motion.div
                    key={bal.user_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
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
                      <span className="truncate text-sm font-medium text-text-primary">
                        {bal.display_name}
                        {isCurrentUser && (
                          <span className="text-text-tertiary"> (you)</span>
                        )}
                      </span>
                    </Link>

                    <div className="shrink-0 text-right">
                      {balIsSettled ? (
                        <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-tertiary">
                          Settled
                        </span>
                      ) : showBalances ? (
                        <div className="flex flex-col items-end">
                          <span
                            className={`flex items-center gap-1 text-sm font-bold tabular-nums ${
                              balIsPositive
                                ? "text-positive"
                                : "text-negative"
                            }`}
                          >
                            {balIsPositive ? (
                              <TrendingUp className="h-3.5 w-3.5" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5" />
                            )}
                            {balIsPositive ? "+" : "-"}
                            {formatCurrency(Math.abs(bal.net_balance), currency)}
                          </span>
                          <span
                            className={`text-[10px] font-medium ${
                              balIsPositive ? "text-positive" : "text-negative"
                            }`}
                          >
                            {balIsPositive
                              ? isCurrentUser
                                ? "You are owed"
                                : "Is owed"
                              : isCurrentUser
                              ? "You owe"
                              : "Owes"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-text-tertiary">
                          ••••••
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
