"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/utils";
import { simplifyDebts } from "@/lib/debt-simplifier";
import { ArrowRight, CheckCircle, Clock, ArrowDown, Handshake, AlertCircle } from "lucide-react";
import type { Balance, Settlement } from "@/types/group";

interface SettleTabProps {
  balances: Balance[];
  pendingSettlements: Settlement[];
  currentUser: string | null;
  currency: string;
  processingSettlementId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  onSettleUp: () => void;
}

export function SettleTab({
  balances,
  pendingSettlements,
  currentUser,
  currency,
  processingSettlementId,
  onApprove,
  onReject,
  onDelete,
  onSettleUp,
}: SettleTabProps) {
  // Simplify debts
  const simplifiedDebts = simplifyDebts(
    balances.map((b: any) => ({
      userId: b.user_id,
      displayName: b.display_name,
      avatarUrl: b.avatar_url,
      amount: b.net_balance,
    }))
  );

  return (
    <div className="space-y-6">
      {/* ⚠️ PENDING SETTLEMENTS FIRST */}
      {pendingSettlements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/20 overflow-hidden"
        >
          {/* Header */}
          <div className="border-b border-amber-200 dark:border-amber-900/50 px-5 py-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                Pending Requests
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {pendingSettlements.length} settlement{pendingSettlements.length !== 1 ? "s" : ""} waiting for approval
              </p>
            </div>
          </div>

          {/* List */}
          <div className="p-4 space-y-3">
            {pendingSettlements.map((s, index) => {
              const isSender = currentUser === s.from_user;
              const isReceiver = currentUser === s.to_user;
              const isProcessing = processingSettlementId === s.id;

              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-surface p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Link href={`/dashboard/profile/${s.from_user}`} className="shrink-0">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Avatar
                          src={s.from_profile.avatar_url}
                          name={s.from_profile.display_name || s.from_profile.username}
                          size="md"
                        />
                      </motion.div>
                    </Link>

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Link
                        href={`/dashboard/profile/${s.from_user}`}
                        className="font-semibold text-text-primary hover:underline truncate"
                      >
                        {isSender ? "You" : s.from_profile.display_name}
                      </Link>
                      <ArrowRight className="h-4 w-4 text-text-tertiary shrink-0" />
                      <Link
                        href={`/dashboard/profile/${s.to_user}`}
                        className="font-semibold text-text-primary hover:underline truncate"
                      >
                        {isReceiver ? "You" : s.to_profile.display_name}
                      </Link>
                    </div>

                    <Link href={`/dashboard/profile/${s.to_user}`} className="shrink-0">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Avatar
                          src={s.to_profile.avatar_url}
                          name={s.to_profile.display_name || s.to_profile.username}
                          size="md"
                        />
                      </motion.div>
                    </Link>
                  </div>

                  {/* Amount + Actions */}
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-text-primary">
                      {formatCurrency(s.amount, currency)}
                    </p>

                    <div className="flex items-center gap-2">
                      {isReceiver && (
                        <>
                          <button
                            onClick={() => onApprove(s.id)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-positive px-4 py-2 text-sm font-medium text-surface transition-all hover:opacity-90 disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Spinner className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => onReject(s.id)}
                            disabled={isProcessing}
                            className="inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-negative transition-all hover:bg-negative/10 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {isSender && (
                        <>
                          <span className="text-sm text-amber-600 dark:text-amber-400">
                            Waiting for approval...
                          </span>
                          <button
                            onClick={() => onDelete(s.id)}
                            disabled={isProcessing}
                            className="p-2 text-text-tertiary hover:text-negative transition-colors disabled:opacity-50"
                            title="Cancel request"
                          >
                            {isProcessing ? (
                              <Spinner className="h-4 w-4" />
                            ) : (
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* SIMPLIFIED DEBTS SECTION */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border px-5 py-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2">
            <Handshake className="h-5 w-5 text-text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Who Owes Whom</h3>
            <p className="text-sm text-text-secondary">
              Simplified to minimum transactions
            </p>
          </div>
        </div>

        <div className="p-5">
          {simplifiedDebts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface-2/50 p-8 text-center">
              <CheckCircle className="h-10 w-10 text-positive mx-auto mb-3" />
              <p className="font-semibold text-text-primary">All settled up! 🎉</p>
              <p className="text-sm text-text-secondary mt-1">No one owes anything.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {simplifiedDebts.map((debt, i) => {
                const isSender = currentUser === debt.from.userId;
                const isReceiver = currentUser === debt.to.userId;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-border bg-surface-2/50 p-4"
                  >
                    {/* From → To */}
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/dashboard/profile/${debt.from.userId}`}
                        className="shrink-0"
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <Avatar
                            src={debt.from.avatarUrl}
                            name={debt.from.displayName}
                            size="md"
                          />
                        </motion.div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {isSender ? "You" : debt.from.displayName}
                        </p>
                        <p className="text-xs text-negative">owes</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1">
                          <span className="text-sm font-bold text-text-primary">
                            {formatCurrency(debt.amount, currency)}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-text-tertiary" />
                      </div>

                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {isReceiver ? "You" : debt.to.displayName}
                        </p>
                        <p className="text-xs text-positive">receives</p>
                      </div>

                      <Link
                        href={`/dashboard/profile/${debt.to.userId}`}
                        className="shrink-0"
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <Avatar
                            src={debt.to.avatarUrl}
                            name={debt.to.displayName}
                            size="md"
                          />
                        </motion.div>
                      </Link>
                    </div>

                    {/* Pay Button - only show if current user is the sender */}
                    {isSender && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <button
                          onClick={onSettleUp}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-text-primary px-4 py-3 text-sm font-medium text-surface transition-all hover:opacity-90"
                        >
                          <Handshake className="h-4 w-4" />
                          Pay {isReceiver ? "yourself" : debt.to.displayName}
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
