"use client";

import { useState, useCallback, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const toast = useToast();
  /* ── Modal state ─────────────────────────────────────── */
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleReceiver, setSettleReceiver] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [submittingSettle, setSubmittingSettle] = useState(false);

  /* ── Action loading ──────────────────────────────────── */
  const [processingSettlementId, setProcessingSettlementId] = useState<
    string | null
  >(null);

  /* ── Open modal ──────────────────────────────────────── */
  const openSettleUpModal = useCallback(() => {
    setSettleReceiver("");
    setSettleAmount("");
    setIsSettleModalOpen(true);
  }, []);

  /* ── Initiate ────────────────────────────────────────── */
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
    [groupId, currentUser, settleReceiver, settleAmount, supabase, refetch]
  );

  /* ── Approve ─────────────────────────────────────────── */
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
      } finally {
        setProcessingSettlementId(null);
      }
    },
    [currentUser, supabase, refetch]
  );

  /* ── Reject ──────────────────────────────────────────── */
  const handleRejectSettlement = useCallback(
    async (settlementId: string) => {
      if (!currentUser) return;
      if (!confirm("Are you sure you want to reject this settlement?")) return;
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
        toast.error("An unexpected error occurred while rejecting settlement.");
      } finally {
        setProcessingSettlementId(null);
      }
    },
    [currentUser, supabase, refetch]
  );

  /* ── Delete (cancel own pending) ─────────────────────── */
  const handleDeleteSettlement = useCallback(
    async (settlementId: string) => {
      if (!currentUser) return;
      if (!confirm("Cancel this settlement request?")) return;
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
      } finally {
        setProcessingSettlementId(null);
      }
    },
    [groupId, currentUser, supabase, refetch]
  );

  /* ── Public API ──────────────────────────────────────── */
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