"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Check, UserPlus, HandCoins, Receipt, Users, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EmptyState, AgentSplitIllustration } from "@/components/ui/empty-states";

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // جلب الإشعارات
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

  // الاستماع للإشعارات اللحظية
  useEffect(() => {
    fetchNotifications();
    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload: { new: any }) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // إغلاق القائمة لما تدوس بره
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // تحديد كل الإشعارات كمقروءة
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  // اختيار أيقونة الإشعار بناءً على نوعه
  const getIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case "settlement":
        return <HandCoins className="h-4 w-4 text-amber-500" />;
      case "expense":
        return <Receipt className="h-4 w-4 text-emerald-500" />;
      case "group":
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-text-secondary" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Bell Icon ── */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllAsRead();
        }}
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
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-border bg-surface-2/50 dark:bg-gray-800/50 px-4 py-3">
            <h3 className="font-semibold text-text-primary">
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-text-primary hover:text-text-primary/80"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
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
                  illustration={<AgentSplitIllustration pose="relaxed" className="h-28 w-28" />}
                  title="Inbox Zero. 🤌"
                  description="No new notifications. Enjoy the moment!"
                  className="border-none bg-transparent py-4 shadow-none"
                />
              </div>
            ) : (
              <div className="divide-y divide-border-light dark:divide-border-dark">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-start gap-3 p-4 transition-colors hover:bg-surface-2 dark:hover:bg-gray-800 cursor-pointer ${
                      !notif.is_read ? "bg-text-primary/5 dark:bg-text-primary/10" : ""
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
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
