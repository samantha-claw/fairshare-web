"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Check, UserPlus, HandCoins, Receipt, Users, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { EmptyState, AgentSplitIllustration } from "@/components/ui/empty-states";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  actor_id: string | null;
  actor: { display_name: string | null; avatar_url: string | null } | null;
}

// ── Skeleton ────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl animate-pulse px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-surface-2" />
          <div className="space-y-2">
            <div className="h-8 w-40 rounded bg-surface-2" />
            <div className="h-4 w-56 rounded bg-surface-2" />
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="mb-3 h-24 rounded-2xl bg-surface-2/40" />
        ))}
      </div>
    </div>
  );
}

// ── Get Icon by Type ─────────────────────────────────────
function getIcon(type: string, className = "h-4 w-4") {
  switch (type) {
    case "friend_request":
      return <UserPlus className={`${className} text-blue-500`} />;
    case "settlement":
      return <HandCoins className={`${className} text-amber-500`} />;
    case "expense":
      return <Receipt className={`${className} text-positive`} />;
    case "group":
      return <Users className={`${className} text-purple-500`} />;
    default:
      return <Bell className={`${className} text-text-secondary`} />;
  }
}

// ── Notification Card ────────────────────────────────────
function NotificationCard({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-4 rounded-2xl border p-4 transition-all ${
        notification.is_read
          ? "border-border bg-surface"
          : "border-border bg-surface"
      }`}
    >
      {/* Icon */}
      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2">
        {getIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">{notification.title}</p>
        <p className="mt-1 text-sm text-text-secondary line-clamp-2">{notification.message}</p>
        <p className="mt-2 text-xs text-text-tertiary">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Mark as Read Button */}
      {!notification.is_read && (
        <button
          onClick={() => onMarkAsRead(notification.id)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-text-secondary transition-colors hover:bg-positive-bg hover:text-positive"
          title="Mark as read"
        >
          <Check className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────
export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user and notifications
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      if (cancelled) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from("notifications")
        .select("*, actor:actor_id(display_name, avatar_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (error) {
        console.error("Failed to fetch notifications:", error);
      } else if (data) {
        setNotifications(data as Notification[]);
      }

      setLoading(false);
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("realtime-notifications-page")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Notification }) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } else {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!userId) return;
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      setNotifications(previous);
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  if (loading) return <PageSkeleton />;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-10">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* ── Back Button & Header ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-text-primary shadow-lg">
                <Bell className="h-7 w-7 text-surface" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
                  Notifications
                </h1>
                <p className="text-sm text-text-secondary">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                    : "All caught up!"}
                </p>
              </div>
            </div>

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-surface-2 hover:text-text-primary"
              >
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Notifications List ────────────────────────── */}
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <EmptyState
              illustration={<AgentSplitIllustration pose="relaxed" className="h-32 w-32" />}
              title="Inbox Zero! 🎉"
              description="No notifications yet. When you have updates, they'll appear here."
              className="border-none bg-transparent shadow-none"
            />
          </motion.div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif, index) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NotificationCard notification={notif} onMarkAsRead={markAsRead} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
