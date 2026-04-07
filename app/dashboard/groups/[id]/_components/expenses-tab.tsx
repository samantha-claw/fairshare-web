"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Receipt, Plus, Calendar, User, ChevronRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Expense } from "@/types/group";

// ==========================================
// 🎨 AVATAR GROUP FOR SPLIT PARTICIPANTS
// ==========================================
interface AvatarGroupProps {
  items: { id: string; name: string; avatar?: string }[];
  maxVisible?: number;
  size?: "sm" | "md";
}

function ExpenseAvatarGroup({ items, maxVisible = 4, size = "sm" }: AvatarGroupProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const visibleItems = items.slice(0, maxVisible);
  const remainingCount = items.length - maxVisible;

  const sizeClasses = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
  };

  return (
    <div className="flex items-center">
      {visibleItems.map((item, index) => (
        <div
          key={item.id}
          className="relative"
          style={{ marginLeft: index === 0 ? 0 : -8, zIndex: visibleItems.length - index }}
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <AnimatePresence>
            {hoveredId === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-surface border border-border px-3 py-1.5 text-xs font-medium text-text-primary shadow-lg z-50"
              >
                {item.name}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            whileHover={{ scale: 1.1, zIndex: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Avatar
              src={item.avatar}
              name={item.name}
              size={size === "sm" ? "sm" : "md"}
              className={cn(
                "ring-2 ring-surface",
                sizeClasses[size]
              )}
            />
          </motion.div>
        </div>
      ))}
      {remainingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "flex items-center justify-center rounded-full bg-surface-2 text-text-secondary font-medium ring-2 ring-surface",
            sizeClasses[size]
          )}
          style={{ marginLeft: -8 }}
        >
          +{remainingCount}
        </motion.div>
      )}
    </div>
  );
}

// ==========================================
// 🏷️ SPLIT BADGE
// ==========================================
function SplitBadge({ type }: { type?: string }) {
  const normalizedType = (type || "equal").toLowerCase();
  const config: Record<string, { label: string; className: string }> = {
    equal: { label: "Equal", className: "bg-surface-2 text-text-secondary" },
    exact: { label: "Exact", className: "bg-surface-2 text-text-secondary" },
    percentage: { label: "Percent", className: "bg-surface-2 text-text-secondary" },
    shares: { label: "Shares", className: "bg-surface-2 text-text-secondary" },
  };
  const { label, className } = config[normalizedType] || config.equal;

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", className)}>
      {label}
    </span>
  );
}

// ==========================================
// 🧩 TYPES
// ==========================================
interface ExpensesTabProps {
  expenses: Expense[];
  onAddExpense: () => void;
  currency: string;
  currentUser: string | null;
  isOwner: boolean;
  onEditExpense: (exp: Expense) => void;
  onDeleteExpense: (id: string, name: string) => void;
  onViewAll?: () => void;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function ExpensesTab({
  expenses,
  onAddExpense,
  currency,
  currentUser,
  isOwner,
  onEditExpense,
  onDeleteExpense,
  onViewAll,
}: ExpensesTabProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  if (expenses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 mb-4">
          <Receipt className="h-8 w-8 text-text-tertiary" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">No expenses yet</h3>
        <p className="text-sm text-text-secondary text-center mb-6">
          Add your first expense to start tracking group spending.
        </p>
        <button
          onClick={onAddExpense}
          className="inline-flex items-center gap-2 rounded-xl bg-text-primary px-5 py-2.5 text-sm font-medium text-surface transition-all hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </motion.div>
    );
  }

  const displayedExpenses = expenses.slice(0, 5);
  const hasMore = expenses.length > 5;

  return (
    <div className="space-y-3">
      {displayedExpenses.map((exp, index) => {
        const payerName = exp.profiles.display_name || exp.profiles.full_name || "Unknown";
        const payerAvatar = (exp.profiles as any)?.avatar_url || null;
        const splits = (exp.expense_splits || []) as any[];
        const splitParticipants = splits.map((s: any) => ({
          id: s.user_id || s.id,
          name: s?.profiles?.display_name || s?.profiles?.full_name || "Member",
          avatar: s?.profiles?.avatar_url || undefined,
        }));

        return (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative rounded-2xl border border-border bg-surface p-4 transition-all hover:border-border-2 hover:shadow-sm"
          >
            {/* Header Row */}
            <div className="flex items-start gap-4">
              {/* Payer Avatar */}
              <Link
                href={`/dashboard/profile/${exp.paid_by}`}
                className="shrink-0"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Avatar src={payerAvatar} name={payerName} size="lg" />
                </motion.div>
              </Link>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title + Badge */}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-text-primary truncate">
                    {exp.name}
                  </h3>
                  <SplitBadge type={(exp as any).split_type} />
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <Link
                      href={`/dashboard/profile/${exp.paid_by}`}
                      className="hover:text-text-primary hover:underline"
                    >
                      {payerName}
                    </Link>
                  </div>
                  <span className="text-text-tertiary">·</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(exp.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-text-primary">
                  {formatCurrency(exp.amount, currency)}
                </p>
              </div>
            </div>

            {/* Footer: Participants + Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              {/* Avatar Group */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-tertiary">Split by</span>
                <ExpenseAvatarGroup items={splitParticipants} maxVisible={4} size="sm" />
              </div>

              {/* Actions Menu */}
              {(isOwner || exp.paid_by === currentUser) && (
                <div className="relative">
                  <button
                    type="button"
                    aria-label={`Open actions for ${exp.name}`}
                    aria-haspopup="menu"
                    aria-expanded={menuOpenId === exp.id}
                    onClick={() => setMenuOpenId(menuOpenId === exp.id ? null : exp.id)}
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  <AnimatePresence>
                    {menuOpenId === exp.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        className="absolute right-0 top-full mt-1 z-50 min-w-[120px] rounded-xl border border-border bg-surface p-1 shadow-lg"
                      >
                        <button
                          onClick={() => {
                            onEditExpense(exp);
                            setMenuOpenId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            onDeleteExpense(exp.id, exp.name);
                            setMenuOpenId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-negative hover:bg-negative/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* View All Button */}
      {onViewAll && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onViewAll}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface p-4 text-sm font-medium text-text-secondary transition-all hover:bg-surface-2 hover:text-text-primary"
        >
          View All Expenses
          {hasMore && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-text-primary">
              {expenses.length}
            </span>
          )}
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      )}
    </div>
  );
}
