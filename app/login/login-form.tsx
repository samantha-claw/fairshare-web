"use client";

import React, { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDebug(null);

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      setDebug("Attempting sign in...");

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setDebug(`Sign in error: ${signInError.message}`);
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        setDebug("No session returned after sign in");
        setError("Login succeeded but no session was created.");
        setLoading(false);
        return;
      }

      setDebug(`Session created! User: ${data.user?.email}. Redirecting...`);

      // CRITICAL: Full page reload, not client-side navigation
      // This ensures middleware picks up the new cookies
      window.location.href = "/dashboard";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setDebug(`Catch block: ${message}`);
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Sign in to FairShare
        </h1>
        <p className="mt-1 text-sm text-gray-500">Welcome back</p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Debug info — REMOVE IN PRODUCTION */}
        {debug && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700 font-mono break-all">
            DEBUG: {debug}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            placeholder="you@example.com"
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            className="
              block w-full rounded-md border border-gray-300 bg-white
              px-3 py-2 text-sm text-gray-900 placeholder-gray-400
              shadow-sm focus:border-blue-500 focus:outline-none
              focus:ring-1 focus:ring-blue-500
            "
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            placeholder="Your password"
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            className="
              block w-full rounded-md border border-gray-300 bg-white
              px-3 py-2 text-sm text-gray-900 placeholder-gray-400
              shadow-sm focus:border-blue-500 focus:outline-none
              focus:ring-1 focus:ring-blue-500
            "
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="
            flex w-full items-center justify-center rounded-md
            bg-blue-600 px-4 py-2 text-sm font-medium text-white
            shadow-sm transition-colors hover:bg-blue-700
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {loading ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Signing in…
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <a
          href="/register"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Register
        </a>
      </p>
    </div>
  );
}