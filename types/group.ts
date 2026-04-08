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

export interface Expense {
  id: string;
  name: string;
  amount: number;
  created_at: string;
  paid_by: string;
 category?: string;
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