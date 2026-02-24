"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import type { Expense } from "@/types/group";

// ==========================================
// 🎨 AVATAR HELPERS
// ==========================================
const AVATAR_GRADIENTS = [
  "bg-gradient-to-br from-blue-400 to-blue-600",
  "bg-gradient-to-br from-emerald-400 to-emerald-600",
  "bg-gradient-to-br from-purple-400 to-purple-600",
  "bg-gradient-to-br from-pink-400 to-pink-600",
  "bg-gradient-to-br from-indigo-400 to-indigo-600",
  "bg-gradient-to-br from-teal-400 to-teal-600",
  "bg-gradient-to-br from-amber-400 to-amber-600",
  "bg-gradient-to-br from-cyan-400 to-cyan-600",
  "bg-gradient-to-br from-rose-400 to-rose-600",
  "bg-gradient-to-br from-violet-400 to-violet-600",
];

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

// ==========================================
// 🧩 TYPES
// ==========================================
interface ExpensesTabProps {
  expenses: Expense[];
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
  currency,
  currentUser,
  isOwner,
  onEditExpense,
  onDeleteExpense,
  onViewAll,
}: ExpensesTabProps) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
        <p className="text-gray-500">No expenses yet. Start adding!</p>
      </div>
    );
  }

  const displayedExpenses = expenses.slice(0, 5);
  const hasMore = expenses.length > 5;

  return (
    <div>
      {/* ── Expense Items ── */}
      <div className="space-y-3">
        {displayedExpenses.map((exp) => {
          const payerName =
            exp.profiles.display_name || exp.profiles.full_name || "Unknown";
          const payerAvatar = (exp.profiles as any)?.avatar_url || null;

          const splits = (exp.expense_splits || []) as any[];
          const visibleSplits = splits.slice(0, 3);
          const remainingCount = Math.max(0, splits.length - 3);

          return (
            <div
              key={exp.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition-all hover:border-gray-200 hover:shadow-sm sm:p-4"
            >
              {/* ── Left: Payer Avatar (real image or initials fallback) ── */}
              {payerAvatar ? (
                <img
                  src={payerAvatar}
                  alt={payerName}
                  className="h-10 w-10 flex-shrink-0 rounded-full object-cover shadow-sm ring-2 ring-white"
                />
              ) : (
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ring-2 ring-white ${getAvatarColor(
                    payerName
                  )}`}
                >
                  {getInitials(payerName)}
                </div>
              )}

              {/* ── Middle: Expense Info ── */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                  {exp.name}
                </h3>
                <p className="truncate text-xs text-gray-500">
                  Paid by{" "}
                  <Link
                    href={`/dashboard/profile/${exp.paid_by}`}
                    className="font-medium text-gray-700 hover:text-blue-600 hover:underline"
                  >
                    {payerName}
                  </Link>{" "}
                  · {new Date(exp.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* ── Right: Amount + Mini Avatars ── */}
              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                <p className="text-base font-bold text-gray-900 sm:text-lg">
                  {formatCurrency(exp.amount, currency)}
                </p>

                {/* Overlapping mini-avatars of participants */}
                <div className="flex items-center">
                  {visibleSplits.map((split: any, i: number) => {
                    const splitName =
                      split?.profiles?.display_name ||
                      split?.profiles?.full_name ||
                      `M${i + 1}`;
                    const splitAvatar =
                      split?.profiles?.avatar_url || null;

                    return splitAvatar ? (
                      <img
                        key={split?.id || i}
                        src={splitAvatar}
                        alt={splitName}
                        title={splitName}
                        className={`${
                          i > 0 ? "-ml-1.5" : ""
                        } h-6 w-6 rounded-full border-2 border-white object-cover shadow-sm`}
                      />
                    ) : (
                      <div
                        key={split?.id || i}
                        className={`${
                          i > 0 ? "-ml-1.5" : ""
                        } flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-sm ${getAvatarColor(
                          splitName
                        )}`}
                        title={splitName}
                      >
                        {getInitials(splitName).charAt(0)}
                      </div>
                    );
                  })}
                  {remainingCount > 0 && (
                    <div className="-ml-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[10px] font-bold text-gray-600 shadow-sm">
                      +{remainingCount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── View All Expenses Button (flush with card bottom) ── */}
      {onViewAll && (
        <div className="-mx-4 -mb-4 mt-4 sm:-mx-6 sm:-mb-6">
          <button
            onClick={onViewAll}
            className="w-full rounded-b-xl border-t border-gray-100 bg-gray-50 p-4 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
          >
            View All Expenses
            {hasMore && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-600">
                {expenses.length}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}