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

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // IMPORTANT: Use window.location.href instead of router.push
      // This forces a full page reload so the middleware
      // picks up the new auth cookies.
      window.location.href = "/dashboard";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
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
              d="M15.75 5.25a3 3 0 11-6 0 3 3 0 016
                 0zM4.501 20.118a7.5 7.5 0 0114.998
                 0A17.933 17.933 0 0112 21.75c-2.676
                 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </div>
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
          placeholder="Your password"
          autoComplete="current-password"
          onChange={setPassword}
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