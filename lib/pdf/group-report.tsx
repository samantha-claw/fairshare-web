import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Group, Member, Expense, Balance, Settlement } from "@/types/group";
import { getCategoryInfo } from "@/types/group";

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

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: BRAND.dark, paddingTop: 0, paddingBottom: 40, paddingHorizontal: 0 },
  coverHeader: { backgroundColor: BRAND.indigo, paddingVertical: 40, paddingHorizontal: 48, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  brandName: { fontSize: 11, color: BRAND.emerald, letterSpacing: 4, textTransform: "uppercase", marginBottom: 16 },
  brandIcon: { fontSize: 28, marginBottom: 12 },
  groupName: { fontSize: 28, color: BRAND.white, fontWeight: "bold", marginBottom: 8 },
  coverMeta: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  content: { paddingHorizontal: 48, paddingTop: 28 },
  sectionTitle: { fontSize: 14, fontWeight: "bold", color: BRAND.dark, marginBottom: 4, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: BRAND.indigo, borderBottomStyle: "solid" },
  sectionSubtitle: { fontSize: 9, color: BRAND.slateLight, marginBottom: 16, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: BRAND.slateBg, borderRadius: 8, padding: 14, borderWidth: 1, borderColor: "#E2E8F0" },
  statLabel: { fontSize: 8, color: BRAND.slate, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: "bold", color: BRAND.dark },
  statGreen: { fontSize: 20, fontWeight: "bold", color: BRAND.emerald },
  statRed: { fontSize: 20, fontWeight: "bold", color: BRAND.red },
  table: { width: "100%", marginBottom: 24 },
  tableHeader: { flexDirection: "row", backgroundColor: BRAND.indigo, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12 },
  tableHeaderCell: { color: BRAND.white, fontSize: 9, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", borderBottomStyle: "solid" },
  tableRowAlt: { backgroundColor: BRAND.slateBg },
  tableCell: { fontSize: 9, color: BRAND.dark },
  tableCellMuted: { fontSize: 9, color: BRAND.slate },
  tableCellBold: { fontSize: 9, fontWeight: "bold", color: BRAND.dark },
  tableFooter: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#EEF2FF", borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
  colDate: { width: "16%" },
  colDesc: { width: "28%" },
  colCategory: { width: "15%" },
  colPaidBy: { width: "15%" },
  colAmount: { width: "12%", textAlign: "right" as const },
  colBalance: { width: "14%", textAlign: "right" as const },
  balanceCard: { flex: 1, padding: 12, borderRadius: 6, borderWidth: 1, borderColor: "#E2E8F0" },
  balanceOwe: { backgroundColor: BRAND.redBg, borderColor: "#FECACA" },
  balanceOwed: { backgroundColor: BRAND.greenBg, borderColor: "#A7F3D0" },
  balanceName: { fontSize: 9, fontWeight: "bold", color: BRAND.dark, marginBottom: 4 },
  balanceAmount: { fontSize: 13, fontWeight: "bold" },
  balanceAmountRed: { color: BRAND.red },
  balanceAmountGreen: { color: BRAND.emerald },
  settlementCard: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8, backgroundColor: BRAND.slateBg, borderRadius: 6, borderWidth: 1, borderColor: "#E2E8F0", gap: 12 },
  settlementArrow: { fontSize: 16, color: BRAND.slate, width: "8%" },
  settlementNames: { width: "40%" },
  settlementAmount: { width: "22%", fontSize: 13, fontWeight: "bold", color: BRAND.emerald, textAlign: "right" },
  settlementStatus: { width: "30%", textAlign: "right" },
  statusBadge: { fontSize: 8, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  footer: { position: "absolute", bottom: 20, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 10 },
  footerText: { fontSize: 7, color: BRAND.slateLight },
  footerBrand: { fontSize: 7, color: BRAND.indigo, fontWeight: "bold" },
  emptyContainer: { padding: 24, backgroundColor: BRAND.slateBg, borderRadius: 8, alignItems: "center" },
  emptyText: { fontSize: 10, color: BRAND.slate },
  pageBreak: { marginTop: 16 },
  categoryBadge: { backgroundColor: "#EEF2FF", paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, fontSize: 8, color: BRAND.indigo },
});

