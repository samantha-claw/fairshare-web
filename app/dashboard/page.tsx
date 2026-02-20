"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Users,
  Home,
  UserPlus,
  LogOut,
  FolderOpen,
  ArrowRight,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════
   INTERFACES
   ════════════════════════════════════════════════════════════ */

interface Profile {
  display_name: string;
  avatar_url: string;
}

interface GroupBalance {
  group_id: string;
  group_name: string;
  currency: string;
  net_balance: number;
  owner_id: string;
}

/* ════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════ */

function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  };

  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=dbeafe&color=1d4ed8&bold=true&size=80`;

  return (
    <img
      src={src || fallback}
      alt={name}
      className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-white shadow-sm`}
    />
  );
}

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

/* ════════════════════════════════════════════════════════════
   SKELETON
   ════════════════════════════════════════════════════════════ */

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="h-7 w-28 animate-pulse rounded bg-gray-200" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            <div className="hidden h-8 w-8 animate-pulse rounded-full bg-gray-200 sm:block" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 space-y-2">
          <div className="h-8 w-72 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-56 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-white shadow-sm" />
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border border-gray-200 bg-white shadow-sm" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  /* ── State ───────────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroups] = useState<GroupBalance[]>([]);

  /* ── Derived ─────────────────────────────────────────── */
  const totalOwedToMe = groups.reduce((sum, g) => (g.net_balance > 0 ? sum + g.net_balance : sum), 0);
  const totalIOwe = groups.reduce((sum, g) => (g.net_balance < 0 ? sum + Math.abs(g.net_balance) : sum), 0);
  const totalNet = totalOwedToMe - totalIOwe;

  const displayName = profile?.display_name || "User";
  const avatarUrl = profile?.avatar_url || "";

  /* ── Fetch ───────────────────────────────────────────── */
  const fetchDashboard = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setUserId(session.user.id);

      // 1. Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        setProfile({
          display_name: profileData.display_name || session.user.email?.split("@")[0] || "User",
          avatar_url: profileData.avatar_url || "",
        });
      }

      //--groups 
  const { data: groupsData } = await supabase
    .from("group_members")
    .select(`
      group_id,
      groups (
        id,
        name,
        created_at,
        owner_id
      )
    `)
    .eq("user_id", userId);



      // 2. Dashboard balances via RPC
      const { data: balancesData, error: balancesError } = await supabase.rpc(
        "get_user_dashboard_balances",
        { _user_id: session.user.id }
      );

      if (balancesError) {
        console.error("Failed to fetch balances:", balancesError);
      }

      if (balancesData) {
        const formattedData = (balancesData as any[]).map((g) => ({
          ...g,
          net_balance: Number(g.net_balance) || 0,
        }));
        setGroups(formattedData as GroupBalance[]);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  /* ── Sign out ────────────────────────────────────────── */
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  /* ── Loading ─────────────────────────────────────────── */
  if (loading) return <DashboardSkeleton />;

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* ── Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight text-blue-600">
            FairShare
          </Link>

          <div className="flex items-center gap-3">
            {/* Friends (desktop) */}
            <Link
              href="/dashboard/friends"
              className="hidden rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-blue-600 sm:block"
              title="Friends"
            >
              <Users className="h-5 w-5" />
            </Link>

            {/* Profile link */}
            <Link
              href="/dashboard/profile"
              className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-gray-100"
            >
              <Avatar src={avatarUrl} name={displayName} size="md" />
              <span className="hidden text-sm font-medium text-gray-700 sm:block">{displayName}</span>
            </Link>

            {/* Sign out (desktop) */}
            <button
              onClick={handleSignOut}
              className="hidden items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 sm:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 py-10">
        {/* ── Welcome ──────────────────────────────────── */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Welcome back, {displayName} 👋
          </h2>
          <p className="mt-1 text-sm text-gray-500">Manage your groups and shared expenses.</p>
        </div>

        {/* ── Summary Cards ────────────────────────────── */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {/* Total Balance */}
          <div
            className={`relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm ${
              totalNet > 0
                ? "border-green-200"
                : totalNet < 0
                  ? "border-red-200"
                  : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  totalNet > 0
                    ? "bg-green-100 text-green-600"
                    : totalNet < 0
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-500"
                }`}
              >
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total Balance
                </p>
                <p
                  className={`text-xl font-bold ${
                    totalNet > 0
                      ? "text-green-600"
                      : totalNet < 0
                        ? "text-red-600"
                        : "text-gray-900"
                  }`}
                >
                  {totalNet > 0 && "+"}
                  {totalNet < 0 && "-"}
                  {formatCurrency(totalNet)}
                </p>
              </div>
            </div>
            <div
              className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 ${
                totalNet > 0 ? "bg-green-500" : totalNet < 0 ? "bg-red-500" : "bg-gray-400"
              }`}
            />
          </div>

          {/* You are owed */}
          <div className="relative overflow-hidden rounded-xl border border-green-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  You are owed
                </p>
                <p className="text-xl font-bold text-green-600">+{formatCurrency(totalOwedToMe)}</p>
              </div>
            </div>
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-green-500 opacity-10" />
          </div>

          {/* You owe */}
          <div className="relative overflow-hidden rounded-xl border border-red-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">You owe</p>
                <p className="text-xl font-bold text-red-600">-{formatCurrency(totalIOwe)}</p>
              </div>
            </div>
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-red-500 opacity-10" />
          </div>
        </div>

        {/* ── Quick Actions ────────────────────────────── */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard/groups/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Group
          </Link>
          <Link
            href="/dashboard/friends"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <UserPlus className="h-4 w-4" />
            Add Friend
          </Link>
        </div>

        {/* ── Groups List ──────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Your Groups</h3>
          {groups.length > 0 && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {groups.length} group{groups.length !== 1 && "s"}
            </span>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <FolderOpen className="h-8 w-8 text-blue-400" />
            </div>
            <h4 className="text-base font-semibold text-gray-900">No groups yet</h4>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
              Create your first group to start tracking shared expenses with friends.
            </p>
            <Link
              href="/dashboard/groups/new"
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create your first group
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Link
                key={group.group_id}
                href={`/dashboard/groups/${group.group_id}`}
                className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-lg font-bold text-blue-600">
                      {group.group_name.charAt(0).toUpperCase()}
                    </div>
                    {group.owner_id === userId && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        Owner
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                    {group.group_name}
                  </h3>

                  <div className="mt-2">
                    {group.net_balance > 0 ? (
                      <div className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                        <TrendingUp className="h-3 w-3" />
                        Gets back {formatCurrency(group.net_balance, group.currency || "USD")}
                      </div>
                    ) : group.net_balance < 0 ? (
                      <div className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
                        <TrendingDown className="h-3 w-3" />
                        Owes {formatCurrency(group.net_balance, group.currency || "USD")}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-500 ring-1 ring-inset ring-gray-500/10">
                        <Wallet className="h-3 w-3" />
                        Settled up
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="text-xs text-gray-400">{group.currency || "USD"}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                    View details <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* ── Mobile Bottom Navigation ──────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-safe md:hidden">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
          <Link
            href="/dashboard"
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-blue-600"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Home</span>
          </Link>

          <Link
            href="/dashboard/friends"
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-gray-500 transition-colors hover:text-blue-600"
          >
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium">Friends</span>
          </Link>

          <Link
            href="/dashboard/groups/new"
            className="flex flex-col items-center justify-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105">
              <Plus className="h-6 w-6" />
            </div>
          </Link>

          <Link
            href="/dashboard/profile"
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-gray-500 transition-colors hover:text-blue-600"
          >
            <Avatar src={avatarUrl} name={displayName} size="sm" />
            <span className="text-xs font-medium">Profile</span>
          </Link>

          <button
            onClick={handleSignOut}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-gray-500 transition-colors hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-xs font-medium">Sign out</span>
          </button>
        </div>
      </nav>
    </div>
  );
}