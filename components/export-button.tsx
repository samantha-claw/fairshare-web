"use client";

// ==========================================
// 📤 EXPORT BUTTON — DROPDOWN WITH PDF/CSV OPTIONS
// ==========================================
import { useState, useRef, useEffect, useCallback } from "react";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  exportGroupPDF,
  exportGroupExpensesCSV,
  exportGroupBalancesCSV,
  type GroupExportData,
} from "@/lib/export";

// ==========================================
// 🧩 PROPS
// ==========================================
interface ExportButtonProps {
  data: GroupExportData;
  className?: string;
}

// ==========================================
// 🎨 EXPORT BUTTON COMPONENT
// ==========================================
export function ExportButton({ data, className = "" }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    },
    []
  );

  // ── Export Handlers ─────────────────────────────
  const handlePDF = useCallback(async () => {
    setExportingPDF(true);
    setIsOpen(false);
    try {
      await exportGroupPDF(data);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExportingPDF(false);
    }
  }, [data]);

  const handleExpensesCSV = useCallback(() => {
    exportGroupExpensesCSV(data);
    setIsOpen(false);
  }, [data]);

  const handleBalancesCSV = useCallback(() => {
    exportGroupBalancesCSV(data);
    setIsOpen(false);
  }, [data]);

  // ================================================
  // 🎨 RENDER
  // ================================================
  return (
    <div className="relative inline-flex" onKeyDown={handleKeyDown}>
      {/* ── Trigger Button ──────────────────────── */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={exportingPDF}
        className={`flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition-all hover:bg-surface-2 disabled:opacity-60 ${className}`}
        title="Export Report"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {exportingPDF ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline">Exporting…</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </>
        )}
      </button>

      {/* ── Dropdown Menu ───────────────────────── */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-xl animate-in slide-in-from-top-2"
        >
          {/* PDF Option */}
          <button
            role="menuitem"
            onClick={handlePDF}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-text-primary transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              <FileText className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-medium">Full Report (PDF)</span>
              <span className="text-xs text-text-muted">
                Professional document with all details
              </span>
            </div>
          </button>

          {/* CSV — Expenses */}
          <button
            role="menuitem"
            onClick={handleExpensesCSV}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-text-primary transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
              <FileSpreadsheet className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-medium">Expenses (CSV)</span>
              <span className="text-xs text-text-muted">
                Spreadsheet-ready expenses list
              </span>
            </div>
          </button>

          {/* CSV — Balances */}
          <button
            role="menuitem"
            onClick={handleBalancesCSV}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-text-primary transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
              <FileSpreadsheet className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-medium">Balances (CSV)</span>
              <span className="text-xs text-text-muted">
                Member balance summary
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}