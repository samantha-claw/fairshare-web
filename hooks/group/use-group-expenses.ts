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
  refetch: () => void
) {
  const supabase = createClient();

  /* ── Modal state ─────────────────────────────────────── */
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [submittingExpense, setSubmittingExpense] = useState(false);

  /* ── Custom Splits State (الجديد) ────────────────────── */
  const [computedSplits, setComputedSplits] = useState<any[]>([]);
  const [isValidSplit, setIsValidSplit] = useState(false);

  const openAddExpenseModal = useCallback(() => {
    setEditingExpenseId(null);
    setExpenseName("");
    setExpenseAmount("");
    setComputedSplits([]);
    setIsValidSplit(false);
    setIsExpenseModalOpen(true);
  }, []);

  const openEditExpenseModal = useCallback((exp: Expense) => {
    setEditingExpenseId(exp.id);
    setExpenseName(exp.name);
    setExpenseAmount(exp.amount.toString());
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

      // 🎯 السر هنا: تجهيز البيانات لترسل المبالغ المحددة لكل شخص
      const splitsPayload = computedSplits.map((split) => ({
        user_id: split.userId,
        amount: split.amount,
      }));

      const rpcParams = editingExpenseId
        ? {
            _expense_id: editingExpenseId,
            _name: expenseName,
            _amount: parseFloat(expenseAmount),
            _splits: splitsPayload, // نرسل الأرقام المحسوبة بدلاً من الـ IDs فقط
          }
        : {
            _group_id: groupId,
            _name: expenseName,
            _amount: parseFloat(expenseAmount),
            _splits: splitsPayload, // نرسل الأرقام المحسوبة بدلاً من الـ IDs فقط
          };

      const { error: rpcError } = await supabase.rpc(rpcName, rpcParams);

      if (rpcError) {
        alert("Error saving expense: " + rpcError.message);
      } else {
        setIsExpenseModalOpen(false);
        setEditingExpenseId(null);
        setExpenseName("");
        setExpenseAmount("");
        setComputedSplits([]);
        refetch();
      }

      setSubmittingExpense(false);
    },
    [
      groupId,
      expenseName,
      expenseAmount,
      computedSplits,
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
    computedSplits, // تم التصدير
    setComputedSplits, // تم التصدير
    isValidSplit, // تم التصدير
    setIsValidSplit, // تم التصدير
    editingExpenseId,
    submittingExpense,
    openAddExpenseModal,
    openEditExpenseModal,
    handleSaveExpense,
    handleDeleteExpense,
  };
}
