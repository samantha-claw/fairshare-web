// ==========================================
// 📦 IMPORTS
// ==========================================
// (none — pure type definitions)

// ==========================================
// 🧩 TYPES
// ==========================================

export interface Group {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  currency: string;
}

export interface Member {
  id: string;
  username: string;
  full_name: string;
  display_name: string;
  avatar_url: string;
  profiles: {
    username: string;
    full_name: string;
    display_name: string;
    avatar_url: string;
  };
}

export type ExpenseCategory =
  | "food"
  | "transport"
  | "housing"
  | "entertainment"
  | "shopping"
  | "health"
  | "education"
  | "travel"
  | "utilities"
  | "other";

export const EXPENSE_CATEGORIES: {
  value: ExpenseCategory;
  label: string;
  emoji: string;
}[] = [
  { value: "food", label: "Food & Drinks", emoji: "🍽️" },
  { value: "transport", label: "Transport", emoji: "🚗" },
  { value: "housing", label: "Housing", emoji: "🏠" },
  { value: "entertainment", label: "Entertainment", emoji: "🎬" },
  { value: "shopping", label: "Shopping", emoji: "🛒" },
  { value: "health", label: "Health", emoji: "💊" },
  { value: "education", label: "Education", emoji: "📚" },
  { value: "travel", label: "Travel", emoji: "✈️" },
  { value: "utilities", label: "Utilities", emoji: "💡" },
  { value: "other", label: "Other", emoji: "📦" },
];

export function getCategoryInfo(category: string | undefined | null): {
  value: ExpenseCategory;
  label: string;
  emoji: string;
} {
  const found = EXPENSE_CATEGORIES.find((c) => c.value === category);
  return found || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]; // "other"
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  created_at: string;
  paid_by: string;
  category?: ExpenseCategory;
  split_type?: string;
  profiles: { full_name: string; username: string; display_name: string };
  expense_splits?: { user_id: string }[];
}

export interface SearchResult {
  id: string;
  username: string;
  full_name: string;
  display_name: string;
  avatar_url: string;
}

export interface InvitableFriend {
  friend_id: string;
  friend_username: string;
  friend_full_name: string;
  friend_display_name: string;
  friend_avatar_url: string;
}

export interface Balance {
  user_id: string;
  display_name: string;
  avatar_url: string;
  total_paid: number;
  total_owed: number;
  net_balance: number;
}

export interface Settlement {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: "pending" | "completed" | "rejected";
  notes: string | null;
  created_at: string;
  created_by: string;
  from_profile: { display_name: string; username: string; avatar_url: string };
  to_profile: { display_name: string; username: string; avatar_url: string };
}

export type ActivityItem =
  | (Expense & { type: "expense" })
  | (Settlement & { type: "settlement" });