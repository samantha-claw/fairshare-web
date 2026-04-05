"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Plus,
  UserCircle,
} from "lucide-react";

interface MobileNavProps {
  displayName: string;
  avatarUrl: string;
}

interface MobileNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  isSpecial?: boolean;
}

const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Groups", href: "/dashboard/groups", icon: FolderOpen },
  { label: "New", href: "/dashboard/groups/new", icon: Plus, isSpecial: true },
  { label: "Friends", href: "/dashboard/friends", icon: Users },
  { label: "Profile", href: "/dashboard/profile", icon: UserCircle },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function MobileNav({ displayName, avatarUrl }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="mx-auto max-w-sm rounded-2xl border border-border bg-surface/90 px-2 py-2 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-around">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            if (item.isSpecial) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-text-text-primary text-surface shadow-sm transition-all active:scale-95">
                    <Icon className="h-5 w-5" />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-2 py-1"
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                    active
                      ? "bg-surface-2 text-text-primary"
                      : "text-text-tertiary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`text-[9px] font-semibold transition-colors ${
                    active ? "text-text-primary" : "text-text-tertiary"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
