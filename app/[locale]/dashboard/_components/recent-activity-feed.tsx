"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { Clock, Zap } from "lucide-react";
import type { RecentExpense } from "@/types/dashboard";

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
  "bg-text-primary",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-purple-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-blue-500",
];

// ==========================================
// 🧩 TYPES
// ==========================================
interface RecentActivityFeedProps {
  expenses: RecentExpense[];
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function RecentActivityFeed({ expenses }: RecentActivityFeedProps) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-8 text-center shadow-sm">
        <Clock className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium text-text-secondary">No recent activity yet</p>
        <p className="mt-1 text-xs text-text-tertiary">Expenses will appear here as they are added.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50">
          <Zap className="h-4 w-4 text-text-primary" />
        </div>
        <h3 className="text-sm font-bold text-text-primary">Recent Activity</h3>
      </div>

      <div className="relative space-y-1">
        {/* Timeline Line */}
        <div className="absolute bottom-0 left-[15px] top-0 w-px bg-gradient-to-b from-gray-200 via-gray-100 to-transparent" />

        {expenses.map((expense, index) => {
          const dotColor = DOT_COLORS[index % DOT_COLORS.length];
          const paidByName = expense.paid_by_profile?.display_name || "Someone";
          const paidByAvatar = expense.paid_by_profile?.avatar_url || "";
          const groupName = expense.expense_group?.name || "Unknown";

          return (
            <Link
              key={expense.id}
              href={`/dashboard/groups/${expense.group_id}`}
              className="group relative flex items-start gap-4 rounded-2xl p-3 transition-all hover:bg-surface-2/80"
            >
              {/* Timeline Dot */}
              <div className="relative z-10 mt-1.5 flex-shrink-0">
                <div className={`h-[9px] w-[9px] rounded-full ${dotColor} ring-4 ring-white`} />
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                <Avatar src={paidByAvatar} name={paidByName} size="sm" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary group-hover:text-text-primary">
                      {expense.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-text-secondary">
                      {paidByName} • {groupName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="whitespace-nowrap font-mono text-sm font-bold text-text-primary">
                      {formatCurrency(expense.amount)}
                    </span>
                    <span className="whitespace-nowrap text-[10px] text-text-tertiary">
                      {getRelativeTime(expense.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}