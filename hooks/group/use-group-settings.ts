"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import type { Group, Balance } from "@/types/group";
import { useToast } from "@/hooks/use-toast";

export function useGroupSettings(
  groupId: string,
  group: Group | null,
  currentUser: string | null,
  balances: Balance[]
) {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);

  const handleDeleteGroup = useCallback(async () => {
    if (!group || deleteConfirmText !== group.name) {
      toast.error(
        "Please type the group name exactly to confirm deletion."
      );
      return;
    }

    setDeletingGroup(true);
    try {
      const { error: deleteError } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId)
        .eq("owner_id", currentUser!);

      if (deleteError) {
        toast.error(
          "Error deleting group: " + deleteError.message
        );
        return;
      }

      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    } finally {
      setDeletingGroup(false);
    }
  }, [
    group,
    groupId,
    currentUser,
    deleteConfirmText,
    supabase,
    router,
    toast,
  ]);

  const handleLeaveGroup = useCallback(async () => {
    if (!currentUser) return;

    const myBal = balances.find((b) => b.user_id === currentUser);
    if (myBal && myBal.net_balance !== 0) {
      toast.error(
        "You must settle your balances before leaving the group. " +
          (myBal.net_balance > 0
            ? `You are still owed ${formatCurrency(myBal.net_balance, group?.currency)}.`
            : `You still owe ${formatCurrency(Math.abs(myBal.net_balance), group?.currency)}.`)
      );
      return;
    }

    const confirmed = await toast.confirm(
      "Leave this group? This action cannot be undone.",
      { confirmLabel: "Leave group" }
    );
    if (!confirmed) return;

    setLeavingGroup(true);
    try {
      const { error: leaveError } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", currentUser);

      if (leaveError) {
        toast.error(
          "Error leaving group: " + leaveError.message
        );
        return;
      }

      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    } finally {
      setLeavingGroup(false);
    }
  }, [
    currentUser,
    groupId,
    group?.currency,
    balances,
    supabase,
    router,
    toast,
  ]);

  return {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    deleteConfirmText,
    setDeleteConfirmText,
    deletingGroup,
    leavingGroup,
    handleDeleteGroup,
    handleLeaveGroup,
  };
}