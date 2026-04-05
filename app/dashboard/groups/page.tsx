"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { GroupsBentoGrid } from "@/app/dashboard/_components/groups-bento-grid";
import { GroupsEmptyState } from "@/components/ui/empty-states";

function GroupsPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse px-4 py-8 sm:px-6">
      <div className="mb-6 h-5 w-32 rounded bg-gray-200" />
      <div className="mb-8 h-10 w-56 rounded-lg bg-gray-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-48 rounded-3xl bg-gray-200/40" />
        <div className="h-48 rounded-3xl bg-gray-200/40" />
        <div className="h-48 rounded-3xl bg-gray-200/40" />
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const router = useRouter();
  const { groups, loading, userId } = useDashboard();

  if (loading) {
    return <GroupsPageSkeleton />;
  }

  if (groups.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <GroupsEmptyState
          onCreateGroup={() => router.push("/dashboard/groups/new")}
          onJoinGroup={() => router.push("/join")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="mb-6 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-text-secondary transition-all hover:bg-surface hover:text-text-primary hover:shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </button>

      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/20">
            <Users className="h-5 w-5 text-surface" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
              Groups
            </h1>
            <p className="text-sm text-text-secondary">
              View and manage all your shared groups
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/groups/new")}
          className="rounded-xl bg-text-text-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-indigo-700"
        >
          New Group
        </button>
      </div>

      <GroupsBentoGrid groups={groups} userId={userId} />
    </div>
  );
}
