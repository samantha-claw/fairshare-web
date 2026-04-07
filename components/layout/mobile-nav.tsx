"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Plus,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
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

export function MobileNav() {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="mx-auto max-w-sm"
      >
        <div
          className={cn(
            "flex items-end justify-center gap-2 px-3 py-2.5 rounded-2xl",
            "border border-border bg-surface/80 backdrop-blur-2xl shadow-lg"
          )}
          style={{
            transform: "perspective(600px) rotateX(5deg)",
          }}
        >
          {MOBILE_NAV_ITEMS.map((item, i) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            const isHovered = hoveredIndex === i;

            if (item.isSpecial) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center gap-1"
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                >
                  <motion.div
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-text-primary text-surface shadow-md transition-all"
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </motion.div>
                  <span className="text-[10px] font-semibold text-text-secondary">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-1"
                aria-current={active ? "page" : undefined}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <motion.div
                  animate={{
                    scale: isHovered ? 1.15 : 1,
                    y: isHovered ? -4 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                    active
                      ? "bg-surface-2 text-text-primary"
                      : "text-text-tertiary"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </motion.div>
                <span
                  className={cn(
                    "text-[10px] font-semibold",
                    active ? "text-text-primary" : "text-text-tertiary"
                  )}
                >
                  {item.label}
                </span>
                <AnimatePresence>
                  {active && (
                    <motion.div
                      layoutId="activeDot"
                      className="w-1.5 h-1.5 rounded-full bg-positive"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                    />
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </nav>
  );
}
