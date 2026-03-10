"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Check, UserPlus, HandCoins, Receipt, Sparkles, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState, AgentSplitIllustration } from "@/components/empty-states";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function useNotifications() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) setNotifications([]);
          return;
        }

        const { data, error } = await supabase
          .from("notifications")
          .select("id, title, message, type, link, is_read, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (mounted) {
          setNotifications((data || []) as NotificationItem[]);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
        if (mounted) setNotifications([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAllAsRead() {
    if (unreadCount === 0) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return { notifications, loading, unreadCount, markAllAsRead };
}

function typeIcon(type: string) {
  switch (type) {
    case "friend_request":
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case "settlement":
      return <HandCoins className="h-4 w-4 text-amber-500" />;
    case "expense":
      return <Receipt className="h-4 w-4 text-emerald-500" />;
    case "group":
      return <Users className="h-4 w-4 text-violet-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, loading, unreadCount, markAllAsRead } = useNotifications();

  const handleAction = () => {
    router.push("/dashboard/friends");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-sm text-gray-500">
        Loading notifications...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <EmptyState
          illustration={<AgentSplitIllustration pose="searching" />}
          title="Custom Empty State"
          description="You can use any pose with any copy."
          action={{
            label: "Do Something",
            onClick: handleAction,
            icon: <Sparkles className="h-4 w-4" />,
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-gray-500 transition-all hover:bg-white hover:text-gray-900 hover:shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Notifications</h1>
          <p className="text-sm text-gray-500">Recent updates and activity</p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Check className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <ul className="divide-y divide-gray-100">
          {notifications.map((n) => (
            <li key={n.id} className={!n.is_read ? "bg-blue-50/40" : ""}>
              <Link
                href={n.link || "#"}
                className="flex items-start gap-3 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="mt-1 rounded-full bg-gray-100 p-2">{typeIcon(n.type)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
