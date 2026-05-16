"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Menu, Wallet, QrCode, Sun, Moon, Bell } from "lucide-react";
import { QRScannerModal } from "@/components/modals/qr/qr-scanner-modal";
import { JoinGroupConfirmModal } from "@/components/modals/join-group-confirm-modal";
import { useTheme } from "@/providers/theme-provider";
import { createClient } from "@/lib/supabase/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface HeaderProps {
  displayName: string;
  avatarUrl: string;
  userId: string;
  onMobileMenuToggle?: () => void;
}

function getPageSubtitleKey(pathname: string, userId: string): string {
  if (pathname === "/dashboard") return "dashboard.subtitle";
  if (pathname.startsWith("/dashboard/notifications")) return "notifications.subtitle";
  if (pathname.startsWith("/dashboard/friends/add")) return "friends.findFriends";
  if (pathname.startsWith("/dashboard/friends")) return "friends.title";
  if (pathname.startsWith("/dashboard/profile/edit")) return "profile.editProfile";
  if (pathname === "/dashboard/profile") return "common.profile";
  if (pathname.startsWith("/dashboard/profile/")) {
    const profileId = pathname.split("/")[3];
    if (profileId && profileId === userId) {
      return "profile.title";
    }
    return "common.profile";
  }
  if (pathname.startsWith("/dashboard/groups/new")) return "groups.createTitle";
  if (pathname.startsWith("/dashboard/groups")) return "groupTabs.members";
  if (pathname.startsWith("/dashboard/settings")) return "common.settings";
  return "dashboard.title";
}

export function Header({ displayName, avatarUrl, userId, onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const subtitleKey = getPageSubtitleKey(pathname, userId);
  const subtitle = t(subtitleKey);
  const { isDark, toggle: toggleTheme } = useTheme();
  const supabase = useMemo(() => createClient(), []);
  const unreadRefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [joinGroupId, setJoinGroupId] = useState<string | null>(null);
  const [joinToken, setJoinToken] = useState<string | null>(null);

  // Unread count for notification badge
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count
  useEffect(() => {
    async function fetchUnread() {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      setUnreadCount(count ?? 0);
    }

    const scheduleUnreadRefetch = () => {
      if (unreadRefetchTimerRef.current) {
        clearTimeout(unreadRefetchTimerRef.current);
      }
      unreadRefetchTimerRef.current = setTimeout(() => {
        fetchUnread();
        unreadRefetchTimerRef.current = null;
      }, 250);
    };

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
          // Debounced refetch to avoid N identical queries during bulk updates
          scheduleUnreadRefetch();
        }
      )
      .subscribe();

    return () => {
      if (unreadRefetchTimerRef.current) {
        clearTimeout(unreadRefetchTimerRef.current);
      }
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
          aria-label="Toggle mobile menu"
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
              <span className="text-text-primary">{t('common.appName')}</span>
            </h1>
          </Link>
          <p className="hidden text-xs text-text-secondary sm:block">{subtitle}</p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? t('common.switchToLight') : t('common.switchToDark')}
            aria-pressed={isDark}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
            title={isDark ? t('common.switchToLight') : t('common.switchToDark')}
          >
            {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>

          {/* QR Scanner */}
          <button
            onClick={() => setIsScannerOpen(true)}
            aria-label={t('header.scanQrCode')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
            title={t('header.scanQrCode')}
          >
            <QrCode className="h-[18px] w-[18px]" />
          </button>

          {/* Notifications Link */}
          <Link
            href="/dashboard/notifications"
            aria-label={t('header.viewNotifications')}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
            title={t('header.viewNotifications')}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute end-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-text-primary text-[10px] font-bold text-surface shadow-sm ring-2 ring-surface">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar → Profile Link */}
          <Link
            href="/dashboard/profile"
            className="group flex items-center gap-2.5 rounded-xl py-1 ps-1 pe-2 transition-colors hover:bg-surface-2 sm:pe-3"
          >
            <div className="relative">
              <Avatar src={avatarUrl} name={displayName} size="sm" />
              <div className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-surface bg-positive" />
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
