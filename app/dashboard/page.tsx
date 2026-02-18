import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

interface GroupData {
  id: string;
  name: string;
  currency: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

interface MembershipRow {
  group_id: string;
  role: string;
  groups: GroupData;
}

/* ────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const supabase = createClient();

  // ── Auth guard ──────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ── Fetch groups where user is a member ─────────────────
  const { data: memberships, error: fetchError } = await supabase
    .from("group_members")
    .select(
      `
      group_id,
      role,
      groups (
        id,
        name,
        currency,
        description,
        owner_id,
        created_at
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", {
      referencedTable: "groups",
      ascending: false,
    });

  const groups = (memberships as unknown as MembershipRow[]) ?? [];

  // ── Fetch member counts per group ───────────────────────
  const groupIds = groups.map((g) => g.group_id);
  const memberCounts = new Map<string, number>();

  if (groupIds.length > 0) {
    const { data: allMembers } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", groupIds);

    if (allMembers) {
      for (const row of allMembers) {
        memberCounts.set(
          row.group_id,
          (memberCounts.get(row.group_id) ?? 0) + 1
        );
      }
    }
  }

  // ── User profile for welcome ────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.display_name ||
    profile?.username ||
    user.email?.split("@")[0] ||
    "there";

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ────────────────────────────────────── */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m-3-2.818l.879.659c1.171.879
                       3.07.879 4.242 0 1.172-.879
                       1.172-2.303 0-3.182C13.536 12.219
                       12.768 12 12 12c-.725
                       0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303
                       0-3.182s2.9-.879 4.006 0l.415.33M21
                       12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                FairShare
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-500 sm:inline">
              {user.email}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="
                  rounded-md border border-gray-300 bg-white px-3
                  py-1.5 text-sm font-medium text-gray-700 shadow-sm
                  transition-colors hover:bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  focus:ring-offset-2
                "
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Welcome back, {displayName} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your groups and shared expenses.
          </p>
        </div>

        {/* Section header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Your Groups
            {groups.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({groups.length})
              </span>
            )}
          </h2>
          <Link
            href="/dashboard/groups/new"
            className="
              inline-flex items-center gap-1.5 rounded-md bg-blue-600
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
            Create Group
          </Link>
        </div>

        {/* Error */}
        {fetchError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load groups: {fetchError.message}
          </div>
        )}

        {/* Empty state */}
        {!fetchError && groups.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-7 w-7 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479
                     3 3 0 00-4.682-2.72m.94
                     3.198l.001.031c0 .225-.012.447-.037.666A11.944
                     11.944 0 0112 21c-2.17
                     0-4.207-.576-5.963-1.584A6.062 6.062
                     0 016 18.719m12 0a5.971 5.971 0
                     00-.941-3.197m0 0A5.995 5.995 0 0012
                     12.75a5.995 5.995 0
                     00-5.058 2.772m0 0a3 3 0 00-4.681
                     2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971
                     5.971 0 00-.94 3.197M15 6.75a3 3 0
                     11-6 0 3 3 0 016 0zm6
                     3a2.25 2.25 0 11-4.5 0 2.25 2.25
                     0 014.5 0zm-13.5 0a2.25 2.25 0
                     11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              No groups yet
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
              Create your first group to start tracking shared expenses
              with friends.
            </p>
            <Link
              href="/dashboard/groups/new"
              className="
                mt-6 inline-flex items-center gap-1.5 rounded-md
                bg-blue-600 px-5 py-2.5 text-sm font-medium
                text-white shadow-sm transition-colors
                hover:bg-blue-700
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
              Create your first group
            </Link>
          </div>
        )}

        {/* Groups grid */}
        {groups.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((membership) => {
              const g = membership.groups;
              const count = memberCounts.get(g.id) ?? 1;
              const isOwner = g.owner_id === user.id;

              return (
                <Link
                  key={g.id}
                  href={`/dashboard/groups/${g.id}`}
                  className="
                    group rounded-lg border border-gray-200 bg-white
                    p-5 shadow-sm transition-all
                    hover:border-blue-200 hover:shadow-md
                  "
                >
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">
                      {g.name}
                    </h3>
                    {isOwner && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        Owner
                      </span>
                    )}
                  </div>

                  {g.description && (
                    <p className="mb-3 line-clamp-2 text-sm text-gray-500">
                      {g.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {g.currency}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                      {count} member{count !== 1 ? "s" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      {formatDate(g.created_at)}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center text-xs font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                    Open group
                    <svg className="ml-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}