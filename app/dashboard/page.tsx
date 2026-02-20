import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. جلب بيانات المستخدم
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 2. جلب البروفايل
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  // 3. جلب المجموعات والأرصدة باستخدام الـ RPC الجديد
  const { data: groupsData, error } = await supabase.rpc("get_user_dashboard_balances");
  
  // @ts-ignore
  const groups = groupsData || [];

  // 4. حساب الإجماليات (Global Summaries)
  let totalOwedToMe = 0;
  let totalIOwe = 0;

  groups.forEach((g: any) => {
    const bal = Number(g.net_balance) || 0;
    if (bal > 0) totalOwedToMe += bal;
    else if (bal < 0) totalIOwe += Math.abs(bal);
  });

  const totalNet = totalOwedToMe - totalIOwe;

  // تجهيز بيانات العرض
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
            <Link 
              href="/dashboard/friends" 
              className="text-gray-500 hover:text-blue-600 transition-colors hidden sm:block p-2 rounded-full hover:bg-gray-50"
              title="Friends"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.321c1.961 0 3.55 1.589 3.55 3.55s-1.589 3.55-3.55 3.55-3.55-1.589-3.55-3.55 1.589-3.55 3.55-3.55zM4.694 17.653c.113-1.895 1.706-3.418 3.618-3.418h7.376c1.912 0 3.505 1.523 3.618 3.418l.056.94c.014.234-.17.433-.404.433H5.042c-.234 0-.418-.199-.404-.433l.056-.94z" />
              </svg>
            </Link>

            <Link href="/dashboard/profile" className="group flex items-center gap-2 rounded-full py-1 pr-3 pl-1 transition-colors hover:bg-gray-100">
              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-100 ring-2 ring-white shadow-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-blue-700">{userInitial}</span>
                )}
              </div>
              <span className="hidden text-sm font-medium text-gray-700 sm:block">{displayName}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Welcome back, {displayName} 👋</h2>
          <p className="mt-1 text-sm text-gray-500">Here is your overall financial summary.</p>
        </div>

        {/* ── Global Summary Cards ── */}
        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">Total Balance</p>
            <p className={`text-2xl font-bold ${totalNet > 0 ? 'text-green-600' : totalNet < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {totalNet > 0 ? '+' : ''}{totalNet.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100">
            <p className="text-sm font-medium text-gray-500 mb-1">You are owed</p>
            <p className="text-2xl font-bold text-green-600">+${totalOwedToMe.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
            <p className="text-sm font-medium text-gray-500 mb-1">You owe</p>
            <p className="text-2xl font-bold text-red-600">-${totalIOwe.toFixed(2)}</p>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link href="/dashboard/groups/new" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-all">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Group
          </Link>
          <Link href="/dashboard/friends" className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-all">
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.66-1.318M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            Add Friend
          </Link>
        </div>

        {/* ── Groups List ── */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Groups</h3>
        
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h4 className="mt-4 text-base font-semibold text-gray-900">No groups yet</h4>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">Create your first group to start tracking shared expenses.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group: any) => {
              const netBal = Number(group.net_balance) || 0;
              return (
                <Link
                  key={group.group_id}
                  href={`/dashboard/groups/${group.group_id}`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-xl font-bold text-gray-700">
                        {group.group_name.charAt(0).toUpperCase()}
                      </div>
                      {group.owner_id === user.id && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          Owner
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {group.group_name}
                    </h3>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Your Balance</span>
                    {netBal > 0 ? (
                      <span className="text-sm font-bold text-green-600">Gets back {netBal} {group.currency || ''}</span>
                    ) : netBal < 0 ? (
                      <span className="text-sm font-bold text-red-600">Owes {Math.abs(netBal)} {group.currency || ''}</span>
                    ) : (
                      <span className="text-sm font-bold text-gray-400">Settled up</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Mobile Bottom Navigation Bar ─────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-safe md:hidden shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
          <Link href="/dashboard" className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-blue-600">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-[10px] font-bold">Home</span>
          </Link>

          <Link href="/dashboard/friends" className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-gray-500 hover:text-blue-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.321c1.961 0 3.55 1.589 3.55 3.55s-1.589 3.55-3.55 3.55-3.55-1.589-3.55-3.55 1.589-3.55 3.55-3.55zM4.694 17.653c.113-1.895 1.706-3.418 3.618-3.418h7.376c1.912 0 3.505 1.523 3.618 3.418l.056.94c.014.234-.17.433-.404.433H5.042c-.234 0-.418-.199-.404-.433l.056-.94z" />
            </svg>
            <span className="text-[10px] font-bold">Friends</span>
          </Link>

          <Link href="/dashboard/groups/new" className="flex flex-col items-center justify-center -mt-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg border-4 border-gray-50">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </Link>

          <Link href="/dashboard/profile" className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-gray-500 hover:text-blue-600">
            {avatarUrl ? (
              <div className="h-6 w-6 overflow-hidden rounded-full ring-2 ring-gray-200">
                <img src={avatarUrl} alt="Me" className="h-full w-full object-cover" />
              </div>
            ) : (
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-[10px] font-bold">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
