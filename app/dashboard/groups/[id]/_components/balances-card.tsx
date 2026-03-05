"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useState, useMemo } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import type { Balance } from "@/types/group";
import { simplifyDebts } from "@/lib/debt-simplifier";
import { ArrowRight } from "lucide-react";

// ==========================================
// 🧩 TYPES
// ==========================================
interface BalancesCardProps {
  balances: Balance[];
  currency: string;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function BalancesCard({ balances, currency }: BalancesCardProps) {
  // حالة (State) للتبديل بين العرض الذكي وعرض الأرصدة القديم
  const [view, setView] = useState<"settlements" | "net">("settlements");

  // 🧠 تمرير البيانات للخوارزمية الذكية لحساب من يدفع لمن
  const simplifiedDebts = useMemo(() => {
    // نقوم بتجهيز البيانات لتطابق ما تطلبه دالة الخوارزمية
    const mappedBalances = balances.map((b: any) => ({
      userId: b.user_id,
      displayName: b.display_name,
      avatarUrl: b.avatar_url,
      amount: b.net_balance,
    }));
    return simplifyDebts(mappedBalances);
  }, [balances]);

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* ── Header & Tabs ── */}
      <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-6">
        <h2 className="text-sm font-bold text-gray-900">Group Balances</h2>
        
        {/* أزرار التبديل (لن تفقد ميزتك القديمة أبداً!) */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setView("settlements")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              view === "settlements"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Settle Up
          </button>
          <button
            onClick={() => setView("net")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              view === "net"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Net Balance
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* ========================================= */}
        {/* 🧠 THE NEW VIEW: Simplified Debts         */}
        {/* ========================================= */}
        {view === "settlements" && (
          <div className="space-y-4">
            {simplifiedDebts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-emerald-50/50 px-4 py-8 text-center">
                <p className="text-sm font-bold text-emerald-600">All settled up! 🎉</p>
                <p className="mt-1 text-xs font-medium text-gray-500">No one owes anything.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {simplifiedDebts.map((debt, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* الشخص الذي يجب أن يدفع */}
                      <Link href={`/dashboard/profile/${debt.from.userId}`} title={debt.from.displayName}>
                        <Avatar src={debt.from.avatarUrl} name={debt.from.displayName} size="sm" />
                      </Link>
                      <span className="max-w-[70px] truncate text-xs font-semibold text-gray-700 sm:max-w-[100px]">
                        {debt.from.displayName}
                      </span>

                      {/* سهم التحويل */}
                      <ArrowRight className="h-4 w-4 text-gray-400" />

                      {/* الشخص الذي سيستلم */}
                      <Link href={`/dashboard/profile/${debt.to.userId}`} title={debt.to.displayName}>
                        <Avatar src={debt.to.avatarUrl} name={debt.to.displayName} size="sm" />
                      </Link>
                      <span className="max-w-[70px] truncate text-xs font-semibold text-gray-700 sm:max-w-[100px]">
                        {debt.to.displayName}
                      </span>
                    </div>
                    {/* المبلغ */}
                    <div className="text-sm font-bold text-gray-900">
                      {formatCurrency(debt.amount, currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================= */}
        {/* 🛡️ THE OLD VIEW: Net Balances (Unchanged) */}
        {/* ========================================= */}
        {view === "net" && (
          <div className="space-y-3">
            {balances.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-8 text-center">
                <p className="text-sm text-gray-500">No balances to show yet.</p>
              </div>
            ) : (
              balances.map((bal) => (
                <div
                  key={bal.user_id}
                  className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Link href={`/dashboard/profile/${bal.user_id}`}>
                      <Avatar src={bal.avatar_url} name={bal.display_name} size="sm" />
                    </Link>
                    <Link
                      href={`/dashboard/profile/${bal.user_id}`}
                      className="text-sm font-semibold text-gray-900 hover:text-indigo-600 hover:underline"
                    >
                      {bal.display_name}
                    </Link>
                  </div>
                  <div className="text-right text-sm font-bold">
                    {bal.net_balance > 0 ? (
                      <span className="text-emerald-600">+{formatCurrency(bal.net_balance, currency)}</span>
                    ) : bal.net_balance < 0 ? (
                      <span className="text-red-600">-{formatCurrency(Math.abs(bal.net_balance), currency)}</span>
                    ) : (
                      <span className="text-gray-400">Settled</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
