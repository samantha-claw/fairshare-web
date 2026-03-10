"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import type { Expense } from "@/types/group";

// ── Constants ───────────────────────────────────────────
const PAGE_SIZE = 20;

// ── Avatar helpers ──────────────────────────────────────
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

// ── Split Badge ─────────────────────────────────────────
function SplitBadge({ type }: { type?: string }) {
  const normalizedType = (type || "equal").toLowerCase();

  const config: Record<string, { label: string; style: string; icon: string }> =
    {
      equal: {
        label: "Equal",
        style: "bg-blue-50 text-blue-700 ring-blue-200",
        icon: "⚖️",
      },
      exact: {
        label: "Exact",
        style: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        icon: "💰",
      },
      percentage: {
        label: "Percent",
        style: "bg-purple-50 text-purple-700 ring-purple-200",
        icon: "📊",
      },
      shares: {
        label: "Shares",
        style: "bg-orange-50 text-orange-700 ring-orange-200",
        icon: "🎯",
      },
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

// ── Types ───────────────────────────────────────────────
interface AllExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  currency: string;
  currentUser: string | null;
  isOwner: boolean;
  onEditExpense: (exp: Expense) => void;
  onDeleteExpense: (id: string, name: string) => void;
}

// ── Fetch helper ────────────────────────────────────────
async function fetchExpensesPage(
  groupId: string,
  lastCursor: string | null
): Promise<{ data: Expense[]; hasMore: boolean }> {
  const supabase = createClient();

  let query = supabase
    .from("expenses")
    .select(
      `
      *,
      profiles:paid_by (id, display_name, full_name, avatar_url),
      expense_splits (
        id,
        user_id,
        amount,
        profiles:user_id (id, display_name, full_name, avatar_url)
      )
    `
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1); // Fetch one extra to determine hasMore

  if (lastCursor) {
    query = query.lt("created_at", lastCursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch expenses page:", error);
    return { data: [], hasMore: false };
  }

  const rows = (data ?? []) as Expense[];
  const hasMore = rows.length > PAGE_SIZE;

  // Trim the extra probe row so we only return PAGE_SIZE items
  if (hasMore) {
    rows.pop();
  }

  return { data: rows, hasMore };
}

// ── Component ───────────────────────────────────────────
export function AllExpensesModal({
  isOpen,
  onClose,
  groupId,
  currency,
  currentUser,
  isOwner,
  onEditExpense,
  onDeleteExpense,
}: AllExpensesModalProps) {
  // ── Pagination state ──────────────────────────────────
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Guard against stale responses after close / unmount
  const abortRef = useRef(false);

  // ── Initial fetch when modal opens ────────────────────
  useEffect(() => {
    if (!isOpen || !groupId) return;

    abortRef.current = false;
    setExpenses([]);
    setHasMore(false);
    setFetchError(null);
    setIsLoadingInitial(true);

    fetchExpensesPage(groupId, null).then(({ data, hasMore: more }) => {
      if (abortRef.current) return;
      setExpenses(data);
      setHasMore(more);
      setIsLoadingInitial(false);
    });

    return () => {
      abortRef.current = true;
    };
  }, [isOpen, groupId]);

  // ── Load more handler ────────────────────────────────
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || expenses.length === 0) return;

    const lastItem = expenses[expenses.length - 1];
    const cursor = lastItem.created_at;

    setIsLoadingMore(true);
    setFetchError(null);

    try {
      const { data: newRows, hasMore: more } = await fetchExpensesPage(
        groupId,
        cursor
      );

      if (abortRef.current) return;

      // Deduplicate — in case a new expense was inserted between pages
      setExpenses((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const unique = newRows.filter((e) => !existingIds.has(e.id));
        return [...prev, ...unique];
      });
      setHasMore(more);
    } catch (err) {
      if (abortRef.current) return;
      console.error("Load more failed:", err);
      setFetchError("Failed to load more expenses. Try again.");
    } finally {
      if (!abortRef.current) setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, expenses, groupId]);

  // ── Helpers ───────────────────────────────────────────
  const canModify = (exp: Expense) => currentUser === exp.paid_by || isOwner;

  const totalLoaded = expenses.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="All Expenses" maxWidth="lg">
      {/* Constrain height so the body scrolls, not the whole modal */}
      <div className="flex max-h-[90vh] flex-col sm:max-h-[85vh]">
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">All Expenses</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {isLoadingInitial
                ? "Loading…"
                : `${totalLoaded} expense${totalLoaded !== 1 ? "s" : ""} loaded · ${currency}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 active:scale-95"
            title="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {/* Initial loading skeleton */}
          {isLoadingInitial ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-gray-100 bg-gray-50/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-gray-200" />
                      <div className="h-3 w-1/2 rounded bg-gray-200" />
                    </div>
                    <div className="h-5 w-16 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
              <p className="text-gray-500">No expenses yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((exp) => {
                const payerName =
                  exp.profiles.display_name ||
                  exp.profiles.full_name ||
                  "Unknown";
                const payerAvatar =
                  (exp.profiles as any)?.avatar_url || null;
                const splits = (exp.expense_splits || []) as any[];
                const visibleSplits = splits.slice(0, 3);
                const remainingCount = Math.max(0, splits.length - 3);
                const showActions = canModify(exp);

                return (
                  <div
                    key={exp.id}
                    className="group rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition-all hover:border-gray-200 hover:shadow-sm sm:p-4"
                  >
                    {/* Top Row */}
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/dashboard/profile/${exp.paid_by}`}
                        className="flex-shrink-0"
                      >
                        <Avatar
                          src={payerAvatar}
                          name={payerName}
                          size="md"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        {/* Name + SplitBadge */}
                        <div className="mb-0.5 flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                            {exp.name}
                          </h3>
                          <SplitBadge type={(exp as any).split_type} />
                        </div>

                        <p className="truncate text-xs text-gray-500">
                          Paid by{" "}
                          <Link
                            href={`/dashboard/profile/${exp.paid_by}`}
                            className="font-medium text-gray-700 hover:text-blue-600 hover:underline"
                          >
                            {payerName}
                          </Link>{" "}
                          ·{" "}
                          {new Date(exp.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                        <p className="text-base font-bold text-gray-900 sm:text-lg">
                          {formatCurrency(exp.amount, currency)}
                        </p>
                        <div className="flex items-center">
                          {visibleSplits.map((split: any, i: number) => {
                            const splitName =
                              split?.profiles?.display_name ||
                              split?.profiles?.full_name ||
                              `M${i + 1}`;
                            const splitAvatar =
                              split?.profiles?.avatar_url || null;
                            return (
                              <div
                                key={split?.id || i}
                                className={`${i > 0 ? "-ml-1.5" : ""} rounded-full ring-2 ring-white`}
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
                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${getAvatarColor(splitName)}`}
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

                    {/* Action Buttons */}
                    {showActions && (
                      <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            onEditExpense(exp);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
                          title={`Edit "${exp.name}"`}
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                            />
                          </svg>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteExpense(exp.id, exp.name);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 active:scale-95"
                          title={`Delete "${exp.name}"`}
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Load More / End-of-list ── */}
              {hasMore && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="group/btn w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
                  >
                    {isLoadingMore ? (
                      <span className="inline-flex items-center gap-2">
                        <svg
                          className="h-4 w-4 animate-spin text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Loading…
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        Load more expenses
                        <svg
                          className="h-4 w-4 transition-transform group-hover/btn:translate-y-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* End-of-list indicator when all pages loaded */}
              {!hasMore && expenses.length > PAGE_SIZE && (
                <p className="pt-2 text-center text-xs text-gray-400">
                  All {expenses.length} expenses loaded
                </p>
              )}

              {/* Error banner for load-more failures */}
              {fetchError && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center">
                  <p className="text-sm text-red-600">{fetchError}</p>
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="mt-1.5 text-xs font-semibold text-red-700 underline hover:text-red-800"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-200 active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}