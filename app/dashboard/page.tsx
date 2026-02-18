import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-gray-900">
            FairShare
          </h1>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-500 sm:inline">
              {user.email}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Welcome back, {user.email?.split("@")[0]} 👋
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your groups and shared expenses.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Your Groups
          </h3>
          <Link
            href="/dashboard/groups/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            + Create Group
          </Link>
        </div>

        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
          <h4 className="text-base font-semibold text-gray-900">
            No groups yet
          </h4>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
            Create your first group to start tracking shared expenses.
          </p>
          <Link
            href="/dashboard/groups/new"
            className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Create your first group
          </Link>
        </div>
      </main>
    </div>
  );
}