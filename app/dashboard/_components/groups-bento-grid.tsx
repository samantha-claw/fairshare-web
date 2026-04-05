"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, Users, Crown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
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
  { from: "#667eea", via: "#764ba2", to: "#f093fb" },
  { from: "#00c9ff", via: "#92fe9d", to: "#00c9ff" },
  { from: "#ff6b6b", via: "#feca57", to: "#ff9ff3" },
  { from: "#5f27cd", via: "#341f97", to: "#222f3e" },
  { from: "#00d2d3", via: "#54a0ff", to: "#5f27cd" },
  { from: "#ff9f43", via: "#ee5a24", to: "#b33939" },
  { from: "#10ac84", via: "#1dd1a1", to: "#00d2d3" },
  { from: "#5f27cd", via: "#a55eea", to: "#f368e0" },
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
// 🎨 IPHONE-STYLE GROUP CARD
// ==========================================
interface GroupCardProps {
  group: GroupBalance;
  gradient: { from: string; via: string; to: string };
  status: keyof typeof STATUS_COLORS;
  isFeatured?: boolean;
  isOwner: boolean;
}

function IPhoneGroupCard({ group, gradient, status, isFeatured, isOwner }: GroupCardProps) {
  const statusStyle = STATUS_COLORS[status];
  // Using a default count since member_count is not in GroupBalance type
  const memberCount = 3;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`group relative ${isFeatured ? "sm:col-span-2" : ""}`}
    >
      <Link
        href={`/dashboard/groups/${group.group_id}`}
        className="block"
      >
        {/* iPhone Frame */}
        <div className="relative bg-black rounded-[2.5rem] p-[3px] shadow-2xl shadow-black/30 transition-transform duration-300 group-hover:scale-[1.02] group-hover:shadow-black/40">
          {/* Screen */}
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 rounded-[2.3rem] overflow-hidden">
            {/* Dynamic Island */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
              <div className="w-24 h-7 bg-black rounded-full flex items-center justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-700" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
              </div>
            </div>
            
            {/* Status Bar */}
            <div className="absolute top-2 left-0 right-0 z-10 px-8 flex justify-between items-center text-white/80 text-[10px] font-medium">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="flex gap-[2px]">
                  <div className="w-1 h-2 bg-white/60 rounded-sm" />
                  <div className="w-1 h-2 bg-white/60 rounded-sm" />
                  <div className="w-1 h-3 bg-white/80 rounded-sm" />
                  <div className="w-1 h-4 bg-white rounded-sm" />
                </div>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C7.5 3 3.75 5.5 2 9c1.75 3.5 5.5 6 10 6s8.25-2.5 10-6c-1.75-3.5-5.5-6-10-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" opacity="0.8"/>
                  <path d="M1 9l2 2-2 2z" opacity="0.6"/>
                </svg>
                <div className="w-6 h-3 border border-white/60 rounded-sm relative">
                  <div className="absolute inset-0.5 right-1 bg-white rounded-sm" />
                </div>
              </div>
            </div>
            
            {/* Hero Section - Group Icon */}
            <div 
              className={`relative overflow-hidden ${isFeatured ? "h-48" : "h-36"}`}
              style={{
                background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.via} 50%, ${gradient.to} 100%)`
              }}
            >
              {/* Glassmorphism Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30 backdrop-blur-[1px]" />
              
              {/* Decorative Circles */}
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
              <div className="absolute right-4 top-4 w-16 h-16 rounded-full bg-white/5" />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-black/20 blur-lg" />
              
              {/* Owner Badge */}
              {isOwner && (
                <div className="absolute top-12 right-4 z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="flex items-center gap-1 bg-black/30 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20"
                  >
                    <Crown className="w-3 h-3 text-yellow-400" />
                    Owner
                  </motion.div>
                </div>
              )}
              
              {/* Group Initial Avatar */}
              <div className="absolute bottom-4 left-4">
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className={`relative flex items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md font-black text-white shadow-2xl border border-white/30 ${isFeatured ? "w-16 h-16 text-3xl" : "w-12 h-12 text-xl"}`}
                >
                  {group.group_name.charAt(0).toUpperCase()}
                  {/* Shine Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-60" />
                </motion.div>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="p-4 space-y-3">
              {/* Title */}
              <div className="flex items-start justify-between gap-2">
                <h3 className={`font-bold text-white truncate ${isFeatured ? "text-lg" : "text-sm"}`}>
                  {group.group_name}
                </h3>
                <motion.div
                  className="flex-shrink-0"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              </div>
              
              {/* Balance Badge */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className={`inline-flex items-center gap-1.5 rounded-full ${statusStyle.bg} ${statusStyle.text} px-3 py-1.5 text-xs font-bold ${statusStyle.border} border backdrop-blur-sm`}
              >
                {status === "positive" && <TrendingUp className="w-3 h-3" />}
                {status === "negative" && <TrendingDown className="w-3 h-3" />}
                {status === "neutral" && <Wallet className="w-3 h-3" />}
                {status === "positive" && `Gets back ${formatCurrency(group.net_balance, group.currency)}`}
                {status === "negative" && `Owes ${formatCurrency(Math.abs(group.net_balance), group.currency)}`}
                {status === "neutral" && "Settled up"}
              </motion.div>
              
              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-white/50 text-[10px]">
                  <Users className="w-3 h-3" />
                  <span>{memberCount} members</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
                    {group.currency}
                  </span>
                  <span className="text-[10px] text-white/40">
                    {new Date(group.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Home Indicator */}
            <div className="pb-2 pt-1 flex justify-center">
              <div className="w-32 h-1 bg-white/30 rounded-full" />
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
    <div className="grid auto-rows-[minmax(200px,auto)] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
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
          <IPhoneGroupCard
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
