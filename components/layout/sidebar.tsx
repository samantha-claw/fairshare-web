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
  Settings,
  MessageCircle,
  Sun,
  Moon,
} from "lucide-react";

// ==========================================
// 🧩 TYPES
// ==========================================
interface SidebarProps {
  displayName: string;
  avatarUrl: string;
  onSignOut: () => void;
  isMobile?: boolean;
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
  { label: "Groups", href: "/dashboard/groups", icon: Users },
  { label: "Friends", href: "/dashboard/friends", icon: Users },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

// ==========================================
// 🎨 UI RENDER — NEW DESIGN
// ==========================================
export function Sidebar({
  displayName,
  avatarUrl,
  onSignOut,
  isMobile = false,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={
        isMobile
          ? "flex h-full w-full flex-col bg-[#121212]"
          : "w-64 flex-shrink-0 flex flex-col justify-between rounded-3xl p-6 hidden md:flex border border-white/5 bg-[#121212]"
      }
    >
      {/* ── Logo & Navigation ───────────────────── */}
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 border-[4px] border-white rounded-full" />
            <div className="w-full h-0.5 bg-white absolute top-1/2 -translate-y-1/2" />
            <div className="w-0.5 h-full bg-white absolute left-1/2 -translate-x-1/2" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">
            FairShare
          </span>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                  active
                    ? "bg-white/10 text-white font-bold"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Bottom Section ──────────────────────── */}
      <div className="space-y-3 pt-6">
        {/* Chat Button */}
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-white/10 text-zinc-400">
          <MessageCircle className="h-5 w-5" />
        </button>

        {/* Theme Toggle */}
        <div className="rounded-full p-1 w-10 flex flex-col items-center bg-white/5">
          <button className="w-8 h-8 rounded-full flex items-center justify-center hover:text-text-light-primary transition-colors text-zinc-400">
            <Sun className="h-4 w-4" />
          </button>
          <button className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white">
            <Moon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
