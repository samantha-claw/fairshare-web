"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import {
  Clock,
  Inbox,
  Check,
  X,
  Send,
} from "lucide-react";
import type { PendingRequest, OutgoingRequest } from "@/types/friend";

// ==========================================
// ⚙️ LOGIC
// ==========================================

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

// ==========================================
// 🧩 TYPES
// ==========================================
interface PendingRequestsProps {
  incoming: PendingRequest[];
  outgoing: OutgoingRequest[];
  loadingPending: boolean;
  acceptingId: string | null;
  decliningId: string | null;
  cancellingId: string | null;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onCancel: (requestId: string) => void;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function PendingRequests({
  incoming,
  outgoing,
  loadingPending,
  acceptingId,
  decliningId,
  cancellingId,
  onAccept,
  onDecline,
  onCancel,
}: PendingRequestsProps) {
  const totalCount = incoming.length + outgoing.length;

  if (totalCount === 0 && !loadingPending) return null;

  return (
    <section className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-orange-50/30 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-amber-100/60 px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100">
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
        <h2 className="text-sm font-bold text-amber-900">Pending Requests</h2>
        {totalCount > 0 && (
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-200 px-1.5 text-[10px] font-bold text-amber-800">
            {totalCount}
          </span>
        )}
      </div>

      <div className="px-6 py-4">
        {loadingPending ? (
          <div className="flex items-center justify-center py-6">
            <Spinner className="h-5 w-5 text-amber-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Incoming Requests */}
            {incoming.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-600/70">
                  Incoming
                </p>
                <div className="space-y-2">
                  {incoming.map((req) => {
                    const name =
                      req.sender_display_name || req.sender_username;
                    const isAccepting = acceptingId === req.request_id;
                    const isDeclining = decliningId === req.request_id;
                    const isProcessing = isAccepting || isDeclining;

                    return (
                      <div
                        key={req.request_id}
                        className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-white/80 p-3.5 backdrop-blur-sm transition-all duration-200 hover:shadow-md"
                      >
                        <Link
                          href={`/dashboard/profile/${req.sender_id}`}
                          className="flex-shrink-0"
                        >
                          <Avatar
                            src={req.sender_avatar_url}
                            name={name}
                            size="md"
                          />
                        </Link>

                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/dashboard/profile/${req.sender_id}`}
                            className="block truncate text-sm font-semibold text-gray-900 hover:text-indigo-600"
                          >
                            {name}
                          </Link>
                          <p className="truncate text-xs text-gray-500">
                            @{req.sender_username} ·{" "}
                            {timeAgo(req.created_at)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onAccept(req.request_id)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isAccepting ? (
                              <Spinner className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={() => onDecline(req.request_id)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeclining ? (
                              <Spinner className="h-3 w-3" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Outgoing Requests */}
            {outgoing.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-600/70">
                  Sent by you
                </p>
                <div className="space-y-2">
                  {outgoing.map((req) => {
                    const name =
                      req.receiver_display_name || req.receiver_username;
                    const isCancelling = cancellingId === req.request_id;

                    return (
                      <div
                        key={req.request_id}
                        className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/60 p-3.5 backdrop-blur-sm transition-all duration-200"
                      >
                        <Link
                          href={`/dashboard/profile/${req.receiver_id}`}
                          className="flex-shrink-0"
                        >
                          <Avatar
                            src={req.receiver_avatar_url}
                            name={name}
                            size="md"
                          />
                        </Link>

                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/dashboard/profile/${req.receiver_id}`}
                            className="block truncate text-sm font-semibold text-gray-900 hover:text-indigo-600"
                          >
                            {name}
                          </Link>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Send className="h-2.5 w-2.5" />
                            <span>Sent {timeAgo(req.created_at)}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => onCancel(req.request_id)}
                          disabled={isCancelling}
                          className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isCancelling ? (
                            <Spinner className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          Cancel
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}