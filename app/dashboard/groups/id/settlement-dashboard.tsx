"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

interface MemberProfile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface MemberInfo {
  user_id: string;
  profiles: MemberProfile;
}

interface BalanceRow {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
}

interface SettlementRow {
  id: string;
  from_user: string;
  to_user: string;
  amount: number;
  notes: string | null;
  settled_at: string;
  created_by: string;
}

interface NetBalance {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  net: number; // positive = owed money (creditor), negative = owes money (debtor)
}

interface SimplifiedDebt {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  amount: number;
}

interface SettlementModalData {
  from_user: string;
  to_user: string;
  fromName: string;
  toName: string;
  maxAmount: number;
}

interface SettlementDashboardProps {
  groupId: string;
  groupCurrency: string;
}

/* ────────────────────────────────────────────────────────────
   Utilities
   ──────────────────────────────────────────────────────────── */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ────────────────────────────────────────────────────────────
   Simplify debts — greedy algorithm
   
   1. Compute net balance for every user (credit − debit)
   2. Separate into creditors (net > 0) and debtors (net < 0)
   3. Sort both by absolute value descending
   4. Match largest debtor with largest creditor, transfer
      min(|debtor|, creditor), reduce both, repeat
   ──────────────────────────────────────────────────────────── */

function simplifyDebts(
  balances: BalanceRow[],
  memberMap: Map<string, { username: string; display_name: string }>
): SimplifiedDebt[] {
  // Net per user
  const nets = new Map<string, number>();

  for (const b of balances) {
    if (b.amount <= 0) continue;
    nets.set(b.from_user, (nets.get(b.from_user) ?? 0) - b.amount);
    nets.set(b.to_user, (nets.get(b.to_user) ?? 0) + b.amount);
  }

  // Separate
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [id, net] of nets) {
    const rounded = round2(net);
    if (rounded > 0.005) creditors.push({ id, amount: rounded });
    else if (rounded < -0.005) debtors.push({ id, amount: Math.abs(rounded) });
  }

  // Sort descending
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const result: SimplifiedDebt[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const transfer = round2(Math.min(debtors[i].amount, creditors[j].amount));

    if (transfer > 0) {
      const fromInfo = memberMap.get(debtors[i].id);
      const toInfo = memberMap.get(creditors[j].id);

      result.push({
        from: debtors[i].id,
        to: creditors[j].id,
        fromName: fromInfo?.display_name || fromInfo?.username || "Unknown",
        toName: toInfo?.display_name || toInfo?.username || "Unknown",
        amount: transfer,
      });
    }

    debtors[i].amount = round2(debtors[i].amount - transfer);
    creditors[j].amount = round2(creditors[j].amount - transfer);

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return result;
}

/* ────────────────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────────────────── */

