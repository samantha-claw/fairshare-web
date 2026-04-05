"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Clock, Zap, Receipt } from "lucide-react";
import type { ProfileActivity } from "@/types/profile";

// ==========================================
// ⚙️ LOGIC
// ==========================================

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = now.getTime() - then.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const DOT_COLORS = [
  "bg-text-text-primary",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-purple-500",
  "bg-cyan-500",
];

// ==========================================
// 🧩 TYPES
// ==========================================
interface ActivityLogProps {
  activities: ProfileActivity[];
  isOwnProfile: boolean;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function ActivityLog({ activities, isOwnProfile }: ActivityLogProps) {
  if (!isOwnProfile) return null;

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
          <Zap className="h-3.5 w-3.5 text-text-primary" />
        </div>
        <h3 className="text-sm font-bold text-text-primary">Recent Activity</h3>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2">
            <Clock className="h-6 w-6 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-text-secondary">
            No activity yet
          </p>
          <p className="mt-0.5 text-xs text-text-tertiary">
            Your expense history will appear here.
          </p>
        </div>
      ) : (
        <div className="relative space-y-1">
          {/* Timeline Line */}
          <div className="absolute bottom-0 left-[15px] top-0 w-px bg-gradient-to-b from-gray-200 via-gray-100 to-transparent" />

          {activities.map((activity, index) => {
            const dotColor = DOT_COLORS[index % DOT_COLORS.length];

            return (
              <Link
                key={activity.id}
                href={`/dashboard/groups/${activity.group_id}`}
                className="group relative flex items-start gap-4 rounded-2xl p-3 transition-all duration-200 hover:bg-surface-2/80"
              >
                {/* Timeline Dot */}
                <div className="relative z-10 mt-2 flex-shrink-0">
                  <div
                    className={`h-[9px] w-[9px] rounded-full ${dotColor} ring-4 ring-white`}
                  />
                </div>

                {/* Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-2 text-text-tertiary transition-colors group-hover:bg-indigo-50 group-hover:text-text-primary">
                    <Receipt className="h-4 w-4" />
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary transition-colors group-hover:text-text-primary">
                        {activity.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-text-tertiary">
                        {activity.group_name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="whitespace-nowrap font-mono text-sm font-bold text-text-primary">
                        {formatCurrency(activity.amount)}
                      </span>
                      <span className="whitespace-nowrap text-[10px] text-text-tertiary">
                        {getRelativeTime(activity.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}