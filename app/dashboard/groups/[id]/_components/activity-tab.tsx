"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { ActivityItem, Expense, Settlement } from "@/types/group";

// ==========================================
// 🧩 TYPES
// ==========================================
interface ActivityTabProps {
  allActivities: ActivityItem[];
  currency: string;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function ActivityTab({ allActivities, currency }: ActivityTabProps) {
  if (allActivities.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-500">No activity to show yet.</p>;
  }

  return (
    <div className="relative ml-4 space-y-6 border-l-2 border-gray-100 pb-4">
      {allActivities.map((item) => {
        if (item.type === "expense") {
          const exp = item as Expense & { type: "expense" };
          const isSettleUp =
            exp.name.toLowerCase().includes("settle up") ||
            exp.name.toLowerCase().includes("cash payment");
          return (
            <div key={`expense-${exp.id}`} className="relative pl-6">
              <span
                className={`absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${
                  isSettleUp ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                }`}
              >
                {isSettleUp ? "🤝" : "💸"}
              </span>
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm text-gray-800">
                    <Link
                      href={`/dashboard/profile/${exp.paid_by}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 hover:underline"
                    >
                      {exp.profiles?.display_name || exp.profiles?.full_name || "Someone"}
                    </Link>{" "}
                    {isSettleUp ? "settled up" : "added"}{" "}
                    <span className="font-semibold text-gray-900">{exp.name}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {new Date(exp.created_at).toLocaleString("en-US", {
                      weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className={`whitespace-nowrap text-sm font-bold ${isSettleUp ? "text-green-600" : "text-gray-900"}`}>
                  {formatCurrency(exp.amount, currency)}
                </div>
              </div>
            </div>
          );
        } else {
          const s = item as Settlement & { type: "settlement" };
          return (
            <div key={`settlement-${s.id}`} className="relative pl-6">
              <span className="absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 ring-4 ring-white">
                🤝
              </span>
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm text-gray-800">
                    <Link
                      href={`/dashboard/profile/${s.from_user}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 hover:underline"
                    >
                      {s.from_profile.display_name || s.from_profile.username}
                    </Link>{" "}
                    paid{" "}
                    <Link
                      href={`/dashboard/profile/${s.to_user}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 hover:underline"
                    >
                      {s.to_profile.display_name || s.to_profile.username}
                    </Link>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {new Date(s.created_at).toLocaleString("en-US", {
                      weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="whitespace-nowrap text-sm font-bold text-green-600">
                  {formatCurrency(s.amount, currency)}
                </div>
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}