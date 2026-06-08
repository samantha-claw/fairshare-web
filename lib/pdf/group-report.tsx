// ==========================================
// 📄 FAIRSHARE GROUP REPORT — PDF TEMPLATE
// ==========================================
// Professional branded PDF export using @react-pdf/renderer
// Designed to be the visual identity of FairShare exports

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Group, Member, Expense, Balance, Settlement } from "@/types/group";
import { getCategoryInfo, type ExpenseCategory } from "@/types/group";

// ==========================================
// 🎨 BRAND COLORS & DESIGN SYSTEM
// ==========================================
const BRAND = {
  indigo: "#4F46E5",
  indigoDark: "#3730A3",
  emerald: "#10B981",
  amber: "#F59E0B",
  slate: "#64748B",
  slateLight: "#94A3B8",
  slateBg: "#F8FAFC",
  white: "#FFFFFF",
  dark: "#0F172A",
  red: "#EF4444",
  greenBg: "#ECFDF5",
  redBg: "#FEF2F2",
};

// ==========================================
// 📐 STYLES
// ==========================================
const styles = StyleSheet.create({
  /* ── Page ────────────────────────────────── */
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: BRAND.dark,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },

  /* ── Cover Header ────────────────────────── */
  coverHeader: {
    backgroundColor: BRAND.indigo,
    paddingVertical: 40,
    paddingHorizontal: 48,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  brandName: {
    fontSize: 11,
    color: BRAND.emerald,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  brandIcon: {
    fontSize: 28,
    marginBottom: 12,
  },
  groupName: {
    fontSize: 28,
    color: BRAND.white,
    fontWeight: "bold",
    marginBottom: 8,
  },
  coverMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },

  /* ── Content Area ────────────────────────── */
  content: {
    paddingHorizontal: 48,
    paddingTop: 28,
  },

  /* ── Section Titles ──────────────────────── */
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: BRAND.dark,
    marginBottom: 4,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: BRAND.indigo,
    borderBottomStyle: "solid",
  },
  sectionSubtitle: {
    fontSize: 9,
    color: BRAND.slateLight,
    marginBottom: 16,
    marginTop: 2,
  },

  /* ── Stats Cards ─────────────────────────── */
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: BRAND.slateBg,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statLabel: {
    fontSize: 8,
    color: BRAND.slate,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: BRAND.dark,
  },
  statGreen: {
    fontSize: 20,
    fontWeight: "bold",
    color: BRAND.emerald,
  },
  statRed: {
    fontSize: 20,
    fontWeight: "bold",
    color: BRAND.red,
  },

  /* ── Table ───────────────────────────────── */
  table: {
    width: "100%",
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND.indigo,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    color: BRAND.white,
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    borderBottomStyle: "solid",
  },
  tableRowAlt: {
    backgroundColor: BRAND.slateBg,
  },
  tableCell: {
    fontSize: 9,
    color: BRAND.dark,
  },
  tableCellMuted: {
    fontSize: 9,
    color: BRAND.slate,
  },
  tableCellBold: {
    fontSize: 9,
    fontWeight: "bold",
    color: BRAND.dark,
  },
  tableFooter: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#EEF2FF",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },

  /* ── Column Widths ──────────────────────── */
  colDate: { width: "16%" },
  colDesc: { width: "28%" },
  colCategory: { width: "15%" },
  colPaidBy: { width: "15%" },
  colAmount: { width: "12%", textAlign: "right" as const },
  colBalance: { width: "14%", textAlign: "right" as const },

  /* ── Balance Cards ──────────────────────── */
  balanceRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  balanceCard: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  balanceOwe: {
    backgroundColor: BRAND.redBg,
    borderColor: "#FECACA",
  },
  balanceOwed: {
    backgroundColor: BRAND.greenBg,
    borderColor: "#A7F3D0",
  },
  balanceName: {
    fontSize: 9,
    fontWeight: "bold",
    color: BRAND.dark,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 13,
    fontWeight: "bold",
  },
  balanceAmountRed: {
    color: BRAND.red,
  },
  balanceAmountGreen: {
    color: BRAND.emerald,
  },

  /* ── Settlement Cards ────────────────────── */
  settlementCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    backgroundColor: BRAND.slateBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  settlementArrow: {
    fontSize: 16,
    color: BRAND.slate,
    width: "8%",
  },
  settlementNames: {
    width: "40%",
  },
  settlementAmount: {
    width: "22%",
    fontSize: 13,
    fontWeight: "bold",
    color: BRAND.emerald,
    textAlign: "right",
  },
  settlementStatus: {
    width: "30%",
    textAlign: "right",
  },
  statusBadge: {
    fontSize: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  /* ── Footer ──────────────────────────────── */
  footer: {
    position: "absolute",
    bottom: 20,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: BRAND.slateLight,
  },
  footerBrand: {
    fontSize: 7,
    color: BRAND.indigo,
    fontWeight: "bold",
  },

  /* ── Empty State ─────────────────────────── */
  emptyContainer: {
    padding: 24,
    backgroundColor: BRAND.slateBg,
    borderRadius: 8,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 10,
    color: BRAND.slate,
  },

  /* ── Page Break ─────────────────────────── */
  pageBreak: {
    marginTop: 16,
  },

  /* ── Category Badge ─────────────────────── */
  categoryBadge: {
    backgroundColor: "#EEF2FF",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 8,
    color: BRAND.indigo,
  },
});

