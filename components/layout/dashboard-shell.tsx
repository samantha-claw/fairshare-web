"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { Spinner } from "@/components/ui/spinner";

// ==========================================
// 🧩 TYPES
// ==========================================
interface DashboardShellProps {
  children: ReactNode;
}

interface UserProfile {
  display_name: string;
  avatar_url: string;
}

// ==========================================
// ⚙️ SKELETON
// ==========================================
function ShellSkeleton() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
          <span className="text-lg font-black text-white">F</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Spinner className="h-4 w-4" />
          Loading…
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    display_name: "User",
    avatar_url: "",
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ── Auth + Profile Fetch ────────────────────────── */

  const initialize = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        setProfile({
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  /* ── Sign Out ────────────────────────────────────── */

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  /* ── Loading State ───────────────────────────────── */

  if (loading) return <ShellSkeleton />;

  return (
    /*
     * ════════════════════════════════════════════════
     * ROOT CONTAINER
     *
     * w-full          → fill viewport width
     * max-w-full      → never exceed viewport
     * overflow-x-hidden → kill any horizontal scroll
     * ════════════════════════════════════════════════
     */
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50">
      {/* ── Desktop Sidebar (hidden on mobile) ───── */}
      <Sidebar
        displayName={profile.display_name}
        avatarUrl={profile.avatar_url}
        onSignOut={handleSignOut}
      />

      {/* ── Mobile Sidebar Overlay ───────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[280px] animate-in slide-in-from-left duration-300">
            <div className="flex h-full flex-col border-r border-slate-800/50 bg-slate-950">
              <div className="flex h-16 items-center justify-between border-b border-slate-800/50 px-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                    <span className="text-sm font-black text-white">F</span>
                  </div>
                  <span className="text-lg font-bold text-white">
                    Fair<span className="text-indigo-400">Share</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  displayName={profile.display_name}
                  avatarUrl={profile.avatar_url}
                  onSignOut={handleSignOut}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/*
       * ════════════════════════════════════════════════
       * MAIN CONTENT COLUMN
       *
       * pl-0           → NO left push on mobile (CRITICAL)
       * md:pl-[260px]  → offset for sidebar only on desktop
       * w-full         → span full available width
       * min-w-0        → allow flex children to shrink below content size
       * overflow-x-hidden → secondary overflow guard
       * ════════════════════════════════════════════════
       */}
      <div className="flex w-full min-w-0 flex-col overflow-x-hidden pl-0 md:pl-[260px]">
        {/* Header */}
        <Header
          displayName={profile.display_name}
          avatarUrl={profile.avatar_url}
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />

        {/*
         * PAGE CONTENT WRAPPER
         *
         * w-full      → fill column
         * min-w-0     → prevent content from forcing overflow
         * px-4 … lg:px-8 → consistent horizontal padding at every breakpoint
         * pb-32       → clear mobile nav + FABs
         * md:pb-8     → normal on desktop
         */}
        <main className="w-full min-w-0 flex-1 px-4 pb-32 sm:px-6 md:pb-8 lg:px-8">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ────────────────────── */}
      <MobileNav
        displayName={profile.display_name}
        avatarUrl={profile.avatar_url}
      />
    </div>
  );
}