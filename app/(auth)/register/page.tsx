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
  XCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function RegisterPage() {
  const {
    signUp,
    loading,
    error,
    clearError,
    usernameStatus,
    usernameSuggestions,
    checkUsername,
    selectSuggestion,
    resetUsernameCheck,
  } = useAuth();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  // Local format validation (instant, no DB)
  const [usernameFormatValid, setUsernameFormatValid] = useState<
    boolean | null
  >(null);
  const usernameRegex = /^[a-z0-9_]{3,30}$/;

  // Live confirm-password match indicator
  const confirmPasswordMatch: boolean | null =
    confirmPassword.length === 0 ? null : password === confirmPassword;

  // ── Password strength ──
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

  // ── Username input handler ──
  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(raw);
    if (error) clearError();

    if (raw.length === 0) {
      setUsernameFormatValid(null);
      resetUsernameCheck();
      return;
    }

    const isFormatValid = usernameRegex.test(raw);
    setUsernameFormatValid(isFormatValid);

    if (isFormatValid) {
      // Format is good → fire debounced availability check
      checkUsername(raw);
    } else {
      // Format invalid → reset availability state
      resetUsernameCheck();
    }
  };

  // ── Click a suggestion pill ──
  const handleSelectSuggestion = (suggestion: string) => {
    setUsername(suggestion);
    setUsernameFormatValid(true);
    selectSuggestion();
    if (error) clearError();
  };

  // ── Derived: border class for username input ──
  const getUsernameBorderClass = (): string => {
    if (username.length === 0) {
      return "border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20";
    }
    if (usernameFormatValid === false) {
      return "border-red-500/30 focus:border-red-500/50 focus:ring-red-500/20";
    }
    // Format is valid → use availability status
    switch (usernameStatus) {
      case "available":
        return "border-emerald-500/30 focus:border-emerald-500/50 focus:ring-emerald-500/20";
      case "taken":
      case "error":
        return "border-red-500/30 focus:border-red-500/50 focus:ring-red-500/20";
      case "checking":
        return "border-purple-500/30 focus:border-purple-500/50 focus:ring-purple-500/20";
      default:
        return "border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20";
    }
  };

  // ── Derived: icon inside the username input ──
  const renderUsernameIcon = () => {
    if (username.length === 0) return null;

    if (usernameFormatValid === false) {
      return <AlertCircle className="h-5 w-5 text-red-400" />;
    }

    switch (usernameStatus) {
      case "checking":
        return (
          <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
        );
      case "available":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case "taken":
        return <XCircle className="h-5 w-5 text-red-400" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-amber-400" />;
      default:
        return null;
    }
  };

  // ── Derived: should submit button be disabled? ──
  const isSubmitDisabled =
    loading ||
    usernameFormatValid === false ||
    usernameStatus === "taken" ||
    usernameStatus === "checking" ||
    confirmPasswordMatch === false;

  const fullNameHasError = error?.field === "full_name";
  const usernameHasError =
    error?.field === "username" ||
    usernameFormatValid === false ||
    usernameStatus === "taken" ||
    usernameStatus === "error";
  const emailHasError = error?.field === "email";
  const passwordHasError = error?.field === "password";
  const confirmPasswordHasError =
    error?.field === "confirm_password" ||
    confirmPasswordMatch === false;

  // ── Form submit ──
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = await signUp({
      email,
      password,
      confirmPassword,
      username,
      fullName,
    });

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
          {/* ── Full Name ── */}
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
                aria-describedby="fullName-error"
                aria-invalid={fullNameHasError}
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 focus:border-purple-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <p id="fullName-error" className="mt-2 text-red-500 text-sm" role="alert">
              {error?.field === "full_name" ? error.message : ""}
            </p>
          </div>

          {/* ── Username (with real-time availability) ── */}
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
                aria-describedby="username-error"
                aria-invalid={usernameHasError}
                required
                className={`w-full rounded-2xl border bg-white/[0.05] py-3.5 pl-12 pr-12 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 focus:bg-white/[0.08] focus:ring-2 ${getUsernameBorderClass()}`}
              />
              {/* Dynamic right-side icon */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {renderUsernameIcon()}
              </div>
            </div>

            {/* ── Status messages ── */}

            {/* Format hint (shown when idle or format-invalid) */}
            {(usernameFormatValid === null ||
              usernameFormatValid === false) && (
              <div className="mt-2 flex items-center gap-1.5">
                <Info className="h-3 w-3 text-white/20" />
                <p
                  className={`text-[11px] ${
                    usernameFormatValid === false
                      ? "text-red-400/80"
                      : "text-white/25"
                  }`}
                >
                  Lowercase letters, numbers, and underscores only (3-30 chars)
                </p>
              </div>
            )}

            {/* Checking */}
            {usernameFormatValid && usernameStatus === "checking" && (
              <div className="mt-2 flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
                <p className="text-[11px] text-purple-400/90">
                  Checking availability…
                </p>
              </div>
            )}

            {/* Available */}
            {usernameFormatValid && usernameStatus === "available" && (
              <div className="mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <p className="text-[11px] text-emerald-400">
                  Username is available!
                </p>
              </div>
            )}

            {/* Taken + Suggestions */}
            {usernameFormatValid && usernameStatus === "taken" && (
              <div className="mt-2 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-3 w-3 text-red-400" />
                  <p className="text-[11px] text-red-400">
                    Username is taken.
                  </p>
                </div>

                {/* Smart Suggestions */}
                {usernameSuggestions.length > 0 && (
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-purple-400" />
                      <p className="text-[11px] font-medium text-white/40">
                        Available alternatives
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {usernameSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="group/pill flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-purple-300 backdrop-blur-sm transition-all duration-200 hover:border-purple-500/40 hover:bg-purple-500/15 hover:text-purple-200 hover:shadow-md hover:shadow-purple-500/10 active:scale-95"
                        >
                          <AtSign className="h-3 w-3 opacity-50 transition-opacity group-hover/pill:opacity-100" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error state */}
            {usernameFormatValid && usernameStatus === "error" && (
              <div className="mt-2 flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3 text-amber-400" />
                <p className="text-[11px] text-amber-400/80">
                  Could not check availability. Try again.
                </p>
              </div>
            )}
            <p id="username-error" className="mt-2 text-red-500 text-sm" role="alert">
              {error?.field === "username"
                ? error.message
                : usernameFormatValid === false
                  ? "Lowercase letters, numbers, and underscores only (3-30 chars)"
                  : usernameStatus === "taken"
                    ? "Username is taken."
                    : usernameStatus === "error"
                      ? "Could not check availability. Try again."
                      : ""}
            </p>
          </div>

          {/* ── Email ── */}
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
                aria-describedby="email-error"
                aria-invalid={emailHasError}
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 focus:border-purple-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <p id="email-error" className="mt-2 text-red-500 text-sm" role="alert">
              {error?.field === "email" ? error.message : ""}
            </p>
          </div>

          {/* ── Password ── */}
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
                aria-describedby="password-error"
                aria-invalid={passwordHasError}
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
            <p id="password-error" className="mt-2 text-red-500 text-sm" role="alert">
              {error?.field === "password" ? error.message : ""}
            </p>
          </div>

          {/* ── Confirm Password ── */}
          <div className="group">
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-purple-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) clearError();
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-describedby="confirmPassword-error"
                aria-invalid={confirmPasswordHasError}
                required
                minLength={6}
                className={`w-full rounded-2xl border bg-white/[0.05] py-3.5 pl-12 pr-20 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 focus:bg-white/[0.08] focus:ring-2 ${
                  confirmPasswordMatch === null
                    ? "border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20"
                    : confirmPasswordMatch
                      ? "border-emerald-500/30 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      : "border-red-500/30 focus:border-red-500/50 focus:ring-red-500/20"
                }`}
              />
              <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
                {confirmPasswordMatch !== null &&
                  (confirmPasswordMatch ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  ))}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-white/30 transition-colors hover:text-white/60"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Mismatch hint */}
            <p id="confirmPassword-error" className="mt-2 text-red-500 text-sm" role="alert">
              {confirmPasswordMatch === false
                ? "Passwords do not match"
                : error?.field === "confirm_password"
                  ? error.message
                  : ""}
            </p>
          </div>

          {/* ── Submit Button ── */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
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