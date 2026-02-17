"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

type ActionType =
  | "expense_added"
  | "expense_deleted"
  | "settlement_recorded"
  | "member_added"
  | "member_removed"
  | "group_created"
  | "group_updated";

interface ActivityRow {
  id: string;
  group_id: string;
  user_id: string;
  action: ActionType;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ProfileInfo {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ActivityLogProps {
  groupId: string;
  groupCurrency: string;
}

/* ────────────────────────────────────────────────────────────
   Action configuration — icon, color, message builder
   ──────────────────────────────────────────────────────────── */

interface ActionConfig {
  icon: React.ReactNode;
  colorClasses: string;
  buildMessage: (meta: Record<string, unknown>, profiles: Map<string, ProfileInfo>) => string;
}

function getProfileName(
  userId: unknown,
  profiles: Map<string, ProfileInfo>
): string {
  if (typeof userId !== "string") return "Someone";
  const p = profiles.get(userId);
  return p?.display_name || p?.username || "Someone";
}

const ACTION_CONFIG: Record<ActionType, ActionConfig> = {
  expense_added: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    colorClasses: "bg-green-100 text-green-600",
    buildMessage: (meta) =>
      `added expense "${meta.expense_name}" for $${Number(meta.amount).toFixed(2)}`,
  },
  expense_deleted: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    ),
    colorClasses: "bg-red-100 text-red-600",
    buildMessage: (meta) =>
      `deleted expense "${meta.expense_name}" ($${Number(meta.amount).toFixed(2)})`,
  },
  settlement_recorded: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
    colorClasses: "bg-blue-100 text-blue-600",
    buildMessage: (meta, profiles) => {
      const from = getProfileName(meta.from_user, profiles);
      const to = getProfileName(meta.to_user, profiles);
      return `recorded settlement: ${from} paid ${to} $${Number(meta.amount).toFixed(2)}`;
    },
  },
  member_added: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
      </svg>
    ),
    colorClasses: "bg-purple-100 text-purple-600",
    buildMessage: (meta) =>
      `${meta.member_username} joined the group as ${meta.role}`,
  },
  member_removed: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
      </svg>
    ),
    colorClasses: "bg-orange-100 text-orange-600",
    buildMessage: (meta) =>
      `${meta.member_username} was removed from the group`,
  },
  group_created: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    colorClasses: "bg-emerald-100 text-emerald-600",
    buildMessage: () => "created this group",
  },
  group_updated: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
    colorClasses: "bg-gray-100 text-gray-600",
    buildMessage: () => "updated group settings",
  },
};

/* ────────────────────────────────────────────────────────────
   Utilities
   ──────────────────────────────────────────────────────────── */

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Group activities by calendar date */
function groupByDate(
  activities: ActivityRow[]
): { date: string; items: ActivityRow[] }[] {
  const map = new Map<string, ActivityRow[]>();

  for (const a of activities) {
    const dateKey = new Date(a.created_at).toDateString();
    const group = map.get(dateKey) ?? [];
    group.push(a);
    map.set(dateKey, group);
  }

  return Array.from(map.entries()).map(([date, items]) => ({
    date,
    items,
  }));
}

/* ────────────────────────────────────────────────────────────
   Skeleton
   ──────────────────────────────────────────────────────────── */

function LogSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex animate-pulse gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-1/4 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────────────────── */

