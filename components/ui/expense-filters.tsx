"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { Expense, ExpenseCategory } from "@/types/group";
import { EXPENSE_CATEGORIES } from "@/types/group";

type SortBy = "date" | "amount" | "category";

interface ExpenseFiltersProps {
  expenses: Expense[];
  currentUserId: string | null;
  onFilteredChange: (filtered: Expense[]) => void;
}

export function ExpenseFilters({ expenses, currentUserId, onFilteredChange }: ExpenseFiltersProps) {
  const t = useTranslations("expensesTab");
  const tCommon = useTranslations("common");

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">("all");
  const [payerFilter, setPayerFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortAsc, setSortAsc] = useState(false);

  // Get unique payers from expenses
  const uniquePayers = useMemo(() => {
    const map = new Map<string, string>();
    expenses.forEach((e) => {
      if (!map.has(e.paid_by)) {
        map.set(e.paid_by, e.profiles?.display_name || e.profiles?.full_name || tCommon("unknown"));
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [expenses, tCommon]);

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || payerFilter !== "all" || sortBy !== "date";

  const clearAll = useCallback(() => {
    setSearchQuery("");
    setCategoryFilter("all");
    setPayerFilter("all");
    setSortBy("date");
    setSortAsc(false);
  }, []);

  // Apply filters and sort
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }

    if (categoryFilter !== "all") {
      result = result.filter((e) => e.category === categoryFilter);
    }

    if (payerFilter !== "all") {
      result = result.filter((e) => e.paid_by === payerFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") {
        cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "amount") {
        cmp = b.amount - a.amount;
      } else if (sortBy === "category") {
        cmp = (a.category || "other").localeCompare(b.category || "other");
      }
      return sortAsc ? -cmp : cmp;
    });

    onFilteredChange(result);
    return result;
  }, [expenses, searchQuery, categoryFilter, payerFilter, sortBy, sortAsc, onFilteredChange]);

  return (
    <div className="space-y-2">
      {/* Search Bar + Filter Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchExpenses")}
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
            showFilters
              ? "border-blue-500 bg-blue-500/10 text-blue-500"
              : "border-border bg-surface text-text-secondary hover:border-border-2"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">{tCommon("filter")}</span>
          {hasActiveFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
              !
            </span>
          )}
        </button>
      </div>

      {/* Expandable Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface-2/50 p-3">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | "all")}
                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-primary"
              >
                <option value="all">{tCommon("allCategories")}</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>

              {/* Payer Filter */}
              <select
                value={payerFilter}
                onChange={(e) => setPayerFilter(e.target.value)}
                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-primary"
              >
                <option value="all">{tCommon("allPayers")}</option>
                {uniquePayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id === currentUserId ? tCommon("you") : p.name}
                  </option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-primary"
              >
                <option value="date">{tCommon("sortByDate")}</option>
                <option value="amount">{tCommon("sortByAmount")}</option>
                <option value="category">{tCommon("sortByCategory")}</option>
              </select>

              {/* Sort Direction */}
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-primary hover:border-border-2"
              >
                {sortAsc ? "↑" : "↓"} {sortAsc ? tCommon("ascending") : tCommon("descending")}
              </button>

              {/* Clear All */}
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="ml-auto rounded-lg bg-negative/10 px-2.5 py-1.5 text-xs font-medium text-negative hover:bg-negative/20 transition-colors"
                >
                  {tCommon("clearAll")}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Count */}
      {(searchQuery || categoryFilter !== "all" || payerFilter !== "all") && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-text-tertiary"
        >
          {filteredExpenses.length} {filteredExpenses.length === 1 ? tCommon("expense") : tCommon("expenses")} {tCommon("found")}
        </motion.p>
      )}
    </div>
  );
}
