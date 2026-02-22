"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Bell, Search, Menu } from "lucide-react";

// ==========================================
// 🧩 TYPES
// ==========================================
interface HeaderProps {
  displayName: string;
  avatarUrl: string;
  onMobileMenuToggle?: () => void;
}

// ==========================================
// ⚙️ LOGIC
// ==========================================

function getPageTitle(pathname: string): { title: string; subtitle: string } {
  if (pathname === "/dashboard") {
    return { title: "Dashboard", subtitle: "Your financial overview" };
  }
  if (pathname.startsWith("/dashboard/friends")) {
    return { title: "Friends", subtitle: "Manage your connections" };
  }
  if (pathname.startsWith("/dashboard/profile/edit")) {
    return { title: "Edit Profile", subtitle: "Update your information" };
  }
  if (pathname.startsWith("/dashboard/profile")) {
    return { title: "Profile", subtitle: "Your account details" };
  }
  if (pathname.startsWith("/dashboard/groups/new")) {
    return { title: "New Group", subtitle: "Create a new expense group" };
  }
  if (pathname.startsWith("/dashboard/groups/")) {
    return { title: "Group Details", subtitle: "Manage expenses & members" };
  }
  return { title: "Dashboard", subtitle: "Welcome back" };
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function Header({
  displayName,
  avatarUrl,
  onMobileMenuToggle,
}: HeaderProps) {
  const pathname = usePathname();
  const { title, subtitle } = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200/60 bg-white/70 px-4 backdrop-blur-xl sm:px-6">
      {/* ── Mobile Menu Toggle ───────────────────── */}
      <button
        onClick={onMobileMenuToggle}
        className="mr-3 flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* ── Page Title ───────────────────────────── */}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg">
          {title}
        </h1>
        <p className="hidden text-xs text-gray-500 sm:block">{subtitle}</p>
      </div>

      {/* ── Right Actions ────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Search (Decorative / Future) */}
        <button className="hidden h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 sm:flex">
          <Search className="h-[18px] w-[18px]" />
        </button>

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600">
          <Bell className="h-[18px] w-[18px]" />
          {/* Notification Dot */}
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
          </span>
        </button>

        {/* Divider */}
        <div className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" />

        {/* User Avatar */}
        <Link
          href="/dashboard/profile"
          className="group flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 transition-all duration-200 hover:bg-gray-100 sm:pr-3"
        >
          <div className="relative">
            <Avatar src={avatarUrl} name={displayName} size="sm" />
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-white bg-emerald-400" />
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold text-gray-800">
              {displayName}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}