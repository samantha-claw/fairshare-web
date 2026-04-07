"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/providers/toast-provider";
import { DeleteAccountDialog } from "./_components/delete-account-dialog";
import { Settings, Mail, Lock, AlertTriangle, Loader2, Eye, EyeOff, Check, Shield } from "lucide-react";
import { motion } from "framer-motion";

// ── Skeleton ────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-3xl animate-pulse px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-surface-2" />
          <div className="space-y-2">
            <div className="h-8 w-40 rounded bg-surface-2" />
            <div className="h-4 w-56 rounded bg-surface-2" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-6 h-52 rounded-2xl bg-surface-2/40" />
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
        className="w-full rounded-xl border border-border bg-surface py-2.5 pl-4 pr-11 text-sm text-text-primary shadow-sm transition-all duration-200 placeholder:text-text-tertiary focus:border-border-2 focus:outline-none focus:ring-2 focus:ring-border/30 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-pressed={show}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary transition-colors hover:text-text-secondary"
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
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      if (cancelled) return;
      setUsername(profile?.username ?? user.email ?? "confirm-delete");
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
          toast.success("Confirmation sent. Check your old and new email inboxes to confirm the change.");
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
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-10">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* ── Page Header ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-text-primary shadow-lg">
            <Settings className="h-7 w-7 text-surface" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
              Settings
            </h1>
            <p className="text-sm text-text-secondary">
              Manage your account, security, and preferences
            </p>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* ═══════════════════════════════════════════
              SECTION 1 — Change Email
          ═══════════════════════════════════════════ */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
          >
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2">
                  <Mail className="h-5 w-5 text-text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">Email Address</h2>
                  <p className="text-xs text-text-secondary">
                    Currently: <span className="font-medium text-text-primary">{userEmail}</span>
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={handleEmailUpdate} className="px-6 py-5">
              <div className="space-y-3">
                <div>
                  <label htmlFor="new-email" className="mb-1.5 block text-sm font-semibold text-text-primary">
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
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary shadow-sm transition-all duration-200 placeholder:text-text-tertiary focus:border-border-2 focus:outline-none focus:ring-2 focus:ring-border/30 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-surface-2 p-3">
                  <Mail className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-text-secondary" />
                  <p className="text-xs text-text-secondary">
                    A confirmation link will be sent to both your current and new email addresses.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingEmail || !newEmail.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-text-primary px-5 py-2.5 text-sm font-semibold text-surface shadow-sm transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-border/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
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
          </motion.section>

          {/* ═══════════════════════════════════════════
              SECTION 2 — Change Password
          ═══════════════════════════════════════════ */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
          >
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2">
                  <Lock className="h-5 w-5 text-text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">Password</h2>
                  <p className="text-xs text-text-secondary">
                    Update your password to keep your account secure
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={handlePasswordUpdate} className="px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold text-text-primary">
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
                  <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-semibold text-text-primary">
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
                <div id="password-requirements" className="space-y-1.5 rounded-lg bg-surface-2 p-3">
                  <p className="mb-1 text-xs font-semibold text-text-secondary">Requirements:</p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                        passwordLongEnough ? "bg-positive-bg text-positive" : "bg-surface-2 text-text-tertiary"
                      }`}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </div>
                    <span className={`text-xs ${passwordLongEnough ? "text-positive" : "text-text-secondary"}`}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                        passwordsMatch ? "bg-positive-bg text-positive" : "bg-surface-2 text-text-tertiary"
                      }`}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </div>
                    <span id="password-match-hint" className={`text-xs ${passwordsMatch ? "text-positive" : "text-text-secondary"}`}>
                      Passwords match
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingPassword || !passwordLongEnough || !passwordsMatch}
                  className="inline-flex items-center gap-2 rounded-xl bg-text-primary px-5 py-2.5 text-sm font-semibold text-surface shadow-sm transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-border/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
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
          </motion.section>

          {/* ═══════════════════════════════════════════
              SECTION 3 — Danger Zone
          ═══════════════════════════════════════════ */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="overflow-hidden rounded-2xl border border-negative/30 bg-surface shadow-sm"
          >
            <div className="border-b border-negative/20 bg-negative-bg/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-negative-bg">
                  <AlertTriangle className="h-5 w-5 text-negative" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">Danger Zone</h2>
                  <p className="text-xs text-text-secondary">Irreversible and destructive actions</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-text-primary">Delete Account</h3>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    Permanently anonymize your profile, remove you from groups, and delete your auth credentials.
                    This cannot be undone.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <DeleteAccountDialog username={username} />
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
