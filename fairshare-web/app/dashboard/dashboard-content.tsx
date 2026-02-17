"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/* ─── Placeholder card (reused for each feature block) ─── */

interface PlaceholderCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

function PlaceholderCard({ title, description, icon }: PlaceholderCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

/* ─── Skeleton loader (shown while session is checked) ─── */

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-4 w-72 rounded bg-gray-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 rounded-lg border border-gray-200 bg-white"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main dashboard ────────────────────────────────────── */

export function DashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  /* ── Check session on mount ────────────────────────────── */

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setUser(session.user);
      setChecking(false);
    }

    checkSession();
  }, [router, supabase.auth]);

  /* ── Sign out handler ──────────────────────────────────── */

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  /* ── Loading state ─────────────────────────────────────── */

  if (checking) return <DashboardSkeleton />;

  /* ── Authenticated view ────────────────────────────────── */

  const displayName =
    user?.email?.split("@")[0] ?? "User";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top nav ─────────────────────────────────────── */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-gray-900">
            FairShare
          </h2>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-500 sm:inline">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="
                rounded-md border border-gray-300 bg-white px-3 py-1.5
                text-sm font-medium text-gray-700 shadow-sm
                transition-colors hover:bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-blue-500
                focus:ring-offset-2
              "
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Welcome back, {displayName} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s an overview of your financial collaborations.
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Groups", value: "0" },
            { label: "Friends", value: "0" },
            { label: "Pending", value: "0" },
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

        {/* Feature placeholders */}
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick actions
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PlaceholderCard
            title="My Groups"
            description="Create or join expense-sharing groups with friends."
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            }
          />
          <PlaceholderCard
            title="Ledger"
            description="Track shared expenses, splits, and balances in real time."
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <PlaceholderCard
            title="Friends"
            description="Manage your connections and send friend requests."
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            }
          />
        </div>
      </main>
    </div>
  );
}