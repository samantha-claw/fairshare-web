"use client";

import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/constants/expense-categories";

interface CategorySelectorProps {
  value: ExpenseCategory;
  onChange: (category: ExpenseCategory) => void;
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-900">
        Category
      </label>
      <div className="grid grid-cols-5 gap-2">
        {EXPENSE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={`flex flex-col items-center rounded-lg border p-2 text-center ${
              value === cat.id
                ? "border-gray-900 bg-gray-100"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="text-lg">{cat.icon}</span>
            <span className="text-xs font-medium">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
