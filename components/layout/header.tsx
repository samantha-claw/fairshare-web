"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Search, Menu, Wallet, QrCode, Sun, Moon, MessageCircle } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { QRScannerModal } from "@/components/modals/qr/qr-scanner-modal";
import { JoinGroupConfirmModal } from "@/components/modals/join-group-confirm-modal";
import { useTheme } from "@/providers/theme-provider";

interface HeaderProps {
  displayName: string;
  avatarUrl: string;
  userId: string;
  onMobileMenuToggle?: () => void;
}

function getPageSubtitle(pathname: string): string {
  if (pathname === "/dashboard") return "Your financial overview";
  if (pathname.startsWith("/dashboard/friends")) return "Manage your connections";
  if (pathname.startsWith("/dashboard/profile/edit")) return "Update your information";
  if (pathname.startsWith("/dashboard/profile")) return "Your account details";
  if (pathname.startsWith("/dashboard/groups/new")) return "Create a new expense group";
  if (pathname.startsWith("/dashboard/groups/")) return "Manage expenses & members";
  return "Welcome back";
}

export function Header({
  displayName,
  avatarUrl,
  userId,
  onMobileMenuToggle,
}: HeaderProps) {
  const pathname = usePathname();
  const subtitle = getPageSubtitle(pathname);
  const { isDark, toggle: toggleTheme } = useTheme();

  // Modal states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [joinGroupId, setJoinGroupId] = useState<string | null>(null);
  const [joinToken, setJoinToken] = useState<string | null>(null);

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
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 transition-opacity active:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-text-text-primary shadow-md md:hidden">
              <Wallet className="h-4 w-4 text-surface" strokeWidth={2.5} />
            </div>
            <h1 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
              <span className="text-text-primary">FairShare</span>
            </h1>
          </Link>
          <p className="hidden text-xs text-text-secondary sm:block">
            {subtitle}
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
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

          {/* Real-time Notifications */}
          <NotificationBell userId={userId} />

          {/* Messages */}
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors">
            <MessageCircle className="h-[18px] w-[18px]" />
          </button>

          {/* Divider */}
          <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

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
              <p className="truncate text-sm font-semibold text-text-primary">
                {displayName}
              </p>
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
