"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await signIn({ email, password });
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("Error with Google Login:", error.message);
      setIsGoogleLoading(false);
    }
  };

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
          <span className="text-2xl font-black text-surface">FS</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-black tracking-tight text-text-primary"
        >
          Welcome back
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-sm text-text-secondary"
        >
          Sign in to your account to continue
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
            className="mb-6 flex items-start gap-3 rounded-xl border border-negative/30 bg-negative-bg px-4 py-3"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-negative" />
            <p className="text-sm text-negative">{error.message}</p>
          </motion.div>
        )}

        {/* ── Google Login Button ── */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || loading}
          className="group flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-primary shadow-sm transition-all hover:bg-surface-2 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-text-secondary" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* ── Divider ── */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-text-tertiary">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* ── Email Form ── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) clearError();
                }}
                placeholder="you@example.com"
                autoComplete="email"
                aria-describedby="email-error"
                aria-invalid={error?.field === "email"}
                required
                className="w-full rounded-xl border border-border bg-surface py-3.5 pl-12 pr-4 text-sm text-text-primary outline-none transition-all placeholder:text-text-tertiary focus:border-border-2 focus:ring-2 focus:ring-border/30"
              />
            </div>
            {error?.field === "email" && (
              <p id="email-error" className="mt-2 text-sm text-negative" role="alert">
                {error.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="group">
            <label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary transition-colors group-focus-within:text-text-primary" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-describedby="password-error"
                aria-invalid={error?.field === "password"}
                required
                className="w-full rounded-xl border border-border bg-surface py-3.5 pl-12 pr-12 text-sm text-text-primary outline-none transition-all placeholder:text-text-tertiary focus:border-border-2 focus:ring-2 focus:ring-border/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary transition-colors hover:text-text-primary"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {error?.field === "password" && (
              <p id="password-error" className="mt-2 text-sm text-negative" role="alert">
                {error.message}
              </p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isGoogleLoading}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-text-primary py-3.5 text-sm font-semibold text-surface shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <p className="mt-8 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-text-primary transition-colors hover:opacity-80">
            Create one
          </Link>
        </p>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-xs text-text-tertiary"
      >
        Protected by enterprise-grade encryption
      </motion.p>
    </motion.div>
  );
}
