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

  // 3. جلب المجموعات الخاصة بالمستخدم
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

  // تنسيق البيانات المسترجعة
  // @ts-ignore
  const groups = groupsData?.map((item) => item.groups) || [];

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url;
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* ── Header ────────────────── */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="text-xl font-bold text-blue-600 tracking-tight">
            FairShare
          </Link>

          <div className="flex items-center gap-4">
            {/* رابط الأصدقاء (Desktop) */}
            <Link 
              href="/dashboard/friends" 
              className="text-gray-500 hover:text-blue-600 transition-colors hidden sm:block p-2 rounded-full hover:bg-gray-50"
              title="Friends"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.321c1.961 0 3.55 1.589 3.55 3.55s-1.589 3.55-3.55 3.55-3.55-1.589-3.55-3.55 1.589-3.55 3.55-3.55zM4.694 17.653c.113-1.895 1.706-3.418 3.618-3.418h7.376c1.912 0 3.505 1.523 3.618 3.418l.056.94c.014.234-.17.433-.404.433H5.042c-.234 0-.418-.199-.404-.433l.056-.94z" />
              </svg>
            </Link>

            {/* Desktop Profile Link */}
            <Link
              href="/dashboard/profile"
              className="group flex items-center gap-2 rounded-full py-1 pr-3 pl-1 transition-colors hover:bg-gray-100"
            >
              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-100 ring-2 ring-white shadow-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-blue-700">{userInitial}</span>
                )}
              </div>
              <span className="hidden text-sm font-medium text-gray-700 sm:block">{displayName}</span>
            </Link>

            <form action="/auth/signout" method="post">
              <button type="submit" className="hidden rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:block">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Welcome back, {displayName} 👋</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your groups and shared expenses.</p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Your Groups</h3>
          <Link
            href="/dashboard/groups/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Group
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center shadow-sm">
            <h4 className="mt-4 text-base font-semibold text-gray-900">No groups yet</h4>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">Create your first group to start tracking shared expenses.</p>
            <Link href="/dashboard/groups/new" className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-all">
              Create your first group
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group: any) => (
              <Link key={group.id} href={`/dashboard/groups/${group.id}`} className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-lg font-bold text-blue-600">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    {group.owner_id === user.id && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Owner</span>
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{group.name}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">Manage expenses and members.</p>
                </div>
                <div className="mt-4 flex items-center text-xs text-gray-400">Created {new Date(group.created_at).toLocaleDateString()}</div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* ── Mobile Bottom Navigation Bar ─────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-safe md:hidden">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
          {/* Home Tab */}
          <Link href="/dashboard" className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-blue-600">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-xs font-medium">Home</span>
          </Link>

          {/* Friends Tab (Mobile) - مضاف حديثاً */}
          <Link href="/dashboard/friends" className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-gray-500 hover:text-blue-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.321c1.961 0 3.55 1.589 3.55 3.55s-1.589 3.55-3.55 3.55-3.55-1.589-3.55-3.55 1.589-3.55 3.55-3.55zM4.694 17.653c.113-1.895 1.706-3.418 3.618-3.418h7.376c1.912 0 3.505 1.523 3.618 3.418l.056.94c.014.234-.17.433-.404.433H5.042c-.234 0-.418-.199-.404-.433l.056-.94z" />
            </svg>
            <span className="text-xs font-medium">Friends</span>
          </Link>

          {/* Create Group Tab */}
          <Link href="/dashboard/groups/new" className="flex flex-col items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </Link>

          {/* Profile Tab */}
          <Link href="/dashboard/profile" className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-gray-500 hover:text-blue-600">
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
