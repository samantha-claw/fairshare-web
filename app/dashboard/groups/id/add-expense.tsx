"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  type FormEvent,
} from "react";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js/dist/index.cjs";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

interface MemberProfile {
  username: string;
  display_name: string | null;
}

interface GroupMember {
  user_id: string;
  profiles: MemberProfile;
}

type SplitType = "equal" | "exact" | "percentage";
type Category =
  | "food"
  | "transport"
  | "housing"
  | "entertainment"
  | "utilities"
  | "shopping"
  | "health"
  | "travel"
  | "education"
  | "other";

interface BeneficiarySplit {
  user_id: string;
  username: string;
  display_name: string;
  selected: boolean;
  amount: number;
  percentage: number;
}

interface AddExpenseProps {
  groupId: string;
  groupCurrency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

/* ────────────────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────────────────── */

const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: "food", label: "Food & Drink", emoji: "🍔" },
  { value: "transport", label: "Transport", emoji: "🚗" },
  { value: "housing", label: "Housing", emoji: "🏠" },
  { value: "entertainment", label: "Entertainment", emoji: "🎬" },
  { value: "utilities", label: "Utilities", emoji: "💡" },
  { value: "shopping", label: "Shopping", emoji: "🛍️" },
  { value: "health", label: "Health", emoji: "🏥" },
  { value: "travel", label: "Travel", emoji: "✈️" },
  { value: "education", label: "Education", emoji: "📚" },
  { value: "other", label: "Other", emoji: "📦" },
];

const SPLIT_TYPES: { value: SplitType; label: string; desc: string }[] = [
  {
    value: "equal",
    label: "Equal",
    desc: "Split evenly among selected members",
  },
  {
    value: "exact",
    label: "Exact",
    desc: "Enter specific amount per person",
  },
  {
    value: "percentage",
    label: "Percentage",
    desc: "Enter percentage per person",
  },
];

/* ────────────────────────────────────────────────────────────
   Utility: round to 2 decimal places
   ──────────────────────────────────────────────────────────── */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/* ────────────────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────────────────── */

