// ==========================================
// 📦 IMPORTS
// ==========================================
// (none — pure type definitions)

// ==========================================
// 🧩 TYPES
// ==========================================

export interface Friend {
  friend_id: string;
  friend_username: string;
  friend_display_name: string;
  friend_avatar_url: string;
}

export interface PendingRequest {
  request_id: string;
  sender_id: string;
  sender_username: string;
  sender_display_name: string;
  sender_avatar_url: string;
  created_at: string;
}

export interface OutgoingRequest {
  request_id: string;
  receiver_id: string;
  receiver_username: string;
  receiver_display_name: string;
  receiver_avatar_url: string;
  created_at: string;
}

export interface SearchResultUser {
  id: string;
  username: string;
  display_name: string;
  full_name: string;
  avatar_url: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error";
  message: string;
}