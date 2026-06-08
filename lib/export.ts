"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { Group, Member, Expense, Balance, Settlement } from "@/types/group";

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

// ── CSV Export — Expenses ─────────────────────────────
export function exportGroupExpensesCSV(data: GroupExportData): void {
  const { expenses, members, group } = data;

  const headers = ["Date", "Description", "Category", "Paid By", "Amount", "Currency", "Participants"];

  const rows = expenses.map((expense) => {
    const paidByMember = members.find((m) => m.id === expense.paid_by);
    const paidByName = paidByMember?.display_name || paidByMember?.full_name || "Unknown";
    const splits = ((expense as any).expense_splits || []) as Array<{ profiles?: { display_name?: string; full_name?: string } }>;
    const participantNames = splits
      .map((s) => s?.profiles?.display_name || s?.profiles?.full_name || "")
      .filter(Boolean)
      .join("; ");

    return [
      new Date(expense.created_at).toISOString().split("T")[0],
      escapeCSV(expense.name || "Untitled"),
      expense.category || "",
      escapeCSV(paidByName),
      expense.amount.toFixed(2),
      group.currency || "USD",
      escapeCSV(participantNames),
    ];
  });

  const csv = [
    headers.join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\n");

  downloadBlob(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
    `FairShare_${sanitizeName(group.name)}_Expenses.csv`
  );
}

// ── CSV Export — Balances ─────────────────────────────
export function exportGroupBalancesCSV(data: GroupExportData): void {
  const { balances, group } = data;

  const headers = ["Member", "Total Paid", "Total Owed", "Net Balance", "Currency"];

  const rows = balances.map((b) => [
    escapeCSV(b.display_name),
    b.total_paid.toFixed(2),
    b.total_owed.toFixed(2),
    b.net_balance.toFixed(2),
    group.currency || "USD",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  downloadBlob(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
    `FairShare_${sanitizeName(group.name)}_Balances.csv`
  );
}

// ── PDF Export ─────────────────────────────────────────
export async function exportGroupPDF(data: GroupExportData): Promise<void> {
  const { group, members, expenses, balances, pendingSettlements, completedSettlements, totalGroupExpenses, currentUserId } = data;

  const container = document.createElement("div");
  container.setAttribute("id", "__export-pdf__");
  Object.assign(container.style, {
    position: "absolute",
    top: "-9999px",
    left: "-9999px",
    width: "960px",
    background: "#ffffff",
    fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
    color: "#111827",
    overflow: "hidden",
  } as CSSStyleDeclaration);

  container.innerHTML = renderReportHtml(data);
  document.body.appendChild(container);

  const canvas = await html2canvas(container, {
    scale: 3,
    useCORS: true,
    logging: false,
    onclone: (_doc, el) => {
      el.getBoundingClientRect();
    },
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    putOnlyUsedFonts: true,
    floatPrecision: 16,
  });

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= 297;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= 297;
  }

  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Page ${i} of ${pageCount}`, 195, 290, { align: "right" });
  }

  pdf.save(`FairShare_${sanitizeName(group.name)}_Report.pdf`);
  document.body.removeChild(container);
}

// ── Helpers ────────────────────────────────────────────
function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s-_]/g, "").replace(/\s+/g, "_").slice(0, 50);
}

function escapeCSV(field: string): string {
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

const CATEGORY_COLORS: Record<string, string> = {
  food: "#f97316", transport: "#3b82f6", housing: "#8b5cf6",
  entertainment: "#ec4899", shopping: "#14b8a6", health: "#ef4444",
  education: "#f59e0b", travel: "#06b6d4", utilities: "#6366f1",
  other: "#6b7280",
};

const AVATAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#14b8a6", "#06b6d4", "#6366f1", "#10b981", "#f59e0b",
];

function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function renderReportHtml(data: GroupExportData): string {
  const { group, members, expenses, balances, totalGroupExpenses } = data;
  const now = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const currency = group.currency || "USD";

  const memberRows = balances
    .filter((b) => members.some((m) => m.id === b.user_id))
    .map((b) => {
      const m = members.find((mem) => mem.id === b.user_id);
      const name = m?.display_name || m?.profiles?.display_name || m?.full_name || b.display_name || "Unknown";
      return `
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 14px 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: ${avatarColor(b.user_id)}; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;">
            ${getInitials(name)}
          </div>
          <span style="font-size: 14px; color: #1f2937; font-weight: 500;">${name}</span>
        </div>
      </td>
      <td style="padding: 14px 16px; font-size: 14px; font-weight: 700; color: ${b.net_balance >= 0 ? "#10b981" : "#ef4444"}; text-align: right;">
        ${b.net_balance > 0 ? "+" : ""}${fmt(b.net_balance, currency)}
      </td>
    </tr>`;
    }).join("");

  const expenseRows = expenses.map((e) => {
    const catColor = CATEGORY_COLORS[e.category?.toLowerCase() || "other"];
    const payer = members.find((m) => m.id === e.paid_by);
    const payerName = payer?.display_name || payer?.profiles?.display_name || payer?.full_name || "Unknown";
    const dateStr = new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const splits = ((e as any).expense_splits || []) as Array<{
      user_id: string;
      profiles?: { display_name?: string; full_name?: string };
    }>;
    const splitTags = splits.map((s) => {
      const n = s?.profiles?.display_name || s?.profiles?.full_name || s?.user_id || "";
      if (!n) return "";
      return `<span style="display: inline-flex; align-items: center; gap: 4px; background: #f3f4f6; border-radius: 100px; padding: 2px 10px 2px 6px; font-size: 11px; color: #374151; margin-right: 4px; margin-bottom: 2px;">
        <span style="width: 16px; height: 16px; border-radius: 50%; background: ${avatarColor(n)}; display: inline-flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 700; color: #fff; flex-shrink: 0;">${getInitials(n)}</span>
        ${n}
      </span>`;
    }).join("");

    return `
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 16px;">
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${catColor}; margin-top: 6px; flex-shrink: 0;"></div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 4px;">${e.name}</div>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6b7280; margin-bottom: 6px;">
              <span style="display: inline-flex; align-items: center; gap: 4px;">
                <span style="width: 18px; height: 18px; border-radius: 50%; background: ${avatarColor(e.paid_by)}; display: inline-flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 700; color: #fff;">${getInitials(payerName)}</span>
                Paid by ${payerName}
              </span>
              <span style="color: #d1d5db;">·</span>
              <span>${dateStr}</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0;">
              ${splitTags}
            </div>
          </div>
        </div>
      </td>
      <td style="padding: 16px; text-align: right; vertical-align: top;">
        <span style="font-size: 16px; font-weight: 800; color: #111827; white-space: nowrap;">${fmt(e.amount, currency)}</span>
      </td>
    </tr>`;
  }).join("");

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; background: #fff; max-width: 960px; margin: 0 auto;">

  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1d4ed8 100%); padding: 40px 48px 32px;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <div style="font-size: 12px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 4px;">
          FAIRSHARE REPORT
        </div>
        <div style="font-size: 30px; font-weight: 800; color: #fff; line-height: 1.2; letter-spacing: -0.02em;">
          ${group.name}
        </div>
        <div style="font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 8px;">
          Generated ${now}
        </div>
      </div>
      <div style="width: 52px; height: 52px; background: rgba(255,255,255,0.12); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: #fff; font-family: Georgia, serif;">F</div>
    </div>
  </div>

  <div style="padding: 0 48px; margin-top: -20px;">
    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 140px; padding: 20px 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; margin-bottom: 6px;">TOTAL EXPENSES</div>
        <div style="font-size: 26px; font-weight: 800; color: #2563eb; letter-spacing: -0.02em;">${fmt(totalGroupExpenses, currency)}</div>
      </div>
      <div style="flex: 1; min-width: 100px; padding: 20px 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; margin-bottom: 6px;">EXPENSES</div>
        <div style="font-size: 26px; font-weight: 800; color: #1f2937;">${expenses.length}</div>
      </div>
      <div style="flex: 1; min-width: 100px; padding: 20px 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; margin-bottom: 6px;">MEMBERS</div>
        <div style="font-size: 26px; font-weight: 800; color: #1f2937;">${members.length}</div>
      </div>
      <div style="flex: 1; min-width: 100px; padding: 20px 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; margin-bottom: 6px;">SETTLEMENTS</div>
        <div style="font-size: 26px; font-weight: 800; color: #1f2937;">${data.completedSettlements.length + data.pendingSettlements.length}</div>
      </div>
    </div>
  </div>

  <div style="padding: 0 48px; margin-top: 36px;">
    <div style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
      <span style="display: inline-block; width: 4px; height: 20px; background: #2563eb; border-radius: 2px;"></span>
      Member Balances
    </div>
    ${memberRows ? `
    <table style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <thead>
        <tr style="background: #f8fafc;">
          <th style="padding: 12px 16px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; border-bottom: 1px solid #e5e7eb;">Member</th>
          <th style="padding: 12px 16px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; border-bottom: 1px solid #e5e7eb;">Net Balance</th>
        </tr>
      </thead>
      <tbody>${memberRows}</tbody>
    </table>` : `<div style="padding: 24px; text-align: center; color: #9ca3af; font-size: 14px; border: 1px dashed #e5e7eb; border-radius: 12px;">No members</div>`}
  </div>

  <div style="padding: 0 48px; margin-top: 36px;">
    <div style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
      <span style="display: inline-block; width: 4px; height: 20px; background: #2563eb; border-radius: 2px;"></span>
      Expense Log
    </div>
    ${expenseRows ? `
    <table style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <thead>
        <tr style="background: #f8fafc;">
          <th style="padding: 12px 16px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; border-bottom: 1px solid #e5e7eb;">Expense</th>
          <th style="padding: 12px 16px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; border-bottom: 1px solid #e5e7eb; width: 130px;">Amount</th>
        </tr>
      </thead>
      <tbody>${expenseRows}</tbody>
    </table>` : `<div style="padding: 24px; text-align: center; color: #9ca3af; font-size: 14px; border: 1px dashed #e5e7eb; border-radius: 12px;">No expenses yet</div>`}
  </div>

  <div style="padding: 32px 48px 40px;">
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 36px; height: 36px; background: #2563eb; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: #fff; font-family: Georgia, serif;">F</div>
        <div>
          <div style="font-size: 14px; font-weight: 700; color: #1f2937;">FairShare</div>
          <div style="font-size: 11px; color: #9ca3af;">Fair expense splitting</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; color: #9ca3af;">Generated <span style="color: #6b7280; font-weight: 600;">${now}</span></div>
      </div>
    </div>
  </div>
</div>`.trim();

  function fmt(amount: number, cur: string): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: cur || "USD",
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  }
}
