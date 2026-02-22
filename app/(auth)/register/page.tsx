// app/(auth)/register/page.tsx
"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  AtSign,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function RegisterPage() {
  const { signUp, loading, error, clearError } = useAuth();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  // Live username validation state
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const usernameRegex = /^[a-z0-9_]{3,30}$/;

  // Password strength
  const getPasswordStrength = (
    pw: string
  ): { label: string; color: string; width: string } => {
    if (pw.length === 0) return { label: "", color: "", width: "0%" };
    if (pw.length < 6)
      return { label: "Too short", color: "bg-red-500", width: "20%" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (pw.length >= 12) score++;

    if (score <= 1)
      return { label: "Weak", color: "bg-orange-500", width: "40%" };
    if (score <= 2)
      return { label: "Fair", color: "bg-yellow-500", width: "60%" };
    if (score <= 3)
      return { label: "Strong", color: "bg-emerald-500", width: "80%" };
    return { label: "Excellent", color: "bg-cyan-400", width: "100%" };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Force lowercase and strip invalid chars on the fly
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(raw);
    if (error) clearError();

    if (raw.length === 0) {
      setUsernameValid(null);
    } else {
      setUsernameValid(usernameRegex.test(raw));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = await signUp({ email, password, username, fullName });

    // If email confirmation is required
    if (result && "confirmEmail" in result && result.confirmEmail) {
      setEmailConfirmationSent(true);
    }
  };

  // ── Email Confirmation Success View ──
  if (emailConfirmationSent) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-8 text-center shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Check your email</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            We&apos;ve sent a confirmation link to{" "}
            <span className="font-medium text-white/70">{email}</span>. Click
            the link to activate your account.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            Back to Sign In
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* ── Logo / Header ── */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg shadow-purple-500/25">
          <User className="h-8 w-8 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Create account
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Join us and start your journey today
        </p>
      </div>

      {/* ── Glass Card ── */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 backdrop-blur-sm">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm leading-relaxed text-red-300">
              {error.message}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div className="group">
            <label
              htmlFor="fullName"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40"
            >
              Full Name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-purple-400" />
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) clearError();
                }}
                placeholder="John Doe"
                autoComplete="name"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 focus:border-purple-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          {/* Username */}
          <div className="group">
            <label
              htmlFor="username"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40"
            >
              Username
            </label>
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-purple-400" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="johndoe"
                autoComplete="username"
                required
                className={`w-full rounded-2xl border bg-white/[0.05] py-3.5 pl-12 pr-12 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 focus:bg-white/[0.08] focus:ring-2 ${
                  usernameValid === null
                    ? "border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20"
                    : usernameValid
                      ? "border-emerald-500/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      : "border-red-500/30 focus:border-red-500/50 focus:ring-red-500/20"
                }`}
              />
              {/* Validation icon */}
              {usernameValid !== null && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {usernameValid ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
              )}
            </div>
            {/* Username hint */}
            <div className="mt-2 flex items-center gap-1.5">
              <Info className="h-3 w-3 text-white/20" />
              <p className="text-[11px] text-white/25">
                Lowercase letters, numbers, and underscores only (3-30 chars)
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="group">
            <label
              htmlFor="email"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-purple-400" />
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
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 focus:border-purple-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
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
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-purple-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={6}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-12 pr-12 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 focus:border-purple-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
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

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${passwordStrength.color}`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
                <p className="mt-1.5 text-right text-[11px] text-white/30">
                  {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || usernameValid === false}
            className="group relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 bg-[length:200%_100%] py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-500 hover:bg-[position:100%_0] hover:shadow-xl hover:shadow-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Create Account
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="text-xs text-white/30">OR</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-white/40">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-purple-400 transition-colors hover:text-purple-300"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Footer accent */}
      <p className="mt-8 text-center text-xs text-white/20">
        By creating an account, you agree to our Terms of Service
      </p>
    </div>
  );
}