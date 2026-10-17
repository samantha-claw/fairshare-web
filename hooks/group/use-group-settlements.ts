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
  const [supabase] = useState(() => createClient());
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

  const openSettleUpModal = useCallback(
    (recipientId?: string, amount?: number) => {
      setSettleReceiver(recipientId ?? "");
      setSettleAmount(amount != null ? String(amount) : "");
      setIsSettleModalOpen(true);
    },
    []
  );

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
      const currentUserBalance = balances?.find(
        (b) => b.user_id === currentUser
      );
      const recipientBalance = balances?.find((b) => b.user_id === to_user);

      let owed = 0;
      if (currentUserBalance && recipientBalance) {
        const myDebt =
          currentUserBalance.net_balance < 0
            ? Math.abs(currentUserBalance.net_balance)
            : 0;
        const theirCredit =
          recipientBalance.net_balance > 0 ? recipientBalance.net_balance : 0;

        if (myDebt > 0 && theirCredit > 0) {
          owed = Math.min(myDebt, theirCredit);
        }
      }

      // Overpay confirmation dialog
      if (owed > 0 && validatedAmount > owed + 0.01) {
        const overpay = validatedAmount - owed;
        const confirmed = await toast.confirm(
          t("settlements.overpayConfirm", {
            owed: formatCurrency(owed, "USD", locale),
            paying: formatCurrency(validatedAmount, "USD", locale),
            overpay: formatCurrency(overpay, "USD", locale),
          }),
          {
            confirmLabel: t("settlements.confirmContinue"),
            cancelLabel: t("settlements.cancel"),
          }
        );
        if (!confirmed) {
          setSubmittingSettle(false);
          return;
        }
      }

      setSubmittingSettle(true);

      try {
        // Call the create_settlement RPC; fall back to direct insert if RPC is not yet created
        const { error: rpcError } = await supabase.rpc("create_settlement", {
          _group_id: groupId,
          _to_user: to_user,
          _amount: validatedAmount,
          _notes: "Settle up",
        });

        if (rpcError) {
          const isMissingRpc =
            rpcError.code === "PGRST202" ||
            rpcError.message?.includes("create_settlement");

          if (isMissingRpc) {
            const { data: inserted, error: insertError } = await supabase
              .from("settlements")
              .insert({
                group_id: groupId,
                from_user: currentUser,
                to_user,
                amount: Math.round(validatedAmount * 100) / 100,
                status: "pending",
              })
              .select("id")
              .single();

            if (insertError) {
              console.error("Settlement insert error:", insertError);
              toast.error(insertError.message || t("settlements.createFailed"));
              return;
            }

            // Best-effort notification to recipient
            try {
              await supabase.from("notifications").insert({
                user_id: to_user,
                type: "settlement_request",
                title: "Settlement Request",
                body: `A payment of $${validatedAmount.toFixed(2)} was recorded for your approval.`,
                data: {
                  group_id: groupId,
                  settlement_id: inserted?.id,
                  from_user: currentUser,
                  amount: validatedAmount,
                },
              });
            } catch {
              // Ignore notification insert error if restricted by RLS
            }
          } else {
            console.error("RPC error:", rpcError);
            toast.error(rpcError.message || t("settlements.createFailed"));
            return;
          }
        }

        setIsSettleModalOpen(false);
        setSettleReceiver("");
        setSettleAmount("");
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
      locale,
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

      const confirmed = await toast.confirm(t("settlements.rejectConfirm"), {
        confirmLabel: t("settlements.reject"),
        cancelLabel: t("settlements.cancel"),
      });
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

      const confirmed = await toast.confirm(t("settlements.cancelConfirm"), {
        confirmLabel: t("settlements.cancelRequest"),
        cancelLabel: t("settlements.keep"),
      });
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

        try {
          await supabase.from("activity_log").insert({
            group_id: groupId,
            user_id: currentUser,
            action: "settlement_deleted",
            details: { settlement_id: settlementId },
          });
        } catch {
          // Ignore optional activity_log insert errors
        }

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
    settleAmountSetter: setSettleAmount,
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