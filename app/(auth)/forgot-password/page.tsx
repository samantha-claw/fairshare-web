"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, ArrowRight, Loader2, CheckCircle2, ArrowLeft, Lock, Eye, EyeOff, AlertCircle, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { validate } from "@/lib/validate";
import { forgotPasswordSchema } from "@/lib/validations";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(window.location.search);
    const type = hashParams.get("type") ?? queryParams.get("type");
    setIsRecoveryMode(type === "recovery");
  }, []);

  const handleForgotSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    const validation = validate(forgotPasswordSchema, { email: normalizedEmail });
    if (!validation.success) {
      setError(validation.errors.email ?? "Please enter a valid email address.");
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/forgot-password`,
    });
    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  const handleResetSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    setPasswordUpdated(true);
  };

  // ── Password Updated Success ──
  if (passwordUpdated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-border bg-surface p-8 text-center shadow-lg">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-positive-bg">
            <CheckCircle2 className="h-8 w-8 text-positive" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Password updated</h2>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Your password has been reset successfully.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-text-primary px-6 py-3 text-sm font-semibold text-surface transition-all hover:opacity-90"
          >
            Back to Sign In
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    );
  }

  // ── Email Sent Success ──
  if (sent && !isRecoveryMode) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-border bg-surface p-8 text-center shadow-lg">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-positive-bg">
            <CheckCircle2 className="h-8 w-8 text-positive" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Check your email</h2>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-medium text-text-primary">{email}</span>.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-text-primary transition-all hover:bg-surface-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      {/* ── Logo / Header ── */}
      <div className="mb-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-text-primary shadow-lg"
        >
          <KeyRound className="h-8 w-8 text-surface" strokeWidth={2} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-black tracking-tight text-text-primary"
        >
          {isRecoveryMode ? "Set new password" : "Reset Password"}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-sm text-text-secondary"
        >
          {isRecoveryMode
            ? "Enter and confirm your new password"
            : "Enter your email and we'll send you a reset link"}
        </motion.p>
      </div>

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-3xl border border-border bg-surface p-8 shadow-lg"
      >
        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            id={isRecoveryMode ? "recovery-error" : "forgot-error"}
            className="mb-6 flex items-start gap-3 rounded-xl border border-negative/30 bg-negative-bg px-4 py-3"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-negative" />
            <p className="text-sm text-negative">{error}</p>
          </motion.div>
        )}

        {isRecoveryMode ? (
          // ── Password Reset Form ──
          <form onSubmit={handleResetSubmit} className="space-y-5">
            <div className="group">
              <label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                New Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary transition-colors group-focus-within:text-text-primary" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "recovery-error" : undefined}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-border bg-surface py-3.5 pl-12 pr-12 text-sm text-text-primary outline-none transition-all placeholder:text-text-tertiary focus:border-border-2 focus:ring-2 focus:ring-border/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary transition-colors hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="group">
              <label htmlFor="confirmPassword" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary transition-colors group-focus-within:text-text-primary" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "recovery-error" : undefined}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-border bg-surface py-3.5 pl-12 pr-12 text-sm text-text-primary outline-none transition-all placeholder:text-text-tertiary focus:border-border-2 focus:ring-2 focus:ring-border/30"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  aria-pressed={showConfirmPassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary transition-colors hover:text-text-primary"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-text-primary py-3.5 text-sm font-semibold text-surface shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Update Password
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          // ── Email Form ──
          <form onSubmit={handleForgotSubmit} className="space-y-5">
            <div className="group">
              <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary transition-colors group-focus-within:text-text-primary" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-describedby={error ? "forgot-error" : undefined}
                  aria-invalid={Boolean(error)}
                  required
                  className="w-full rounded-xl border border-border bg-surface py-3.5 pl-12 pr-4 text-sm text-text-primary outline-none transition-all placeholder:text-text-tertiary focus:border-border-2 focus:ring-2 focus:ring-border/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-text-primary py-3.5 text-sm font-semibold text-surface shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          <Link href="/login" className="font-medium text-text-primary transition-colors hover:opacity-80">
            Back to Sign In
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}
