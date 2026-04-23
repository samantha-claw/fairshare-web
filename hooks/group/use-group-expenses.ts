"use client";

import { useState, useCallback, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validate } from "@/lib/validate";
import { expenseSchema } from "@/lib/validations";
import type { Member, Expense, ExpenseCategory } from "@/types/group";

export type SplitType = "equal" | "exact" | "custom" | "percentage" | "shares";

/**
 * Manages the expense modal state and all expense CRUD operations.
 */
export function useGroupExpenses(
  groupId: string,
  members: Member[],
  refetch: () => void,
  currentUserId: string
) {
  const supabase = createClient();
  const toast = useToast();

  /* ── Modal state ─────────────────────────────────────── */
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [submittingExpense, setSubmittingExpense] = useState(false);

  /* ── Who Paid State ─────────────────────────────── */
  const [paidBy, setPaidBy] = useState<string>("");

  /* ── Category State ─────────────────────────────── */
  const [category, setCategory] = useState<ExpenseCategory>("other");

  /* ── Custom Splits State ─────────────────────────────── */
  const [computedSplits, setComputedSplits] = useState<any[]>([]);
  const [isValidSplit, setIsValidSplit] = useState(false);
  const [splitType, setSplitType] = useState<SplitType>("equal");

  const openAddExpenseModal = useCallback(() => {
    setEditingExpenseId(null);
    setExpenseName("");
    setExpenseAmount("");
    setPaidBy(currentUserId);
    setCategory("other");
    setComputedSplits([]);
    setIsValidSplit(false);
    setIsExpenseModalOpen(true);
  }, [currentUserId]);

  const openEditExpenseModal = useCallback(
    (exp: Expense) => {
      const rawSplits = ((exp as any).expense_splits || []) as any[];
      const splitMemberIds = rawSplits
        .map((s) => s?.user_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);

      const fallbackIds =
        splitMemberIds.length > 0 ? splitMemberIds : members.map((m) => m.id);
      const evenAmount =
        fallbackIds.length > 0 ? exp.amount / fallbackIds.length : 0;

      const derivedSplits = fallbackIds.map((userId) => {
        const split = rawSplits.find((s) => s?.user_id === userId);
        const directAmount = Number(
          split?.amount ?? split?.split_amount ?? split?.owed_amount
        );
        const amount =
          Number.isFinite(directAmount) && directAmount > 0
            ? directAmount
            : evenAmount;
        return {
          userId,
          amount,
          percentage:
            exp.amount > 0
              ? +((amount / exp.amount) * 100).toFixed(2)
              : 0,
          shares: Number(split?.shares ?? 1),
        };
      });

      setEditingExpenseId(exp.id);
      setExpenseName(exp.name);
      setExpenseAmount(exp.amount.toString());
      setPaidBy(exp.paid_by);
      setCategory((exp.category as ExpenseCategory) || "other");

      const rawDbSplit = ((exp as any).split_type as string)?.toLowerCase();
      const validSplitType = [
        "equal",
        "exact",
        "custom",
        "percentage",
        "shares",
      ].includes(rawDbSplit)
        ? (rawDbSplit as SplitType)
        : "equal";
      setSplitType(validSplitType);
      setComputedSplits(derivedSplits);
      setIsValidSplit(derivedSplits.length > 0);
      setIsExpenseModalOpen(true);
    },
    [members]
  );

  const handleSaveExpense = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const trimmedName = expenseName.trim();
      const amount = parseFloat(expenseAmount);

      // For RPC — lean payload, no percentage
      const splitsPayload = computedSplits.map((split) => ({
        user_id: split.userId,
        amount: split.amount,
      }));

      // For Zod — include percentage when relevant
      const splitsForValidation = computedSplits.map((split) => ({
        user_id: split.userId,
        amount: split.amount,
        ...(splitType === "percentage" ? { percentage: split.percentage } : {}),
      }));

      const validation = validate(expenseSchema, {
        name: trimmedName,
        amount,
        paid_by: paidBy,
        split_type: splitType,
        category,
        splits: splitsForValidation,
      });

      if (!validation.success) {
        toast.error(Object.values(validation.errors)[0]);
        return;
      }

      const validatedExpense = validation.data;
      setSubmittingExpense(true);

      const rpcName = editingExpenseId
        ? "edit_expense_custom_split"
        : "add_expense_custom_split";

      const rpcParams = editingExpenseId
        ? {
            _expense_id: editingExpenseId,
            _name: validatedExpense.name,
            _amount: validatedExpense.amount,
            _paid_by: validatedExpense.paid_by,
            _splits: splitsPayload,
            _split_type: validatedExpense.split_type,
            _category: category,
          }
        : {
            _group_id: groupId,
            _name: validatedExpense.name,
            _amount: validatedExpense.amount,
            _paid_by: validatedExpense.paid_by,
            _splits: splitsPayload,
            _split_type: validatedExpense.split_type,
            _category: category,
          };

      try {
        const { error: rpcError } = await supabase.rpc(rpcName, rpcParams);

        if (rpcError) {
          console.error("Failed to save expense:", rpcError);
          toast.error(
            editingExpenseId
              ? "Failed to update the expense."
              : "Failed to add the expense."
          );
        } else {
          setIsExpenseModalOpen(false);
          setEditingExpenseId(null);
          setExpenseName("");
          setExpenseAmount("");
          setPaidBy("");
          setCategory("other");
          setComputedSplits([]);
          refetch();
        }
      } catch (error) {
        console.error("Failed to save expense:", error);
        toast.error(
          editingExpenseId
            ? "Failed to update the expense."
            : "Failed to add the expense."
        );
      } finally {
        setSubmittingExpense(false);
      }
    },
    [
      groupId,
      expenseName,
      expenseAmount,
      paidBy,
      category,
      computedSplits,
      splitType,
      editingExpenseId,
      supabase,
      refetch,
      toast,
    ]
  );

  const handleDeleteExpense = useCallback(
    async (expenseId: string, name: string) => {
      const confirmed = await toast.confirm(
        `Delete "${name}"? This will recalculate all balances.`,
        { confirmLabel: "Delete", cancelLabel: "Cancel" }
      );
      if (!confirmed) return;

      const { error: delError } = await supabase.rpc("delete_expense", {
        _expense_id: expenseId,
      });

      if (delError) {
        console.error("Failed to delete expense:", delError);
        toast.error("Failed to delete the expense.");
      } else {
        refetch();
      }
    },
    [supabase, refetch, toast]
  );

  return {
    isExpenseModalOpen,
    setIsExpenseModalOpen,
    expenseName,
    setExpenseName,
    expenseAmount,
    setExpenseAmount,
    paidBy,
    setPaidBy,
    category,
    setCategory,
    computedSplits,
    setComputedSplits,
    isValidSplit,
    setIsValidSplit,
    editingExpenseId,
    submittingExpense,
    openAddExpenseModal,
    openEditExpenseModal,
    handleSaveExpense,
    handleDeleteExpense,
    splitType,
    setSplitType,
  };
}