export function ActivityLog({ groupId, groupCurrency }: ActivityLogProps) {

  // ── State ───────────────────────────────────────────────
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNewActivity, setHasNewActivity] = useState(false);

  // ── Refs ────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  
  // 💡 إضافة الـ Ref الخاص بتحسين الأداء لمنع تكرار جلب البيانات (Stale Closure Fix)
  const fetchedProfileIds = useRef<Set<string>>(new Set());

  // ── Scroll helpers ──────────────────────────────────────

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
    setHasNewActivity(false);
  }, []);

  function handleScroll() {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 40;
    if (isAtBottomRef.current) setHasNewActivity(false);
  }

  // ── Fetch profiles for a set of user IDs ────────────────

  const fetchProfiles = useCallback(
    async (userIds: string[]) => {
      // 💡 قراءة الايديهات من الـ ref مباشرة لضمان أحدث نسخة دائماً
      const newIds = userIds.filter((id) => !fetchedProfileIds.current.has(id));
      if (newIds.length === 0) return;

      // 💡 إضافة الايديهات فوراً لمنع التكرار في حال وصول طلبات متزامنة
      newIds.forEach(id => fetchedProfileIds.current.add(id));

      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", newIds);

      if (data) {
        setProfiles((prev) => {
          const next = new Map(prev);
          for (const p of data) {
            next.set(p.id, {
              username: p.username,
              display_name: p.display_name,
              avatar_url: p.avatar_url,
            });
          }
          return next;
        });
      }
    },
    [] // 💡 قمنا بإزالة profiles من هنا لأنه يتم التحديث داخلياً عبر prev
  );

  // ── Collect all user IDs from activities + metadata ─────

  function collectUserIds(rows: ActivityRow[]): string[] {
    const ids = new Set<string>();
    for (const row of rows) {
      ids.add(row.user_id);
      if (typeof row.metadata.paid_by === "string") ids.add(row.metadata.paid_by);
      if (typeof row.metadata.from_user === "string") ids.add(row.metadata.from_user);
      if (typeof row.metadata.to_user === "string") ids.add(row.metadata.to_user);
      if (typeof row.metadata.member_id === "string") ids.add(row.metadata.member_id);
    }
    return Array.from(ids);
  }

  // ── Initial fetch ───────────────────────────────────────

  useEffect(() => {
    async function load() {
      const { data, error: fetchErr } = await supabase
        .from("activity_log")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(200);

      if (fetchErr) {
        setError(fetchErr.message);
        setLoading(false);
        return;
      }

      const rows = (data as ActivityRow[]) ?? [];
      setActivities(rows);

      // Fetch profiles for all referenced users
      const userIds = collectUserIds(rows);
      await fetchProfiles(userIds);

      setLoading(false);

      // Scroll to bottom after render
      setTimeout(() => scrollToBottom(false), 100);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // ── Realtime subscription ───────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(`activity-log-${groupId}`)
      .on<ActivityRow>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_log",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload: RealtimePostgresInsertPayload<ActivityRow>) => {
          const newRow = payload.new;

          // Fetch any new profile IDs
          const userIds = collectUserIds([newRow]);
          await fetchProfiles(userIds);

          setActivities((prev) => [...prev, newRow]);

          // Auto-scroll if at bottom, otherwise show pill
          if (isAtBottomRef.current) {
            setTimeout(() => scrollToBottom(true), 50);
          } else {
            setHasNewActivity(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // ── Loading ─────────────────────────────────────────────

  if (loading) {
    return (
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Activity
        </h2>
        <LogSkeleton />
      </section>
    );
  }

  // ── Error ───────────────────────────────────────────────

  if (error) {
    return (
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Activity
        </h2>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </section>
    );
  }

  // ── Group by date ───────────────────────────────────────

  const grouped = groupByDate(activities);

  // ── Render ──────────────────────────────────────────────

  return (
    <section className="relative">
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        Activity
        {/* Live indicator */}
        <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-green-600">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Live
        </span>
      </h2>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="
          relative max-h-[500px] overflow-y-auto rounded-lg
          border border-gray-200 bg-white
        "
      >
        {activities.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No activity yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Actions will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 px-4 py-2">
            {grouped.map((group) => (
              <div key={group.date} className="py-2">
                {/* Date header */}
                <div className="sticky top-0 z-10 flex justify-center py-2">
                  <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-500">
                    {formatDateHeader(group.items[0].created_at)}
                  </span>
                </div>

                {/* Activity items */}
                <div className="space-y-1">
                  {group.items.map((activity) => {
                    const config = ACTION_CONFIG[activity.action];
                    const profile = profiles.get(activity.user_id);
                    const displayName =
                      profile?.display_name || profile?.username || "Unknown";
                    const message = config.buildMessage(
                      activity.metadata,
                      profiles
                    );

                    return (
                      <div
                        key={activity.id}
                        className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50"
                      >
                        {/* Icon */}
                        <div
                          className={`
                            mt-0.5 flex h-8 w-8 flex-shrink-0 items-center
                            justify-center rounded-full
                            ${config.colorClasses}
                          `}
                        >
                          {config.icon}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{displayName}</span>
                            {" "}
                            <span className="text-gray-600">{message}</span>
                          </p>

                          {/* Metadata details */}
                          {/* 💡 هذا هو السطر الذي أضفنا فيه typeof لحل مشكلة unknown Type */}
                          {activity.action === "expense_added" && typeof activity.metadata.category === "string" && (
                            <span className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                              {activity.metadata.category}
                            </span>
                          )}
                        </div>

                        {/* Timestamp */}
                        <span className="flex-shrink-0 text-xs text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">
                          {formatTime(activity.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* New activity pill */}
      {hasNewActivity && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="
            absolute bottom-4 left-1/2 z-20 -translate-x-1/2
            rounded-full bg-blue-600 px-4 py-1.5 text-xs
            font-medium text-white shadow-lg transition-transform
            hover:bg-blue-700
            animate-bounce
          "
        >
          ↓ New activity
        </button>
      )}
    </section>
  );
}
