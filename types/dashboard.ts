// ==========================================
// 📦 IMPORTS
// ==========================================
// (none — pure type definitions)

// ==========================================
// 🧩 TYPES
// ==========================================

export interface Profile {
  display_name: string;
  avatar_url: string;
}

export interface GroupBalance {
  group_id: string;
  group_name: string;
  currency: string;
  net_balance: number;
  owner_id: string;
  created_at: string;
}

export interface RecentExpense {
  id: string;
  name: string;
  amount: number;
  created_at: string;
  group_id: string;
  paid_by_profile: { display_name: string; avatar_url: string } | null;
  expense_group: { name: string } | null;
}