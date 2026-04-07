// components/split-type-selector.tsx
"use client";

import { useMemo, useCallback, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";

// ─── Types ───
export type SplitType = "equal" | "exact" | "percentage" | "shares";

interface Member {
  id: string;
  display_name?: string;
  username: string;
  avatar_url?: string;
}

export interface ComputedSplit {
  userId: string;
  amount: number;
  percentage: number;
  shares: number;
}

interface SplitTypeSelectorProps {
  splitType: SplitType;
  onSplitTypeChange: (type: SplitType) => void;
  members: Member[];
  totalAmount: number;
  allocations: Map<string, number>;
  onAllocationChange: (userId: string, value: number) => void;
  selectedMembers: Set<string>;
  onSelectedMembersChange: (ids: Set<string>) => void;
  onComputedSplitsChange?: (splits: ComputedSplit[], isValid: boolean) => void;
  currency?: string;
}

// ─── Split type configuration ───
const SPLIT_TYPES: {
  value: SplitType;
  label: string;
  icon: string;
  hint: string;
}[] = [
  {
    value: "equal",
    label: "Equal",
    icon: "⚖️",
    hint: "Split equally among selected members",
  },
  {
    value: "exact",
    label: "Exact",
    icon: "💰",
    hint: "Enter exact amount for each person",
  },
  {
    value: "percentage",
    label: "Percent",
    icon: "📊",
    hint: "Enter percentage for each person",
  },
  {
    value: "shares",
    label: "Shares",
    icon: "🎯",
    hint: "Enter share units for each person",
  },
];

// ─── Helper: get member display name ───
const getName = (m: Member) => m.display_name || m.username;

// ═══════════════════════════════════════
// ██  SplitTypeSelector Component      ██
// ═══════════════════════════════════════
export function SplitTypeSelector({
  splitType,
  onSplitTypeChange,
  members,
  totalAmount,
  allocations,
  onAllocationChange,
  selectedMembers,
  onSelectedMembersChange,
  onComputedSplitsChange,
  currency = "$",
}: SplitTypeSelectorProps) {

  // ─── 1) Compute actual amounts per member ───
  const computed = useMemo(() => {
    const results: Map<string, number> = new Map();

    switch (splitType) {
      case "equal": {
        const selected = [...selectedMembers];
        if (selected.length === 0) break;
        const perPerson = totalAmount / selected.length;
        // Handle penny rounding: remainder goes to first person
        const rounded = Math.floor(perPerson * 100) / 100;
        const remainder = +(totalAmount - rounded * selected.length).toFixed(2);
        selected.forEach((id, i) => {
          results.set(id, i === 0 ? rounded + remainder : rounded);
        });
        break;
      }

      case "exact": {
        members.forEach((m) => {
          results.set(m.id, allocations.get(m.id) ?? 0);
        });
        break;
      }

      case "percentage": {
        members.forEach((m) => {
          const pct = allocations.get(m.id) ?? 0;
          results.set(m.id, +((pct / 100) * totalAmount).toFixed(2));
        });
        break;
      }

      case "shares": {
        const totalShares = [...allocations.values()].reduce(
          (s, v) => s + (v || 0),
          0
        );
        if (totalShares === 0) break;
        const memberIds = members.map((m) => m.id);
        const rounded = memberIds.map((id) => {
          const sh = allocations.get(id) ?? 0;
          return Math.floor((sh / totalShares) * totalAmount * 100) / 100;
        });
        const roundedSum = rounded.reduce((s, v) => s + v, 0);
        const remainder = +((totalAmount - roundedSum).toFixed(2));
        const remainderIndex = memberIds.findIndex((id) => (allocations.get(id) ?? 0) > 0);

        memberIds.forEach((id, i) => {
          results.set(id, i === remainderIndex ? rounded[i] + remainder : rounded[i]);
        });
        break;
      }
    }

    return results;
  }, [splitType, totalAmount, selectedMembers, allocations, members]);

  // ─── 2) Validation state ───
  const validation = useMemo(() => {
    const allocated = [...computed.values()].reduce((s, v) => s + v, 0);
    const inputTotal = [...allocations.values()].reduce(
      (s, v) => s + (v || 0),
      0
    );

    let isValid = false;
    let message = "";
    let status: "ok" | "warn" | "error" = "warn";

    switch (splitType) {
      case "equal":
        isValid = selectedMembers.size > 0;
        message = isValid
          ? `${currency}${(totalAmount / selectedMembers.size).toFixed(2)}/person`
          : "Select at least one member";
        status = isValid ? "ok" : "warn";
        break;

      case "exact":
        if (Math.abs(inputTotal - totalAmount) < 0.01) {
          isValid = true;
          message = "Fully allocated";
          status = "ok";
        } else if (inputTotal > totalAmount) {
          message = `Over by ${currency}${(inputTotal - totalAmount).toFixed(2)}`;
          status = "error";
        } else {
          message = `${currency}${(totalAmount - inputTotal).toFixed(2)} remaining`;
          status = "warn";
        }
        break;

      case "percentage":
        if (Math.abs(inputTotal - 100) < 0.01) {
          isValid = true;
          message = "100% allocated";
          status = "ok";
        } else if (inputTotal > 100) {
          message = `Over by ${(inputTotal - 100).toFixed(1)}%`;
          status = "error";
        } else {
          message = `${(100 - inputTotal).toFixed(1)}% remaining`;
          status = "warn";
        }
        break;

      case "shares": {
        const totalShares = inputTotal;
        isValid = totalShares > 0;
        message = isValid
          ? `${totalShares} shares · ${currency}${(totalAmount / totalShares).toFixed(2)}/share`
          : "Enter at least one share";
        status = isValid ? "ok" : "warn";
        break;
      }
    }

    const progress =
      totalAmount > 0 ? Math.min((allocated / totalAmount) * 100, 105) : 0;

    return { isValid, message, status, allocated, progress };
  }, [computed, allocations, splitType, totalAmount, selectedMembers, currency]);

  // ─── 3) Send computed results to parent ───
  useEffect(() => {
    if (!onComputedSplitsChange) return;

    const splits: ComputedSplit[] = members
      .filter((m) => (computed.get(m.id) ?? 0) > 0)
      .map((m) => ({
        userId: m.id,
        amount: computed.get(m.id) ?? 0,
        percentage:
          totalAmount > 0
            ? +(((computed.get(m.id) ?? 0) / totalAmount) * 100).toFixed(2)
            : 0,
        shares: allocations.get(m.id) ?? 0,
      }));

    onComputedSplitsChange(splits, validation.isValid);
  }, [computed, validation.isValid]);

  // ─── 4) Handle type change with reset ───
  const handleTypeChange = useCallback(
    (type: SplitType) => {
      onSplitTypeChange(type);

      if (type === "equal") {
        // Select all members by default
        onSelectedMembersChange(new Set(members.map((m) => m.id)));
      } else {
        // Reset all values to zero
        members.forEach((m) => onAllocationChange(m.id, 0));
        onSelectedMembersChange(new Set());
      }
    },
    [members, onSplitTypeChange, onSelectedMembersChange, onAllocationChange]
  );

  // ─── 5) Toggle member selection (equal mode only) ───
  const toggleMember = (userId: string) => {
    if (splitType !== "equal") return;
    const next = new Set(selectedMembers);
    if (next.has(userId)) {
      if (next.size <= 1) return; // keep at least one
      next.delete(userId);
    } else {
      next.add(userId);
    }
    onSelectedMembersChange(next);
  };

  const toggleAll = () => {
    if (selectedMembers.size === members.length) {
      onSelectedMembersChange(new Set([members[0].id]));
    } else {
      onSelectedMembersChange(new Set(members.map((m) => m.id)));
    }
  };

  // ─── 6) Safe value input handler ───
  const handleValueInput = (userId: string, raw: string) => {
    if (raw === "" || raw === "0") {
      onAllocationChange(userId, 0);
      return;
    }
    const val = parseFloat(raw);
    if (isNaN(val) || val < 0) return;
    onAllocationChange(userId, val);
  };

  // ─── Style maps ───
  const statusColors = {
    ok: "text-emerald-600 bg-emerald-50",
    warn: "text-amber-600 bg-amber-50",
    error: "text-red-500 bg-red-50",
  };

  const barColors = {
    ok: "bg-emerald-500",
    warn: "bg-text-primary",
    error: "bg-red-500",
  };

  // ═══════════════════════════════════
  // ██           JSX                 ██
  // ═══════════════════════════════════
  return (
    <div className="space-y-3">

      {/* ── 1) Split Type Tabs ── */}
      <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
        {SPLIT_TYPES.map((st) => (
          <button
            key={st.value}
            type="button"
            onClick={() => handleTypeChange(st.value)}
            title={st.hint}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              splitType === st.value
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {st.icon} {st.label}
          </button>
        ))}
      </div>

      {/* ── 2) Progress Bar + Status Message ── */}
      {totalAmount > 0 && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                barColors[validation.status]
              }`}
              style={{ width: `${Math.min(validation.progress, 100)}%` }}
            />
          </div>
          <div
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              statusColors[validation.status]
            }`}
          >
            {validation.status === "ok" && "✓ "}
            {validation.message}
          </div>
        </div>
      )}

      {/* ── 3) Select All Toggle (equal mode) ── */}
      {splitType === "equal" && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-text-secondary">
            {selectedMembers.size}/{members.length} selected
          </span>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-medium text-text-primary hover:text-indigo-700"
          >
            {selectedMembers.size === members.length
              ? "Deselect all"
              : "Select all"}
          </button>
        </div>
      )}

      {/* ── 4) Members List ── */}
      <div className="space-y-1.5 rounded-xl border border-border p-2">
        {members.map((m) => {
          const isSelected = selectedMembers.has(m.id);
          const memberAmount = computed.get(m.id) ?? 0;
          const name = getName(m);

          return (
            <div
              key={m.id}
              onClick={() => toggleMember(m.id)}
              className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                splitType === "equal"
                  ? "cursor-pointer hover:bg-surface-2"
                  : "bg-surface-2"
              } ${
                splitType === "equal" && isSelected
                  ? "bg-indigo-50/60 ring-1 ring-indigo-200"
                  : ""
              }`}
            >
            {/* Avatar with check badge */}
            <div className="relative">

           <Avatar src={m.avatar_url} name={name} size="md" />
                {splitType === "equal" && (
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white text-[8px] transition-all ${
                      isSelected
                        ? "bg-text-primary text-white"
                        : "bg-gray-200 text-transparent"
                    }`}
                  >
                    ✓
                  </div>
                )}
              </div>

              {/* Name + computed amount */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">
                  {name}
                </p>
                {memberAmount > 0 && totalAmount > 0 && (
                  <p className="text-xs text-text-tertiary">
                    {currency}{memberAmount.toFixed(2)}
                    {splitType !== "equal" && splitType !== "exact" && (
                      <span className="ml-1">
                        ({((memberAmount / totalAmount) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Right side: display amount or input field */}
              {splitType === "equal" ? (
                isSelected &&
                totalAmount > 0 && (
                  <span className="text-sm font-semibold text-text-primary">
                    {currency}{memberAmount.toFixed(2)}
                  </span>
                )
              ) : (
                <div className="flex items-center gap-1.5">
                  {splitType === "exact" && (
                    <span className="text-xs text-text-tertiary">{currency}</span>
                  )}
                  <input
                    type="number"
                    step={splitType === "shares" ? "1" : "0.01"}
                    min="0"
                    value={allocations.get(m.id) || ""}
                    onChange={(e) => handleValueInput(m.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder={
                      splitType === "percentage"
                        ? "%"
                        : splitType === "shares"
                        ? "1"
                        : "0.00"
                    }
                    className={`w-24 rounded-lg border px-3 py-2 text-right text-sm font-mono outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 ${
                      (allocations.get(m.id) ?? 0) > 0
                        ? "border-indigo-300 bg-surface"
                        : "border-border bg-surface"
                    }`}
                  />
                  {splitType === "percentage" && (
                    <span className="text-xs text-text-tertiary">%</span>
                  )}
                  {splitType === "shares" && (
                    <span className="text-xs text-text-tertiary">×</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 5) Summary Footer ── */}
      {totalAmount > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-2.5 text-xs">
          <div className="space-y-0.5">
            <div className="text-text-tertiary">Allocated</div>
            <div
              className={`font-semibold ${
                validation.isValid ? "text-emerald-600" : "text-text-secondary"
              }`}
            >
              {currency}{validation.allocated.toFixed(2)}
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200" />

          <div className="space-y-0.5 text-right">
            <div className="text-text-tertiary">Total</div>
            <div className="font-semibold text-text-primary">
              {currency}{totalAmount.toFixed(2)}
            </div>
          </div>

          {validation.allocated < totalAmount - 0.01 && (
            <>
              <div className="h-6 w-px bg-gray-200" />
              <div className="space-y-0.5 text-right">
                <div className="text-text-tertiary">Remaining</div>
                <div className="font-semibold text-red-500">
                  {currency}{(totalAmount - validation.allocated).toFixed(2)}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}