"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { motion, useSpring, useTransform, animate } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
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

// Animated Balance Card Component
interface AnimatedBalanceCardProps {
  title: string;
  subtitle: string;
  amount: number;
  currency: string;
  isPositive?: boolean | null;
  isVisible: boolean;
  onToggleVisibility: () => void;
  icon: React.ReactNode;
  accentColor?: "positive" | "negative" | "neutral";
}

function AnimatedBalanceCard({
  title,
  subtitle,
  amount,
  currency,
  isPositive,
  isVisible,
  onToggleVisibility,
  icon,
  accentColor = "neutral",
}: AnimatedBalanceCardProps) {
  const springValue = useSpring(0, { damping: 100, stiffness: 100 });
  const displayValue = useTransform(springValue, (latest) => {
    return formatCurrency(latest, currency);
  });

  useEffect(() => {
    const controls = animate(springValue, Math.abs(amount), {
      duration: 2,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [amount, springValue]);

  const getAccentClasses = () => {
    if (accentColor === "positive") {
      return "from-positive/10 via-background to-background";
    }
    if (accentColor === "negative") {
      return "from-negative/10 via-background to-background";
    }
    return "from-surface-2 via-background to-background";
  };

  const getIconBgClass = () => {
    if (accentColor === "positive") {
      return "bg-positive/10";
    }
    if (accentColor === "negative") {
      return "bg-negative/10";
    }
    return "bg-surface-2";
  };

  const visibilityLabel = isVisible ? "Hide financial data" : "Show financial data";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-3xl border border-border bg-gradient-to-br ${getAccentClasses()} p-6 shadow-lg relative overflow-hidden`}
    >
      {/* Animated background glow */}
      <motion.div
        className="absolute w-32 h-32 rounded-full bg-text-primary/5 blur-3xl"
        animate={{
          top: ["10%", "70%", "10%"],
          left: ["10%", "80%", "10%"],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getIconBgClass()}`}>
              {icon}
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">{title}</h2>
              <p className="text-xs text-text-secondary">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onToggleVisibility}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-2 hover:bg-surface-2/80 transition-colors"
            aria-label={visibilityLabel}
            aria-pressed={isVisible}
          >
            {isVisible ? (
              <EyeOff className="w-4 h-4 text-text-secondary" />
            ) : (
              <Eye className="w-4 h-4 text-text-secondary" />
            )}
          </button>
        </div>

        {/* Balance Amount */}
        <div className="flex items-baseline gap-2">
          {isVisible ? (
            <motion.span className="text-4xl font-bold tracking-tight text-text-primary">
              {displayValue}
            </motion.span>
          ) : (
            <span className="text-4xl font-bold tracking-tight text-text-primary">
              ••••••
            </span>
          )}
        </div>

        {/* Status indicator */}
        {isPositive !== null && isPositive !== undefined && (
          <div className="flex items-center gap-2 mt-3">
            <span
              className={`flex items-center justify-center rounded-full p-1 ${
                isPositive ? "bg-positive/20" : "bg-negative/20"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3 text-positive" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-negative" />
              )}
            </span>
            <p className="text-sm text-text-secondary">
              <span
                className={`font-semibold ${
                  isPositive ? "text-positive" : "text-negative"
                }`}
              >
                {isPositive ? "You are owed" : "You owe"}
              </span>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function OverviewTab({
  totalGroupExpenses,
  myNetBalance,
  balances,
  currency,
  currentUserId,
}: OverviewTabProps) {
  const [showTotal, setShowTotal] = useState(true);
  const [showMyBalance, setShowMyBalance] = useState(true);
  const [showGroupBalances, setShowGroupBalances] = useState(false);

  const isPositive = myNetBalance > 0;

  const getBalanceStatusText = (isPositiveBalance: boolean, isCurrentUser: boolean): string => {
    if (isPositiveBalance) {
      return isCurrentUser ? "You are owed" : "Is owed";
    }
    return isCurrentUser ? "You owe" : "Owes";
  };

  return (
    <div className="space-y-6">
      {/* Balance Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Total Group Expenses */}
        <AnimatedBalanceCard
          title="Total Expenses"
          subtitle="All group expenses"
          amount={totalGroupExpenses}
          currency={currency}
          isVisible={showTotal}
          onToggleVisibility={() => setShowTotal(!showTotal)}
          icon={<Wallet className="w-5 h-5 text-text-primary" />}
          accentColor="neutral"
        />

        {/* My Balance */}
        <AnimatedBalanceCard
          title="My Balance"
          subtitle="Your net position"
          amount={Math.abs(myNetBalance)}
          currency={currency}
          isPositive={myNetBalance !== 0 ? isPositive : null}
          isVisible={showMyBalance}
          onToggleVisibility={() => setShowMyBalance(!showMyBalance)}
          icon={
            myNetBalance > 0 ? (
              <TrendingUp className="w-5 h-5 text-positive" />
            ) : myNetBalance < 0 ? (
              <TrendingDown className="w-5 h-5 text-negative" />
            ) : (
              <Wallet className="w-5 h-5 text-text-secondary" />
            )
          }
          accentColor={
            myNetBalance > 0 ? "positive" : myNetBalance < 0 ? "negative" : "neutral"
          }
        />
      </div>

      {/* Group Balances Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-3xl border border-border bg-surface overflow-hidden shadow-lg"
      >
        {/* Header with Eye Toggle */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center">
              <Users className="w-5 h-5 text-text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Group Balances</h3>
              <p className="text-xs text-text-secondary">Who owes whom</p>
            </div>
          </div>
          <button
            onClick={() => setShowGroupBalances(!showGroupBalances)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-2 hover:bg-surface-2/80 transition-colors"
            aria-label={showGroupBalances ? "Hide financial data" : "Show financial data"}
            aria-pressed={showGroupBalances}
          >
            {showGroupBalances ? (
              <EyeOff className="w-4 h-4 text-text-secondary" />
            ) : (
              <Eye className="w-4 h-4 text-text-secondary" />
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
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <Link
                      href={`/dashboard/profile/${bal.user_id}`}
                      className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <Avatar
                        src={bal.avatar_url}
                        name={bal.display_name}
                        size="md"
                      />
                      <span className="truncate text-sm font-medium text-text-primary">
                        {bal.display_name}
                        {isCurrentUser && (
                          <span className="text-text-tertiary ml-1">(you)</span>
                        )}
                      </span>
                    </Link>

                    <div className="shrink-0 text-right">
                      {balIsSettled ? (
                        <span className="inline-flex items-center rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-text-tertiary">
                          Settled
                        </span>
                      ) : showGroupBalances ? (
                        <div className="flex flex-col items-end">
                          <span
                            className={`flex items-center gap-1 text-base font-bold tabular-nums ${
                              balIsPositive ? "text-positive" : "text-negative"
                            }`}
                          >
                            {balIsPositive ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                            {formatCurrency(Math.abs(bal.net_balance), currency)}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              balIsPositive ? "text-positive" : "text-negative"
                            }`}
                          >
                            {getBalanceStatusText(balIsPositive, isCurrentUser)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-base font-medium text-text-tertiary">
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
