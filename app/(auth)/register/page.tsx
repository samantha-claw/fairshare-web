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
import { motion } from "framer-motion";
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
  const [usernameFormatValid, setUsernameFormatValid] = useState<boolean | null>(null);
  const usernameRegex = /^[a-z0-9_]{3,30}$/;

  // Live confirm-password match indicator
  const confirmPasswordMatch: boolean | null =
    confirmPassword.length === 0 ? null : password === confirmPassword;

  // ── Password strength ──
  const getPasswordStrength = (
    pw: string
  ): { label: string; color: string; width: string } => {
    if (pw.length === 0) return { label: "", color: "", width: "0%" };
    if (pw.length < 6) return { label: "Too short", color: "bg-negative", width: "20%" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (pw.length >= 12) score++;
    if (score <= 1) return { label: "Weak", color: "bg-orange-500", width: "40%" };
    if (score <= 2) return { label: "Fair", color: "bg-amber-500", width: "60%" };
    if (score <= 3) return { label: "Strong", color: "bg-positive", width: "80%" };
    return { label: "Excellent", color: "bg-cyan-500", width: "100%" };
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
      checkUsername(raw);
    } else {
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
    if (username.length === 0) return "border-border focus:border-border-2 focus:ring-border/30";
    if (usernameFormatValid === false) return "border-negative/50 focus:border-negative focus:ring-negative/30";
    switch (usernameStatus) {
      case "available":
        return "border-positive/50 focus:border-positive focus:ring-positive/30";
      case "taken":
      case "error":
        return "border-negative/50 focus:border-negative focus:ring-negative/30";
      case "checking":
        return "border-amber-500/50 focus:border-amber-500 focus:ring-amber-500/30";
      default:
        return "border-border focus:border-border-2 focus:ring-border/30";
    }
  };

  // ── Derived: icon inside the username input ──
  const renderUsernameIcon = () => {
    if (username.length === 0) return null;
    if (usernameFormatValid === false) {
      return <AlertCircle className="h-5 w-5 text-negative" />;
    }
    switch (usernameStatus) {
      case "checking":
        return <Loader2 className="h-5 w-5 animate-spin text-amber-500" />;
      case "available":
        return <CheckCircle2 className="h-5 w-5 text-positive" />;
      case "taken":
        return <XCircle className="h-5 w-5 text-negative" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
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
  const confirmPasswordHasError = error?.field === "confirm_password" || confirmPasswordMatch === false;

  const fullNameErrorMessage = fullNameHasError ? error?.message ?? "" : "";
  const usernameErrorMessage = (() => {
    if (error?.field === "username") return error.message;
    if (usernameFormatValid === false) {
      return "Lowercase letters, numbers, and underscores only (3-30 chars)";
    }
    if (usernameStatus === "taken") return "Username is taken.";
    if (usernameStatus === "error") {
      return "Could not check availability. Try again.";
    }
    return "";
  })();
  const emailErrorMessage = emailHasError ? error?.message ?? "" : "";
  const passwordErrorMessage = passwordHasError ? error?.message ?? "" : "";
  const confirmPasswordErrorMessage =
    confirmPasswordMatch === false
      ? "Passwords do not match"
      : error?.field === "confirm_password"
      ? error.message
      : "";

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
            We&apos;ve sent a confirmation link to{" "}
            <span className="font-medium text-text-primary">{email}</span>. Click the link to activate your account.
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
          <User className="h-8 w-8 text-surface" strokeWidth={2} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-black tracking-tight text-text-primary"
        >
          Create account
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-sm text-text-secondary"
        >
          Join us and start your journey today
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Full Name ── */}
          <div className="group">
            <label htmlFor="fullName" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Full Name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary transition-colors group-focus-within:text-text-primary" />
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
                className="w-full rounded-xl border border-border bg-surface py-3.5 pl-12 pr-4 text-sm text-text-primary outline-none transition-all placeholder:text-text-tertiary focus:border-border-2 focus:ring-2 focus:ring-border/30"
              />
            </div>
            {fullNameErrorMessage && (
              <p id="fullName-error" className="mt-2 text-sm text-negative" role="alert">
                {fullNameErrorMessage}
              </p>
            )}
          </div>

          {/* ── Username ── */}
          <div className="group">
            <label htmlFor="username" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Username
            </label>
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary transition-colors group-focus-within:text-text-primary" />
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
                className={`w-full rounded-xl border bg-surface py-3.5 pl-12 pr-12 text-sm text-text-primary outline-none transition-all placeholder:text-text-tertiary focus:ring-2 ${getUsernameBorderClass()}`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">{renderUsernameIcon()}</div>
            </div>

            {/* Status messages */}
            {(usernameFormatValid === null || usernameFormatValid === false) && (
              <div className="mt-2 flex items-center gap-1.5">
                <Info className="h-3 w-3 text-text-tertiary" />
                <p className={`text-[11px] ${usernameFormatValid === false ? "text-negative" : "text-text-tertiary"}`}>
                  Lowercase letters, numbers, and underscores only (3-30 chars)
                </p>
              </div>
            )}
            {usernameFormatValid && usernameStatus === "checking" && (
              <div className="mt-2 flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                <p className="text-[11px] text-amber-600">Checking availability…</p>
              </div>
            )}
            {usernameFormatValid && usernameStatus === "available" && (
              <div className="mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-positive" />
                <p className="text-[11px] text-positive">Username is available!</p>
              </div>
            )}
            {usernameFormatValid && usernameStatus === "taken" && (
              <div className="mt-2 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-3 w-3 text-negative" />
                  <p className="text-[11px] text-negative">Username is taken.</p>
                </div>
                {usernameSuggestions.length > 0 && (
                  <div className="rounded-xl border border-border bg-surface-2 p-3">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-text-primary" />
                      <p className="text-[11px] font-medium text-text-secondary">Available alternatives</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {usernameSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary transition-all hover:bg-surface-2 hover:shadow-sm active:scale-95"
                        >
                          @{suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {usernameFormatValid && usernameStatus === "error" && (
              <div className="mt-2 flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3 text-amber-500" />
                <p className="text-[11px] text-amber-600">Could not check availability. Try again.</p>
              </div>
            )}
            <p id="username-error" className="sr-only" role="alert">
              {usernameErrorMessage}
            </p>
          </div>

          {/* ── Email ── */}
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
                aria-invalid={emailHasError}
                required
                className="w-full rounded-xl border border-border bg-surface py-3.5 pl-12 pr-4 text-sm text-text-primary outline-none transition-all placeholder:text-text-tertiary focus:border-border-2 focus:ring-2 focus:ring-border/30"
              />
            </div>
            {emailErrorMessage && (
              <p id="email-error" className="mt-2 text-sm text-negative" role="alert">
                {emailErrorMessage}
              </p>
            )}
          </div>

          {/* ── Password ── */}
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
                autoComplete="new-password"
                aria-describedby="password-strength"
                aria-invalid={passwordHasError}
                required
                minLength={6}
                className="w-full rounded-xl border border-border bg-surface py-3.5 pl-12 pr-12 text-sm text-text-primary outline-none transition-all placeholder:text-text-tertiary focus:border-border-2 focus:ring-2 focus:ring-border/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary transition-colors hover:text-text-primary"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${passwordStrength.color}`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
                <p id="password-strength" className="mt-1.5 text-right text-[11px] text-text-tertiary">
                  {passwordStrength.label}
                </p>
              </div>
            )}
            {passwordErrorMessage && (
              <p className="mt-2 text-sm text-negative" role="alert">
                {passwordErrorMessage}
              </p>
            )}
          </div>

          {/* ── Confirm Password ── */}
          <div className="group">
            <label htmlFor="confirmPassword" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary transition-colors group-focus-within:text-text-primary" />
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
                className={`w-full rounded-xl border bg-surface py-3.5 pl-12 pr-20 text-sm text-text-primary outline-none transition-all placeholder:text-text-tertiary focus:ring-2 ${
                  confirmPasswordMatch === null
                    ? "border-border focus:border-border-2 focus:ring-border/30"
                    : confirmPasswordMatch
                    ? "border-positive/50 focus:border-positive focus:ring-positive/30"
                    : "border-negative/50 focus:border-negative focus:ring-negative/30"
                }`}
              />
              <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
                {confirmPasswordMatch !== null &&
                  (confirmPasswordMatch ? (
                    <CheckCircle2 className="h-4 w-4 text-positive" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-negative" />
                  ))}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-text-tertiary transition-colors hover:text-text-primary"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {confirmPasswordErrorMessage && (
              <p id="confirmPassword-error" className="mt-2 text-sm text-negative" role="alert">
                {confirmPasswordErrorMessage}
              </p>
            )}
          </div>

          {/* ── Submit Button ── */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-text-primary py-3.5 text-sm font-semibold text-surface shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-tertiary">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-text-primary transition-colors hover:opacity-80">
            Sign in
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
        By creating an account, you agree to our Terms of Service
      </motion.p>
    </motion.div>
  );
}
