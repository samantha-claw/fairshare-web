"use client";

import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

interface OverviewTabProps {
  totalGroupExpenses: number;
  myNetBalance: number;
  currency: string;
}

export function OverviewTab({
  totalGroupExpenses,
  myNetBalance,
  currency,
}: OverviewTabProps) {
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
          <div>
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
    </div>
  );
}
