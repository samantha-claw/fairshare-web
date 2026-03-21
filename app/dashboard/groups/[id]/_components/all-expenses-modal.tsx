"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import type { Expense } from "@/types/group";

// ── Constants ───────────────────────────────────────────
const PAGE_SIZE = 20;
const CURSOR_SEPARATOR = "|";

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

type ExpenseWithAvatar = Omit<Expense, "profiles" | "expense_splits"> & {
  profiles: Expense["profiles"] & { avatar_url?: string | null };
  expense_splits?: Array<{
    id?: string;
    user_id: string;
    amount?: number;
    profiles?: {
      id?: string;
      display_name?: string | null;
      full_name?: string | null;
      avatar_url?: string | null;
    } | null;
  }>;
  split_type?: string | null;
};

function encodeCursor(lastItem: ExpenseWithAvatar): string {
  return `${lastItem.created_at}${CURSOR_SEPARATOR}${lastItem.id}`;
}

function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  const separatorIndex = cursor.lastIndexOf(CURSOR_SEPARATOR);
  if (separatorIndex <= 0 || separatorIndex === cursor.length - 1) {
    return null;
  }

  return {
    createdAt: cursor.slice(0, separatorIndex),
    id: cursor.slice(separatorIndex + 1),
  };
}

// ── Fetch helper ────────────────────────────────────────
async function fetchExpensesPage(
  groupId: string,
  cursor: string | null,
  pageSize: number
): Promise<{
  data: ExpenseWithAvatar[];
  totalCount: number;
  nextCursor: string | null;
  error: string | null;
}> {
  const supabase = createClient();
  let query = supabase
    .from("expenses")
    .select(
      `
      *,
      profiles:paid_by (id, display_name, full_name, username, avatar_url),
      expense_splits (
        id,
        user_id,
        amount,
        profiles:user_id (id, display_name, full_name, avatar_url)
      )
    `,
      { count: "exact" }
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize);

  if (cursor) {
    const parsedCursor = decodeCursor(cursor);
    if (parsedCursor) {
      query = query.or(
        `created_at.lt.${parsedCursor.createdAt},and(created_at.eq.${parsedCursor.createdAt},id.lt.${parsedCursor.id})`
      );
    }
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Failed to fetch expenses page:", error);
    return {
      data: [],
      totalCount: 0,
      nextCursor: null,
      error: "Failed to load expenses. Please try again.",
    };
  }

  const rows = (data ?? []) as ExpenseWithAvatar[];
  const nextCursor = rows.length === pageSize ? encodeCursor(rows[rows.length - 1]) : null;

  return {
    data: rows,
    totalCount: count ?? 0,
    nextCursor,
    error: null,
  };
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
  const [expenses, setExpenses] = useState<ExpenseWithAvatar[]>([]);
  const [page, setPage] = useState(0);
  const [pageCursors, setPageCursors] = useState<Array<string | null>>([null]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setPage(0);
    setPageCursors([null]);
  }, [isOpen, groupId]);

  // ── Fetch page when modal opens or page changes ───────
  useEffect(() => {
    if (!isOpen || !groupId) return;

    const cursor = pageCursors[page] ?? null;

    setExpenses([]);
    setTotalCount(0);
    setFetchError(null);
    setIsLoadingInitial(true);

    let cancelled = false;

    fetchExpensesPage(groupId, cursor, PAGE_SIZE).then(({ data, totalCount, nextCursor, error }) => {
      if (cancelled) return;
      if (error) {
        setFetchError(error);
      } else {
        setExpenses(data);
        setTotalCount(totalCount);
        setPageCursors((prev) => {
          const next = [...prev];
          next[page] = cursor;
          next[page + 1] = nextCursor;
          return next;
        });
      }
      setIsLoadingInitial(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, groupId, page]);

  // ── Helpers ───────────────────────────────────────────
  const canModify = (exp: ExpenseWithAvatar) =>
    currentUser === exp.paid_by || isOwner;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

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
                : `${totalCount} expense${totalCount !== 1 ? "s" : ""} · ${currency}`}
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
          ) : fetchError && expenses.length === 0 ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-center">
              <p className="text-sm text-red-600">{fetchError}</p>
              <p className="mt-1 text-xs text-red-500">
                Close and reopen this modal to retry.
              </p>
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
                const payerAvatar = exp.profiles.avatar_url || undefined;
                const splits = exp.expense_splits ?? [];
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
                          <SplitBadge type={exp.split_type ?? undefined} />
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

              {/* Error banner for load-more failures */}
              {fetchError && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center">
                  <p className="text-sm text-red-600">{fetchError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-gray-200 px-5 py-3">
          {totalPages > 1 && (
            <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isLoadingInitial}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-gray-400">
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1 || isLoadingInitial}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
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