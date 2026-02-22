"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import type { Balance } from "@/types/group";

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
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-800">Balances</h2>
      </div>

      {balances.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center">
          <p className="text-sm text-gray-500">No balances to show yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {balances.map((bal) => (
            <div
              key={bal.user_id}
              className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <Link href={`/dashboard/profile/${bal.user_id}`}>
                  <Avatar src={bal.avatar_url} name={bal.display_name} size="sm" />
                </Link>
                <Link
                  href={`/dashboard/profile/${bal.user_id}`}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline"
                >
                  {bal.display_name}
                </Link>
              </div>
              <div className="text-right text-xs font-bold">
                {bal.net_balance > 0 ? (
                  <span className="text-green-600">+{formatCurrency(bal.net_balance, currency)}</span>
                ) : bal.net_balance < 0 ? (
                  <span className="text-red-600">-{formatCurrency(bal.net_balance, currency)}</span>
                ) : (
                  <span className="text-gray-400">Settled</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}