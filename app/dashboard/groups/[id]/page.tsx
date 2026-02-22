"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useGroup } from "@/hooks/use-group";
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
import { QRShareModal } from "@/components/qr/qr-share-modal";
import { Share2, QrCode } from "lucide-react";

// ==========================================
// 🎨 UI RENDER
// ==========================================
export default function GroupDetailsPage() {
  const g = useGroup();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  /* ── Loading ─────────────────────────────────────────── */
  if (g.loading) {
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
  if (g.error || !g.group) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
          <h2 className="text-xl font-semibold text-red-600">
            {g.error || "Group not found"}
          </h2>
          <button
            onClick={g.goBack}
            className="mt-4 text-blue-600 hover:underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currency = g.group.currency || "USD";
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join?id=${g.group.id}`
      : "";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ── Header ───────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {g.group.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {g.members.length} member{g.members.length !== 1 && "s"} ·{" "}
              {currency}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* ★ Share Group QR Button ★ */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100"
              title="Share Group via QR"
            >
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={() => g.setIsSettingsModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
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
            <button
              onClick={g.navigateToDashboard}
              className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
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
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────── */}
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <SummaryCards
          totalGroupExpenses={g.totalGroupExpenses}
          myNetBalance={g.myNetBalance}
          pendingCount={g.pendingSettlements.length}
          currency={currency}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <PendingSettlements
              settlements={g.pendingSettlements}
              currentUser={g.currentUser}
              currency={currency}
              processingSettlementId={g.processingSettlementId}
              onApprove={g.handleApproveSettlement}
              onReject={g.handleRejectSettlement}
              onDelete={g.handleDeleteSettlement}
            />

            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => g.setActiveTab("expenses")}
                  className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                    g.activeTab === "expenses"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  💸 Expenses ({g.expenses.length})
                </button>
                <button
                  onClick={() => g.setActiveTab("activity")}
                  className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                    g.activeTab === "activity"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📋 Activity ({g.allActivities.length})
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4 flex items-center justify-end gap-2">
                  <button
                    onClick={g.openSettleUpModal}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    <span>🤝</span> Settle Up
                  </button>
                  <button
                    onClick={g.openAddExpenseModal}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
                  >
                    <span>💸</span> Add Expense
                  </button>
                </div>

                {g.activeTab === "expenses" && (
                  <ExpensesTab
                    expenses={g.expenses}
                    currency={currency}
                    currentUser={g.currentUser}
                    isOwner={g.isOwner}
                    onEditExpense={g.openEditExpenseModal}
                    onDeleteExpense={g.handleDeleteExpense}
                  />
                )}

                {g.activeTab === "activity" && (
                  <ActivityTab
                    allActivities={g.allActivities}
                    currency={currency}
                  />
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <MembersCard
              members={g.members}
              group={g.group}
              isOwner={g.isOwner}
              onOpenAddModal={g.openMemberModal}
              onRemoveMember={g.handleRemoveMember}
            />
            <BalancesCard balances={g.balances} currency={currency} />
          </div>
        </div>
      </main>

      {/* ── Existing Modals ──────────────────────────── */}
      <AddMemberModal
        isOpen={g.isMemberModalOpen}
        onClose={() => g.setIsMemberModalOpen(false)}
        invitableFriends={g.invitableFriends}
        loadingFriends={g.loadingFriends}
        addingMember={g.addingMember}
        searchTerm={g.searchTerm}
        onSearchTermChange={g.setSearchTerm}
        searchResults={g.searchResults}
        searching={g.searching}
        onAddMember={g.handleAddMember}
      />

      <ExpenseModal
        isOpen={g.isExpenseModalOpen}
        onClose={() => g.setIsExpenseModalOpen(false)}
        editingExpenseId={g.editingExpenseId}
        expenseName={g.expenseName}
        onExpenseNameChange={g.setExpenseName}
        expenseAmount={g.expenseAmount}
        onExpenseAmountChange={g.setExpenseAmount}
        selectedMembers={g.selectedMembers}
        onSelectedMembersChange={g.setSelectedMembers}
        members={g.members}
        submitting={g.submittingExpense}
        onSubmit={g.handleSaveExpense}
      />

      <SettleModal
        isOpen={g.isSettleModalOpen}
        onClose={() => g.setIsSettleModalOpen(false)}
        otherMembers={g.otherMembers}
        settleReceiver={g.settleReceiver}
        onReceiverChange={g.setSettleReceiver}
        settleAmount={g.settleAmount}
        onAmountChange={g.setSettleAmount}
        currency={currency}
        submitting={g.submittingSettle}
        onSubmit={g.handleInitiateSettlement}
      />

      <SettingsModal
        isOpen={g.isSettingsModalOpen}
        onClose={() => g.setIsSettingsModalOpen(false)}
        group={g.group}
        members={g.members}
        isOwner={g.isOwner}
        canLeave={g.canLeave}
        myNetBalance={g.myNetBalance}
        deleteConfirmText={g.deleteConfirmText}
        onDeleteConfirmTextChange={g.setDeleteConfirmText}
        deletingGroup={g.deletingGroup}
        leavingGroup={g.leavingGroup}
        onDeleteGroup={g.handleDeleteGroup}
        onLeaveGroup={g.handleLeaveGroup}
      />

      {/* ★ QR Share Modal ★ */}
      <QRShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        value={shareUrl}
        title={g.group.name}
        subtitle={`${g.members.length} member${g.members.length !== 1 ? "s" : ""} · ${currency}`}
        type="group"
      />
    </div>
  );
}