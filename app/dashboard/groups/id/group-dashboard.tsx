"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { GroupMembersList } from "./group-members-list";
import { AddExpense } from "./add-expense";
import { SettlementDashboard } from "./settlement-dashboard";
import { ActivityLog } from "./activity-log";
import type { User } from "@supabase/supabase-js";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

interface GroupRow {
  id: string;
  name: string;
  currency: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

type TabKey = "overview" | "settlements" | "activity";

/* ────────────────────────────────────────────────────────────
   Loading skeleton
   ──────────────────────────────────────────────────────────── */

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="h-5 w-5 rounded bg-gray-200" />
          <div className="space-y-1.5">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="h-3 w-16 rounded bg-gray-200" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-full rounded-lg bg-gray-200" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-lg border border-gray-200 bg-white"
              />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg border border-gray-200 bg-white"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Error state
   ──────────────────────────────────────────────────────────── */

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

/* ────────────────────────────────────────────────────────────
   Tab button
   ──────────────────────────────────────────────────────────── */

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

/* ────────────────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────────────────── */

export function GroupDashboard({ groupId }: { groupId: string }) {
  // ── Data state ──────────────────────────────────────────
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── UI state ────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [showAddExpense, setShowAddExpense] = useState(false);

  const router = useRouter();


  /* ── Load session + group ────────────────────────────── */

  useEffect(() => {
    async function load() {
      // 1. Auth check
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setUser(session.user);

      // 2. Fetch group (RLS enforces membership)
      const { data, error: fetchError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (fetchError || !data) {
        setError("Group not found or you don't have access.");
        setLoading(false);
        return;
      }

      setGroup(data as GroupRow);
      setLoading(false);
    }

    load();
  }, [groupId, router, supabase]);

  /* ── Loading ─────────────────────────────────────────── */

  if (loading) return <DashboardSkeleton />;

  /* ── Error ───────────────────────────────────────────── */

  if (error || !group) {
    return (
      <ErrorState
        message={error ?? "Something went wrong."}
        onBack={() => router.push("/dashboard")}
      />
    );
  }

  /* ── Derived ─────────────────────────────────────────── */

  const isOwner = user?.id === group.owner_id;
  const createdDate = new Date(group.created_at).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  /* ── Render ──────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ══════════════════════════════════════════════════
          HEADER
          ══════════════════════════════════════════════════ */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Left: back + group info */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-400 transition-colors hover:text-gray-600"
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
              <h1 className="text-lg font-semibold text-gray-900">
                {group.name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{group.currency}</span>
                <span className="text-gray-300">·</span>
                <span>Created {createdDate}</span>
              </div>
            </div>
          </div>

          {/* Right: role badge */}
          {isOwner ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              Owner
            </span>
          ) : (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              Member
            </span>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          MAIN CONTENT
          ══════════════════════════════════════════════════ */}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Description */}
        {group.description && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-white px-5 py-4">
            <p className="text-sm text-gray-600">{group.description}</p>
          </div>
        )}

        {/* ── Tab navigation ──────────────────────────── */}
        <div className="mb-8 flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
          <TabButton
            label="Overview"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <TabButton
            label="Settlements"
            active={activeTab === "settlements"}
            onClick={() => setActiveTab("settlements")}
          />
          <TabButton
            label="Activity"
            active={activeTab === "activity"}
            onClick={() => setActiveTab("activity")}
          />
        </div>

        {/* ── Tab content ─────────────────────────────── */}

        {activeTab === "overview" && (
          <>
            {/* ── Stats row ───────────────────────────── */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Total Expenses", value: "$0.00" },
                { label: "Your Balance", value: "$0.00" },
                { label: "Members", value: "—" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Add Expense ─────────────────────────── */}
            {!showAddExpense ? (
              <div className="mb-8">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(true)}
                  className="
                    inline-flex items-center gap-2 rounded-md bg-blue-600
                    px-4 py-2 text-sm font-medium text-white shadow-sm
                    transition-colors hover:bg-blue-700
                    focus:outline-none focus:ring-2 focus:ring-blue-500
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
            ) : (
              <div className="mb-8">
                <AddExpense
                  groupId={groupId}
                  groupCurrency={group.currency}
                  onSuccess={() => {
                    setShowAddExpense(false);
                    // TODO: refresh expenses list when built
                  }}
                  onCancel={() => setShowAddExpense(false)}
                />
              </div>
            )}

            {/* ── Members list ────────────────────────── */}
            <div className="mb-10">
              <GroupMembersList groupId={groupId} />
            </div>
          </>
        )}

        {activeTab === "settlements" && (
          <SettlementDashboard
            groupId={groupId}
            groupCurrency={group.currency}
          />
        )}

        {activeTab === "activity" && (
          <ActivityLog
            groupId={groupId}
            groupCurrency={group.currency}
          />
        )}
      </main>
    </div>
  );
}