"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Clock, Check, X, Send } from "lucide-react";
import type { PendingRequest, OutgoingRequest } from "@/types/friend";

// ==========================================
// ⚙️ LOGIC
// ==========================================
function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
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
    <section className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/50 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
        <h2 className="text-sm font-bold text-foreground">Pending Requests</h2>
        {totalCount > 0 && (
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500/10 px-1.5 text-xs font-bold text-amber-600">
            {totalCount}
          </span>
        )}
      </div>

      <div className="px-5 py-4">
        {loadingPending ? (
          <div className="flex items-center justify-center py-6">
            <Spinner className="h-5 w-5 text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Incoming Requests */}
            {incoming.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Incoming
                </p>
                <div className="space-y-2">
                  {incoming.map((req) => {
                    const name = req.sender_display_name || req.sender_username;
                    const isAccepting = acceptingId === req.request_id;
                    const isDeclining = decliningId === req.request_id;
                    const isProcessing = isAccepting || isDeclining;

                    return (
                      <div
                        key={req.request_id}
                        className="flex items-center gap-3 rounded-xl border border-border/50 bg-background p-3.5 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                      >
                        <Link
                          href={`/dashboard/profile/${req.sender_id}`}
                          className="flex-shrink-0"
                        >
                          <Avatar src={req.sender_avatar_url} name={name} size="md" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/dashboard/profile/${req.sender_id}`}
                            className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                          >
                            {name}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            @{req.sender_username} · {timeAgo(req.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onAccept(req.request_id)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isAccepting ? <Spinner className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                            Accept
                          </button>
                          <button
                            onClick={() => onDecline(req.request_id)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeclining ? <Spinner className="h-3 w-3" /> : <X className="h-3 w-3" />}
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
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Sent by you
                </p>
                <div className="space-y-2">
                  {outgoing.map((req) => {
                    const name = req.receiver_display_name || req.receiver_username;
                    const isCancelling = cancellingId === req.request_id;

                    return (
                      <div
                        key={req.request_id}
                        className="flex items-center gap-3 rounded-xl border border-border/50 bg-background p-3.5 transition-all duration-200"
                      >
                        <Link
                          href={`/dashboard/profile/${req.receiver_id}`}
                          className="flex-shrink-0"
                        >
                          <Avatar src={req.receiver_avatar_url} name={name} size="md" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/dashboard/profile/${req.receiver_id}`}
                            className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                          >
                            {name}
                          </Link>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Send className="h-2.5 w-2.5" />
                            <span>Sent {timeAgo(req.created_at)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => onCancel(req.request_id)}
                          disabled={isCancelling}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isCancelling ? <Spinner className="h-3 w-3" /> : <X className="h-3 w-3" />}
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
