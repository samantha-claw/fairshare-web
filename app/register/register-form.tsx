"use client";

import React, { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

interface FieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  placeholder?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
}

function Field({
  id,
  label,
  type,
  value,
  placeholder,
  autoComplete,
  onChange,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="
          block w-full rounded-md border border-gray-300 bg-white
          px-3 py-2 text-sm text-gray-900 placeholder-gray-400
          shadow-sm transition-colors
          focus:border-blue-500 focus:outline-none focus:ring-1
          focus:ring-blue-500
        "
      />
    </div>
  );
}

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  function usernameFromEmail(raw: string): string {
    return raw
      .split("@")[0]
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .slice(0, 30)
      .toLowerCase();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.user) {
        setError("Signup succeeded but no user was returned.");
        return;
      }

      // Check if email confirmation is required
      if (data.user.identities?.length === 0) {
        setError(
          "This email is already registered. Please sign in instead."
        );
        return;
      }

      // If session exists, user is immediately logged in
      // (email confirmation disabled in Supabase settings)
      if (data.session) {
        const username = usernameFromEmail(email);

        await supabase
          .from("profiles")
          .update({
            username,
            display_name: username,
            is_public: false,
          })
          .eq("id", data.user.id);

        // Full page reload to pick up cookies
        window.location.href = "/dashboard";
        return;
      }

      // If no session, email confirmation is required
      setError(
        "Check your email for a confirmation link, then sign in."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-gray-500">Welcome to FairShare</p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <Field
          id="email"
          label="Email address"
          type="email"
          value={email}
          placeholder="you@example.com"
          autoComplete="email"
          onChange={setEmail}
        />
        <Field
          id="password"
          label="Password"
          type="password"
          value={password}
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          onChange={setPassword}
        />
        <Field
          id="confirm-password"
          label="Confirm password"
          type="password"
          value={confirmPassword}
          placeholder="Re-enter password"
          autoComplete="new-password"
          onChange={setConfirmPassword}
        />

        <button
          type="submit"
          disabled={loading}
          className="
            flex w-full items-center justify-center rounded-md
            bg-blue-600 px-4 py-2 text-sm font-medium text-white
            shadow-sm transition-colors hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-blue-500
            focus:ring-offset-2
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
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Creating account…
            </>
          ) : (
            "Register"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <a
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Sign in
        </a>
      </p>
    </div>
  );
}