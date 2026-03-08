"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import type { Expense } from "@/types/group";

// ==========================================
// 🎨 AVATAR FALLBACK HELPERS
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
// 🏷️ SPLIT BADGE
// ==========================================
function SplitBadge({ type }: { type?: string }) {
  const normalizedType = (type || "equal").toLowerCase();

  const config: Record<string, { label: string; style: string; icon: string }> = {
    equal:      { label: "Equal",   style: "bg-blue-50 text-blue-700 ring-blue-200",          icon: "⚖️" },
    exact:      { label: "Exact",   style: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: "💰" },
    percentage: { label: "Percent", style: "bg-purple-50 text-purple-700 ring-purple-200",    icon: "📊" },
    shares:     { label: "Shares",  style: "bg-orange-50 text-orange-700 ring-orange-200",    icon: "🎯" },
  };

  const { label, style, icon } = config[normalizedType] || config.equal;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${style}`}
    >
      <span>{icon}</span> {label}
    </span>
  );
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
    <>
      {/* FIX 1: Added overflow-hidden to the outermost wrapper 
        so nothing can ever push beyond the card boundary */}
      <div className="overflow-hidden">
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
              className="flex items-start gap-3 overflow-hidden rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition-all hover:border-gray-200 hover:shadow-sm sm:items-center sm:p-4"
            >
              {/* FIX 2: Added overflow-hidden to each expense row so long text inside flex children can't push the row wider */}
              {/* ── Left: Payer Avatar ── */}
              <Link
                href={`/dashboard/profile/${exp.paid_by}`}
                className="mt-1 shrink-0 sm:mt-0"
              >
                <Avatar src={payerAvatar} name={payerName} size="md" />
              </Link>

              {/* ── Middle: Expense Info ── */}
              {/* FIX 3: Added overflow-hidden alongside min-w-0
                  Both are needed: min-w-0 allows the flex child to shrink
                  below its content size, overflow-hidden clips any remainder */}
              <div className="min-w-0 flex-1 overflow-hidden">
                {/* Name + SplitBadge */}
                <div className="mb-0.5 flex items-center gap-2 overflow-hidden">
                  <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                    {exp.name}
                  </h3>
                  <SplitBadge type={(exp as any).split_type} />
                </div>

                {/* FIX 4: Added overflow-hidden to the meta line
                    so the "Paid by <name> · <date>" can't overflow either */}
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 overflow-hidden text-xs text-gray-500">
                  <span>Paid by</span>
                  <Link
                    href={`/dashboard/profile/${exp.paid_by}`}
                    className="max-w-[80px] truncate font-medium text-gray-700 hover:text-blue-600 hover:underline sm:max-w-[120px]"
                    title={payerName}
                  >
                    {payerName}
                  </Link>
                  <span className="text-gray-400">·</span>
                  <span className="whitespace-nowrap">
                    {new Date(exp.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* ── Right: Amount + Mini Participant Avatars ── */}
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <p className="whitespace-nowrap text-base font-bold text-gray-900 sm:text-lg">
                  {formatCurrency(exp.amount, currency)}
                </p>

                {/* Overlapping mini-avatars */}
                <div className="flex items-center">
                  {visibleSplits.map((split: any, i: number) => {
                    const splitName =
                      split?.profiles?.display_name ||
                      split?.profiles?.full_name ||
                      `M${i + 1}`;
                    const splitAvatar = split?.profiles?.avatar_url || null;

                    return (
                      <div
                        key={split?.id || i}
                        className={`${
                          i > 0 ? "-ml-1.5" : ""
                        } rounded-full ring-2 ring-white`}
                        title={splitName}
                      >
                        {splitAvatar ? (
                          <img
                            src={splitAvatar}
                            alt={splitName}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${getAvatarColor(
                              splitName
                            )}`}
                          >
                            {getInitials(splitName).charAt(0)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {remainingCount > 0 && (
                    <div
                      className="-ml-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 ring-2 ring-white"
                      title={`+${remainingCount} more`}
                    >
                      +{remainingCount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Seamless "View All" Button ── */}
      {onViewAll && (
        <div className="-mx-4 -mb-4 mt-3 sm:-mx-6 sm:-mb-6">
          <button
            onClick={onViewAll}
            className="flex w-full items-center justify-center gap-2 rounded-b-xl border-t border-gray-100 bg-gray-50 p-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 active:scale-[0.99]"
          >
            View All Expenses
            {hasMore && (
              <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-600">
                {expenses.length}
              </span>
            )}
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      )}
      </div>
    </>
  );
}