function Avatar({
  url,
  name,
  size = "sm",
}: {
  url: string | null;
  name: string;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "h-10 w-10" : "h-8 w-8";
  const textSize = size === "md" ? "text-sm" : "text-xs";
  const initials = name
    .split(/[_\s]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (url) {
    return (
      <img src={url} alt={name} className={`${dim} rounded-full object-cover`} />
    );
  }

  return (
    <div
      className={`${dim} flex items-center justify-center rounded-full bg-blue-100 ${textSize} font-semibold text-blue-700`}
    >
      {initials || "?"}
    </div>
  );
}

/* ── Settlement Modal ────────────────────────────────────── */

interface SettleModalProps {
  data: SettlementModalData;
  currency: string;
  loading: boolean;
  onConfirm: (amount: number, notes: string) => void;
  onCancel: () => void;
}

function SettleModal({
  data,
  currency,
  loading,
  onConfirm,
  onCancel,
}: SettleModalProps) {
  const [amount, setAmount] = useState(data.maxAmount.toFixed(2));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    if (val > data.maxAmount) {
      setError(`Amount cannot exceed ${formatCurrency(data.maxAmount, currency)}.`);
      return;
    }
    setError(null);
    onConfirm(round2(val), notes.trim());
  }

  const isPartial = parseFloat(amount) > 0 && parseFloat(amount) < data.maxAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">
            Record Settlement
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            <strong>{data.fromName}</strong> pays{" "}
            <strong>{data.toName}</strong>
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Amount */}
          <div>
            <label
              htmlFor="settle-amount"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Amount ({currency})
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-400">
                $
              </span>
              <input
                id="settle-amount"
                type="number"
                min="0.01"
                max={data.maxAmount}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="
                  block w-full rounded-md border border-gray-300
                  bg-white py-2 pl-7 pr-3 text-sm text-gray-900
                  shadow-sm focus:border-blue-500 focus:outline-none
                  focus:ring-1 focus:ring-blue-500
                  [appearance:textfield]
                  [&::-webkit-inner-spin-button]:appearance-none
                  [&::-webkit-outer-spin-button]:appearance-none
                "
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Outstanding: {formatCurrency(data.maxAmount, currency)}
            </p>
          </div>

          {/* Partial badge */}
          {isPartial && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              This is a partial payment. The remaining balance will stay open.
            </div>
          )}

          {/* Notes */}
          <div>
            <label
              htmlFor="settle-notes"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Notes{" "}
              <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="settle-notes"
              type="text"
              maxLength={200}
              value={notes}
              placeholder='e.g. "Venmo transfer"'
              onChange={(e) => setNotes(e.target.value)}
              className="
                block w-full rounded-md border border-gray-300
                bg-white px-3 py-2 text-sm text-gray-900
                placeholder-gray-400 shadow-sm
                focus:border-blue-500 focus:outline-none
                focus:ring-1 focus:ring-blue-500
              "
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              rounded-md border border-gray-300 bg-white px-4 py-2
              text-sm font-medium text-gray-700 shadow-sm
              transition-colors hover:bg-gray-50
              disabled:opacity-50
            "
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="
              inline-flex items-center justify-center rounded-md
              bg-green-600 px-5 py-2 text-sm font-medium text-white
              shadow-sm transition-colors hover:bg-green-700
              focus:outline-none focus:ring-2 focus:ring-green-500
              focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {loading ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Recording…
              </>
            ) : (
              "Confirm payment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────── */

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-6 w-48 rounded bg-gray-200" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-lg border border-gray-200 bg-white" />
        ))}
      </div>
      <div className="h-6 w-40 rounded bg-gray-200" />
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 rounded-lg border border-gray-200 bg-white" />
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────────────────── */

