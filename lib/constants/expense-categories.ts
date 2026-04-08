// Expense categories matching Supabase enum

export type ExpenseCategory =
  | "rent"
  | "utilities"
  | "groceries"
  | "travel"
  | "health"
  | "cash"
  | "food"
  | "entertainment"
  | "shopping"
  | "other";

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string; icon: string }[] = [
  { id: "rent", label: "Rent", icon: "🏠" },
  { id: "utilities", label: "Utilities", icon: "💡" },
  { id: "groceries", label: "Groceries", icon: "🛒" },
  { id: "food", label: "Food", icon: "🍔" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "health", label: "Health", icon: "💊" },
  { id: "entertainment", label: "Entertainment", icon: "🎬" },
  { id: "shopping", label: "Shopping", icon: "🛍️" },
  { id: "cash", label: "Cash", icon: "💵" },
  { id: "other", label: "Other", icon: "📦" },
];
