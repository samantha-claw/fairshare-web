"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FloatingActionMenu } from "@/components/ui/floating-action-menu";
import { createClient } from "@/lib/supabase/client";
import { QrCode, Settings, Receipt, Handshake, Plus } from "lucide-react";

// ── Hooks ─────────────────────────────────────────
import {
  useGroupData,
  useGroupExpenses,
  useGroupSettlements,
  useGroupMembers,
  useGroupSettings,
  useGroupRealtime,
} from "@/hooks/group";

// ── Tab Components ─────────────────────────────────
import { OverviewTab } from "./_components/overview-tab";
import { SettleTab } from "./_components/settle-tab";
import { AnalysisTab } from "./_components/analysis-tab";
import { MembersTab } from "./_components/members-tab";

// ── Existing Components ────────────────────────────
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
  const [activeTab, setActiveTab] = useState("overview");
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
      <div className="flex min-h-screen items-center justify-center bg-surface-2">
        <div className="flex items-center gap-2 text-text-secondary">
          <Spinner className="h-5 w-5" />
          Loading Group…
        </div>
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────── */
  if (data.error || !data.group) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-2">
        <div className="rounded-2xl bg-surface p-8 text-center shadow-lg">
          <h2 className="text-xl font-semibold text-negative">
            {data.error || "Group not found"}
          </h2>
          <button
            onClick={data.goBack}
            className="mt-4 text-text-primary hover:underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ── Derived constants ───────────────────────────────── */
  const currency = data.group.currency || "USD";
  const activeToken = localToken || (data.group as any).invite_token || null;
  const shareUrl =
    typeof window !== "undefined"
      ? activeToken
        ? `${window.location.origin}/join?id=${data.group.id}&token=${activeToken}`
        : `${window.location.origin}/join?id=${data.group.id}`
      : "";

  /* ── FAB Options ─────────────────────────────────────── */
  const fabOptions = [
    {
      label: "Add Expense",
      onClick: expenseCtl.openAddExpenseModal,
      Icon: <Receipt className="h-4 w-4" />,
    },
    {
      label: "Settle Up",
      onClick: settleCtl.openSettleUpModal,
      Icon: <Handshake className="h-4 w-4" />,
    },
  ];

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-surface-2 pb-24">
      {/* ── Header ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-text-primary">
              {data.group.name}
            </h1>
            <p className="text-sm text-text-secondary">
              {data.members.length} member{data.members.length !== 1 && "s"} ·{" "}
              {currency}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition-all hover:bg-surface-2"
              title="Share Group via QR"
            >
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={() => settingsCtl.setIsSettingsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-surface-2"
              title="Group Settings"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Tabs ─────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mt-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">
              Expenses
            </TabsTrigger>
            <TabsTrigger
              value="settle"
              badge={data.pendingSettlements.length || undefined}
            >
              Settle
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab
              totalGroupExpenses={data.totalGroupExpenses}
              myNetBalance={data.myNetBalance}
              balances={data.balances}
              currency={currency}
              currentUserId={data.currentUser}
            />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesTab
              expenses={data.expenses}
              onAddExpense={expenseCtl.openAddExpenseModal}
              currency={currency}
              currentUser={data.currentUser}
              isOwner={data.isOwner}
              onEditExpense={expenseCtl.openEditExpenseModal}
              onDeleteExpense={expenseCtl.handleDeleteExpense}
              onViewAll={() => setIsAllExpensesModalOpen(true)}
            />
          </TabsContent>

          <TabsContent value="settle">
            <SettleTab
              balances={data.balances}
              pendingSettlements={data.pendingSettlements}
              currentUser={data.currentUser}
              currency={currency}
              processingSettlementId={settleCtl.processingSettlementId}
              onApprove={settleCtl.handleApproveSettlement}
              onReject={settleCtl.handleRejectSettlement}
              onDelete={settleCtl.handleDeleteSettlement}
              onSettleUp={settleCtl.openSettleUpModal}
            />
          </TabsContent>

          <TabsContent value="activity">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <ActivityTab allActivities={data.allActivities} currency={currency} />
            </div>
          </TabsContent>

          <TabsContent value="analysis">
            <AnalysisTab />
          </TabsContent>

          <TabsContent value="members">
            <MembersTab
              members={data.members}
              group={data.group}
              isOwner={data.isOwner}
              onOpenAddModal={memberCtl.openMemberModal}
              onRemoveMember={memberCtl.handleRemoveMember}
              onOpenQRModal={() => setIsShareModalOpen(true)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Floating Action Button ─────────────────────── */}
      <FloatingActionMenu options={fabOptions} />

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
        expenseCategory={expenseCtl.expenseCategory}
        onExpenseCategoryChange={expenseCtl.setExpenseCategory}
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
        initialSplitType={
          expenseCtl.splitType === "equal"
            ? "equal"
            : expenseCtl.splitType === "percentage"
            ? "percentage"
            : expenseCtl.splitType === "shares"
            ? "shares"
            : "exact"
        }
        initialSplits={expenseCtl.computedSplits}
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
        groupId={groupId}
        currency={currency}
        currentUser={data.currentUser}
        isOwner={data.isOwner}
        onEditExpense={expenseCtl.openEditExpenseModal}
        onDeleteExpense={expenseCtl.handleDeleteExpense}
      />
    </div>
  );
}
