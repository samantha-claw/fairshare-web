"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "./sidebar";
import { Spinner } from "@/components/ui/spinner";

// ==========================================
// 🧩 TYPES
// ==========================================
interface DashboardShellProps {
  children: ReactNode;
}

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string;
}

// ==========================================
// ⚙️ SKELETON
// ==========================================
function ShellSkeleton() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-background-light dark:bg-background-dark">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 shadow-lg shadow-primary/20">
          <span className="text-lg font-black text-white">F</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          <Spinner className="h-4 w-4" />
          Loading…
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🎨 UI RENDER — NEW DESIGN
// ==========================================
export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    display_name: "User",
    avatar_url: "",
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ── Auth + Profile Fetch ────────────────────────── */
  const initialize = useCallback(async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!user || authError) {
        router.replace("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile({
          id: user.id,
          display_name: profileData.display_name || "User",
          avatar_url: profileData.avatar_url || "",
        });
      }
    } catch (err) {
      console.error("Shell init error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  /* ── Auth State Listener ─────────────────────────── */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  /* ── Sign Out ────────────────────────────────────── */
  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      window.location.href = "/login";
    }
  }

  /* ── Loading State ───────────────────────────────── */
  if (loading) return <ShellSkeleton />;

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary min-h-screen flex antialiased p-4 lg:p-6 gap-6 transition-colors duration-200">
      {/* ── Sidebar (Desktop) ───────────────────── */}
      <Sidebar
        displayName={profile.display_name}
        avatarUrl={profile.avatar_url}
        onSignOut={handleSignOut}
      />

      {/* ── Mobile Sidebar Overlay ─────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[280px] animate-in slide-in-from-left duration-300">
            <Sidebar
              displayName={profile.display_name}
              avatarUrl={profile.avatar_url}
              onSignOut={handleSignOut}
              isMobile={true}
            />
          </div>
        </div>
      )}

      {/* ── Main Content ────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-light dark:bg-surface-dark rounded-3xl border border-border-light dark:border-border-dark shadow-sm">
        {children}
      </main>
    </div>
  );
}