export function AddExpense({
  groupId,
  groupCurrency,
  onSuccess,
  onCancel,
}: AddExpenseProps) {


  // ── Auth ────────────────────────────────────────────────
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ── Members (for payer + beneficiary selection) ─────────
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // ── Form fields ─────────────────────────────────────────
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [category, setCategory] = useState<Category>("other");
  const [notes, setNotes] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ── Beneficiary splits ─────────────────────────────────
  const [splits, setSplits] = useState<BeneficiarySplit[]>([]);

  // ── UI state ────────────────────────────────────────────
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch members ───────────────────────────────────────

  const fetchMembers = useCallback(async () => {
    const { data, error: fetchErr } = await supabase
      .from("group_members")
      .select("user_id, profiles ( username, display_name )")
      .eq("group_id", groupId);

    if (fetchErr || !data) return;

    const fetched = data as unknown as GroupMember[];
    setMembers(fetched);

    // Initialize splits — everyone selected by default
    setSplits(
      fetched.map((m) => ({
        user_id: m.user_id,
        username: m.profiles.username,
        display_name: m.profiles.display_name || m.profiles.username,
        selected: true,
        amount: 0,
        percentage: 0,
      }))
    );

    setMembersLoading(false);
  }, [groupId, supabase]);

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setCurrentUserId(session.user.id);
        setPayerId(session.user.id); // default payer = current user
      }

      await fetchMembers();
    }

    init();
  }, [fetchMembers, supabase.auth]);

  // ── Recalculate equal splits when amount or selection changes

  useEffect(() => {
    if (splitType !== "equal") return;

    const totalAmount = parseFloat(amount) || 0;
    const selectedCount = splits.filter((s) => s.selected).length;

    if (selectedCount === 0 || totalAmount === 0) {
      setSplits((prev) =>
        prev.map((s) => ({ ...s, amount: 0, percentage: 0 }))
      );
      return;
    }

    const perPerson = round2(totalAmount / selectedCount);
    // Handle rounding remainder
    const remainder = round2(totalAmount - perPerson * selectedCount);

    setSplits((prev) => {
      let firstSelected = true;
      return prev.map((s) => {
        if (!s.selected) return { ...s, amount: 0, percentage: 0 };

        let splitAmount = perPerson;
        if (firstSelected && remainder !== 0) {
          splitAmount = round2(perPerson + remainder);
          firstSelected = false;
        } else {
          firstSelected = false;
        }

        return {
          ...s,
          amount: splitAmount,
          percentage: round2((splitAmount / totalAmount) * 100),
        };
      });
    });
  }, [amount, splits.map((s) => s.selected).join(","), splitType]);
  // ↑ stringified selection as dep to avoid object reference issues

  // ── Toggle beneficiary selection ────────────────────────

  function toggleBeneficiary(userId: string) {
    setSplits((prev) =>
      prev.map((s) =>
        s.user_id === userId ? { ...s, selected: !s.selected } : s
      )
    );
  }

  // ── Update exact amount for a beneficiary ───────────────

  function updateSplitAmount(userId: string, val: string) {
    const num = parseFloat(val) || 0;
    setSplits((prev) =>
      prev.map((s) =>
        s.user_id === userId ? { ...s, amount: round2(num) } : s
      )
    );
  }

  // ── Update percentage for a beneficiary ─────────────────

  function updateSplitPercentage(userId: string, val: string) {
    const pct = parseFloat(val) || 0;
    const totalAmount = parseFloat(amount) || 0;
    setSplits((prev) =>
      prev.map((s) =>
        s.user_id === userId
          ? {
              ...s,
              percentage: round2(pct),
              amount: round2((pct / 100) * totalAmount),
            }
          : s
      )
    );
  }

  // ── Validation ──────────────────────────────────────────

  function validate(): string | null {
    if (!name.trim()) return "Expense name is required.";

    const totalAmount = parseFloat(amount);
    if (!totalAmount || totalAmount <= 0)
      return "Amount must be greater than zero.";

    if (!payerId) return "Please select a payer.";

    const selected = splits.filter((s) => s.selected);
    if (selected.length === 0)
      return "Select at least one beneficiary.";

    if (splitType === "exact") {
      const sumExact = round2(
        selected.reduce((acc, s) => acc + s.amount, 0)
      );
      if (sumExact !== round2(totalAmount)) {
        return `Split amounts sum to ${sumExact.toFixed(
          2
        )}, but expense total is ${totalAmount.toFixed(
          2
        )}. They must match.`;
      }
    }

    if (splitType === "percentage") {
      const sumPct = round2(
        selected.reduce((acc, s) => acc + s.percentage, 0)
      );
      if (sumPct !== 100) {
        return `Percentages sum to ${sumPct.toFixed(
          1
        )}%. They must add up to 100%.`;
      }
    }

    return null;
  }

  // ── Submit ──────────────────────────────────────────────

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!currentUserId) {
      setError("You must be signed in.");
      return;
    }

    setSubmitting(true);

    try {
      const totalAmount = parseFloat(amount);

      // 1. Insert expense
      const { data: expense, error: expenseErr } = await supabase
        .from("expenses")
        .insert({
          group_id: groupId,
          name: name.trim(),
          amount: totalAmount,
          currency: groupCurrency,
          paid_by: payerId,
          split_type: splitType,
          category,
          notes: notes.trim() || null,
          expense_date: expenseDate,
          created_by: currentUserId,
        })
        .select("id")
        .single();

      if (expenseErr || !expense) {
        setError(expenseErr?.message ?? "Failed to create expense.");
        return;
      }

      // 2. Build split rows
      const selected = splits.filter((s) => s.selected);
      const splitRows = selected.map((s) => ({
        expense_id: expense.id,
        user_id: s.user_id,
        amount: s.amount,
        percentage: splitType === "percentage" ? s.percentage : null,
      }));

      // 3. Insert splits (trigger updates balances)
      const { error: splitsErr } = await supabase
        .from("expense_splits")
        .insert(splitRows);

      if (splitsErr) {
        // Rollback: delete the orphan expense
        await supabase.from("expenses").delete().eq("id", expense.id);
        setError(splitsErr.message);
        return;
      }

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Derived values ──────────────────────────────────────

  const totalAmount = parseFloat(amount) || 0;
  const selectedSplits = splits.filter((s) => s.selected);
  const splitSum = round2(selectedSplits.reduce((a, s) => a + s.amount, 0));
  const pctSum = round2(
    selectedSplits.reduce((a, s) => a + s.percentage, 0)
  );
  const hasMismatch =
    (splitType === "exact" && totalAmount > 0 && splitSum !== round2(totalAmount)) ||
    (splitType === "percentage" && totalAmount > 0 && pctSum !== 100);

  // ── Loading ─────────────────────────────────────────────

  if (membersLoading) {
    return (
      <div className="animate-pulse space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="h-6 w-36 rounded bg-gray-200" />
        <div className="h-10 w-full rounded bg-gray-200" />
        <div className="h-10 w-full rounded bg-gray-200" />
        <div className="h-24 w-full rounded bg-gray-200" />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-lg border border-gray-200 bg-white shadow-sm"
    >
      {/* ── Header ────────────────────────────────────── */}
      <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Add Expense
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-5 px-4 py-5 sm:px-6">
        {/* ── Error ───────────────────────────────────── */}
        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* ── Name ────────────────────────────────────── */}
        <div>
          <label htmlFor="expense-name" className="mb-1 block text-sm font-medium text-gray-700">
            Expense name <span className="text-red-500">*</span>
          </label>
          <input
            id="expense-name"
            type="text"
            required
            maxLength={200}
            value={name}
            placeholder='e.g. "Dinner at Marios"'
            onChange={(e) => setName(e.target.value)}
            className="
              block w-full rounded-md border border-gray-300 bg-white
              px-3 py-2 text-sm text-gray-900 placeholder-gray-400
              shadow-sm focus:border-blue-500 focus:outline-none
              focus:ring-1 focus:ring-blue-500
            "
          />
        </div>

        {/* ── Amount + Category (side by side on sm+) ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="expense-amount" className="mb-1 block text-sm font-medium text-gray-700">
              Amount ({groupCurrency}) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-400">
                $
              </span>
              <input
                id="expense-amount"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                placeholder="0.00"
                onChange={(e) => setAmount(e.target.value)}
                className="
                  block w-full rounded-md border border-gray-300
                  bg-white py-2 pl-7 pr-3 text-sm text-gray-900
                  placeholder-gray-400 shadow-sm
                  focus:border-blue-500 focus:outline-none
                  focus:ring-1 focus:ring-blue-500
                  [appearance:textfield]
                  [&::-webkit-inner-spin-button]:appearance-none
                  [&::-webkit-outer-spin-button]:appearance-none
                "
              />
            </div>
          </div>

          <div>
            <label htmlFor="expense-category" className="mb-1 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="expense-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="
                block w-full rounded-md border border-gray-300
                bg-white px-3 py-2 text-sm text-gray-900
                shadow-sm focus:border-blue-500 focus:outline-none
                focus:ring-1 focus:ring-blue-500
              "
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Date ────────────────────────────────────── */}
        <div>
          <label htmlFor="expense-date" className="mb-1 block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            id="expense-date"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="
              block w-full rounded-md border border-gray-300
              bg-white px-3 py-2 text-sm text-gray-900
              shadow-sm focus:border-blue-500 focus:outline-none
              focus:ring-1 focus:ring-blue-500
            "
          />
        </div>

        {/* ── Paid by ─────────────────────────────────── */}
        <div>
          <label htmlFor="paid-by" className="mb-1 block text-sm font-medium text-gray-700">
            Paid by <span className="text-red-500">*</span>
          </label>
          <select
            id="paid-by"
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            className="
              block w-full rounded-md border border-gray-300
              bg-white px-3 py-2 text-sm text-gray-900
              shadow-sm focus:border-blue-500 focus:outline-none
              focus:ring-1 focus:ring-blue-500
            "
          >
            <option value="" disabled>
              Select payer
            </option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.profiles.display_name || m.profiles.username}
                {m.user_id === currentUserId ? " (you)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* ── Split type ──────────────────────────────── */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">
            Split type
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SPLIT_TYPES.map((st) => (
              <button
                key={st.value}
                type="button"
                onClick={() => setSplitType(st.value)}
                className={`
                  rounded-md border px-3 py-2 text-center text-sm
                  font-medium transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  focus:ring-offset-2
                  ${
                    splitType === st.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                {st.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {SPLIT_TYPES.find((s) => s.value === splitType)?.desc}
          </p>
        </div>

        {/* ── Beneficiaries + split inputs ─────────────── */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Split between
            </p>
            <span className="text-xs text-gray-400">
              {selectedSplits.length} of {splits.length} selected
            </span>
          </div>

          <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
            {splits.map((s) => (
              <div
                key={s.user_id}
                className={`
                  flex items-center gap-3 rounded-md border
                  px-3 py-2.5 transition-colors
                  ${
                    s.selected
                      ? "border-blue-200 bg-white"
                      : "border-transparent bg-gray-50 opacity-50"
                  }
                `}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={s.selected}
                  onChange={() => toggleBeneficiary(s.user_id)}
                  className="
                    h-4 w-4 rounded border-gray-300 text-blue-600
                    focus:ring-blue-500
                  "
                />

                {/* Name */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {s.display_name}
                    {s.user_id === currentUserId && (
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    @{s.username}
                  </p>
                </div>

                {/* Split input (exact or percentage) */}
                {s.selected && splitType === "exact" && (
                  <div className="relative w-28">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={s.amount || ""}
                      placeholder="0.00"
                      onChange={(e) =>
                        updateSplitAmount(s.user_id, e.target.value)
                      }
                      className="
                        block w-full rounded-md border border-gray-300
                        bg-white py-1.5 pl-6 pr-2 text-right text-sm
                        text-gray-900 shadow-sm
                        focus:border-blue-500 focus:outline-none
                        focus:ring-1 focus:ring-blue-500
                        [appearance:textfield]
                        [&::-webkit-inner-spin-button]:appearance-none
                        [&::-webkit-outer-spin-button]:appearance-none
                      "
                    />
                  </div>
                )}

                {s.selected && splitType === "percentage" && (
                  <div className="relative w-24">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={s.percentage || ""}
                      placeholder="0"
                      onChange={(e) =>
                        updateSplitPercentage(s.user_id, e.target.value)
                      }
                      className="
                        block w-full rounded-md border border-gray-300
                        bg-white py-1.5 pl-2 pr-7 text-right text-sm
                        text-gray-900 shadow-sm
                        focus:border-blue-500 focus:outline-none
                        focus:ring-1 focus:ring-blue-500
                        [appearance:textfield]
                        [&::-webkit-inner-spin-button]:appearance-none
                        [&::-webkit-outer-spin-button]:appearance-none
                      "
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-xs text-gray-400">
                      %
                    </span>
                  </div>
                )}

                {/* Show calculated amount for equal / percentage */}
                {s.selected && splitType === "equal" && (
                  <span className="text-sm font-medium text-gray-700">
                    ${s.amount.toFixed(2)}
                  </span>
                )}

                {s.selected && splitType === "percentage" && s.amount > 0 && (
                  <span className="text-xs text-gray-400">
                    ${s.amount.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Split summary bar */}
          {totalAmount > 0 && selectedSplits.length > 0 && (
            <div
              className={`
                mt-2 flex items-center justify-between rounded-md
                px-3 py-2 text-xs font-medium
                ${
                  hasMismatch
                    ? "border border-red-200 bg-red-50 text-red-700"
                    : "border border-green-200 bg-green-50 text-green-700"
                }
              `}
            >
              <span>
                {splitType === "percentage"
                  ? `Total: ${pctSum.toFixed(1)}% of 100%`
                  : `Total: $${splitSum.toFixed(2)} of $${totalAmount.toFixed(2)}`}
              </span>
              {hasMismatch ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* ── Notes ───────────────────────────────────── */}
        <div>
          <label htmlFor="expense-notes" className="mb-1 block text-sm font-medium text-gray-700">
            Notes{" "}
            <span className="text-xs font-normal text-gray-400">
              (optional)
            </span>
          </label>
          <textarea
            id="expense-notes"
            rows={2}
            maxLength={500}
            value={notes}
            placeholder="Any extra details..."
            onChange={(e) => setNotes(e.target.value)}
            className="
              block w-full resize-none rounded-md border
              border-gray-300 bg-white px-3 py-2 text-sm
              text-gray-900 placeholder-gray-400 shadow-sm
              focus:border-blue-500 focus:outline-none
              focus:ring-1 focus:ring-blue-500
            "
          />
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="
            rounded-md border border-gray-300 bg-white px-4 py-2
            text-sm font-medium text-gray-700 shadow-sm
            transition-colors hover:bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-blue-500
            focus:ring-offset-2
            disabled:opacity-50
          "
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || hasMismatch}
          className="
            inline-flex items-center justify-center rounded-md
            bg-blue-600 px-5 py-2 text-sm font-medium text-white
            shadow-sm transition-colors hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-blue-500
            focus:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {submitting ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Saving…
            </>
          ) : (
            "Add expense"
          )}
        </button>
      </div>
    </form>
  );
}