import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/* ════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════ */

interface FriendProfile {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
}

/* ════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════ */

export default async function ProfileViewPage() {
  const supabase = await createClient();

  // 1. Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name || user.email?.split("@")[0];
  const username = profile?.username || "No username";
  const bio = profile?.bio || "No bio added yet.";
  const avatarUrl = profile?.avatar_url;
  const userInitial = displayName?.charAt(0).toUpperCase() || "U";

  // 3. Fetch accepted friendships (both directions)
  const { data: friendshipsAsRequester } = await supabase
    .from("friendships")
    .select(
      `
      receiver_id,
      profiles!friendships_receiver_id_fkey (
        id,
        display_name,
        username,
        avatar_url
      )
    `
    )
    .eq("requester_id", user.id)
    .eq("status", "accepted");

  const { data: friendshipsAsReceiver } = await supabase
    .from("friendships")
    .select(
      `
      requester_id,
      profiles!friendships_requester_id_fkey (
        id,
        display_name,
        username,
        avatar_url
      )
    `
    )
    .eq("receiver_id", user.id)
    .eq("status", "accepted");

  // Merge & deduplicate
  const friendsMap = new Map<string, FriendProfile>();

  friendshipsAsRequester?.forEach((row: any) => {
    const p = row.profiles;
    if (p && !friendsMap.has(p.id)) {
      friendsMap.set(p.id, {
        id: p.id,
        display_name: p.display_name || p.username || "User",
        username: p.username || "",
        avatar_url: p.avatar_url || "",
      });
    }
  });

  friendshipsAsReceiver?.forEach((row: any) => {
    const p = row.profiles;
    if (p && !friendsMap.has(p.id)) {
      friendsMap.set(p.id, {
        id: p.id,
        display_name: p.display_name || p.username || "User",
        username: p.username || "",
        avatar_url: p.avatar_url || "",
      });
    }
  });

  const allFriends = Array.from(friendsMap.values());
  const friendsPreview = allFriends.slice(0, 6);
  const totalFriends = allFriends.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* ── Header ───────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="mr-4 text-gray-500 hover:text-gray-900"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
          </div>

          <Link
            href="/dashboard/profile/edit"
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Edit Profile
          </Link>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* ── User Info Card ──────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="p-8 text-center sm:p-10">
            {/* Avatar */}
            <div className="mx-auto mb-5 h-24 w-24 overflow-hidden rounded-full ring-4 ring-gray-50">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-blue-100 text-4xl font-bold text-blue-600">
                  {userInitial}
                </div>
              )}
            </div>

            <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
            <p className="mt-1 font-mono text-sm text-gray-500">
              @{username}
            </p>

            {/* Bio */}
            <p className="mx-auto mt-4 max-w-md text-sm text-gray-600">
              {bio}
            </p>
          </div>

          <div className="border-t border-gray-100 bg-gray-50 px-8 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Email Address</span>
              <span className="font-medium text-gray-900">{user.email}</span>
            </div>
          </div>
        </div>

        {/* ── Friends Card ────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
              <h3 className="text-sm font-semibold text-gray-900">
                Friends{" "}
                <span className="font-normal text-gray-500">
                  ({totalFriends})
                </span>
              </h3>
            </div>

            {totalFriends > 0 && (
              <Link
                href="/dashboard/friends"
                className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
              >
                See all
              </Link>
            )}
          </div>

          {/* Body */}
          <div className="p-6">
            {totalFriends === 0 ? (
              /* ── Empty State ─────────────────────────── */
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
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
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  No friends yet
                </p>
                <p className="mt-1 max-w-xs text-xs text-gray-500">
                  Start connecting with people to see them here.
                </p>
                <Link
                  href="/dashboard/friends"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
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
                      d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                    />
                  </svg>
                  Find Friends
                </Link>
              </div>
            ) : (
              /* ── Friends Grid ────────────────────────── */
              <div className="grid grid-cols-3 gap-4">
                {friendsPreview.map((friend) => {
                  const initial =
                    friend.display_name?.charAt(0).toUpperCase() || "?";

                  return (
                    <Link
                      key={friend.id}
                      href={`/dashboard/profile/${friend.id}`}
                      className="group flex flex-col items-center gap-2 rounded-xl p-3 transition-colors hover:bg-gray-50"
                    >
                      {/* Avatar */}
                      <div className="relative h-20 w-20 overflow-hidden rounded-xl ring-1 ring-gray-200 transition-shadow group-hover:ring-blue-300 group-hover:shadow-md">
                        {friend.avatar_url ? (
                          <img
                            src={friend.avatar_url}
                            alt={friend.display_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-blue-50 text-2xl font-bold text-blue-600">
                            {initial}
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <p className="w-full truncate text-center text-xs font-medium text-gray-800 transition-colors group-hover:text-blue-600">
                        {friend.display_name}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Account Actions ─────────────────────────────── */}
        <div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3.5 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
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
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
              Sign Out
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}