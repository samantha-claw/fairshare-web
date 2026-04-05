"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, Users, ArrowUpRight } from "lucide-react";
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
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-amber-500 via-orange-500 to-red-500",
  "from-pink-500 via-rose-500 to-fuchsia-600",
  "from-violet-500 via-purple-500 to-indigo-600",
  "from-cyan-500 via-blue-500 to-indigo-600",
];

const STATUS_COLORS = {
  positive: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/30",
  },
  negative: {
    bg: "bg-rose-500/10",
    text: "text-rose-500",
    border: "border-rose-500/30",
  },
  neutral: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-500",
    border: "border-gray-200 dark:border-gray-700",
  },
};

// ==========================================
// 🎨 GLASS GROUP CARD COMPONENT
// ==========================================
interface GlassGroupCardProps {
  group: GroupBalance;
  gradient: string;
  status: keyof typeof STATUS_COLORS;
  isFeatured?: boolean;
  isOwner: boolean;
}

function GlassGroupCard({ group, gradient, status, isFeatured, isOwner }: GlassGroupCardProps) {
  const statusStyle = STATUS_COLORS[status];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={isFeatured ? "sm:col-span-2" : ""}
    >
      <Link
        href={`/dashboard/groups/${group.group_id}`}
        className="group relative h-full overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 block"
      >
        {/* Image/Gradient Section */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <div className={`h-full w-full bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-110`} />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />
          
          {/* Tags/Badges */}
          <div className="absolute bottom-3 left-3 flex gap-2">
            <span className="bg-white/50 dark:bg-black/50 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full text-white">
              {group.currency}
            </span>
            {isOwner && (
              <span className="bg-amber-500/80 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full text-white">
                Owner
              </span>
            )}
          </div>
          
          {/* Hover Overlay Action */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/25"
            >
              <Users className="h-4 w-4" />
              View Group
            </motion.div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="flex flex-col gap-4 p-5">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-white transition-colors group-hover:text-emerald-500">
                {group.group_name}
              </h3>
              <ArrowUpRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-500" />
            </div>
            
            {/* Balance Badge */}
            <div className="mt-3">
              {group.net_balance > 0 ? (
                <div className={`inline-flex items-center gap-1.5 rounded-full ${statusStyle.bg} ${statusStyle.text} px-3 py-1.5 text-xs font-bold ${statusStyle.border} border`}>
                  <TrendingUp className="h-3 w-3" />
                  Gets back {formatCurrency(group.net_balance, group.currency)}
                </div>
              ) : group.net_balance < 0 ? (
                <div className={`inline-flex items-center gap-1.5 rounded-full ${statusStyle.bg} ${statusStyle.text} px-3 py-1.5 text-xs font-bold ${statusStyle.border} border`}>
                  <TrendingDown className="h-3 w-3" />
                  Owes {formatCurrency(Math.abs(group.net_balance), group.currency)}
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-bold text-gray-500 border border-gray-200 dark:border-gray-700">
                  <Wallet className="h-3 w-3" />
                  Settled up
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200/50 dark:border-gray-700/50 pt-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm border border-white/50">
                {group.group_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-xs">
                <span className="font-medium text-gray-900 dark:text-white">
                  Group
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {new Date(group.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Users className="h-3 w-3" />
              <span>Members</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ==========================================
// 🎨 UI RENDER — EMPTY STATE
// ==========================================
function EmptyState() {
  return (
    <div className="rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 py-20 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center"
      >
        <Wallet className="h-8 w-8 text-emerald-500" />
      </motion.div>
      <h4 className="text-lg font-bold text-gray-900 dark:text-white">
        No groups yet
      </h4>
      <p className="mx-auto mt-1 max-w-xs text-sm text-gray-500 dark:text-gray-400">
        Create your first group to start splitting expenses with friends.
      </p>
      <Link
        href="/dashboard/groups/new"
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-black dark:bg-white text-white dark:text-black px-6 py-3 text-sm font-semibold shadow-lg transition-all hover:scale-105"
      >
        Create your first group
      </Link>
    </div>
  );
}

// ==========================================
// 🎨 UI RENDER — MAIN GRID
// ==========================================
export function GroupsBentoGrid({ groups, userId }: GroupsBentoGridProps) {
  if (groups.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid auto-rows-[minmax(280px,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
      {groups.slice(0, 6).map((group, index) => {
        const gradient = GRADIENTS[index % GRADIENTS.length];
        const status = group.net_balance > 0
          ? "positive"
          : group.net_balance < 0
          ? "negative"
          : "neutral";
        const isFeatured = index === 0;
        const isOwner = group.owner_id === userId;

        return (
          <GlassGroupCard
            key={group.group_id}
            group={group}
            gradient={gradient}
            status={status}
            isFeatured={isFeatured}
            isOwner={isOwner}
          />
        );
      })}
    </div>
  );
}
