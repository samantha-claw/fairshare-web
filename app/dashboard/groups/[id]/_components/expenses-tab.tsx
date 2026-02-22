"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import type { Expense } from "@/types/group";

// ==========================================
// 🧩 TYPES
// ==========================================
interface ExpensesTabProps {
  expenses: Expense[];
  currency: string;
  currentUser: string | null;
  isOwner: boolean;
  onEditExpense: (exp: Expense) => void;
  onDeleteExpense: (id: string, name: string) => void;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function ExpensesTab({
  expenses,
  currency,
  currentUser,
  isOwner,
  onEditExpense,
  onDeleteExpense,
}: ExpensesTabProps) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
        <p className="text-gray-500">No expenses yet. Start adding!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((exp) => (
        <div
          key={exp.id}
          className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:border-gray-200 hover:shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-white p-3 text-xl shadow-sm ring-1 ring-gray-100">🧾</div>
            <div>
              <h3 className="font-semibold text-gray-900">{exp.name}</h3>
              <p className="text-xs text-gray-500">
                Paid by{" "}
                <Link
                  href={`/dashboard/profile/${exp.paid_by}`}
                  className="font-medium text-gray-700 hover:text-blue-600 hover:underline"
                >
                  {exp.profiles.display_name || exp.profiles.full_name}
                </Link>{" "}
                · {new Date(exp.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <p className="text-lg font-bold text-gray-900">{formatCurrency(exp.amount, currency)}</p>
            <div className="flex items-center gap-2">
              <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                {exp.expense_splits?.length} members
              </span>

              {(currentUser === exp.paid_by || isOwner) && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditExpense(exp)}
                    className="p-1 text-gray-400 transition-colors hover:text-blue-600"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteExpense(exp.id, exp.name)}
                    className="p-1 text-gray-400 transition-colors hover:text-red-600"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}