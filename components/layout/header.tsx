"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Search, Menu, Wallet, QrCode, Sun, Moon, Bell } from "lucide-react";
import { QRScannerModal } from "@/components/modals/qr/qr-scanner-modal";
import { JoinGroupConfirmModal } from "@/components/modals/join-group-confirm-modal";
import { useTheme } from "@/providers/theme-provider";
import { createClient } from "@/lib/supabase/client";
import { useState as useReactState, useEffect } from "react";

interface HeaderProps {
  displayName: string;
  avatarUrl: string;
  userId: string;
  onMobileMenuToggle?: () => void;
}

function getPageSubtitle(pathname: string): string {
  if (pathname === "/dashboard") return "Your financial overview";
  if (pathname.startsWith("/dashboard/notifications")) return "View all your updates";
  if (pathname.startsWith("/dashboard/friends/add")) return "Find and connect with friends";
  if (pathname.startsWith("/dashboard/friends")) return "Manage your connections";
  if (pathname.startsWith("/dashboard/profile/edit")) return "Update your information";
  if (pathname.startsWith("/dashboard/profile")) return "Your account details";
  if (pathname.startsWith("/dashboard/groups/new")) return "Create a new expense group";
  if (pathname.startsWith("/dashboard/groups")) return "Manage expenses & members";
  if (pathname.startsWith("/dashboard/settings")) return "Account preferences";
  return "Welcome back";
}

export function Header({ displayName, avatarUrl, userId, onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const subtitle = getPageSubtitle(pathname);
  const { isDark, toggle: toggleTheme } = useTheme();
  const supabase = createClient();

  // Modal states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [joinGroupId, setJoinGroupId] = useState<string | null>(null);
  const [joinToken, setJoinToken] = useState<string | null>(null);

  // Unread count for notification badge
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count
  useEffect(() => {
    async function fetchUnread() {
      const { data } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (data) setUnreadCount(data.length);
    }
    fetchUnread();

    // Subscribe to realtime
    const channel = supabase
      .channel("header-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch on update (mark as read)
          fetchUnread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const handleGroupScanned = (groupId: string, token: string | null) => {
    setIsScannerOpen(false);
    setJoinGroupId(groupId);
    setJoinToken(token);
  };

  const handleJoinModalClose = () => {
    setJoinGroupId(null);
    setJoinToken(null);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/80 backdrop-blur-xl px-4 sm:px-5 transition-colors duration-200">
        {/* Mobile Menu */}
        <button
          onClick={onMobileMenuToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand */}
        <div className="min-w-0 flex-1">
          <Link href="/dashboard" className="inline-flex items-center gap-2 transition-opacity active:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-text-primary shadow-md md:hidden">
              <Wallet className="h-4 w-4 text-surface" strokeWidth={2.5} />
            </div>
            <h1 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
              <span className="text-text-primary">FairShare</span>
            </h1>
          </Link>
          <p className="hidden text-xs text-text-secondary sm:block">{subtitle}</p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>

          {/* Search */}
          <button className="hidden h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors sm:flex">
            <Search className="h-[18px] w-[18px]" />
          </button>

          {/* QR Scanner */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
            title="Scan QR Code"
          >
            <QrCode className="h-[18px] w-[18px]" />
          </button>

          {/* Notifications Link */}
          <Link
            href="/dashboard/notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
            title="View notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-text-primary text-[10px] font-bold text-surface shadow-sm ring-2 ring-surface">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar → Profile Link */}
          <Link
            href="/dashboard/profile"
            className="group flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-surface-2 sm:pr-3"
          >
            <div className="relative">
              <Avatar src={avatarUrl} name={displayName} size="sm" />
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-surface bg-positive" />
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-text-primary">{displayName}</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onGroupScanned={handleGroupScanned}
      />

      {/* Join Confirm Modal */}
      {joinGroupId && (
        <JoinGroupConfirmModal
          isOpen={!!joinGroupId}
          onClose={handleJoinModalClose}
          groupId={joinGroupId}
          token={joinToken}
        />
      )}
    </>
  );
}