function formatCurrency(amount: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale || "en-US", {
    style: "currency", currency: currency || "USD",
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatDateTime(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    month: "long", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function t(locale: string, key: string, vars?: Record<string, string | number>): string {
  const en: Record<string, string> = {
    totalExpenses: "Total Expenses",
    expenseCount: "Expense Count",
    yourBalance: "Your Balance",
    settlements: "Settlements",
    expensesSection: "EXPENSES",
    date: "Date",
    description: "Description",
    category: "Category",
    paidBy: "Paid By",
    amount: "Amount",
    yourShare: "Your Share",
    total: "TOTAL",
    noExpenses: "No expenses recorded yet",
    balancesSection: "BALANCES",
    youLabel: "(You)",
    paidLabel: "Paid:",
    owedLabel: "Owed:",
    settlementsSection: "SETTLEMENTS",
    paidVerb: "paid",
    unknown: "Unknown",
    createdLabel: "Created",
    generatedOn: "Generated on {date}",
    membersCount_singular: "member",
    membersCount_plural: "members",
  };

  const ar: Record<string, string> = {
    totalExpenses: "إجمالي المصاريف",
    expenseCount: "عدد المصاريف",
    yourBalance: "رصيدك",
    settlements: "التسويات",
    expensesSection: "المصاريف",
    date: "التاريخ",
    description: "الوصف",
    category: "الفئة",
    paidBy: "دفعها",
    amount: "المبلغ",
    yourShare: "حصتك",
    total: "الإجمالي",
    noExpenses: "لا توجد مصاريف مسجلة بعد",
    balancesSection: "الأرصدة",
    youLabel: "(أنت)",
    paidLabel: "دفع:",
    owedLabel: "مستحق:",
    settlementsSection: "التسويات",
    paidVerb: "دفع",
    unknown: "غير معروف",
    createdLabel: "أُنشئت",
    generatedOn: "تم الإنشاء في {date}",
    membersCount_singular: "عضو",
    membersCount_plural: "أعضاء",
  };

  const dict = locale === "ar" ? ar : en;
  let text = dict[key] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

function plural(locale: string, count: number, singular: string, pluralStr: string): string {
  if (locale === "ar") {
    if (count === 1) return `${count} ${singular}`;
    return `${count} ${pluralStr}`;
  }
  return count === 1 ? `${count} ${singular}` : `${count} ${pluralStr}`;
}

interface GroupReportProps {
  group: Group;
  members: Member[];
  expenses: Expense[];
  balances: Balance[];
  pendingSettlements: Settlement[];
  completedSettlements: Settlement[];
  totalGroupExpenses: number;
  currentUserId?: string | null;
  locale?: string;
}

function ReportFooter({ locale }: { locale: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        {t(locale, "generatedOn", { date: formatDateTime(new Date().toISOString(), locale) })}
      </Text>
      <Text style={styles.footerBrand}>FAIRSHARE</Text>
    </View>
  );
}

export function GroupReportDocument({
  group, members, expenses, balances, pendingSettlements, completedSettlements,
  totalGroupExpenses, currentUserId, locale = "en",
}: GroupReportProps) {
  const myBalance = balances.find((b) => b.user_id === currentUserId);
  const allSettlements = [...completedSettlements, ...pendingSettlements];
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.coverHeader}>
          <Text style={styles.brandIcon}>⚡</Text>
          <Text style={styles.brandName}>FairShare</Text>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.coverMeta}>
            {plural(locale, members.length, t(locale, "membersCount_singular") || "Member", t(locale, "membersCount_plural") || "Members")} ·{" "}
            {group.currency || "USD"} · {t(locale, "createdLabel")}{" "}
            {formatDate(group.created_at, locale)}
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t(locale, "totalExpenses")}</Text>
              <Text style={styles.statValue}>
                {formatCurrency(totalGroupExpenses, group.currency || "USD", locale)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t(locale, "yourBalance")}</Text>
              {myBalance && myBalance.net_balance >= 0 ? (
                <Text style={styles.statGreen}>{formatCurrency(myBalance.net_balance, group.currency || "USD", locale)}</Text>
              ) : myBalance ? (
                <Text style={styles.statRed}>{formatCurrency(myBalance.net_balance, group.currency || "USD", locale)}</Text>
              ) : (
                <Text style={styles.statValue}>—</Text>
              )}
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t(locale, "expenseCount")}</Text>
              <Text style={styles.statValue}>{expenses.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t(locale, "settlements")}</Text>
              <Text style={styles.statValue}>{completedSettlements.length}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t(locale, "expensesSection")}</Text>
          <Text style={styles.sectionSubtitle}>
            {locale === "ar"
              ? `${expenses.length} مصروف${expenses.length !== 1 ? "ات" : ""} مسجل`
              : `${expenses.length} expense${expenses.length !== 1 ? "s" : ""} recorded`
            }
          </Text>

          {sortedExpenses.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colDate]}>{t(locale, "date")}</Text>
                <Text style={[styles.tableHeaderCell, styles.colDesc]}>{t(locale, "description")}</Text>
                <Text style={[styles.tableHeaderCell, styles.colCategory]}>{t(locale, "category")}</Text>
                <Text style={[styles.tableHeaderCell, styles.colPaidBy]}>{t(locale, "paidBy")}</Text>
                <Text style={[styles.tableHeaderCell, styles.colAmount]}>{t(locale, "amount")}</Text>
                <Text style={[styles.tableHeaderCell, styles.colBalance]}>{t(locale, "yourShare")}</Text>
              </View>

              {sortedExpenses.map((expense, index) => {
                const category = getCategoryInfo(expense.category);
                const paidByMember = members.find((m) => m.id === expense.paid_by);
                const paidByName = paidByMember?.display_name || paidByMember?.full_name || t(locale, "unknown");
                const splitEntry = (expense as any).expense_splits?.find((s: any) => s.user_id === currentUserId);
                const myShare = splitEntry
                  ? (splitEntry as any).amount
                  : currentUserId === expense.paid_by ? expense.amount : 0;

                return (
                  <View style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]} key={expense.id}>
                    <Text style={[styles.tableCellMuted, styles.colDate]}>{formatDate(expense.created_at, locale)}</Text>
                    <Text style={[styles.tableCellBold, styles.colDesc]}>{expense.name || t(locale, "unknown")}</Text>
                    <View style={styles.colCategory}>
                      <Text style={styles.categoryBadge}>{category.emoji} {category.label}</Text>
                    </View>
                    <Text style={[styles.tableCell, styles.colPaidBy]}>{paidByName}</Text>
                    <Text style={[styles.tableCellBold, styles.colAmount]}>{formatCurrency(expense.amount, group.currency || "USD", locale)}</Text>
                    <Text style={[styles.tableCell, styles.colBalance]}>
                      {currentUserId ? formatCurrency(myShare, group.currency || "USD", locale) : "—"}
                    </Text>
                  </View>
                );
              })}

              <View style={styles.tableFooter}>
                <Text style={[styles.tableCellBold, styles.colDate]}>{t(locale, "total")}</Text>
                <Text style={[styles.tableCell, styles.colDesc]}>
                  {locale === "ar"
                    ? `${expenses.length} مصروف${expenses.length !== 1 ? "ات" : ""}`
                    : `${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`
                  }
                </Text>
                <Text style={[styles.tableCell, styles.colCategory]}></Text>
                <Text style={[styles.tableCell, styles.colPaidBy]}></Text>
                <Text style={[styles.tableCellBold, styles.colAmount]}>{formatCurrency(totalGroupExpenses, group.currency || "USD", locale)}</Text>
                <Text style={[styles.tableCell, styles.colBalance]}></Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t(locale, "noExpenses")}</Text>
            </View>
          )}

          <ReportFooter locale={locale} />
        </View>
      </Page>

      {(balances.length > 0 || allSettlements.length > 0) && (
        <Page size="A4" style={styles.page}>
          <View style={[styles.content, { paddingTop: 40 }]}>
            {balances.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t(locale, "balancesSection")}</Text>
                <Text style={styles.sectionSubtitle}>
                  {locale === "ar"
                    ? `من يدين لمن في ${group.name}`
                    : `Who owes whom in ${group.name}`
                  }
                </Text>

                {balances.map((balance) => {
                  const isCurrentUser = balance.user_id === currentUserId;
                  return (
                    <View
                      style={[
                        styles.balanceCard,
                        balance.net_balance < 0 ? styles.balanceOwe : balance.net_balance > 0 ? styles.balanceOwed : {},
                        { marginBottom: 8 },
                      ]}
                      key={balance.user_id}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View>
                          <Text style={styles.balanceName}>
                            {balance.display_name} {isCurrentUser ? t(locale, "youLabel") : ""}
                          </Text>
                          <Text style={{ fontSize: 8, color: BRAND.slate }}>
                            {t(locale, "paidLabel")} {formatCurrency(balance.total_paid, group.currency || "USD", locale)} · {t(locale, "owedLabel")}{" "}
                            {formatCurrency(balance.total_owed, group.currency || "USD", locale)}
                          </Text>
                        </View>
                        <Text style={[styles.balanceAmount, balance.net_balance >= 0 ? styles.balanceAmountGreen : styles.balanceAmountRed]}>
                          {balance.net_balance >= 0 ? "+" : ""}
                          {formatCurrency(balance.net_balance, group.currency || "USD", locale)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            <View style={styles.pageBreak} />

            {allSettlements.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t(locale, "settlementsSection")}</Text>
                <Text style={styles.sectionSubtitle}>
                  {locale === "ar"
                    ? `${completedSettlements.length} مكتملة · ${pendingSettlements.length} معلقة`
                    : `${completedSettlements.length} completed · ${pendingSettlements.length} pending`
                  }
                </Text>

                {allSettlements.map((settlement) => (
                  <View style={styles.settlementCard} key={settlement.id}>
                    <Text style={styles.settlementArrow}>→</Text>
                    <View style={styles.settlementNames}>
                      <Text style={{ fontSize: 9, color: BRAND.dark }}>
                        {settlement.from_profile?.display_name || t(locale, "unknown")}
                      </Text>
                      <Text style={{ fontSize: 8, color: BRAND.slate }}>
                        {t(locale, "paidVerb")} {settlement.to_profile?.display_name || t(locale, "unknown")}
                      </Text>
                    </View>
                    <Text style={styles.settlementAmount}>
                      {formatCurrency(settlement.amount, group.currency || "USD", locale)}
                    </Text>
                    <View style={styles.settlementStatus}>
                      <Text style={[styles.statusBadge, {
                        backgroundColor: settlement.status === "completed" ? BRAND.greenBg : settlement.status === "pending" ? "#FEF3C7" : BRAND.redBg,
                        color: settlement.status === "completed" ? BRAND.emerald : settlement.status === "pending" ? BRAND.amber : BRAND.red,
                      }]}>
                        {locale === "ar"
                          ? (settlement.status === "completed" ? "مكتملة" : settlement.status === "pending" ? "معلقة" : "مرفوضة")
                          : settlement.status
                        }
                      </Text>
                      <Text style={{ fontSize: 7, color: BRAND.slateLight, marginTop: 2 }}>
                        {formatDate(settlement.created_at, locale)}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            <ReportFooter locale={locale} />
          </View>
        </Page>
      )}
    </Document>
  );
}
