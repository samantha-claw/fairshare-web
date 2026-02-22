"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import type { FormEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import type { Member } from "@/types/group";

// ==========================================
// 🧩 TYPES
// ==========================================
interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpenseId: string | null;
  expenseName: string;
  onExpenseNameChange: (name: string) => void;
  expenseAmount: string;
  onExpenseAmountChange: (amount: string) => void;
  selectedMembers: string[];
  onSelectedMembersChange: (members: string[]) => void;
  members: Member[];
  submitting: boolean;
  onSubmit: (e: FormEvent) => void;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function ExpenseModal({
  isOpen,
  onClose,
  editingExpenseId,
  expenseName,
  onExpenseNameChange,
  expenseAmount,
  onExpenseAmountChange,
  selectedMembers,
  onSelectedMembersChange,
  members,
  submitting,
  onSubmit,
}: ExpenseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
<div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
<div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl sm:my-8">
          <div className="px-6 pb-6 pt-6">
            <h3 className="text-xl font-bold text-gray-900">
              {editingExpenseId ? "Edit Expense" : "Add Expense"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">Split among selected members.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dinner"
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={expenseName}
                  onChange={(e) => onExpenseNameChange(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-gray-300 p-3 font-mono text-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={expenseAmount}
                  onChange={(e) => onExpenseAmountChange(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <label className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
                  <span>Split equally between:</span>
                  <button
                    type="button"
                    onClick={() => onSelectedMembersChange(members.map((m) => m.id))}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Select All
                  </button>
                </label>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
                  {members.map((m) => (
                    <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-100">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedMembers.includes(m.id)}
                        onChange={(e) => {
                          if (e.target.checked) onSelectedMembersChange([...selectedMembers, m.id]);
                          else onSelectedMembersChange(selectedMembers.filter((id) => id !== m.id));
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <Avatar src={m.avatar_url} name={m.display_name || m.username} size="sm" />
                        <span className="text-sm font-medium text-gray-700">{m.display_name || m.username}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedMembers.length} of {members.length} selected
                  {selectedMembers.length > 0 && (
                    <>
                      {" · "}
                      <button type="button" onClick={() => onSelectedMembersChange([])} className="text-red-500 hover:underline">Clear</button>
                    </>
                  )}
                </p>
              </div>

              <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4">
                <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting || selectedMembers.length === 0}
                  className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Saving…" : editingExpenseId ? "Save Changes" : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}