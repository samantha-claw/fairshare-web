"use client";

import { useState, useCallback, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Member, Expense } from "@/types/group";
import { useToast } from "@/hooks/use-toast";

export function useGroupExpenses(
  groupId: string,
  members: Member[],
  refetch: () => void
) {
  const supabase = createClient();
  const toast = useToast();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(
    null
  );
  const [submittingExpense, setSubmittingExpense] = useState(false);

  const openAddExpenseModal = useCallback(() => {
    setEditingExpenseId(null);
    setExpenseName("");
    setExpenseAmount("");
    setSelectedMembers(members.map((m) => m.id));
    setIsExpenseModalOpen(true);
  }, [members]);

  const openEditExpenseModal = useCallback((exp: Expense) => {
    setEditingExpenseId(exp.id);
    setExpenseName(exp.name);
    setExpenseAmount(exp.amount.toString());
    setSelectedMembers(
      exp.expense_splits?.map((split) => split.user_id) || []
    );
    setIsExpenseModalOpen(true);
  }, []);

  const handleSaveExpense = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!expenseName || !expenseAmount) return;
      if (selectedMembers.length === 0) {
        toast.error(
          "Please select at least one member to split with."
        );
        return;
      }

      setSubmittingExpense(true);

      const rpcName = editingExpenseId
        ? "edit_expense_custom_split"
        : "add_expense_custom_split";

      const rpcParams = editingExpenseId
        ? {
            _expense_id: editingExpenseId,
            _name: expenseName,
            _amount: parseFloat(expenseAmount),
            _participant_ids: selectedMembers,
          }
        : {
            _group_id: groupId,
            _name: expenseName,
            _amount: parseFloat(expenseAmount),
            _participant_ids: selectedMembers,
          };

      const { error: rpcError } = await supabase.rpc(rpcName, rpcParams);

      if (rpcError) {
        toast.error("Error saving expense: " + rpcError.message);
      } else {
        setIsExpenseModalOpen(false);
        setEditingExpenseId(null);
        setExpenseName("");
        setExpenseAmount("");
        setSelectedMembers([]);
        refetch();
      }

      setSubmittingExpense(false);
    },
    [
      groupId,
      expenseName,
      expenseAmount,
      selectedMembers,
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
        { confirmLabel: "Delete" }
      );
      if (!confirmed) return;

      const { error: delError } = await supabase.rpc("delete_expense", {
        _expense_id: expenseId,
      });

      if (delError) {
        toast.error("Error deleting expense: " + delError.message);
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
    selectedMembers,
    setSelectedMembers,
    editingExpenseId,
    submittingExpense,
    openAddExpenseModal,
    openEditExpenseModal,
    handleSaveExpense,
    handleDeleteExpense,
  };
}