"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { GroupMembersList } from "./group-members-list";

interface GroupRow {
  id: string;
  name: string;
  currency: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

export function GroupDashboard({ groupId }: { groupId: string }) {
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (fetchError || !data) {
        setError("Group not found or you don't have access.");
        setLoading(false);
        return;
      }

      setGroup(data as GroupRow);
      setLoading(false);
    }

    load();
  }, [groupId, router, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <svg
          className="h-8 w-8 animate-spin text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-center">
          <p className="text-sm font-medium text-red-700">{error ?? "Something went wrong."}</p>
        </div>
        <button onClick={() => router.push("/dashboard")} className="mt-4 text-sm text-blue-600 hover:text-blue-500">
          ← Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-400 transition-colors hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{group.name}</h1>
              <p className="text-xs text-gray-500">{group.currency}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {group.description && (
          <p className="mb-8 text-sm text-gray-500">{group.description}</p>
        )}

        {/* ── Members list (NEW) ──────────────────────── */}
        <div className="mb-10">
          <GroupMembersList groupId={groupId} />
        </div>

        {/* Placeholder cards */}
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Coming soon
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {[
            { title: "Expenses", desc: "Add and view shared expenses." },
            { title: "Settlements", desc: "See who owes whom." },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center"
            >
              <h3 className="text-sm font-semibold text-gray-900">{card.title}</h3>
              <p className="mt-1 text-xs text-gray-400">{card.desc}</p>
              <span className="mt-3 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}