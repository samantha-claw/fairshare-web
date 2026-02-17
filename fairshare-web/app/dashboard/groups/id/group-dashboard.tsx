"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { GroupMembersList } from "./group-members-list";
import { AddExpense } from "./add-expense";
import { SettlementDashboard } from "./settlement-dashboard";
import { ActivityLog } from "./activity-log";
import type { User } from "@supabase/supabase-js";

/* ════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════ */

interface GroupRow {
  id: string;
  name: string;
  currency: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

interface ProfileInfo {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface MemberRow {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  profiles: ProfileInfo;
}

interface ExpenseSplit {
  user_id: string;
  amount: number;
}

interface ExpenseRow {
  id: string;
  name: string;
  amount: number;
  currency: string;
  paid_by: string;
  split_type: string;
  category: string;
  notes: string | null;
  expense_date: string;
  created_by: string;
  created_at: string;
  expense_splits: ExpenseSplit[];
}

interface BalanceRow {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
}

interface SimplifiedDebt {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  amount: number;
}

type CenterTab = "overview" | "settlements" | "activity";

/* ════════════════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════════════════ */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍔",
  transport: "🚗",
  housing: "🏠",
  entertainment: "🎬",
  utilities: "💡",
  shopping: "🛍️",
  health: "🏥",
  travel: "✈️",
  education: "📚",
  other: "📦",
};

const ROLE_STYLES: Record<string, string> = {
  owner: "bg-amber-50 text-amber-700 border-amber-200",
  admin: "bg-purple-50 text-purple-700 border-purple-200",
  member: "bg-gray-50 text-gray-600 border-gray-200",
};

/* ── Simplify debts (greedy algorithm) ─────────────────── */

function simplifyDebts(
  balances: BalanceRow[],
  memberMap: Map<string, ProfileInfo>
): SimplifiedDebt[] {
  const nets = new Map<string, number>();

  for (const b of balances) {
    if (b.amount <= 0) continue;
    nets.set(b.from_user, (nets.get(b.from_user) ?? 0) - b.amount);
    nets.set(b.to_user, (nets.get(b.to_user) ?? 0) + b.amount);
  }

  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [id, net] of nets) {
    const rounded = round2(net);
    if (rounded > 0.005) creditors.push({ id, amount: rounded });
    else if (rounded < -0.005)
      debtors.push({ id, amount: Math.abs(rounded) });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const result: SimplifiedDebt[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const transfer = round2(
      Math.min(debtors[i].amount, creditors[j].amount)
    );
    if (transfer > 0) {
      const fromP = memberMap.get(debtors[i].id);
      const toP = memberMap.get(creditors[j].id);
      result.push({
        from: debtors[i].id,
        to: creditors[j].id,
        fromName:
          fromP?.display_name || fromP?.username || "Unknown",
        toName: toP?.display_name || toP?.username || "Unknown",
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

/* ════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════════════ */

/* ── Avatar ──────────────────────────────────────────────── */

function Avatar({
  url,
  name,
}: {
  url: string | null;
  name: string;
}) {
  const initials = name
    .split(/[_\s]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
      {initials || "?"}
    </div>
  );
}

/* ── Invite Member Modal ─────────────────────────────────── */

function InviteMemberModal({
  groupId,
  onClose,
  onSuccess,
}: {
  groupId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite() {
    if (!username.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const { data: profile, error: lookupErr } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", username.trim())
        .single();

      if (lookupErr || !profile) {
        setError(`No user found with username "${username.trim()}".`);
        return;
      }

      const { error: insertErr } = await supabase
        .from("group_members")
        .insert({
          group_id: groupId,
          user_id: profile.id,
          role: "member",
        });

      if (insertErr) {
        if (
          insertErr.message.includes("duplicate") ||
          insertErr.message.includes("unique")
        ) {
          setError("This user is already a member.");
        } else {
          setError(insertErr.message);
        }
        return;
      }

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to invite member."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">
          Invite Member
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Enter the username of the person to invite.
        </p>

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4">
          <label
            htmlFor="invite-username"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Username
          </label>
          <input
            id="invite-username"
            type="text"
            value={username}
            placeholder="e.g. janedoe"
            autoFocus
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            className="
              block w-full rounded-md border border-gray-300 bg-white
              px-3 py-2 text-sm text-gray-900 placeholder-gray-400
              shadow-sm focus:border-blue-500 focus:outline-none
              focus:ring-1 focus:ring-blue-500
            "
          />
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              flex-1 rounded-md border border-gray-300 bg-white px-4
              py-2 text-sm font-medium text-gray-700 shadow-sm
              transition-colors hover:bg-gray-50 disabled:opacity-50
            "
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInvite}
            disabled={loading || !username.trim()}
            className="
              flex flex-1 items-center justify-center rounded-md
              bg-blue-600 px-4 py-2 text-sm font-medium text-white
              shadow-sm transition-colors hover:bg-blue-700
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {loading ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
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
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Inviting…
              </>
            ) : (
              "Invite"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Tab Button ──────────────────────────────────────────── */

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors
        ${
          active
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }
      `}
    >
      {label}
    </button>
  );
}

/* ── Dashboard Skeleton ──────────────────────────────────── */

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
          <div className="h-5 w-5 rounded bg-gray-200" />
          <div className="space-y-1.5">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="h-3 w-24 rounded bg-gray-200" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse grid gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-gray-200"
              />
            ))}
          </div>
          <div className="space-y-3 lg:col-span-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 rounded-lg bg-gray-200"
              />
            ))}
          </div>
          <div className="space-y-3 lg:col-span-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-gray-200"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Error State ─────────────────────────────────────────── */

function ErrorState({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-5 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-5 w-5 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0
                 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-red-700">{message}</p>
      </div>
      <button
        onClick={onBack}
        className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 transition-colors hover:text-blue-500"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
        Back to dashboard
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */

export function GroupDashboard({ groupId }: { groupId: string }) {

  const router = useRouter();

  // ── Data state ──────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── UI state ────────────────────────────────────────────
  const [centerTab, setCenterTab] = useState<CenterTab>("overview");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // ── Member lookup ───────────────────────────────────────
  const memberMap = new Map<string, ProfileInfo>(
    members.map((m) => [m.user_id, m.profiles])
  );

  function getName(userId: string): string {
    const p = memberMap.get(userId);
    return p?.display_name || p?.username || "Unknown";
  }

  // ── Fetch all data ──────────────────────────────────────

  const fetchAll = useCallback(async () => {
    const [groupRes, membersRes, expensesRes, balancesRes] =
      await Promise.all([
        supabase
          .from("groups")
          .select("*")
          .eq("id", groupId)
          .single(),
        supabase
          .from("group_members")
          .select(
            "id, user_id, role, joined_at, profiles ( username, display_name, avatar_url )"
          )
          .eq("group_id", groupId)
          .order("joined_at", { ascending: true }),
        supabase
          .from("expenses")
          .select("*, expense_splits ( user_id, amount )")
          .eq("group_id", groupId)
          .order("expense_date", { ascending: false })
          .limit(50),
        supabase.from("balances").select("*").eq("group_id", groupId),
      ]);

    if (groupRes.error || !groupRes.data) {
      setError("Group not found or you don't have access.");
      return;
    }

    setGroup(groupRes.data as GroupRow);
    setMembers(
      (membersRes.data as unknown as MemberRow[]) ?? []
    );
    setExpenses(
      (expensesRes.data as unknown as ExpenseRow[]) ?? []
    );
    setBalances((balancesRes.data as BalanceRow[]) ?? []);
  }, [groupId, supabase]);

  // ── Init ────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setUser(session.user);
      await fetchAll();
      setLoading(false);
    }

    init();
  }, [fetchAll, router, supabase.auth]);

  // ── Loading / Error ─────────────────────────────────────

  if (loading) return <DashboardSkeleton />;

  if (error || !group || !user) {
    return (
      <ErrorState
        message={error ?? "Something went wrong."}
        onBack={() => router.push("/dashboard")}
      />
    );
  }

  // ── Derived data ────────────────────────────────────────

  const isOwner = user.id === group.owner_id;
  const createdDate = new Date(group.created_at).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );
  const simplifiedDebts = simplifyDebts(balances, memberMap);
  const totalExpenses = expenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );
  const allSettled = simplifiedDebts.length === 0;

  // Net balance for current user
  const myOwed = balances
    .filter((b) => b.to_user === user.id && b.amount > 0)
    .reduce((s, b) => s + Number(b.amount), 0);
  const myOwes = balances
    .filter((b) => b.from_user === user.id && b.amount > 0)
    .reduce((s, b) => s + Number(b.amount), 0);
  const myNet = round2(myOwed - myOwes);

  // Sorted members: owner → admin → member
  const ROLE_ORDER: Record<string, number> = {
    owner: 0,
    admin: 1,
    member: 2,
  };
  const sortedMembers = [...members].sort(
    (a, b) =>
      (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3)
  );

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ══════════════════════════════════════════════════
          HEADER
          ══════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Left: back + group info */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Back to dashboard"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-semibold text-gray-900 sm:text-lg">
                {group.name}
              </h1>
              <p className="text-xs text-gray-500">
                {group.currency} · {members.length} member
                {members.length !== 1 ? "s" : ""} · Created{" "}
                {createdDate}
              </p>
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2">
            {/* Add Expense */}
            <button
              type="button"
              onClick={() => {
                setCenterTab("overview");
                setShowAddExpense(true);
              }}
              className="
                inline-flex items-center gap-1.5 rounded-md bg-blue-600
                px-3 py-1.5 text-xs font-medium text-white shadow-sm
                transition-colors hover:bg-blue-700 sm:text-sm
              "
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              <span className="hidden sm:inline">Add Expense</span>
            </button>

            {/* Invite Member (owner only) */}
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="
                  inline-flex items-center gap-1.5 rounded-md border
                  border-gray-300 bg-white px-3 py-1.5 text-xs
                  font-medium text-gray-700 shadow-sm transition-colors
                  hover:bg-gray-50 sm:text-sm
                "
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375
                       3.375 0 11-6.75 0 3.375 3.375 0 016.75
                       0zM4 19.235v-.11a6.375 6.375 0 0112.75
                       0v.109A12.318 12.318 0 0110.374
                       21c-2.331 0-4.512-.645-6.374-1.766z"
                  />
                </svg>
                <span className="hidden sm:inline">Invite</span>
              </button>
            )}

            {/* Create Invoice */}
            <button
              type="button"
              onClick={() => alert("Invoice feature coming soon!")}
              className="
                inline-flex items-center gap-1.5 rounded-md border
                border-gray-300 bg-white px-3 py-1.5 text-xs
                font-medium text-gray-700 shadow-sm transition-colors
                hover:bg-gray-50 sm:text-sm
              "
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0
                     00-3.375-3.375h-1.5A1.125 1.125 0
                     0113.5 7.125v-1.5a3.375 3.375 0
                     00-3.375-3.375H8.25m2.25
                     0H5.625c-.621 0-1.125.504-1.125
                     1.125v17.25c0 .621.504 1.125 1.125
                     1.125h12.75c.621 0 1.125-.504
                     1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <span className="hidden sm:inline">Invoice</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          STATS BAR
          ══════════════════════════════════════════════════ */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-gray-200 px-4 sm:px-6">
          <div className="px-4 py-3 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Total
            </p>
            <p className="mt-0.5 text-lg font-semibold text-gray-900">
              {formatCurrency(totalExpenses, group.currency)}
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Your Balance
            </p>
            <p
              className={`mt-0.5 text-lg font-semibold ${
                myNet > 0
                  ? "text-green-600"
                  : myNet < 0
                    ? "text-red-600"
                    : "text-gray-900"
              }`}
            >
              {myNet > 0 ? "+" : ""}
              {formatCurrency(myNet, group.currency)}
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Transfers
            </p>
            <p className="mt-0.5 text-lg font-semibold text-gray-900">
              {simplifiedDebts.length}
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          3-COLUMN LAYOUT
          ══════════════════════════════════════════════════ */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* ────────────────────────────────────────────
              LEFT SIDEBAR: Members (always visible)
              ──────────────────────────────────────────── */}
          <aside className="lg:col-span-3">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-900">
                  Members
                  <span className="ml-1.5 text-xs font-normal text-gray-400">
                    ({members.length})
                  </span>
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {sortedMembers.map((m) => {
                  const p = m.profiles;
                  const displayName =
                    p.display_name || p.username;
                  const isSelf = m.user_id === user.id;

                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-gray-50"
                    >
                      <Avatar
                        url={p.avatar_url}
                        name={displayName}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {displayName}
                          {isSelf && (
                            <span className="ml-1 text-xs font-normal text-gray-400">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          @{p.username}
                        </p>
                      </div>
                      <span
                        className={`
                          rounded-full border px-2 py-0.5
                          text-[10px] font-medium capitalize
                          ${ROLE_STYLES[m.role] ?? ROLE_STYLES.member}
                        `}
                      >
                        {m.role}
                      </span>
                    </div>
                  );
                })}
              </div>

              {isOwner && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(true)}
                    className="
                      flex w-full items-center justify-center gap-1.5
                      rounded-md border border-dashed border-gray-300
                      px-3 py-2 text-xs font-medium text-gray-500
                      transition-colors hover:border-blue-400
                      hover:text-blue-600
                    "
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    Invite member
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* ────────────────────────────────────────────
              CENTER: Tabbed content area
              ──────────────────────────────────────────── */}
          <section className="lg:col-span-6">
            {/* Tab navigation */}
            <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
              <TabButton
                label="Overview"
                active={centerTab === "overview"}
                onClick={() => setCenterTab("overview")}
              />
              <TabButton
                label="Settlements"
                active={centerTab === "settlements"}
                onClick={() => setCenterTab("settlements")}
              />
              <TabButton
                label="Activity"
                active={centerTab === "activity"}
                onClick={() => setCenterTab("activity")}
              />
            </div>

            {/* ── Overview tab ────────────────────────── */}
            {centerTab === "overview" && (
              <>
                {/* Add Expense form (toggled) */}
                {showAddExpense ? (
                  <div className="mb-6">
                    <AddExpense
                      groupId={groupId}
                      groupCurrency={group.currency}
                      onSuccess={() => {
                        setShowAddExpense(false);
                        fetchAll();
                      }}
                      onCancel={() => setShowAddExpense(false)}
                    />
                  </div>
                ) : (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => setShowAddExpense(true)}
                      className="
                        inline-flex items-center gap-2 rounded-md
                        bg-blue-600 px-4 py-2 text-sm font-medium
                        text-white shadow-sm transition-colors
                        hover:bg-blue-700 focus:outline-none
                        focus:ring-2 focus:ring-blue-500
                        focus:ring-offset-2
                      "
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                      Add expense
                    </button>
                  </div>
                )}

                {/* Expenses list */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Expenses
                      <span className="ml-1.5 text-xs font-normal text-gray-400">
                        ({expenses.length})
                      </span>
                    </h3>
                  </div>

                  {expenses.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 18.75a60.07 60.07 0
                               0115.797 2.101c.727.198
                               1.453-.342
                               1.453-1.096V18.75M3.75
                               4.5v.75A.75.75 0 013
                               6h-.75m0 0v-.375c0-.621.504-1.125
                               1.125-1.125H20.25M2.25
                               6v9m18-10.5v.75c0
                               .414.336.75.75.75h.75m-1.5-1.5h.375c.621
                               0 1.125.504 1.125
                               1.125v9.75c0 .621-.504
                               1.125-1.125
                               1.125h-.375m1.5-1.5H21a.75.75
                               0 00-.75.75v.75m0
                               0H3.75m0 0h-.375a1.125 1.125
                               0 01-1.125-1.125V15m1.5
                               1.5v-.75A.75.75 0 003
                               15h-.75M15 10.5a3 3 0
                               11-6 0 3 3 0 016 0zm3
                               0h.008v.008H18V10.5zm-12
                               0h.008v.008H6V10.5z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">
                        No expenses yet.
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Add your first expense to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {expenses.map((exp) => {
                        const payerName = getName(exp.paid_by);
                        const splitCount =
                          exp.expense_splits?.length ?? 0;
                        const emoji =
                          CATEGORY_EMOJI[exp.category] ?? "📦";

                        return (
                          <div
                            key={exp.id}
                            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                          >
                            {/* Category icon */}
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-base">
                              {emoji}
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {exp.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Paid by{" "}
                                <span className="font-medium text-gray-700">
                                  {payerName}
                                </span>
                                {" · "}
                                {exp.split_type} · {splitCount}{" "}
                                member
                                {splitCount !== 1 ? "s" : ""}
                              </p>
                            </div>

                            {/* Amount + date */}
                            <div className="flex-shrink-0 text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {formatCurrency(
                                  Number(exp.amount),
                                  exp.currency
                                )}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(exp.expense_date)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Members list (detailed, with add/remove) */}
                <div className="mt-6">
                  <GroupMembersList groupId={groupId} />
                </div>
              </>
            )}

            {/* ── Settlements tab ─────────────────────── */}
            {centerTab === "settlements" && (
              <SettlementDashboard
                groupId={groupId}
                groupCurrency={group.currency}
              />
            )}

            {/* ── Activity tab ────────────────────────── */}
            {centerTab === "activity" && (
              <ActivityLog
                groupId={groupId}
                groupCurrency={group.currency}
              />
            )}
          </section>

          {/* ────────────────────────────────────────────
              RIGHT SIDEBAR: Settlement Summary
              ──────────────────────────────────────────── */}
          <aside className="lg:col-span-3">
            {/* Settlement summary card */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-900">
                  Settlement Summary
                </h2>
              </div>

              {allSettled ? (
                <div className="px-4 py-6 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <svg
                      className="h-5 w-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15
                           9.75M21 12a9 9 0 11-18
                           0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-green-800">
                    All settled! 🎉
                  </p>
                  <p className="mt-1 text-xs text-green-600">
                    No outstanding balances.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {simplifiedDebts.map((debt, idx) => (
                    <div
                      key={`${debt.from}-${debt.to}-${idx}`}
                      className="px-4 py-3"
                    >
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-medium text-red-700">
                          {debt.fromName}
                        </span>
                        <svg
                          className="h-3.5 w-3.5 flex-shrink-0 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5L21 12m0
                               0l-7.5 7.5M21 12H3"
                          />
                        </svg>
                        <span className="font-medium text-green-700">
                          {debt.toName}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-gray-900">
                        {formatCurrency(
                          debt.amount,
                          group.currency
                        )}
                      </p>
                    </div>
                  ))}

                  {/* Summary footer */}
                  <div className="bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">
                        {simplifiedDebts.length}
                      </span>{" "}
                      transfer
                      {simplifiedDebts.length !== 1 ? "s" : ""}{" "}
                      needed
                    </p>
                    <button
                      type="button"
                      onClick={() => setCenterTab("settlements")}
                      className="mt-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-500"
                    >
                      View details →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Invoice placeholder card */}
            <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center">
              <svg
                className="mx-auto h-8 w-8 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0
                     00-3.375-3.375h-1.5A1.125 1.125 0
                     0113.5 7.125v-1.5a3.375 3.375 0
                     00-3.375-3.375H8.25m2.25
                     0H5.625c-.621 0-1.125.504-1.125
                     1.125v17.25c0 .621.504 1.125 1.125
                     1.125h12.75c.621 0 1.125-.504
                     1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <p className="mt-2 text-xs font-medium text-gray-500">
                Create Invoice
              </p>
              <p className="mt-0.5 text-[10px] text-gray-400">
                Coming soon
              </p>
            </div>

            {/* Group description */}
            {group.description && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  About
                </h3>
                <p className="text-sm text-gray-600">
                  {group.description}
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════
          MODALS
          ══════════════════════════════════════════════════ */}

      {showInviteModal && (
        <InviteMemberModal
          groupId={groupId}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}