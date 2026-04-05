"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
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
    // Note: if successful, the browser navigates away,
    // so we don't need to set isGoogleLoading(false)
  };

  return (
    <div className="w-full max-w-md">
      {/* ── Logo / Header ── */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
          <Lock className="h-8 w-8 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Sign in to your account to continue
        </p>
      </div>

      {/* ── Glass Card ── */}
      <div className="rounded-3xl border border-white/10 bg-surface/[0.07] p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 backdrop-blur-sm">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm leading-relaxed text-red-300">
              {error.message}
            </p>
          </div>
        )}

        {/* ── Google Login Button ── */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || loading}
          className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-surface/[0.05] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-surface/[0.08] hover:shadow-lg hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white/70" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* ── Divider ── */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white/30">
            Or continue with email
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* ── Email Form ── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="group">
            <label
              htmlFor="email"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-indigo-400" />
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
                className="w-full rounded-2xl border border-white/10 bg-surface/[0.05] py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 focus:border-indigo-500/50 focus:bg-surface/[0.08] focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <p id="email-error" className="mt-2 text-red-500 text-sm" role="alert">
              {error?.field === "email" ? error.message : ""}
            </p>
          </div>

          {/* Password */}
          <div className="group">
            <label
              htmlFor="password"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-indigo-400" />
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
                className="w-full rounded-2xl border border-white/10 bg-surface/[0.05] py-3.5 pl-12 pr-12 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 focus:border-indigo-500/50 focus:bg-surface/[0.08] focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <p id="password-error" className="mt-2 text-red-500 text-sm" role="alert">
              {error?.field === "password" ? error.message : ""}
            </p>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isGoogleLoading}
            className="group relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-500 hover:bg-[position:100%_0] hover:shadow-xl hover:shadow-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign In
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            )}
          </button>
        </form>

        {/* Register Link */}
        <p className="mt-8 text-center text-sm text-white/40">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
          >
            Create one
          </Link>
        </p>
      </div>

      {/* Footer accent */}
      <p className="mt-8 text-center text-xs text-white/20">
        Protected by enterprise-grade encryption
      </p>
    </div>
  );
}