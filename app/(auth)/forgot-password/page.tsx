// app/(auth)/forgot-password/page.tsx
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, ArrowRight, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validate } from "@/lib/validate";
import { forgotPasswordSchema } from "@/lib/validations";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validation = validate(forgotPasswordSchema, { email });
    if (!validation.success) {
      setError(validation.errors.email ?? "Please enter a valid email address.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/auth/reset-password` }
    );

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Check your email</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-medium text-white/70">{email}</span>.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Reset Password</h1>
        <p className="mt-2 text-sm text-white/50">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-8 shadow-2xl backdrop-blur-xl">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/25 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Sending…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Send Reset Link <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}