"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/utils";
import type { Settlement } from "@/types/group";

// ==========================================
// 🧩 TYPES
// ==========================================
interface PendingSettlementsProps {
  settlements: Settlement[];
  currentUser: string | null;
  currency: string;
  processingSettlementId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function PendingSettlements({
  settlements,
  currentUser,
  currency,
  processingSettlementId,
  onApprove,
  onReject,
  onDelete,
}: PendingSettlementsProps) {
  if (settlements.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/30 p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg">⏳</span>
        <h2 className="text-sm font-semibold text-amber-800">
          Pending Settlements ({settlements.length})
        </h2>
      </div>

      <div className="space-y-3">
        {settlements.map((s) => {
          const isSender = currentUser === s.from_user;
          const isReceiver = currentUser === s.to_user;
          const isProcessing = processingSettlementId === s.id;

          return (
            <div
              key={s.id}
              className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <Link href={`/dashboard/profile/${s.from_user}`}>
                  <Avatar
                    src={s.from_profile.avatar_url}
                    name={s.from_profile.display_name || s.from_profile.username}
                    size="sm"
                  />
                </Link>
                <div className="text-sm">
                  <p className="text-gray-800">
                    <Link href={`/dashboard/profile/${s.from_user}`} className="font-semibold hover:text-blue-600 hover:underline">
                      {isSender ? "You" : s.from_profile.display_name || s.from_profile.username}
                    </Link>
                    {" → "}
                    <Link href={`/dashboard/profile/${s.to_user}`} className="font-semibold hover:text-blue-600 hover:underline">
                      {isReceiver ? "You" : s.to_profile.display_name || s.to_profile.username}
                    </Link>
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(s.created_at).toLocaleString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(s.amount, currency)}
                </span>

                {isReceiver && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onApprove(s.id)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing ? <Spinner className="h-3.5 w-3.5" /> : "✅"} Approve
                    </button>
                    <button
                      onClick={() => onReject(s.id)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing ? <Spinner className="h-3.5 w-3.5" /> : "❌"} Reject
                    </button>
                  </div>
                )}

                {isSender && (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Pending…</span>
                    <button
                      onClick={() => onDelete(s.id)}
                      disabled={isProcessing}
                      className="p-1 text-gray-400 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Cancel request"
                    >
                      {isProcessing ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}

                {!isSender && !isReceiver && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}