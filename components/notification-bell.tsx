"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Bell, Check, UserPlus, HandCoins, Receipt, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns"; // لازم تسطب المكتبة دي: npm install date-fns

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
      setUnreadCount(data.filter((n) => !n.is_read).length);
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
        (payload) => {
          // لما ييجي إشعار جديد، زوده في القائمة وزود العداد
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

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
      case "friend_request": return <UserPlus className="h-4 w-4 text-blue-500" />;
      case "settlement": return <HandCoins className="h-4 w-4 text-amber-500" />;
      case "expense": return <Receipt className="h-4 w-4 text-emerald-500" />;
      case "group": return <Users className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Bell Icon ── */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllAsRead(); // لما يفتح، خليهم مقروئين
        }}
        className="relative rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Modal ── */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs font-medium text-blue-600 hover:text-blue-800">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No notifications yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={notif.link || "#"}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-start gap-3 p-4 transition-colors hover:bg-gray-50 ${
                      !notif.is_read ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="mt-1 shrink-0 rounded-full bg-gray-100 p-2">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-gray-400">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
