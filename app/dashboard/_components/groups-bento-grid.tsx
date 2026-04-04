"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight } from "lucide-react";
import type { GroupBalance } from "@/types/dashboard";

// ==========================================
// 🧩 TYPES
// ==========================================
interface GroupsBentoGridProps {
  groups: GroupBalance[];
  userId: string | null;
}

// ==========================================
// ⚙️ GRADIENTS & COLORS
// ==========================================
const GRADIENTS = [
  "from-indigo-500 via-purple-500 to-blue-600",
  "from-primary via-emerald-500 to-teal-600",
  "from-amber-500 via-orange-500 to-red-500",
  "from-pink-500 via-rose-500 to-fuchsia-600",
  "from-violet-500 via-purple-500 to-indigo-600",
  "from-cyan-500 via-blue-500 to-indigo-600",
  "from-lime-500 via-emerald-500 to-teal-600",
  "from-rose-500 via-pink-500 to-purple-600",
];

const STATUS_COLORS = {
  positive: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/30",
  },
  negative: {
    bg: "bg-rose-500/10",
    text: "text-rose-500",
    border: "border-rose-500/30",
  },
  neutral: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-text-light-secondary dark:text-text-dark-secondary",
    border: "border-border-light dark:border-border-dark",
  },
};

// ==========================================
// 🎨 UI RENDER — NEW DESIGN
// ==========================================
export function GroupsBentoGrid({ groups, userId }: GroupsBentoGridProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-gray-200 dark:border-border-dark bg-surface-light dark:bg-surface-dark py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        <h4 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
          No groups yet
        </h4>
        <p className="mx-auto mt-1 max-w-xs text-sm text-text-light-secondary dark:text-text-dark-secondary">
          Create your first group to start splitting expenses with friends.
        </p>
        <Link
          href="/dashboard/groups/new"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-3 text-sm font-semibold shadow-lg transition-all hover:opacity-90"
        >
          Create your first group
        </Link>
      </div>
    );
  }

  return (
    <div className="grid auto-rows-[minmax(140px,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
      {groups.slice(0, 6).map((group, index) => {
        const gradient = GRADIENTS[index % GRADIENTS.length];
        const status = 
          group.net_balance > 0 
            ? STATUS_COLORS.positive 
            : group.net_balance < 0 
              ? STATUS_COLORS.negative 
              : STATUS_COLORS.neutral;
        const isFeatured = index === 0;

        return (
          <Link
            key={group.group_id}
            href={`/dashboard/groups/${group.group_id}`}
            className={`group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
              isFeatured ? "sm:col-span-2 row-span-1" : ""
            }`}
          >
            {/* Gradient Header */}
            <div
              className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${
                isFeatured ? "h-32" : "h-20"
              }`}
            >
              {/* Decorative Elements */}
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute right-8 top-8 h-12 w-12 rounded-full bg-white/[0.07]" />
              <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-black/[0.06]" />

              {/* Owner Badge */}
              {group.owner_id === userId && (
                <div className="absolute right-3 top-3">
                  <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                    Owner
                  </span>
                </div>
              )}

              {/* Group Initial */}
              <div className="absolute bottom-3 left-4">
                <div
                  className={`flex items-center justify-center rounded-2xl bg-white/25 font-black text-white shadow-lg backdrop-blur-sm ${
                    isFeatured ? "h-14 w-14 text-2xl" : "h-11 w-11 text-lg"
                  }`}
                >
                  {group.group_name.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-between p-4">
              <div>
                <div className="flex items-start justify-between">
                  <h3
                    className={`font-bold text-text-light-primary dark:text-text-dark-primary transition-colors group-hover:text-primary ${
                      isFeatured ? "text-xl" : "text-sm"
                    }`}
                  >
                    {group.group_name}
                  </h3>
                  <ArrowUpRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>

                {/* Balance Badge */}
                <div className="mt-3">
                  {group.net_balance > 0 ? (
                    <div className={`inline-flex items-center gap-1.5 rounded-full ${status.bg} ${status.text} px-3 py-1.5 text-xs font-bold ${status.border} border`}>
                      <TrendingUp className="h-3 w-3" />
                      Gets back {formatCurrency(group.net_balance, group.currency)}
                    </div>
                  ) : group.net_balance < 0 ? (
                    <div className={`inline-flex items-center gap-1.5 rounded-full ${status.bg} ${status.text} px-3 py-1.5 text-xs font-bold ${status.border} border`}>
                      <TrendingDown className="h-3 w-3" />
                      Owes {formatCurrency(Math.abs(group.net_balance), group.currency)}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-bold text-text-light-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark">
                      <Wallet className="h-3 w-3" />
                      Settled up
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-lg bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                  {group.currency}
                </span>
                <span className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary">
                  {new Date(group.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
