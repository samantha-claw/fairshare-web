"use client";

import { useState, useCallback, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslations, useLocale } from "next-intl";
import { validate } from "@/lib/validate";
import { settlementSchema } from "@/lib/validations";
import { formatCurrency } from "@/lib/utils";

/**
 * Manages the settle-up modal and all settlement actions
 * (initiate, approve, reject, delete).
 */
export function useGroupSettlements(
  groupId: string,
  currentUser: string | null,
  refetch: () => void,
  balances?: { user_id: string; net_balance: number }[]
) {
  const supabase = createClient();
  const toast = useToast();
  const t = useTranslations("toasts");
  const locale = useLocale();

  /* ── Modal state ─────────────────────────────────────── */
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleReceiver, setSettleReceiver] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [submittingSettle, setSubmittingSettle] = useState(false);
  const [processingSettlementId, setProcessingSettlementId] = useState<
    string | null
  >(null);

  const openSettleUpModal = useCallback((recipientId?: string, amount?: number) => {
    setSettleReceiver(recipientId ?? "");
    setSettleAmount(amount != null ? String(amount) : "");
    setIsSettleModalOpen(true);
  }, []);

  const handleInitiateSettlement = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      const validation = validate(settlementSchema, {
        to_user: settleReceiver,
        amount: parseFloat(settleAmount),
      });
      if (!validation.success) {
        toast.error(Object.values(validation.errors)[0]);
        return;
      }

      const { to_user, amount: validatedAmount } = validation.data;

      if (!currentUser) {
        toast.error(t("expenses.sessionExpired"));
        return;
      }

      // Calculate what the current user owes the recipient
      const currentUserBalance = balances?.find(b => b.user_id === currentUser);
      const recipientBalance = balances?.find(b => b.user_id === to_user);

      // Current user's net_balance is their overall balance
      // If current user has negative balance and recipient has positive,
      // and they're in a simplified debt relationship, calculate the owed amount
      let owed = 0;
      if (currentUserBalance && recipientBalance) {
        // Simplified: if I have negative balance and they have positive,
        // the amount I owe them is proportional to their share of total credits
        const myDebt = currentUserBalance.net_balance < 0 ? Math.abs(currentUserBalance.net_balance) : 0;
        const theirCredit = recipientBalance.net_balance > 0 ? recipientBalance.net_balance : 0;

        // Simple heuristic: if I'm in debt and they're owed, assume I owe them up to the minimum
        if (myDebt > 0 && theirCredit > 0) {
          owed = Math.min(myDebt, theirCredit);
        }
      }

      // Overpay confirmation dialog
      if (owed > 0 && validatedAmount > owed + 0.01) {
        const overpay = validatedAmount - owed;
        const confirmed = await toast.confirm(
          `You currently owe approximately ${formatCurrency(owed, "USD", locale)} but you're paying ${formatCurrency(validatedAmount, "USD", locale)}. The extra ${formatCurrency(overpay, "USD", locale)} will become a credit — they will owe you. Continue?`,
          { confirmLabel: "Yes, Continue", cancelLabel: "Cancel" }
        );
        if (!confirmed) {
          setSubmittingSettle(false);
          return;
        }
      }

      setSubmittingSettle(true);

      try {
        // Call the create_settlement RPC instead of direct insert
        const { data: settlementId, error: rpcError } = await supabase.rpc(
          "create_settlement",
          {
            _group_id: groupId,
            _to_user: to_user,
            _amount: validatedAmount,
            _notes: "Settle up",
          }
        );

        if (rpcError) {
          console.error("RPC error:", rpcError);
          toast.error(rpcError.message || t("settlements.createFailed"));
          return;
        }

        setIsSettleModalOpen(false);
        setSettleReceiver("");
        setSettleAmount("");
        // 🎉 Celebrate the settlement!
        const { fireSettlementConfetti } = await import("@/lib/confetti");
        fireSettlementConfetti();
        refetch();
      } catch (err) {
        console.error(err);
        toast.error(t("friends.unexpectedError"));
      } finally {
        setSubmittingSettle(false);
      }
    },
    [
      groupId,
      currentUser,
      settleReceiver,
      settleAmount,
      balances,
      supabase,
      refetch,
      toast,
      t,
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
          toast.error(rpcError.message);
          return;
        }
        refetch();
      } catch (err) {
        console.error(err);
        toast.error(t("settlements.approveFailed"));
      } finally {
        setProcessingSettlementId(null);
      }
    },
    [currentUser, supabase, refetch, toast, t]
  );

  const handleRejectSettlement = useCallback(
    async (settlementId: string) => {
      if (!currentUser) return;

      const confirmed = await toast.confirm(
        "Reject this settlement?",
        {
          confirmLabel: "Reject",
          cancelLabel: "Cancel"
        }
      );
      if (!confirmed) return;

      setProcessingSettlementId(settlementId);
      try {
        const { error: rpcError } = await supabase.rpc(
          "respond_to_settlement",
          { p_settlement_id: settlementId, p_action: "reject" }
        );
        if (rpcError) {
          toast.error(rpcError.message);
          return;
        }
        refetch();
      } catch (err) {
        console.error(err);
        toast.error(t("settlements.rejectFailed"));
      } finally {
        setProcessingSettlementId(null);
      }
    },
    [currentUser, supabase, refetch, toast, t]
  );

  const handleDeleteSettlement = useCallback(
    async (settlementId: string) => {
      if (!currentUser) return;

      const confirmed = await toast.confirm(
        "Cancel this settlement request?",
        {
          confirmLabel: "Cancel Request",
          cancelLabel: "Keep"
        }
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
          toast.error(deleteError.message);
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
        toast.error(t("settlements.deleteFailed"));
      } finally {
        setProcessingSettlementId(null);
      }
    },
    [groupId, currentUser, supabase, refetch, toast, t]
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