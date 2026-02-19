import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. جلب بيانات المستخدم الأساسية (Auth)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. جلب بيانات البروفايل (الاسم والصورة)
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  // 3. 🔥 جلب المجموعات الخاصة بالمستخدم
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
    .eq("user_id", user.id);

  // تنسيق البيانات المسترجعة لتكون مصفوفة نظيفة
  // @ts-ignore
  const groups = groupsData?.map((item) => item.groups) || [];

  // إعداد بيانات العرض
  const displayName = profile?.display_name || user.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url;
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* ── Header (Desktop & Mobile Top) ────────────────── */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="text-xl font-bold text-blue-600 tracking-tight">
            FairShare
          </Link>

          <div className="flex items-center gap-4">
            {/* Desktop Profile Link */}
            <Link
              href="/dashboard/profile"
              className="group flex items-center gap-2 rounded-full py-1 pr-3 pl-1 transition-colors hover:bg-gray-100"
            >
              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-100 ring-2 ring-white shadow-sm">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-blue-700">
                    {userInitial}
                  </span>
                )}
              </div>
              <span className="hidden text-sm font-medium text-gray-700 sm:block">
                {displayName}
              </span>
            </Link>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="hidden rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:block"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Welcome back, {displayName} 👋
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your groups and shared expenses.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Your Groups</h3>
          <Link
            href="/dashboard/groups/new" // ✅ تم التعديل
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Group
          </Link>
        </div>

        {/* ── Groups Grid Logic ── */}
        {groups.length === 0 ? (
          // حالة عدم وجود مجموعات (Empty State)
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h4 className="mt-4 text-base font-semibold text-gray-900">No groups yet</h4>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
              Create your first group to start tracking shared expenses.
            </p>
            <Link
              href="/dashboard/groups/new" // ✅ تم التعديل
              className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-all"
            >
              Create your first group
            </Link>
          </div>
        ) : (
          // حالة وجود مجموعات (Grid View)
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group: any) => (
              <Link
                key={group.id}
                href={`/dashboard/groups/${group.id}`} // ✅ تم التعديل
                className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-lg font-bold text-blue-600">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    {group.owner_id === user.id && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        Owner
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {group.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    Manage expenses and members.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs text-gray-400">
                  Created {new Date(group.created_at).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* ── Mobile Bottom Navigation Bar ─────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-safe md:hidden">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
          {/* Home Tab */}
          <Link
            href="/dashboard"
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-blue-600"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-xs font-medium">Home</span>
          </Link>

          {/* Create Group Tab */}
          <Link
            href="/dashboard/groups/new" // ✅ تم التعديل
            className="flex flex-col items-center justify-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transform transition hover:scale-105">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </Link>

          {/* Profile Tab */}
          <Link
            href="/dashboard/profile"
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-gray-500 hover:text-blue-600"
          >
            {avatarUrl ? (
              <div className="h-6 w-6 overflow-hidden rounded-full ring-1 ring-gray-200">
                <img src={avatarUrl} alt="Me" className="h-full w-full object-cover" />
              </div>
            ) : (
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
