// lib/get-current-user.ts
import { createClient } from "@/lib/supabase/client";

/**
 * Secure user identity check.
 * Uses getUser() (server-verified) instead of getSession() (localStorage).
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}