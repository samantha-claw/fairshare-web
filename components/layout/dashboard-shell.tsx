"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { Spinner } from "@/components/ui/spinner";

interface DashboardShellProps {
  children: ReactNode;
}

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string;
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-surface">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-text-primary shadow-lg">
          <span className="text-lg font-black text-surface">F</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Spinner className="h-4 w-4" />
          Loading…
        </div>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-surface text-text-primary flex antialiased transition-colors duration-200">
      {/* ── Desktop Sidebar ── */}
      <div className="hidden md:flex md:flex-shrink-0 p-3">
        <Sidebar
          displayName={profile.display_name}
          avatarUrl={profile.avatar_url}
          onSignOut={handleSignOut}
        />
      </div>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 animate-fade-in">
            <Sidebar
              displayName={profile.display_name}
              avatarUrl={profile.avatar_url}
              onSignOut={handleSignOut}
              isMobile
            />
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          displayName={profile.display_name}
          avatarUrl={profile.avatar_url}
          userId={profile.id}
          onMobileMenuToggle={() => setMobileMenuOpen((v) => !v)}
        />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <MobileNav
        displayName={profile.display_name}
        avatarUrl={profile.avatar_url}
      />
    </div>
  );
}
