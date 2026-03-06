"use client";

import { useState, useCallback, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Member, Expense } from "@/types/group";

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

  /* ── Modal state ─────────────────────────────────────── */
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [submittingExpense, setSubmittingExpense] = useState(false);

  /* ── Who Paid State (الجديد) ─────────────────────────── */
  const [paidBy, setPaidBy] = useState<string>("");

  /* ── Custom Splits State ─────────────────────────────── */
  const [computedSplits, setComputedSplits] = useState<any[]>([]);
  const [isValidSplit, setIsValidSplit] = useState(false);
  const [splitType, setSplitType] = useState<string>("equal");

  const openAddExpenseModal = useCallback(() => {
    setEditingExpenseId(null);
    setExpenseName("");
    setExpenseAmount("");
    setPaidBy(currentUserId);
    setComputedSplits([]);
    setIsValidSplit(false);
    setIsExpenseModalOpen(true);
  }, [currentUserId]);

  const openEditExpenseModal = useCallback((exp: Expense) => {
    setEditingExpenseId(exp.id);
    setExpenseName(exp.name);
    setExpenseAmount(exp.amount.toString());
    setPaidBy(exp.paid_by);
    setIsExpenseModalOpen(true);
  }, []);

  const handleSaveExpense = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!expenseName || !expenseAmount) return;

      // حماية إضافية: التأكد من أن التقسيم سليم قبل الإرسال
      if (!isValidSplit || computedSplits.length === 0) {
        alert("Please ensure the split is valid and amounts match the total.");
        return;
      }

      setSubmittingExpense(true);

      const rpcName = editingExpenseId
        ? "edit_expense_custom_split"
        : "add_expense_custom_split";

      // 🎯 تجهيز البيانات لترسل المبالغ المحددة لكل شخص
      const splitsPayload = computedSplits.map((split) => ({
        user_id: split.userId,
        amount: split.amount,
      }));

      const rpcParams = editingExpenseId
        ? {
            _expense_id: editingExpenseId,
            _name: expenseName,
            _amount: parseFloat(expenseAmount),
            _paid_by: paidBy,
            _splits: splitsPayload,
            _split_type: splitType,
          }
        : {
            _group_id: groupId,
            _name: expenseName,
            _amount: parseFloat(expenseAmount),
            _paid_by: paidBy,
            _splits: splitsPayload,
            _split_type: splitType,
          };

      const { error: rpcError } = await supabase.rpc(rpcName, rpcParams);

      if (rpcError) {
        alert("Error saving expense: " + rpcError.message);
      } else {
        setIsExpenseModalOpen(false);
        setEditingExpenseId(null);
        setExpenseName("");
        setExpenseAmount("");
        setPaidBy("");
        setComputedSplits([]);
        refetch();
      }

      setSubmittingExpense(false);
    },
    [
      groupId,
      expenseName,
      expenseAmount,
      paidBy,
      computedSplits,
      splitType,
      isValidSplit,
      editingExpenseId,
      supabase,
      refetch,
    ]
  );

  const handleDeleteExpense = useCallback(
    async (expenseId: string, name: string) => {
      const confirmed = confirm(
        `Delete "${name}"? This will recalculate all balances.`
      );
      if (!confirmed) return;

      const { error: delError } = await supabase.rpc("delete_expense", {
        _expense_id: expenseId,
      });

      if (delError) {
        alert("Error deleting expense: " + delError.message);
      } else {
        refetch();
      }
    },
    [supabase, refetch]
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