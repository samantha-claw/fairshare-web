// File: app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/providers/toast-provider";
import { DeleteAccountDialog } from "./_components/delete-account-dialog";
import {
  ArrowLeft,
  Settings,
  Mail,
  Lock,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Check,
  Shield,
} from "lucide-react";

// ── Skeleton ────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl animate-pulse px-4 py-10 sm:px-6">
        <div className="mb-6 h-5 w-32 rounded bg-gray-200" />
        <div className="mb-8 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gray-200" />
          <div className="space-y-2">
            <div className="h-7 w-40 rounded bg-gray-200" />
            <div className="h-4 w-56 rounded bg-gray-200" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-6 h-52 rounded-2xl bg-gray-200/40" />
        ))}
      </div>
    </div>
  );
}

// ── Password Input ──────────────────────────────────────
function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  ariaDescribedBy,
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  disabled: boolean;
  ariaDescribedBy?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="new-password"
        aria-describedby={ariaDescribedBy}
        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-11 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-pressed={show}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();

  // ── Auth state ──────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [username, setUsername] = useState("");

  // ── Email form ──────────────────────────────────
  const [newEmail, setNewEmail] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // ── Password form ───────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // ── Load user data ──────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setUserEmail(user.email ?? "");

      // Fetch username from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      setUsername(profile?.username ?? user.email ?? "user");
      setLoading(false);
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  // ── Email update handler ────────────────────────
  const handleEmailUpdate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmed = newEmail.trim().toLowerCase();

      if (!trimmed) {
        toast.error("Email required. Please enter a new email address.");
        return;
      }

      if (trimmed === userEmail.toLowerCase()) {
        toast.error("That is already your current email address.");
        return;
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        toast.error("Invalid email. Please enter a valid email address.");
        return;
      }

      setIsUpdatingEmail(true);

      try {
        const { error } = await supabase.auth.updateUser({
          email: trimmed,
        });

        if (error) {
          toast.error(`Email update failed: ${error.message}`);
        } else {
          toast.success(
            "Confirmation sent. Check your old and new email inboxes to confirm the change."
          );
          setNewEmail("");
        }
      } catch {
        toast.error("Unexpected error. Please try again.");
      } finally {
        setIsUpdatingEmail(false);
      }
    },
    [newEmail, userEmail, supabase, toast]
  );

  // ── Password update handler ─────────────────────
  const handlePasswordUpdate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (newPassword.length < 8) {
        toast.error("Password must be at least 8 characters long.");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }

      setIsUpdatingPassword(true);

      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          toast.error(`Password update failed: ${error.message}`);
        } else {
          toast.success("Password updated successfully.");
          setNewPassword("");
          setConfirmPassword("");
        }
      } catch {
        toast.error("Unexpected error. Please try again.");
      } finally {
        setIsUpdatingPassword(false);
      }
    },
    [newPassword, confirmPassword, supabase, toast]
  );

  // ── Loading state ───────────────────────────────
  if (loading) return <PageSkeleton />;

  // ── Password validation hints ───────────────────
  const passwordLongEnough = newPassword.length >= 8;
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-10">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* ── Back Button ────────────────────────────── */}
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-6 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-gray-500 transition-all hover:bg-white hover:text-gray-900 hover:shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </button>

        {/* ── Page Header ────────────────────────────── */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 shadow-lg shadow-gray-500/20">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Settings
            </h1>
            <p className="text-sm text-gray-500">
              Manage your account, security, and preferences
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* ═══════════════════════════════════════════
              SECTION 1 — Change Email
              ═══════════════════════════════════════════ */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Email Address
                  </h2>
                  <p className="text-xs text-gray-500">
                    Currently:{" "}
                    <span className="font-medium text-gray-700">
                      {userEmail}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleEmailUpdate} className="px-6 py-5">
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="new-email"
                    className="mb-1.5 block text-sm font-semibold text-gray-700"
                  >
                    New email address
                  </label>
                  <input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="your-new-email@example.com"
                    disabled={isUpdatingEmail}
                    autoComplete="email"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3">
                  <Mail className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                  <p className="text-xs text-blue-700">
                    A confirmation link will be sent to both your current and new
                    email addresses.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingEmail || !newEmail.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  {isUpdatingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Update Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* ═══════════════════════════════════════════
              SECTION 2 — Change Password
              ═══════════════════════════════════════════ */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                  <Lock className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Password
                  </h2>
                  <p className="text-xs text-gray-500">
                    Update your password to keep your account secure
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate} className="px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-1.5 block text-sm font-semibold text-gray-700"
                  >
                    New password
                  </label>
                  <PasswordInput
                    id="new-password"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="Enter new password"
                    disabled={isUpdatingPassword}
                    ariaDescribedBy="password-requirements"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-1.5 block text-sm font-semibold text-gray-700"
                  >
                    Confirm new password
                  </label>
                  <PasswordInput
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Confirm new password"
                    disabled={isUpdatingPassword}
                    ariaDescribedBy="password-match-hint"
                  />
                </div>

                {/* Validation hints */}
                <div
                  id="password-requirements"
                  className="space-y-1.5 rounded-lg bg-gray-50 p-3"
                >
                  <p className="mb-1 text-xs font-semibold text-gray-500">
                    Requirements:
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                        passwordLongEnough
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </div>
                    <span
                      className={`text-xs ${passwordLongEnough ? "text-emerald-700" : "text-gray-500"}`}
                    >
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      id="password-match-hint"
                      className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                        passwordsMatch
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </div>
                    <span
                      className={`text-xs ${passwordsMatch ? "text-emerald-700" : "text-gray-500"}`}
                    >
                      Passwords match
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={
                    isUpdatingPassword ||
                    !passwordLongEnough ||
                    !passwordsMatch
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* ═══════════════════════════════════════════
              SECTION 3 — Danger Zone
              ═══════════════════════════════════════════ */}
          <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
            <div className="border-b border-red-100 bg-red-50/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-red-900">
                    Danger Zone
                  </h2>
                  <p className="text-xs text-red-600">
                    Irreversible and destructive actions
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900">
                    Delete Account
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Permanently anonymize your profile, remove you from groups,
                    and delete your auth credentials. This cannot be undone.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <DeleteAccountDialog username={username} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}