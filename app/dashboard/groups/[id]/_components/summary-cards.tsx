"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { formatCurrency } from "@/lib/utils";

// ==========================================
// 🧩 TYPES
// ==========================================
interface SummaryCardsProps {
  totalGroupExpenses: number;
  myNetBalance: number;
  pendingCount: number;
  currency: string;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function SummaryCards({
  totalGroupExpenses,
  myNetBalance,
  pendingCount,
  currency,
}: SummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Total Expenses */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Expenses</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalGroupExpenses, currency)}</p>
          </div>
        </div>
      </div>

      {/* My Balance */}
      <div
        className={`rounded-xl border bg-white p-5 shadow-sm ${
          myNetBalance > 0 ? "border-green-200" : myNetBalance < 0 ? "border-red-200" : "border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              myNetBalance > 0
                ? "bg-green-100 text-green-600"
                : myNetBalance < 0
                ? "bg-red-100 text-red-600"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">My Balance</p>
            <p
              className={`text-xl font-bold ${
                myNetBalance > 0 ? "text-green-600" : myNetBalance < 0 ? "text-red-600" : "text-gray-900"
              }`}
            >
              {myNetBalance > 0 && "+"}
              {myNetBalance < 0 && "-"}
              {formatCurrency(myNetBalance, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Settlements Count */}
      <div
        className={`rounded-xl border bg-white p-5 shadow-sm ${
          pendingCount > 0 ? "border-amber-200" : "border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              pendingCount > 0 ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pending</p>
            <p className="text-xl font-bold text-gray-900">{pendingCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}