export function SettlementDashboard({
  groupId,
  groupCurrency,
}: SettlementDashboardProps) {

  // ── State ───────────────────────────────────────────────
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Modal state ─────────────────────────────────────────
  const [settleModal, setSettleModal] = useState<SettlementModalData | null>(null);
  const [settleLoading, setSettleLoading] = useState(false);

  // ── Member lookup map ───────────────────────────────────
  const memberMap = new Map(
    members.map((m) => [
      m.user_id,
      {
        username: m.profiles.username,
        display_name: m.profiles.display_name || m.profiles.username,
        avatar_url: m.profiles.avatar_url,
      },
    ])
  );

  // ── Fetch all data ──────────────────────────────────────

  const fetchData = useCallback(async () => {
    const [membersRes, balancesRes, settlementsRes] = await Promise.all([
      supabase
        .from("group_members")
        .select("user_id, profiles ( username, display_name, avatar_url )")
        .eq("group_id", groupId),
      supabase
        .from("balances")
        .select("*")
        .eq("group_id", groupId),
      supabase
        .from("settlements")
        .select("*")
        .eq("group_id", groupId)
        .order("settled_at", { ascending: false })
        .limit(20),
    ]);

    if (membersRes.error) {
      setFetchError(membersRes.error.message);
      return;
    }

    setMembers((membersRes.data as unknown as MemberInfo[]) ?? []);
    setBalances((balancesRes.data as BalanceRow[]) ?? []);
    setSettlements((settlementsRes.data as SettlementRow[]) ?? []);
  }, [groupId, supabase]);

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) setCurrentUserId(session.user.id);

      await fetchData();
      setLoading(false);
    }
    init();
  }, [fetchData, supabase.auth]);

  // ── Compute net balances ────────────────────────────────

  const netBalances: NetBalance[] = members.map((m) => {
    const owed = balances
      .filter((b) => b.to_user === m.user_id && b.amount > 0)
      .reduce((sum, b) => sum + Number(b.amount), 0);

    const owes = balances
      .filter((b) => b.from_user === m.user_id && b.amount > 0)
      .reduce((sum, b) => sum + Number(b.amount), 0);

    const info = memberMap.get(m.user_id);

    return {
      user_id: m.user_id,
      username: info?.username ?? "unknown",
      display_name: info?.display_name ?? "Unknown",
      avatar_url: info?.avatar_url ?? null,
      net: round2(owed - owes),
    };
  });

  // Sort: largest debtor first, then largest creditor
  const sortedBalances = [...netBalances].sort((a, b) => a.net - b.net);

  // ── Simplified debts ───────────────────────────────────

  const simplifiedDebts = simplifyDebts(balances, memberMap as Map<string, { username: string; display_name: string }>);

  // ── Settle handler ──────────────────────────────────────

  async function handleSettle(amount: number, notes: string) {
    if (!settleModal || !currentUserId) return;
    setSettleLoading(true);

    try {
      const { error: insertErr } = await supabase
        .from("settlements")
        .insert({
          group_id: groupId,
          from_user: settleModal.from_user,
          to_user: settleModal.to_user,
          amount,
          notes: notes || null,
          created_by: currentUserId,
        });

      if (insertErr) {
        alert(insertErr.message);
        return;
      }

      // Optimistic update: reduce local balance
      setBalances((prev) =>
        prev.map((b) => {
          if (
            b.group_id === groupId &&
            b.from_user === settleModal.from_user &&
            b.to_user === settleModal.to_user
          ) {
            return { ...b, amount: round2(Math.max(Number(b.amount) - amount, 0)) };
          }
          return b;
        })
      );

      // Add to local settlements
      setSettlements((prev) => [
        {
          id: crypto.randomUUID(),
          from_user: settleModal.from_user,
          to_user: settleModal.to_user,
          amount,
          notes: notes || null,
          settled_at: new Date().toISOString(),
          created_by: currentUserId,
        },
        ...prev,
      ]);

      setSettleModal(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Settlement failed.");
    } finally {
      setSettleLoading(false);
    }
  }

  // ── Loading / Error ─────────────────────────────────────

  if (loading) return <DashboardSkeleton />;

  if (fetchError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {fetchError}
      </div>
    );
  }

  const allSettled = simplifiedDebts.length === 0;

  // ── Render ──────────────────────────────────────────────

  return (
    <section className="space-y-8">
      {/* ════════════════════════════════════════════════════
          1. NET BALANCES
          ════════════════════════════════════════════════════ */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Net Balances
        </h2>

        {allSettled ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-6 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-green-800">All settled up! 🎉</p>
            <p className="mt-1 text-xs text-green-600">No outstanding balances in this group.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sortedBalances.map((nb) => {
              const isCreditor = nb.net > 0;
              const isDebtor = nb.net < 0;
              const isSettled = Math.abs(nb.net) < 0.01;
              const isSelf = nb.user_id === currentUserId;

              return (
                <div
                  key={nb.user_id}
                  className={`
                    flex items-center gap-3 rounded-lg border px-4 py-3
                    ${isSettled
                      ? "border-gray-200 bg-gray-50"
                      : isCreditor
                        ? "border-green-200 bg-green-50/50"
                        : "border-red-200 bg-red-50/50"
                    }
                  `}
                >
                  <Avatar url={nb.avatar_url} name={nb.display_name} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {nb.display_name}
                      {isSelf && (
                        <span className="ml-1 text-xs font-normal text-gray-400">(you)</span>
                      )}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        isSettled
                          ? "text-gray-500"
                          : isCreditor
                            ? "text-green-700"
                            : "text-red-700"
                      }`}
                    >
                      {isSettled
                        ? "Settled up"
                        : isCreditor
                          ? `gets back ${formatCurrency(nb.net, groupCurrency)}`
                          : `owes ${formatCurrency(nb.net, groupCurrency)}`}
                    </p>
                  </div>

                  {/* Net amount badge */}
                  {!isSettled && (
                    <span
                      className={`
                        rounded-full px-2.5 py-0.5 text-xs font-semibold
                        ${isCreditor
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                        }
                      `}
                    >
                      {isCreditor ? "+" : "-"}
                      {formatCurrency(nb.net, groupCurrency)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          2. SIMPLIFIED TRANSACTIONS
          ════════════════════════════════════════════════════ */}
      {!allSettled && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Simplified Transactions
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Minimum transfers needed to settle all debts
              </p>
            </div>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {simplifiedDebts.length} transfer{simplifiedDebts.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-2">
            {simplifiedDebts.map((debt, idx) => {
              const fromInfo = memberMap.get(debt.from);
              const toInfo = memberMap.get(debt.to);

              return (
                <div
                  key={`${debt.from}-${debt.to}-${idx}`}
                  className="
                    flex flex-col gap-3 rounded-lg border border-gray-200
                    bg-white p-4 transition-shadow hover:shadow-sm
                    sm:flex-row sm:items-center
                  "
                >
                  {/* From → To */}
                  <div className="flex flex-1 items-center gap-2">
                    <Avatar
                      url={fromInfo?.avatar_url ?? null}
                      name={debt.fromName}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {debt.fromName}
                    </span>

                    <svg
                      className="h-4 w-4 flex-shrink-0 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>

                    <Avatar
                      url={toInfo?.avatar_url ?? null}
                      name={debt.toName}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {debt.toName}
                    </span>
                  </div>

                  {/* Amount + settle button */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(debt.amount, groupCurrency)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSettleModal({
                          from_user: debt.from,
                          to_user: debt.to,
                          fromName: debt.fromName,
                          toName: debt.toName,
                          maxAmount: debt.amount,
                        })
                      }
                      className="
                        inline-flex items-center gap-1 rounded-md
                        bg-green-600 px-3 py-1.5 text-xs font-medium
                        text-white shadow-sm transition-colors
                        hover:bg-green-700
                        focus:outline-none focus:ring-2
                        focus:ring-green-500 focus:ring-offset-2
                      "
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Settle
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          3. RECENT SETTLEMENTS
          ════════════════════════════════════════════════════ */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Recent Settlements
        </h2>

        {settlements.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white py-6 text-center">
            <p className="text-sm text-gray-500">No settlements recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {settlements.map((s) => {
              const fromInfo = memberMap.get(s.from_user);
              const toInfo = memberMap.get(s.to_user);

              return (
                <div
                  key={s.id}
                  className="
                    flex flex-col gap-2 rounded-lg border border-gray-200
                    bg-white px-4 py-3 sm:flex-row sm:items-center
                  "
                >
                  <div className="flex flex-1 items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-gray-900">
                        <strong>{fromInfo?.display_name ?? "Unknown"}</strong>
                        {" paid "}
                        <strong>{toInfo?.display_name ?? "Unknown"}</strong>
                      </p>
                      {s.notes && (
                        <p className="truncate text-xs text-gray-500">{s.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:ml-auto">
                    <span className="text-sm font-semibold text-green-700">
                      {formatCurrency(s.amount, groupCurrency)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {timeAgo(s.settled_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          SETTLEMENT MODAL
          ════════════════════════════════════════════════════ */}
      {settleModal && (
        <SettleModal
          data={settleModal}
          currency={groupCurrency}
          loading={settleLoading}
          onConfirm={handleSettle}
          onCancel={() => setSettleModal(null)}
        />
      )}
    </section>
  );
}