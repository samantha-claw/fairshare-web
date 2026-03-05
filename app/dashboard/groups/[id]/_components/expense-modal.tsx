// expense-modal.tsx
"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Modal } from "@/components/ui/modal";
import type { Member } from "@/types/group";
import {
  SplitTypeSelector,
  type SplitType,
  type ComputedSplit,
} from "./split-selector";

// ─── Updated Props Interface ───
interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpenseId: string | null;
  expenseName: string;
  onExpenseNameChange: (name: string) => void;
  expenseAmount: string;
  onExpenseAmountChange: (amount: string) => void;
  members: Member[];
  submitting: boolean;
  onSubmit: (e: FormEvent) => void;
  /** Parent receives computed split results whenever they change */
  onSplitDataChange?: (
    splits: ComputedSplit[],
    splitType: SplitType,
    isValid: boolean
  ) => void;
}

export function ExpenseModal({
  isOpen,
  onClose,
  editingExpenseId,
  expenseName,
  onExpenseNameChange,
  expenseAmount,
  onExpenseAmountChange,
  members,
  submitting,
  onSubmit,
  onSplitDataChange,
}: ExpenseModalProps) {
  const title = editingExpenseId ? "Edit Expense" : "Add Expense";

  // ─── Split-related internal state ───
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [allocations, setAllocations] = useState<Map<string, number>>(
    new Map()
  );
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [computedSplits, setComputedSplits] = useState<ComputedSplit[]>([]);
  const [isValidSplit, setIsValidSplit] = useState(false);

  // ─── Initialize / reset when modal opens ───
  useEffect(() => {
    if (isOpen && members.length > 0) {
      setSelectedMembers(new Set(members.map((m) => m.id)));
      setSplitType("equal");
      setAllocations(new Map());
      setComputedSplits([]);
      setIsValidSplit(false);
    }
  }, [isOpen, members]);

  // ─── Notify parent whenever split data changes ───
  useEffect(() => {
    onSplitDataChange?.(computedSplits, splitType, isValidSplit);
  }, [computedSplits, splitType, isValidSplit, onSplitDataChange]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="px-6 pb-6 pt-6">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">
          Split among selected members.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {/* ── Description (UNCHANGED) ── */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dinner"
              className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={expenseName}
              onChange={(e) => onExpenseNameChange(e.target.value)}
            />
          </div>

          {/* ── Amount (UNCHANGED) ── */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Amount
            </label>
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

          {/* ══════════════════════════════════════════════ */}
          {/* ██  REPLACED: old checklist → SplitTypeSelector  ██ */}
          {/* ══════════════════════════════════════════════ */}
          <div className="pt-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Split between
            </label>

            <SplitTypeSelector
              splitType={splitType}
              onSplitTypeChange={setSplitType}
              members={members}
              totalAmount={parseFloat(expenseAmount) || 0}
              allocations={allocations}
              onAllocationChange={(userId, value) => {
                setAllocations((prev) => {
                  const next = new Map(prev);
                  next.set(userId, value);
                  return next;
                });
              }}
              selectedMembers={selectedMembers}
              onSelectedMembersChange={setSelectedMembers}
              onComputedSplitsChange={(splits, isValid) => {
                setComputedSplits(splits);
                setIsValidSplit(isValid);
              }}
              currency="$"
            />
          </div>

          {/* ── Action Buttons (submit disabled tied to isValidSplit) ── */}
          <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isValidSplit}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Saving…"
                : editingExpenseId
                  ? "Save Changes"
                  : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}