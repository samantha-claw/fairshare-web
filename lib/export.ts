// ==========================================
// 📤 EXPORT UTILITY — PDF + CSV GENERATION
// ==========================================
// Client-side export functions for FairShare group reports

import { pdf } from "@react-pdf/renderer";
import { GroupReportDocument } from "@/lib/pdf/group-report";
import type { Group, Member, Expense, Balance, Settlement } from "@/types/group";
import { getCategoryInfo } from "@/types/group";

// ==========================================
// 📊 EXPORT DATA INTERFACE
// ==========================================
export interface GroupExportData {
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
// 📄 PDF EXPORT
// ==========================================
export async function exportGroupPDF(data: GroupExportData): Promise<void> {
  const doc = GroupReportDocument(data);
  const blob = await pdf(doc).toBlob();

  const fileName = `FairShare_${sanitizeFileName(data.group.name)}_Report.pdf`;
  downloadBlob(blob, fileName);
}

// ==========================================
// 📋 CSV EXPORT — EXPENSES
// ==========================================
export function exportGroupExpensesCSV(data: GroupExportData): void {
  const { expenses, members, group } = data;

  // Build CSV headers
  const headers = [
    "Date",
    "Description",
    "Category",
    "Paid By",
    "Amount",
    "Currency",
  ];

  // Build CSV rows
  const rows = expenses.map((expense) => {
    const category = getCategoryInfo(expense.category);
    const paidByMember = members.find((m) => m.id === expense.paid_by);
    const paidByName =
      paidByMember?.display_name ||
      paidByMember?.full_name ||
      "Unknown";

    return [
      new Date(expense.created_at).toISOString().split("T")[0],
      escapeCSVField(expense.name || "Untitled"),
      `${category.emoji} ${category.label}`,
      escapeCSVField(paidByName),
      expense.amount.toFixed(2),
      group.currency || "USD",
    ];
  });

  // Add totals row
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  rows.push([
    "",
    `TOTAL (${expenses.length} expenses)`,
    "",
    "",
    totalAmount.toFixed(2),
    group.currency || "USD",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility

  const fileName = `FairShare_${sanitizeFileName(group.name)}_Expenses.csv`;
  downloadBlob(
    new Blob([BOM + csv], { type: "text/csv;charset=utf-8" }),
    fileName
  );
}

// ==========================================
// 📋 CSV EXPORT — BALANCES
// ==========================================
export function exportGroupBalancesCSV(data: GroupExportData): void {
  const { balances, group } = data;

  const headers = [
    "Member",
    "Total Paid",
    "Total Owed",
    "Net Balance",
    "Currency",
  ];

  const rows = balances.map((b) => [
    escapeCSVField(b.display_name),
    b.total_paid.toFixed(2),
    b.total_owed.toFixed(2),
    b.net_balance.toFixed(2),
    group.currency || "USD",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const BOM = "\uFEFF";

  const fileName = `FairShare_${sanitizeFileName(group.name)}_Balances.csv`;
  downloadBlob(
    new Blob([BOM + csv], { type: "text/csv;charset=utf-8" }),
    fileName
  );
}

// ==========================================
// 🔧 HELPERS
// ==========================================
function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-_]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 50);
}

function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}