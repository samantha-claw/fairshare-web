// ==========================================
// 📦 IMPORTS
// ==========================================
// (none — pure type definitions)

// ==========================================
// 🧩 TYPES
// ==========================================

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  is_public: boolean;
}

export type FriendStatus = "none" | "pending" | "friends";

export interface ProfileGroup {
  group_id: string;
  group_name: string;
  currency: string;
  net_balance: number;
  created_at: string;
}

export interface ProfileActivity {
  id: string;
  name: string;
  amount: number;
  created_at: string;
  group_name: string;
  group_id: string;
  type: "expense" | "settlement";
}

export interface ProfileStats {
  totalGroups: number;
  totalExpensesPaid: number;
  totalOwed: number;
  totalOwes: number;
  netBalance: number;
}