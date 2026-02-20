import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileViewPage() {
  const supabase = await createClient();

  // 1. جلب المستخدم الحالي
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. جلب بيانات البروفايل من قاعدة البيانات
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* ── Header ───────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-4 text-gray-500 hover:text-gray-900">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
          </div>
          
          {/* زر التعديل */}
          <Link
            href="/dashboard/profile/edit"
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Edit Profile
          </Link>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        
        {/* User Info Card */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="p-8 text-center sm:p-10">
            {/* Avatar */}
            <div className="mx-auto mb-5 h-24 w-24 overflow-hidden rounded-full ring-4 ring-gray-50">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-blue-100 text-4xl font-bold text-blue-600">
                  {userInitial}
                </div>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
            <p className="mt-1 font-mono text-sm text-gray-500">@{username}</p>
            
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

        {/* Account Actions */}
        <div className="mt-6">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3.5 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Sign Out
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
