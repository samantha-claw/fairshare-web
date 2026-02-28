"use client";

import { useState, useCallback, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Manages the settle-up modal and all settlement actions
 * (initiate, approve, reject, delete).
 */
export function useGroupSettlements(
  groupId: string,
  currentUser: string | null,
  refetch: () => void
) {
  const supabase = createClient();

  /* ── Modal state ─────────────────────────────────────── */
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
        alert("Please select who you are paying.");
        return;
      }
      if (!settleAmount || parseFloat(settleAmount) <= 0) {
        alert("Please enter a valid amount.");
        return;
      }
      if (!currentUser) {
        alert("Session expired. Please refresh.");
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
          alert("Error: " + insertError.message);
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
        alert("An unexpected error occurred.");
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
          alert("Error: " + rpcError.message);
          return;
        }
        refetch();
      } catch (err) {
        console.error(err);
      } finally {
        setProcessingSettlementId(null);
      }
    },
    [currentUser, supabase, refetch]
  );

  const handleRejectSettlement = useCallback(
    async (settlementId: string) => {
      if (!currentUser) return;

      const confirmed = confirm(
        "Reject this settlement?"
      );
      if (!confirmed) return;

      setProcessingSettlementId(settlementId);
      try {
        const { error: rpcError } = await supabase.rpc(
          "respond_to_settlement",
          { p_settlement_id: settlementId, p_action: "reject" }
        );
        if (rpcError) {
          alert("Error: " + rpcError.message);
          return;
        }
        refetch();
      } catch (err) {
        console.error(err);
      } finally {
        setProcessingSettlementId(null);
      }
    },
    [currentUser, supabase, refetch]
  );

  const handleDeleteSettlement = useCallback(
    async (settlementId: string) => {
      if (!currentUser) return;

      const confirmed = confirm(
        "Cancel this settlement request?"
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
          alert("Error: " + deleteError.message);
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
      } finally {
        setProcessingSettlementId(null);
      }
    },
    [groupId, currentUser, supabase, refetch]
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