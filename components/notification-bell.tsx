"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  UserPlus,
  HandCoins,
  Receipt,
  Users,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar as arLocale, enUS as enLocale } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  EmptyState,
  AgentSplitIllustration,
} from "@/components/ui/empty-states";

export function resolveNotificationHref(notif: any): string {
  const type = String(notif?.type || "").toLowerCase();
  const payload =
    notif?.data && typeof notif.data === "object"
      ? notif.data
      : notif?.metadata && typeof notif.metadata === "object"
      ? notif.metadata
      : {};

  const groupId =
    payload.group_id ||
    payload.groupId ||
    notif?.group_id ||
    (type.includes("group") ? notif?.reference_id : null);

  if (type.includes("friend")) {
    return "/dashboard/friends";
  }

  if (type.includes("settlement") && groupId) {
    return `/dashboard/groups/${groupId}?tab=settle`;
  }

  if (type.includes("expense") && groupId) {
    return `/dashboard/groups/${groupId}?tab=expenses`;
  }

  if (groupId) {
    return `/dashboard/groups/${groupId}`;
  }

  if (notif?.actor_id) {
    return `/dashboard/profile/${notif.actor_id}`;
  }

  return "/dashboard/notifications";
}

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const router = useRouter();
  const dateLocale = locale === "ar" ? arLocale : enLocale;
  const t = useTranslations("notificationBell");
  const [supabase] = useState(() => createClient());

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*, actor:actor_id(display_name, avatar_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data && !error) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const channel = supabase
      .channel(`realtime-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: any }) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleNotificationClick = async (notif: any) => {
    setIsOpen(false);
    if (!notif.is_read && notif.id) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notif.id);
    }
    const targetHref = resolveNotificationHref(notif);
    router.push(targetHref);
  };

  const getIcon = (type: string) => {
    const normalized = String(type || "").toLowerCase();
    if (normalized.includes("friend")) {
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    }
    if (normalized.includes("settlement")) {
      return <HandCoins className="h-4 w-4 text-amber-500" />;
    }
    if (normalized.includes("expense")) {
      return <Receipt className="h-4 w-4 text-emerald-500" />;
    }
    if (normalized.includes("group")) {
      return <Users className="h-4 w-4 text-purple-500" />;
    }
    return <Bell className="h-4 w-4 text-text-secondary" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Bell Icon ── */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllAsRead();
        }}
        aria-label={t("buttonLabel")}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary transition-all duration-200 hover:bg-surface-2 dark:hover:bg-gray-800"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-text-primary text-[10px] font-bold text-white shadow-sm ring-2 ring-surface-light dark:ring-surface-dark">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Modal ── */}
      {isOpen && (
        <div className="absolute end-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-border bg-surface-2/50 dark:bg-gray-800/50 px-4 py-3">
            <h3 className="font-semibold text-text-primary">{t("title")}</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-text-primary hover:text-text-primary/80"
                >
                  {t("markAllRead")}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                aria-label={t("close")}
                className="text-text-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  illustration={
                    <AgentSplitIllustration
                      pose="relaxed"
                      className="h-28 w-28"
                    />
                  }
                  title={t("emptyTitle")}
                  description={t("emptyDescription")}
                  className="border-none bg-transparent py-4 shadow-none"
                />
              </div>
            ) : (
              <div className="divide-y divide-border-light dark:divide-border-dark">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex w-full items-start gap-3 p-4 text-start transition-colors hover:bg-surface-2 dark:hover:bg-gray-800 ${
                      !notif.is_read
                        ? "bg-text-primary/5 dark:bg-text-primary/10"
                        : ""
                    }`}
                  >
                    <div className="mt-1 shrink-0 rounded-full bg-surface-2 dark:bg-gray-800 p-2">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-text-primary">
                        {notif.title}
                      </p>
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {notif.message || notif.body}
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        {formatDistanceToNow(new Date(notif.created_at), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