// ==========================================
// 📊 HELPER FUNCTIONS
// ==========================================
function formatCurrency(amount: number, currency: string): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return amount < 0 ? `-${formatted}` : formatted;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ==========================================
// 📄 DOCUMENT PROPS
// ==========================================
interface GroupReportProps {
  group: Group;
  members: Member[];
  expenses: Expense[];
  balances: Balance[];
  pendingSettlements: Settlement[];
  completedSettlements: Settlement[];
  totalGroupExpenses: number;
  currentUserId?: string | null;
}

// ==========================================
// 🏢 FOOTER COMPONENT
// ==========================================
function ReportFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        Generated on {formatDateTime(new Date().toISOString())}
      </Text>
      <Text style={styles.footerBrand}>FAIRSHARE</Text>
    </View>
  );
}

// ==========================================
// 📄 GROUP REPORT DOCUMENT
// ==========================================
export function GroupReportDocument({
  group,
  members,
  expenses,
  balances,
  pendingSettlements,
  completedSettlements,
  totalGroupExpenses,
  currentUserId,
}: GroupReportProps) {
  const myBalance = balances.find((b) => b.user_id === currentUserId);
  const allSettlements = [...completedSettlements, ...pendingSettlements];

  // Sort expenses by date (newest first for display)
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Calculate category totals
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    const cat = e.category || "other";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(e.amount);
  });

  return (
    <Document>
      {/* ============================================ */}
      {/* 📄 PAGE 1 — COVER + SUMMARY + EXPENSES      */}
      {/* ============================================ */}
      <Page size="A4" style={styles.page}>
        {/* ── Cover Header ────────────────────────── */}
        <View style={styles.coverHeader}>
          <Text style={styles.brandIcon}>⚡</Text>
          <Text style={styles.brandName}>FairShare</Text>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.coverMeta}>
            {members.length} Member{members.length !== 1 ? "s" : ""} ·{" "}
            {group.currency || "USD"} · Created{" "}
            {formatDate(group.created_at)}
          </Text>
        </View>

        <View style={styles.content}>
          {/* ── Summary Stats ──────────────────────── */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Expenses</Text>
              <Text style={styles.statValue}>
                {formatCurrency(totalGroupExpenses, group.currency || "USD")}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Your Balance</Text>
              {myBalance && myBalance.net_balance >= 0 ? (
                <Text style={styles.statGreen}>
                  {formatCurrency(myBalance.net_balance, group.currency || "USD")}
                </Text>
              ) : myBalance ? (
                <Text style={styles.statRed}>
                  {formatCurrency(myBalance.net_balance, group.currency || "USD")}
                </Text>
              ) : (
                <Text style={styles.statValue}>—</Text>
              )}
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Expenses</Text>
              <Text style={styles.statValue}>{expenses.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Settlements</Text>
              <Text style={styles.statValue}>
                {completedSettlements.length}
              </Text>
            </View>
          </View>

          {/* ── Expenses Table ─────────────────────── */}
          <Text style={styles.sectionTitle}>EXPENSES</Text>
          <Text style={styles.sectionSubtitle}>
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""} recorded
          </Text>

          {sortedExpenses.length > 0 ? (
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colDate]}>
                  Date
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colDesc]}>
                  Description
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colCategory]}>
                  Category
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colPaidBy]}>
                  Paid By
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colAmount]}>
                  Amount
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colBalance]}>
                  Your Share
                </Text>
              </View>

              {/* Table Rows */}
              {sortedExpenses.map((expense, index) => {
                const category = getCategoryInfo(expense.category);
                const paidByMember = members.find(
                  (m) => m.id === expense.paid_by
                );
                const paidByName =
                  paidByMember?.display_name ||
                  paidByMember?.full_name ||
                  "Unknown";

                // Calculate user's share from splits
                const splitEntry = (expense as any).expense_splits?.find(
                  (s: any) => s.user_id === currentUserId
                );
                const myShare = splitEntry
                  ? (splitEntry as any).amount
                  : currentUserId === expense.paid_by
                  ? expense.amount
                  : 0;

                return (
                  <View
                    style={[
                      styles.tableRow,
                      index % 2 === 1 ? styles.tableRowAlt : {},
                    ]}
                    key={expense.id}
                  >
                    <Text style={[styles.tableCellMuted, styles.colDate]}>
                      {formatDate(expense.created_at)}
                    </Text>
                    <Text style={[styles.tableCellBold, styles.colDesc]}>
                      {expense.name || "Untitled"}
                    </Text>
                    <View style={styles.colCategory}>
                      <Text style={styles.categoryBadge}>
                        {category.emoji} {category.label}
                      </Text>
                    </View>
                    <Text style={[styles.tableCell, styles.colPaidBy]}>
                      {paidByName}
                    </Text>
                    <Text style={[styles.tableCellBold, styles.colAmount]}>
                      {formatCurrency(expense.amount, group.currency || "USD")}
                    </Text>
                    <Text style={[styles.tableCell, styles.colBalance]}>
                      {currentUserId
                        ? formatCurrency(myShare, group.currency || "USD")
                        : "—"}
                    </Text>
                  </View>
                );
              })}

              {/* Table Footer — Totals */}
              <View style={styles.tableFooter}>
                <Text style={[styles.tableCellBold, styles.colDate]}>
                  TOTAL
                </Text>
                <Text style={[styles.tableCell, styles.colDesc]}>
                  {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
                </Text>
                <Text style={[styles.tableCell, styles.colCategory]}></Text>
                <Text style={[styles.tableCell, styles.colPaidBy]}></Text>
                <Text style={[styles.tableCellBold, styles.colAmount]}>
                  {formatCurrency(totalGroupExpenses, group.currency || "USD")}
                </Text>
                <Text style={[styles.tableCell, styles.colBalance]}></Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No expenses recorded yet</Text>
            </View>
          )}

          <ReportFooter />
        </View>
      </Page>

      {/* ============================================ */}
      {/* 📄 PAGE 2 — BALANCES + SETTLEMENTS         */}
      {/* ============================================ */}
      {(balances.length > 0 || allSettlements.length > 0) && (
        <Page size="A4" style={styles.page}>
          <View style={[styles.content, { paddingTop: 40 }]}>
            {/* ── Balances ─────────────────────────── */}
            {balances.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>BALANCES</Text>
                <Text style={styles.sectionSubtitle}>
                  Who owes whom in {group.name}
                </Text>

                {balances.map((balance) => {
                  const isCurrentUser = balance.user_id === currentUserId;
                  return (
                    <View
                      style={[
                        styles.balanceCard,
                        balance.net_balance < 0
                          ? styles.balanceOwe
                          : balance.net_balance > 0
                          ? styles.balanceOwed
                          : {},
                        { marginBottom: 8 },
                      ]}
                      key={balance.user_id}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View>
                          <Text style={styles.balanceName}>
                            {balance.display_name}{" "}
                            {isCurrentUser ? "(You)" : ""}
                          </Text>
                          <Text style={{ fontSize: 8, color: BRAND.slate }}>
                            Paid: {formatCurrency(balance.total_paid, group.currency || "USD")} · Owed:{" "}
                            {formatCurrency(balance.total_owed, group.currency || "USD")}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.balanceAmount,
                            balance.net_balance >= 0
                              ? styles.balanceAmountGreen
                              : styles.balanceAmountRed,
                          ]}
                        >
                          {balance.net_balance >= 0 ? "+" : ""}
                          {formatCurrency(
                            balance.net_balance,
                            group.currency || "USD"
                          )}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            <View style={styles.pageBreak} />

            {/* ── Settlements ───────────────────────── */}
            {allSettlements.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>SETTLEMENTS</Text>
                <Text style={styles.sectionSubtitle}>
                  {completedSettlements.length} completed ·{" "}
                  {pendingSettlements.length} pending
                </Text>

                {allSettlements.map((settlement) => (
                  <View style={styles.settlementCard} key={settlement.id}>
                    <Text style={styles.settlementArrow}>→</Text>
                    <View style={styles.settlementNames}>
                      <Text style={{ fontSize: 9, color: BRAND.dark }}>
                        {settlement.from_profile?.display_name ||
                          "Unknown"}
                      </Text>
                      <Text
                        style={{ fontSize: 8, color: BRAND.slate }}
                      >
                        paid{" "}
                        {settlement.to_profile?.display_name || "Unknown"}
                      </Text>
                    </View>
                    <Text style={styles.settlementAmount}>
                      {formatCurrency(
                        settlement.amount,
                        group.currency || "USD"
                      )}
                    </Text>
                    <View style={styles.settlementStatus}>
                      <Text
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              settlement.status === "completed"
                                ? BRAND.greenBg
                                : settlement.status === "pending"
                                ? "#FEF3C7"
                                : BRAND.redBg,
                            color:
                              settlement.status === "completed"
                                ? BRAND.emerald
                                : settlement.status === "pending"
                                ? BRAND.amber
                                : BRAND.red,
                          },
                        ]}
                      >
                        {settlement.status}
                      </Text>
                      <Text
                        style={{
                          fontSize: 7,
                          color: BRAND.slateLight,
                          marginTop: 2,
                        }}
                      >
                        {formatDate(settlement.created_at)}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            <ReportFooter />
          </View>
        </Page>
      )}
    </Document>
  );
}