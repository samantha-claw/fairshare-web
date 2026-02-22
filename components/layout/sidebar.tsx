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
  UserCircle,
  PlusCircle,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";

// ==========================================
// 🧩 TYPES
// ==========================================
interface SidebarProps {
  displayName: string;
  avatarUrl: string;
  onSignOut: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

// ==========================================
// ⚙️ LOGIC
// ==========================================

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Friends", href: "/dashboard/friends", icon: Users },
  { label: "Profile", href: "/dashboard/profile", icon: UserCircle },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function Sidebar({ displayName, avatarUrl, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-slate-800/50 bg-slate-950 md:flex">
      {/* ── Logo ───────────────────────────────────── */}
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-800/50 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
          <span className="text-sm font-black text-white">F</span>
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          Fair<span className="text-indigo-400">Share</span>
        </span>
      </div>

      {/* ── Navigation ─────────────────────────────── */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
          Menu
        </p>

        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                active
                  ? "bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-lg shadow-indigo-500/25"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              {/* Active Indicator Bar */}
              {active && (
                <div className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
              )}

              <Icon
                className={`h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200 ${
                  active
                    ? "text-white"
                    : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              <span>{item.label}</span>

              {active && (
                <ChevronRight className="ml-auto h-4 w-4 text-white/50" />
              )}
            </Link>
          );
        })}

        {/* ── Create Group CTA ─────────────────────── */}
        <div className="pt-4">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
            Quick Actions
          </p>
          <Link
            href="/dashboard/groups/new"
            className="group flex items-center gap-3 rounded-xl border border-dashed border-slate-700 px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-300"
          >
            <PlusCircle className="h-[18px] w-[18px] flex-shrink-0 text-slate-600 transition-colors group-hover:text-indigo-400" />
            <span>Create Group</span>
            <Sparkles className="ml-auto h-3.5 w-3.5 text-slate-600 transition-all group-hover:rotate-12 group-hover:text-indigo-400" />
          </Link>
        </div>
      </nav>

      {/* ── Bottom Section: User + Sign Out ─────── */}
      <div className="border-t border-slate-800/50 p-3">
        {/* User Card */}
        <Link
          href="/dashboard/profile"
          className="group mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-slate-800/60"
        >
          <div className="relative flex-shrink-0">
            <Avatar src={avatarUrl} name={displayName} size="sm" />
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-slate-500">View profile</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5" />
        </Link>

        {/* Sign Out */}
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}