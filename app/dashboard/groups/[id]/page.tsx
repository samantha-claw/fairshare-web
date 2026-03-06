"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import { QrCode } from "lucide-react";

// ── Decomposed hooks ───────────────────────────────────
import {
  useGroupData,
  useGroupExpenses,
  useGroupSettlements,
  useGroupMembers,
  useGroupSettings,
  useGroupRealtime,
} from "@/hooks/group";

// ── Components ─────────────────────────────────────────
import { SummaryCards } from "./_components/summary-cards";
import { MembersCard } from "./_components/members-card";
import { BalancesCard } from "./_components/balances-card";
import { PendingSettlements } from "./_components/pending-settlements";
import { ExpensesTab } from "./_components/expenses-tab";
import { ActivityTab } from "./_components/activity-tab";
import { AddMemberModal } from "./_components/add-member-modal";
import { ExpenseModal } from "./_components/expense-modal";
import { SettleModal } from "./_components/settle-modal";
import { SettingsModal } from "./_components/settings-modal";
import { QRShareModal } from "@/components/modals/qr/qr-share-modal";
import { AllExpensesModal } from "./_components/all-expenses-modal";

// ==========================================
// 🎨 PAGE
// ==========================================
export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = params.id as string;
  const supabase = createClient();

  /* ── Compose focused hooks ───────────────────────────── */
  const data = useGroupData(groupId);
  const expenseCtl = useGroupExpenses(
  groupId,
  data.members,
  data.refetch,
  data.currentUser || ""
);

  const settleCtl = useGroupSettlements(groupId, data.currentUser, data.refetch);
  const memberCtl = useGroupMembers(groupId, data.members, data.refetch);
  const settingsCtl = useGroupSettings(
    groupId,
    data.group,
    data.currentUser,
    data.balances
  );
  useGroupRealtime(groupId, data.refetch);

  /* ── Page-local UI state ─────────────────────────────── */
  const [activeTab, setActiveTab] = useState<"expenses" | "activity">("expenses");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAllExpensesModalOpen, setIsAllExpensesModalOpen] = useState(false);
  const [localToken, setLocalToken] = useState<string | null>(null);

  /* ── Reset invite token ──────────────────────────────── */
  const handleResetToken = useCallback(async () => {
    const { data: rpcData, error } = await supabase.rpc(
      "reset_group_invite_token",
      { p_group_id: data.group!.id }
    );

    if (error) {
      console.error("Reset token RPC error:", error);
      throw new Error(error.message);
    }

    const newToken = typeof rpcData === "string" ? rpcData : rpcData?.token;

    if (newToken) {
      setLocalToken(newToken);
    } else {
      throw new Error("No token returned from reset");
    }
  }, [supabase, data.group]);

  /* ── Loading ─────────────────────────────────────────── */
  if (data.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <Spinner className="h-5 w-5" />
          Loading Group…
        </div>
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────── */
  if (data.error || !data.group) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
          <h2 className="text-xl font-semibold text-red-600">
            {data.error || "Group not found"}
          </h2>
          <button
            onClick={data.goBack}
            className="mt-4 text-blue-600 hover:underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ── Derived constants ───────────────────────────────── */
  const currency = data.group.currency || "USD";

  const activeToken =
    localToken || (data.group as any).invite_token || null;

  const shareUrl =
    typeof window !== "undefined"
      ? activeToken
        ? `${window.location.origin}/join?id=${data.group.id}&token=${activeToken}`
        : `${window.location.origin}/join?id=${data.group.id}`
      : "";

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ── Header ───────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              {data.group.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {data.members.length} member{data.members.length !== 1 && "s"} ·{" "}
              {currency}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm transition-all duration-200 hover:bg-indigo-100 active:scale-95"
              title="Share Group via QR"
            >
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={() => settingsCtl.setIsSettingsModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-95"
              title="Group Settings"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────── */}
      <main className="mx-auto w-full max-w-6xl space-y-6 overflow-hidden px-4 py-6 sm:px-6">
        <SummaryCards
          totalGroupExpenses={data.totalGroupExpenses}
          myNetBalance={data.myNetBalance}
          pendingCount={data.pendingSettlements.length}
          currency={currency}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <PendingSettlements
              settlements={data.pendingSettlements}
              currentUser={data.currentUser}
              currency={currency}
              processingSettlementId={settleCtl.processingSettlementId}
              onApprove={settleCtl.handleApproveSettlement}
              onReject={settleCtl.handleRejectSettlement}
              onDelete={settleCtl.handleDeleteSettlement}
            />

            <section className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* ── Tabs + Action Buttons ── */}
              <div className="flex flex-col border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("expenses")}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 sm:flex-initial sm:px-6 ${
                      activeTab === "expenses"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    💸 Expenses ({data.expenses.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("activity")}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 sm:flex-initial sm:px-6 ${
                      activeTab === "activity"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    📋 Activity ({data.allActivities.length})
                  </button>
                </div>

                <div className="mb-5 mt-4 flex w-full items-center justify-center gap-3 sm:justify-end">
                  <button
                    onClick={settleCtl.openSettleUpModal}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] sm:flex-none"
                  >
                    <span>🤝</span> Settle Up
                  </button>
                  <button
                    onClick={expenseCtl.openAddExpenseModal}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 active:scale-[0.98] sm:flex-none"
                  >
                    <span>💸</span> Add Expense
                  </button>
                </div>
              </div>

              {/* ── Tab Content ── */}
              <div className="p-4 sm:p-6">
                {activeTab === "expenses" && (
                  <ExpensesTab
                    expenses={data.expenses}
                    currency={currency}
                    currentUser={data.currentUser}
                    isOwner={data.isOwner}
                    onEditExpense={expenseCtl.openEditExpenseModal}
                    onDeleteExpense={expenseCtl.handleDeleteExpense}
                    onViewAll={() => setIsAllExpensesModalOpen(true)}
                  />
                )}

                {activeTab === "activity" && (
                  <ActivityTab
                    allActivities={data.allActivities}
                    currency={currency}
                  />
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <MembersCard
              members={data.members}
              group={data.group}
              isOwner={data.isOwner}
              onOpenAddModal={memberCtl.openMemberModal}
              onRemoveMember={memberCtl.handleRemoveMember}
            />
            <BalancesCard balances={data.balances} currency={currency} />
          </div>
        </div>
      </main>

      {/* ── Modals ───────────────────────────────────── */}
      <AddMemberModal
        isOpen={memberCtl.isMemberModalOpen}
        onClose={() => memberCtl.setIsMemberModalOpen(false)}
        invitableFriends={memberCtl.invitableFriends}
        loadingFriends={memberCtl.loadingFriends}
        addingMember={memberCtl.addingMember}
        searchTerm={memberCtl.searchTerm}
        onSearchTermChange={memberCtl.setSearchTerm}
        searchResults={memberCtl.searchResults}
        searching={memberCtl.searching}
        onAddMember={memberCtl.handleAddMember}
      />

      <ExpenseModal
        isOpen={expenseCtl.isExpenseModalOpen}
        onClose={() => expenseCtl.setIsExpenseModalOpen(false)}
        editingExpenseId={expenseCtl.editingExpenseId}
        expenseName={expenseCtl.expenseName}
        onExpenseNameChange={expenseCtl.setExpenseName}
        expenseAmount={expenseCtl.expenseAmount}
        onExpenseAmountChange={expenseCtl.setExpenseAmount}
        members={data.members}
        submitting={expenseCtl.submittingExpense}
        onSubmit={expenseCtl.handleSaveExpense}
        onSplitDataChange={(splits, splitType, isValid) => {
          expenseCtl.setComputedSplits(splits);
          expenseCtl.setSplitType(splitType);
          expenseCtl.setIsValidSplit(isValid);
        }}
        paidBy={expenseCtl.paidBy}
        onPaidByChange={expenseCtl.setPaidBy}
        currentUserId={data.currentUser || ""}
      />

      <SettleModal
        isOpen={settleCtl.isSettleModalOpen}
        onClose={() => settleCtl.setIsSettleModalOpen(false)}
        otherMembers={data.otherMembers}
        settleReceiver={settleCtl.settleReceiver}
        onReceiverChange={settleCtl.setSettleReceiver}
        settleAmount={settleCtl.settleAmount}
        onAmountChange={settleCtl.setSettleAmount}
        currency={currency}
        submitting={settleCtl.submittingSettle}
        onSubmit={settleCtl.handleInitiateSettlement}
      />

      <SettingsModal
        isOpen={settingsCtl.isSettingsModalOpen}
        onClose={() => settingsCtl.setIsSettingsModalOpen(false)}
        group={data.group}
        members={data.members}
        isOwner={data.isOwner}
        canLeave={data.canLeave}
        myNetBalance={data.myNetBalance}
        deleteConfirmText={settingsCtl.deleteConfirmText}
        onDeleteConfirmTextChange={settingsCtl.setDeleteConfirmText}
        deletingGroup={settingsCtl.deletingGroup}
        leavingGroup={settingsCtl.leavingGroup}
        onDeleteGroup={settingsCtl.handleDeleteGroup}
        onLeaveGroup={settingsCtl.handleLeaveGroup}
      />

      <QRShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        value={shareUrl}
        title={data.group.name}
        subtitle={`${data.members.length} member${
          data.members.length !== 1 ? "s" : ""
        } · ${currency}`}
        type="group"
        isOwner={data.isOwner}
        onResetToken={handleResetToken}
      />

      <AllExpensesModal
        isOpen={isAllExpensesModalOpen}
        onClose={() => setIsAllExpensesModalOpen(false)}
        expenses={data.expenses}
        currency={currency}
        currentUser={data.currentUser}
        isOwner={data.isOwner}
        onEditExpense={expenseCtl.openEditExpenseModal}
        onDeleteExpense={expenseCtl.handleDeleteExpense}
      />
    </div>
  );
}