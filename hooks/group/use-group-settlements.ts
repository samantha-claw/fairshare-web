"use client";

import { useState, useCallback, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useGroupSettlements(
  groupId: string,
  currentUser: string | null,
  refetch: () => void
) {
  const supabase = createClient();
  const toast = useToast();

  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleReceiver, setSettleReceiver] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [submittingSettle, setSubmittingSettle] = useState(false);
  const [processingSettlementId, setProcessingSettlementId] = useState<
    string | null
  >(null);

  const openSettleUpModal = useCallback(() => {
    setSettleReceiver("");
    setSettleAmount("");
    setIsSettleModalOpen(true);
  }, []);

  const handleInitiateSettlement = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!settleReceiver) {
        toast.error("Please select who you are paying.");
        return;
      }
      if (!settleAmount || parseFloat(settleAmount) <= 0) {
        toast.error("Please enter a valid amount.");
        return;
      }
      if (!currentUser) {
        toast.error("Session expired. Please refresh.");
        return;
      }

      setSubmittingSettle(true);

      try {
        const { error: insertError } = await supabase
          .from("settlements")
          .insert({
            group_id: groupId,
            from_user: currentUser,
            to_user: settleReceiver,
            amount: parseFloat(settleAmount),
            status: "pending",
            notes: "Settle up",
            created_by: currentUser,
          });

        if (insertError) {
          toast.error("Error: " + insertError.message);
          return;
        }

        await supabase.from("activity_log").insert({
          group_id: groupId,
          user_id: currentUser,
          action: "settlement_initiated",
          metadata: {
            amount: parseFloat(settleAmount),
            to_user: settleReceiver,
            type: "settlement",
          },
        });

        setIsSettleModalOpen(false);
        setSettleReceiver("");
        setSettleAmount("");
        refetch();
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred.");
      } finally {
        setSubmittingSettle(false);
      }
    },
    [
      groupId,
      currentUser,
      settleReceiver,
      settleAmount,
      supabase,
      refetch,
      toast,
    ]
  );

  const handleApproveSettlement = useCallback(
    async (settlementId: string) => {
      if (!currentUser) return;
      setProcessingSettlementId(settlementId);
      try {
        const { error: rpcError } = await supabase.rpc(
          "respond_to_settlement",
          { p_settlement_id: settlementId, p_action: "approve" }
        );
        if (rpcError) {
          toast.error("Error: " + rpcError.message);
          return;
        }
        refetch();
      } catch (err) {
        console.error(err);
        toast.error("Failed to approve settlement.");
      } finally {
        setProcessingSettlementId(null);
      }
    },
    [currentUser, supabase, refetch, toast]
  );

  const handleRejectSettlement = useCallback(
    async (settlementId: string) => {
      if (!currentUser) return;

      const confirmed = await toast.confirm(
        "Reject this settlement?",
        { confirmLabel: "Reject" }
      );
      if (!confirmed) return;

      setProcessingSettlementId(settlementId);
      try {
        const { error: rpcError } = await supabase.rpc(
          "respond_to_settlement",
          { p_settlement_id: settlementId, p_action: "reject" }
        );
        if (rpcError) {
          toast.error("Error: " + rpcError.message);
          return;
        }
        refetch();
      } catch (err) {
        console.error(err);
        toast.error(
          "An unexpected error occurred while rejecting settlement."
        );
      } finally {
        setProcessingSettlementId(null);
      }
    },
    [currentUser, supabase, refetch, toast]
  );

  const handleDeleteSettlement = useCallback(
    async (settlementId: string) => {
      if (!currentUser) return;

      const confirmed = await toast.confirm(
        "Cancel this settlement request?",
        { confirmLabel: "Cancel request", cancelLabel: "Keep it" }
      );
      if (!confirmed) return;

      setProcessingSettlementId(settlementId);

      try {
        const { error: deleteError } = await supabase
          .from("settlements")
          .delete()
          .eq("id", settlementId)
          .eq("from_user", currentUser)
          .eq("status", "pending");

        if (deleteError) {
          toast.error("Error: " + deleteError.message);
          return;
        }

        await supabase.from("activity_log").insert({
          group_id: groupId,
          user_id: currentUser,
          action: "settlement_deleted",
          metadata: { settlement_id: settlementId },
        });

        refetch();
      } catch (err) {
        console.error(err);
        toast.error("Failed to cancel settlement.");
      } finally {
        setProcessingSettlementId(null);
      }
    },
    [groupId, currentUser, supabase, refetch, toast]
  );

  return {
    isSettleModalOpen,
    setIsSettleModalOpen,
    settleReceiver,
    setSettleReceiver,
    settleAmount,
    setSettleAmount,
    submittingSettle,
    processingSettlementId,
    openSettleUpModal,
    handleInitiateSettlement,
    handleApproveSettlement,
    handleRejectSettlement,
    handleDeleteSettlement,
  };
}