"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, FolderOpen } from "lucide-react";
import type { GroupBalance } from "@/types/dashboard";

// ==========================================
// 🧩 TYPES
// ==========================================
interface GroupsBentoGridProps {
  groups: GroupBalance[];
  userId: string | null;
}

// ==========================================
// ⚙️ LOGIC
// ==========================================

const GRADIENTS = [
  "from-indigo-500 via-purple-500 to-blue-600",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-amber-500 via-orange-500 to-red-500",
  "from-pink-500 via-rose-500 to-fuchsia-600",
  "from-violet-500 via-purple-500 to-indigo-600",
  "from-cyan-500 via-blue-500 to-indigo-600",
  "from-lime-500 via-emerald-500 to-teal-600",
  "from-rose-500 via-pink-500 to-purple-600",
];

const ACCENT_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-violet-100 text-violet-700",
  "bg-cyan-100 text-cyan-700",
  "bg-lime-100 text-lime-700",
  "bg-rose-100 text-rose-700",
];

function getCardSpan(index: number, total: number): string {
  if (total === 1) return "sm:col-span-2 lg:col-span-3";
  if (index === 0 && total >= 3) return "sm:col-span-2 row-span-2";
  if (total >= 5 && index === 3) return "sm:col-span-2";
  return "";
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function GroupsBentoGrid({ groups, userId }: GroupsBentoGridProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white/60 py-20 text-center backdrop-blur-sm">
        <FolderOpen className="mx-auto mb-4 h-14 w-14 text-indigo-300" />
        <h4 className="text-lg font-bold text-gray-900">No groups yet</h4>
        <p className="mx-auto mt-1 max-w-xs text-sm text-gray-500">
          Create your first group to start splitting expenses with friends.
        </p>
        <Link
          href="/dashboard/groups/new"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30"
        >
          Create your first group
        </Link>
      </div>
    );
  }

  return (
    <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group, index) => {
        const gradient = GRADIENTS[index % GRADIENTS.length];
        const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
        const span = getCardSpan(index, groups.length);
        const isFeatured = index === 0 && groups.length >= 3;

        return (
          <Link
            key={group.group_id}
            href={`/dashboard/groups/${group.group_id}`}
            className={`group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-xl ${span}`}
          >
            {/* Gradient Header */}
            <div
              className={`relative ${
                isFeatured ? "h-36" : "h-24"
              } overflow-hidden bg-gradient-to-br ${gradient}`}
            >
              {/* Decorative Circles */}
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute right-8 top-10 h-12 w-12 rounded-full bg-white/[0.07]" />
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
                  className={`flex ${
                    isFeatured ? "h-14 w-14 text-2xl" : "h-11 w-11 text-lg"
                  } items-center justify-center rounded-2xl bg-white/25 font-black text-white shadow-lg backdrop-blur-sm`}
                >
                  {group.group_name.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between">
                  <h3
                    className={`${
                      isFeatured ? "text-xl" : "text-base"
                    } font-bold text-gray-900 transition-colors group-hover:text-indigo-600`}
                  >
                    {group.group_name}
                  </h3>
                  <ArrowUpRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-indigo-500" />
                </div>

                <div className="mt-3">
                  {group.net_balance > 0 ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      <TrendingUp className="h-3 w-3" />
                      Gets back {formatCurrency(group.net_balance, group.currency)}
                    </div>
                  ) : group.net_balance < 0 ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-200">
                      <TrendingDown className="h-3 w-3" />
                      Owes {formatCurrency(group.net_balance, group.currency)}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-500 ring-1 ring-inset ring-gray-200">
                      <Wallet className="h-3 w-3" />
                      Settled up
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Accent */}
              <div className="mt-4 flex items-center justify-between">
                <span className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${accent}`}>
                  {group.currency}
                </span>
                <span className="text-[10px] text-gray-400">
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