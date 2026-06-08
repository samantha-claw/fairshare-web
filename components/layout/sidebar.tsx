"use client";

import { useState, useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Globe, LayoutDashboard, Users, FolderOpen, Settings, LogOut, Sun, Moon, User, Bell } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface SidebarProps {
  displayName: string;
  avatarUrl: string;
  onSignOut: () => void;
  isMobile?: boolean;
}

const NAV_ITEMS = [
  { label: "Dashboard", translationKey: "sidebar.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Groups", translationKey: "sidebar.groups", href: "/dashboard/groups", icon: FolderOpen },
  { label: "Friends", translationKey: "sidebar.friends", href: "/dashboard/friends", icon: Users },
  { label: "Notifications", translationKey: "sidebar.notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Settings", translationKey: "sidebar.settings", href: "/dashboard/settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function Sidebar({ displayName, avatarUrl, onSignOut, isMobile = false }: SidebarProps) {
  const pathname = usePathname();
  const { isDark, toggle } = useTheme();
  const t = useTranslations();
  const initials = displayName
    ? displayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <aside
      className={
        isMobile
          ? "flex h-full w-full flex-col bg-sidebar-bg px-4 py-6"
          : "hidden md:flex w-60 flex-shrink-0 flex-col justify-between rounded-2xl px-4 py-6 bg-sidebar-bg border border-sidebar-border"
      }
    >
      {/* ── Logo ── */}
      <div>
        <Link href="/dashboard" className="flex items-center gap-3 px-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-sidebar-logo-bg flex items-center justify-center border border-sidebar-border">
            <span className="text-xs font-black text-sidebar-logo-text">FS</span>
          </div>
          <span className="font-bold text-base tracking-tight text-sidebar-active">
            {t('common.appName')}
          </span>
        </Link>

        {/* ── Nav ── */}
        <nav className="space-y-0.5">
          {NAV_ITEMS.map(({ translationKey, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-hover text-sidebar-active"
                    : "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {t(translationKey as any)}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Bottom ── */}
      <div className="space-y-1">
        {/* Profile link */}
        <Link
          href="/dashboard/profile"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            isActive(pathname, "/dashboard/profile")
              ? "bg-sidebar-hover text-sidebar-active"
              : "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active"
          }`}
        >
          <User className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{displayName || t('common.profile')}</span>
        </Link>

        {/* Language Switcher */}
        <LanguageSwitcher className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active transition-colors" />

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active transition-colors"
        >
          {isDark ? (
            <Sun className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Moon className="h-4 w-4 flex-shrink-0" />
          )}
          {isDark ? t('common.lightMode') : t('common.darkMode')}
        </button>

        {/* Sign out */}
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-text hover:bg-negative-bg hover:text-negative transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {t('sidebar.signOut')}
        </button>
      </div>
    </aside>
  );
}
