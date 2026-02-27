// contexts/user-context.tsx
"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserContextValue {
  userId: string | null;
  displayName: string;
  avatarUrl: string;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  userId: null,
  displayName: "User",
  avatarUrl: "",
  loading: true,
  refreshProfile: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("User");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (data) {
      setDisplayName(data.display_name || "User");
      setAvatarUrl(data.avatar_url || "");
    }
  }, [supabase]);

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false));
  }, [refreshProfile]);

  return (
    <UserContext.Provider value={{ userId, displayName, avatarUrl, loading, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);