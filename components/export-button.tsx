"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  exportGroupPDF,
  exportGroupExpensesCSV,
  exportGroupBalancesCSV,
  type GroupExportData,
} from "@/lib/export";

interface ExportButtonProps {
  data: GroupExportData;
  className?: string;
}

export function ExportButton({ data, className = "" }: ExportButtonProps) {
  const t = useTranslations("groupDetail.export");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  }, []);

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

  return (
    <div className="relative inline-flex" onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={exportingPDF}
        className={`flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition-all hover:bg-surface-2 disabled:opacity-60 ${className}`}
        title={t("download")}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {exportingPDF ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline">{t("generating")}</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t("download")}</span>
          </>
        )}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-xl animate-in slide-in-from-top-2"
        >
          <button
            role="menuitem"
            onClick={handlePDF}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-text-primary transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              <FileText className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-medium">{t("pdfTitle")}</span>
              <span className="text-xs text-text-secondary">{t("pdfDesc")}</span>
            </div>
          </button>

          <button
            role="menuitem"
            onClick={handleExpensesCSV}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-text-primary transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
              <FileSpreadsheet className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-medium">{t("csvTitle")}</span>
              <span className="text-xs text-text-secondary">{t("csvDesc")}</span>
            </div>
          </button>

          <button
            role="menuitem"
            onClick={handleBalancesCSV}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-text-primary transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
              <FileSpreadsheet className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-medium">{t("balancesTitle")}</span>
              <span className="text-xs text-text-secondary">{t("balancesDesc")}</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
