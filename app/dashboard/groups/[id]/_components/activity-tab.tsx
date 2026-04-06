"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Receipt, Handshake, ArrowRight, Calendar } from "lucide-react";
import type { ActivityItem, Expense, Settlement } from "@/types/group";

// ==========================================
// 🧩 TYPES
// ==========================================
interface ActivityTabProps {
  allActivities: ActivityItem[];
  currency: string;
}

// ==========================================
// 🎨 ACTIVITY ITEM COMPONENT
// ==========================================
interface ActivityItemCardProps {
  type: "expense" | "settlement";
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  amount: string;
  amountColor: string;
  date: string;
  profiles: { from?: any; to?: any };
}

function ActivityItemCard({
  type,
  icon,
  iconBg,
  title,
  subtitle,
  amount,
  amountColor,
  date,
  profiles,
}: ActivityItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="relative pl-10"
    >
      {/* Timeline connector */}
      <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border last:hidden" />

      {/* Icon */}
      <div className={`absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>

      {/* Content Card */}
      <div className="rounded-2xl border border-border bg-surface p-4 transition-all hover:border-border-2 hover:shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-text-primary mb-1">{title}</h4>
            <p className="text-sm text-text-secondary">{subtitle}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-lg font-bold ${amountColor}`}>{amount}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 text-xs text-text-tertiary">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{date}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function ActivityTab({ allActivities, currency }: ActivityTabProps) {
  if (allActivities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 mb-4">
          <Receipt className="h-8 w-8 text-text-tertiary" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">No activity yet</h3>
        <p className="text-sm text-text-secondary text-center">
          When expenses and settlements happen, they'll appear here.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {allActivities.map((item, index) => {
        if (item.type === "expense") {
          const exp = item as Expense & { type: "expense" };
          const isSettleUp =
            exp.name.toLowerCase().includes("settle up") ||
            exp.name.toLowerCase().includes("cash payment");
          const payerName = exp.profiles?.display_name || exp.profiles?.full_name || "Someone";
          const payerAvatar = (exp.profiles as any)?.avatar_url;

          return (
            <motion.div
              key={`expense-${exp.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative pl-10"
            >
              {/* Timeline connector */}
              {index < allActivities.length - 1 && (
                <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border" />
              )}

              {/* Icon */}
              <div
                className={`absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl ${
                  isSettleUp ? "bg-positive/10" : "bg-surface-2"
                }`}
              >
                {isSettleUp ? (
                  <Handshake className="h-4 w-4 text-positive" />
                ) : (
                  <Receipt className="h-4 w-4 text-text-primary" />
                )}
              </div>

              {/* Content Card */}
              <div className="rounded-2xl border border-border bg-surface p-4 transition-all hover:border-border-2 hover:shadow-sm">
                {/* Header Row */}
                <div className="flex items-start gap-3 mb-3">
                  <Link href={`/dashboard/profile/${exp.paid_by}`} className="shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Avatar src={payerAvatar} name={payerName} size="md" />
                    </motion.div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-text-primary">{exp.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
                      <Link
                        href={`/dashboard/profile/${exp.paid_by}`}
                        className="hover:text-text-primary hover:underline"
                      >
                        {payerName}
                      </Link>
                      <span>{isSettleUp ? "settled up" : "added expense"}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-lg font-bold ${
                        isSettleUp ? "text-positive" : "text-text-primary"
                      }`}
                    >
                      {formatCurrency(exp.amount, currency)}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(exp.created_at).toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        } else {
          const s = item as Settlement & { type: "settlement" };
          const fromName = s.from_profile.display_name || s.from_profile.username;
          const toName = s.to_profile.display_name || s.to_profile.username;
          const fromAvatar = s.from_profile.avatar_url;
          const toAvatar = s.to_profile.avatar_url;

          return (
            <motion.div
              key={`settlement-${s.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative pl-10"
            >
              {/* Timeline connector */}
              {index < allActivities.length - 1 && (
                <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border" />
              )}

              {/* Icon */}
              <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl bg-positive/10">
                <Handshake className="h-4 w-4 text-positive" />
              </div>

              {/* Content Card */}
              <div className="rounded-2xl border border-border bg-surface p-4 transition-all hover:border-border-2 hover:shadow-sm">
                {/* Header Row */}
                <div className="flex items-center gap-3 mb-3">
                  {/* From Avatar */}
                  <Link href={`/dashboard/profile/${s.from_user}`} className="shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Avatar src={fromAvatar} name={fromName} size="md" />
                    </motion.div>
                  </Link>

                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Link
                      href={`/dashboard/profile/${s.from_user}`}
                      className="font-medium text-text-primary hover:underline truncate"
                    >
                      {fromName}
                    </Link>
                    <ArrowRight className="h-4 w-4 text-text-tertiary shrink-0" />
                    <Link
                      href={`/dashboard/profile/${s.to_user}`}
                      className="font-medium text-text-primary hover:underline truncate"
                    >
                      {toName}
                    </Link>
                  </div>

                  {/* To Avatar */}
                  <Link href={`/dashboard/profile/${s.to_user}`} className="shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Avatar src={toAvatar} name={toName} size="md" />
                    </motion.div>
                  </Link>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-text-tertiary">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(s.created_at).toLocaleString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-lg font-bold text-positive">
                    {formatCurrency(s.amount, currency)}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        }
      })}
    </div>
  );
}
