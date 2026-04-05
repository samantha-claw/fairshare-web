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
// ⚙️ GRADIENTS & COLORS (Premium palette - no purple)
// ==========================================
const GRADIENTS = [
  "from-slate-800 via-slate-700 to-slate-600",
  "from-emerald-700 via-emerald-600 to-teal-600",
  "from-amber-700 via-orange-600 to-red-600",
  "from-rose-700 via-pink-600 to-rose-500",
  "from-cyan-700 via-teal-600 to-cyan-600",
  "from-stone-700 via-stone-600 to-stone-500",
];

const STATUS_COLORS = {
  positive: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
  },
  negative: {
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/30",
  },
  neutral: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
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
        className="group relative h-full overflow-hidden rounded-2xl border border-border/50 bg-card/30 backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 block"
      >
        {/* Image/Gradient Section */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <motion.div
            className={`h-full w-full bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-110`}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />
          
          {/* Tags/Badges */}
          <div className="absolute bottom-3 left-3 flex gap-2">
            <span className="bg-background/50 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full text-foreground">
              {group.currency}
            </span>
            {isOwner && (
              <span className="bg-amber-500/90 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full text-white">
                Owner
              </span>
            )}
          </div>
          
          {/* Hover Overlay Action */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25"
            >
              <Users className="h-4 w-4" />
              View Group
            </motion.button>
          </motion.div>
        </div>
        
        {/* Content Section */}
        <div className="flex flex-col gap-4 p-5">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
                {group.group_name}
              </h3>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
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
                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground border border-border">
                  <Wallet className="h-3 w-3" />
                  Settled up
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/50 pt-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-bold text-sm border border-border/50">
                {group.group_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-xs">
                <span className="font-medium text-foreground">
                  Group
                </span>
                <span className="text-muted-foreground">
                  {new Date(group.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
    <div className="rounded-3xl border-2 border-dashed border-border bg-muted/30 py-20 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center"
      >
        <Wallet className="h-8 w-8 text-primary" />
      </motion.div>
      <h4 className="text-lg font-bold text-foreground">
        No groups yet
      </h4>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
        Create your first group to start splitting expenses with friends.
      </p>
      <Link
        href="/dashboard/groups/new"
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-foreground text-background px-6 py-3 text-sm font-semibold shadow-lg transition-all hover:scale-105"
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
