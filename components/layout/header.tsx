"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Search, Menu, Wallet, QrCode, Sun, Moon, MessageCircle } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { QRScannerModal } from "@/components/modals/qr/qr-scanner-modal";
import { JoinGroupConfirmModal } from "@/components/modals/join-group-confirm-modal";

// ==========================================
// 🧩 TYPES
// ==========================================
interface HeaderProps {
  displayName: string;
  avatarUrl: string;
  userId: string;
  onMobileMenuToggle?: () => void;
}

// ==========================================
// ⚙️ LOGIC
// ==========================================
function getPageSubtitle(pathname: string): string {
  if (pathname === "/dashboard") return "Your financial overview";
  if (pathname.startsWith("/dashboard/friends")) return "Manage your connections";
  if (pathname.startsWith("/dashboard/profile/edit")) return "Update your information";
  if (pathname.startsWith("/dashboard/profile")) return "Your account details";
  if (pathname.startsWith("/dashboard/groups/new")) return "Create a new expense group";
  if (pathname.startsWith("/dashboard/groups/")) return "Manage expenses & members";
  return "Welcome back";
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function Header({
  displayName,
  avatarUrl,
  userId,
  onMobileMenuToggle,
}: HeaderProps) {
  const pathname = usePathname();
  const subtitle = getPageSubtitle(pathname);
  
  // Theme state
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Modal states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [joinGroupId, setJoinGroupId] = useState<string | null>(null);
  const [joinToken, setJoinToken] = useState<string | null>(null);

  // Initialize theme from localStorage
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = stored ? stored === "dark" : prefersDark;
    setIsDark(initialDark);
    document.documentElement.classList.toggle("dark", initialDark);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newDark);
  };

  const handleGroupScanned = (groupId: string, token: string | null) => {
    setIsScannerOpen(false);
    setJoinGroupId(groupId);
    setJoinToken(token);
  };

  const handleJoinModalClose = () => {
    setJoinGroupId(null);
    setJoinToken(null);
  };

  if (!mounted) {
    return (
      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border-light dark:border-border-dark bg-surface-light/70 dark:bg-surface-dark/70 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex-1" />
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border-light dark:border-border-dark bg-surface-light/70 dark:bg-surface-dark/70 px-4 backdrop-blur-xl sm:px-6">
        {/* Mobile Menu */}
        <button
          onClick={onMobileMenuToggle}
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-xl text-text-light-secondary dark:text-text-dark-secondary transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand */}
        <div className="min-w-0 flex-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 transition-opacity active:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 shadow-md shadow-primary/20 md:hidden">
              <Wallet className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
              <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                Fair
              </span>
              <span className="text-text-light-primary dark:text-text-dark-primary">
                Share
              </span>
            </h1>
          </Link>
          <p className="hidden text-xs text-text-light-secondary dark:text-text-dark-secondary sm:block">
            {subtitle}
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-text-light-secondary dark:text-text-dark-secondary transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>

          {/* Search */}
          <button className="hidden h-9 w-9 items-center justify-center rounded-xl text-text-light-secondary dark:text-text-dark-secondary transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 sm:flex">
            <Search className="h-[18px] w-[18px]" />
          </button>

          {/* QR Scanner */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-text-light-secondary dark:text-text-dark-secondary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
            title="Scan QR Code"
          >
            <QrCode className="h-[18px] w-[18px]" />
          </button>

          {/* Real-time Notifications */}
          <NotificationBell userId={userId} />

          {/* Messages */}
          <button className="flex h-9 w-9 items-center justify-center rounded-xl text-text-light-secondary dark:text-text-dark-secondary transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800">
            <MessageCircle className="h-[18px] w-[18px]" />
          </button>

          {/* Divider */}
          <div className="mx-1 hidden h-6 w-px bg-border-light dark:bg-border-dark sm:block" />

          {/* Avatar → Profile Link */}
          <Link
            href="/dashboard/profile"
            className="group flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 sm:pr-3"
          >
            <div className="relative">
              <Avatar src={avatarUrl} name={displayName} size="sm" />
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-surface-light dark:border-surface-dark bg-primary" />
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
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
