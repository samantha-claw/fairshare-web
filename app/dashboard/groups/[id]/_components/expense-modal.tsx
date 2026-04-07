"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { Modal } from "@/components/ui/modal";
import type { Member } from "@/types/group";
import {
  SplitTypeSelector,
  type SplitType as SelectorSplitType,
  type ComputedSplit,
} from "./split-selector";
import type { SplitType } from "@/hooks/group/use-group-expenses";

// ─── Props Interface ───
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
  onSplitDataChange?: (
    splits: ComputedSplit[],
    splitType: SplitType,
    isValid: boolean
  ) => void;
  paidBy: string;
  onPaidByChange: (val: string) => void;
  currentUserId: string;
  initialSplitType?: SelectorSplitType;
  initialSplits?: ComputedSplit[];
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
  paidBy,
  onPaidByChange,
  currentUserId,
  initialSplitType = "equal",
  initialSplits = [],
}: ExpenseModalProps) {
  const title = editingExpenseId ? "Edit Expense" : "Add Expense";

  // ─── Split-related internal state ───
  const [splitType, setSplitType] = useState<SelectorSplitType>("equal");
  const [allocations, setAllocations] = useState<Map<string, number>>(
    new Map()
  );
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [computedSplits, setComputedSplits] = useState<ComputedSplit[]>([]);
  const [isValidSplit, setIsValidSplit] = useState(false);

  // ─── Scroll-shadow state ───
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  // ─── Initialize / reset when modal opens ───
  useEffect(() => {
    if (isOpen && members.length > 0) {
      setSplitType(initialSplitType);

      if (initialSplits.length > 0) {
        // Editing — seed from existing split data
        const newAllocations = new Map<string, number>();
        const newSelected = new Set<string>();

        initialSplits.forEach((split) => {
          newSelected.add(split.userId);

          if (initialSplitType === "percentage") {
            newAllocations.set(split.userId, split.percentage);
          } else if (initialSplitType === "shares") {
            newAllocations.set(split.userId, split.shares);
          } else {
            // "exact" or "equal" (equal doesn't use allocations, but setting it is harmless)
            newAllocations.set(split.userId, split.amount);
          }
        });

        setSelectedMembers(newSelected);
        setAllocations(newAllocations);
        setComputedSplits(initialSplits);
        setIsValidSplit(true);
      } else {
        // Adding new expense — reset to defaults
        setSelectedMembers(new Set(members.map((m) => m.id)));
        setAllocations(new Map());
        setComputedSplits([]);
        setIsValidSplit(false);
      }
    }
  }, [isOpen, members]);

  // ─── Notify parent whenever split data changes ───
  useEffect(() => {
    onSplitDataChange?.(computedSplits, splitType as SplitType, isValidSplit);
  }, [computedSplits, splitType, isValidSplit, onSplitDataChange]);

  // ─── Update scroll shadows ───
  const updateShadows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowTopShadow(el.scrollTop > 2);
    setShowBottomShadow(
      el.scrollTop + el.clientHeight < el.scrollHeight - 2
    );
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isOpen) return;

    // Defer to allow DOM to paint first
    const raf = requestAnimationFrame(updateShadows);
    el.addEventListener("scroll", updateShadows, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", updateShadows);
    };
  }, [isOpen, members, splitType]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {/*
        Flex column layout:
        ┌──────────────────────┐
        │  FIXED TOP (inputs)  │  shrink-0
        ├──────────────────────┤
        │  SCROLLABLE MIDDLE   │  overflow-y-auto, max-h constrained
        │  (split selector)    │
        ├──────────────────────┤
        │  FIXED BOTTOM (btns) │  shrink-0
        └──────────────────────┘
      */}
      <form
        onSubmit={onSubmit}
        className="flex max-h-[85vh] flex-col overflow-hidden sm:max-h-[80vh]"
      >
        {/* ═══════════════════════════════════════════ */}
        {/* ██  FIXED TOP — Header + Inputs           ██ */}
        {/* ═══════════════════════════════════════════ */}
        <div className="shrink-0 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-text-primary sm:text-xl">
              {title}
            </h3>
            <p className="mt-0.5 text-sm text-text-secondary">
              Split among selected members.
            </p>
          </div>

          {/* ── Description ── */}
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dinner"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={expenseName}
              onChange={(e) => onExpenseNameChange(e.target.value)}
            />
          </div>

          {/* ── Amount ── */}
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Amount
            </label>
            <input
              type="number"
              required
              step="0.01"
              placeholder="0.00"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 font-mono text-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={expenseAmount}
              onChange={(e) => onExpenseAmountChange(e.target.value)}
            />
          </div>

          {/* ── Paid By ── */}
          <div className="mb-1">
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Paid by
            </label>
            <div className="relative">
              <select
                value={paidBy}
                onChange={(e) => onPaidByChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-300 bg-surface px-3 py-2.5 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.id === currentUserId
                      ? "You"
                      : (member as any).display_name ||
                        (member as any).name ||
                        (member as any).full_name ||
                        "Unknown"}
                  </option>
                ))}
              </select>
              {/* Custom dropdown chevron */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  className="h-4 w-4 text-text-tertiary"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* ██  SCROLLABLE MIDDLE — Split Selector    ██ */}
        {/* ═══════════════════════════════════════════ */}
        <div className="relative min-h-0 flex-1 flex flex-col">

{/* Top scroll shadow */}

<div

className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-gradient-to-b from-surface to-transparent transition-opacity duration-200 ${

showTopShadow ? "opacity-100" : "opacity-0"

}`}

/>


<div

ref={scrollRef}

className="flex-1 overflow-y-auto overscroll-contain px-5 py-3 sm:px-6 custom-scrollbar"

>

            <label className="mb-2 block text-sm font-medium text-text-primary">
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

          {/* Bottom scroll shadow */}
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-4 bg-gradient-to-t from-surface to-transparent transition-opacity duration-200 ${
              showBottomShadow ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* ██  FIXED BOTTOM — Action Buttons         ██ */}
        {/* ═══════════════════════════════════════════ */}
        <div className="shrink-0 border-t border-border bg-surface-2/80 px-5 py-4 sm:px-6">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-surface-2 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-gray-200 active:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isValidSplit}
              className="flex-1 rounded-xl bg-text-primary py-3 text-sm font-medium text-white transition-colors hover:opacity-90 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Saving…"
                : editingExpenseId
                  ? "Save Changes"
                  : "Add Expense"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}