"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import type { FormEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import type { Member } from "@/types/group";

// ==========================================
// 🧩 TYPES
// ==========================================
interface SettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherMembers: Member[];
  settleReceiver: string;
  onReceiverChange: (id: string) => void;
  settleAmount: string;
  onAmountChange: (amount: string) => void;
  currency: string;
  submitting: boolean;
  onSubmit: (e: FormEvent) => void;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function SettleModal({
  isOpen,
  onClose,
  otherMembers,
  settleReceiver,
  onReceiverChange,
  settleAmount,
  onAmountChange,
  currency,
  submitting,
  onSubmit,
}: SettleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

        <div className="relative mb-20 w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl sm:my-8">
  <div className="px-6 pb-6 pt-6">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-2xl">🤝</span>
              <h3 className="text-xl font-bold text-gray-900">Settle Up</h3>
            </div>
            <p className="text-sm text-gray-500">Record a payment to a group member. They will need to approve it.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Who are you paying?</label>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
                  {otherMembers.length === 0 ? (
                    <p className="p-3 text-center text-sm text-gray-400">No other members in this group.</p>
                  ) : (
                    otherMembers.map((m) => (
                      <label
                        key={m.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors ${
                          settleReceiver === m.id ? "bg-blue-50 ring-1 ring-blue-300" : "hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="settle-receiver"
                          value={m.id}
                          checked={settleReceiver === m.id}
                          onChange={() => onReceiverChange(m.id)}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Avatar src={m.avatar_url} name={m.display_name || m.username} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{m.display_name || m.full_name || m.username}</p>
                          <p className="truncate text-xs text-gray-500">@{m.username}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{currency}</span>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-300 p-3 pl-14 font-mono text-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={settleAmount}
                    onChange={(e) => onAmountChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p className="text-xs text-blue-700">
                  This settlement will be <strong>pending</strong> until the recipient approves it. Balances update only after approval.
                </p>
              </div>

              <div className="flex gap-3 border-t border-gray-100 pt-4">
                <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting || !settleReceiver || !settleAmount}
                  className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" /> Sending…</span>
                  ) : (
                    "Send Settlement"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}