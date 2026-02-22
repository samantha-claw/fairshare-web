"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  Plus,
  UserCircle,
} from "lucide-react";

// ==========================================
// 🧩 TYPES
// ==========================================
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

// ==========================================
// ⚙️ LOGIC
// ==========================================

const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Friends", href: "/dashboard/friends", icon: Users },
  { label: "New", href: "/dashboard/groups/new", icon: Plus, isSpecial: true },
  { label: "Profile", href: "/dashboard/profile", icon: UserCircle },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function MobileNav({ displayName, avatarUrl }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-5 left-4 right-4 z-50 md:hidden">
      <div className="mx-auto max-w-sm rounded-2xl border border-white/20 bg-white/80 px-2 py-2 shadow-2xl shadow-black/10 ring-1 ring-black/[0.04] backdrop-blur-xl">
        <div className="flex items-center justify-around">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            if (item.isSpecial) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative flex flex-col items-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 active:scale-95 group-hover:shadow-xl group-hover:shadow-indigo-500/40">
                    <Icon className="h-5 w-5" />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex flex-col items-center gap-0.5 px-3 py-1"
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 ${
                    active
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-400 group-hover:text-gray-600"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </div>

                <span
                  className={`text-[10px] font-semibold transition-colors ${
                    active ? "text-indigo-600" : "text-gray-400"
                  }`}
                >
                  {item.label}
                </span>

                {/* Active Dot Indicator */}
                {active && (
                  <div className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-indigo-600 shadow-[0_0_4px_rgba(99,102,241,0.6)]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}