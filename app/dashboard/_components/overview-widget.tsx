"use client";

import { useState, useEffect } from "react";
import { TrendingDown, TrendingUp, Wallet, ArrowRight, Eye, EyeOff, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion, useSpring, useTransform, animate } from "framer-motion";
import type { GroupBalance } from "@/types/dashboard";

interface OverviewWidgetProps {
  totalNet: number;
  totalOwedToMe: number;
  totalIOwe: number;
  groups: GroupBalance[];
}

// Animated Balance Card Component
interface AnimatedBalanceCardProps {
  title: string;
  amount: number;
  currency: string;
  type: "owe" | "owed";
  isVisible: boolean;
  onToggleVisibility: () => void;
}

function AnimatedBalanceCard({
  title,
  amount,
  currency,
  type,
  isVisible,
  onToggleVisibility,
}: AnimatedBalanceCardProps) {
  const springValue = useSpring(0, { damping: 100, stiffness: 100 });
  const displayValue = useTransform(springValue, (latest) => {
    if (latest >= 1000) {
      return `${(latest / 1000).toFixed(1)}k`;
    }
    return latest.toLocaleString();
  });

  useEffect(() => {
    const controls = animate(springValue, amount, {
      duration: 2,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [amount, springValue]);

  const isOwe = type === "owe";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-3xl border p-6 shadow-lg relative overflow-hidden ${
        isOwe
          ? "bg-gradient-to-br from-negative/10 via-surface to-surface border-negative/20"
          : "bg-gradient-to-br from-positive/10 via-surface to-surface border-positive/20"
      }`}
    >
      {/* Animated background glow */}
      <motion.div
        className={`absolute w-32 h-32 rounded-full blur-3xl ${
          isOwe ? "bg-negative/10" : "bg-positive/10"
        }`}
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
              <p className="text-xs text-text-secondary">
                {isOwe ? "Outstanding debts" : "Pending payments"}
              </p>
            </div>
          </div>
          <button
            onClick={onToggleVisibility}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-2 hover:bg-surface-2/80 transition-colors"
          >
            {isVisible ? (
              <Eye className="w-4 h-4 text-text-secondary" />
            ) : (
              <EyeOff className="w-4 h-4 text-text-secondary" />
            )}
          </button>
        </div>

        {/* Balance Amount */}
        <div className="flex items-baseline gap-2">
          {isVisible ? (
            <>
              <DollarSign className="w-5 h-5 text-text-secondary mt-1" />
              <motion.span className={`text-4xl font-bold tracking-tight ${
                isOwe ? "text-negative" : "text-positive"
              }`}>
                {displayValue}
              </motion.span>
            </>
          ) : (
            <span className="text-4xl font-bold tracking-tight text-text-primary">
              ••••••
            </span>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 mt-3">
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
            <span className={`font-semibold ${
              isOwe ? "text-negative" : "text-positive"
            }`}>
              {isOwe ? "You owe" : "You are owed"}
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function OverviewWidget({
  totalNet,
  totalOwedToMe,
  totalIOwe,
  groups,
}: OverviewWidgetProps) {
  const [showOwe, setShowOwe] = useState(true);
  const [showOwed, setShowOwed] = useState(true);
  const currency = groups[0]?.currency ?? "$";

  return (
    <div className="space-y-5">
      {/* Financial Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* You Owe Card */}
        <AnimatedBalanceCard
          title="You Owe"
          amount={totalIOwe}
          currency={currency}
          type="owe"
          isVisible={showOwe}
          onToggleVisibility={() => setShowOwe(!showOwe)}
        />

        {/* You Are Owed Card */}
        <AnimatedBalanceCard
          title="You Are Owed"
          amount={totalOwedToMe}
          currency={currency}
          type="owed"
          isVisible={showOwed}
          onToggleVisibility={() => setShowOwed(!showOwed)}
        />
      </div>

      {/* Groups Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface rounded-3xl p-6 border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-text-primary">
              {groups.length} active groups
            </h3>
            <p className="text-sm text-text-secondary">
              Groups you&apos;ve interacted with
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {groups.slice(0, 5).map((group) => (
            <motion.div
              key={group.group_id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                  group.net_balance > 0
                    ? "border-positive bg-positive/10"
                    : group.net_balance < 0
                    ? "border-negative bg-negative/10"
                    : "border-border bg-surface-2"
                }`}
              >
                <span className="text-sm font-bold text-text-primary">
                  {group.group_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-text-secondary max-w-[60px] truncate text-center">
                {group.group_name}
              </span>
            </motion.div>
          ))}

          {groups.length > 5 && (
            <div className="flex flex-col items-center gap-2 ml-2">
              <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-surface-2 transition-colors">
                <ArrowRight className="h-4 w-4 text-text-secondary" />
              </button>
              <span className="text-xs text-text-secondary">View all</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
