"use client";

import React, { useState, useEffect, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── States for Username Validation ──
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const supabase = createClient();

  // ── Real-time Username Check (Debounced) ──
  useEffect(() => {
    // تجاهل الفحص لو اليوزر نيم أقل من 3 حروف
    if (username.length < 3) {
      setUsernameStatus("idle");
      setSuggestions([]);
      return;
    }

    // تأخير الفحص لمدة 500 ملي ثانية حتى ينتهي المستخدم من الكتابة
    const timeoutId = setTimeout(async () => {
      setUsernameStatus("checking");
      
      const formattedUsername = username
        .trim()
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .slice(0, 30)
        .toLowerCase();

      try {
        const { data: isAvailable, error } = await supabase.rpc("check_username_available", {
          _username: formattedUsername
        });

        if (error) throw error;

        if (isAvailable) {
          setUsernameStatus("available");
          setSuggestions([]);
        } else {
          setUsernameStatus("taken");
          // اقتراح بدائل سريعة
          const random1 = Math.floor(Math.random() * 100);
          const random2 = Math.floor(Math.random() * 1000);
          setSuggestions([`${formattedUsername}${random1}`, `${formattedUsername}_${random2}`]);
        }
      } catch (err) {
        console.error("Error checking username:", err);
        setUsernameStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, supabase]);

  // ── Form Submission ──
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password || !confirmPassword || !username.trim() || !fullName.trim()) {
      setError("All fields are required.");
      return;
    }

    if (usernameStatus === "taken") {
      setError("Please choose an available username before registering.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const formattedUsername = username
        .trim()
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .slice(0, 30)
        .toLowerCase();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: formattedUsername,
            full_name: fullName.trim(),
            display_name: fullName.trim(),
          },
        },
      });

      if (signUpError) {
        let friendlyMessage = signUpError.message;
        const errStr = friendlyMessage.toLowerCase();

        if (errStr.includes("database error saving new user")) {
          friendlyMessage = "This username is already taken. Please choose another one.";
          setUsernameStatus("taken"); // عشان نظهرله الاقتراحات فوراً
        } else if (errStr.includes("already registered") || errStr.includes("user already exists")) {
          friendlyMessage = "This email is already registered. Please sign in.";
        } else if (errStr.includes("rate limit")) {
          friendlyMessage = "Too many attempts. Please try again later.";
        }

        setError(friendlyMessage);
        setLoading(false);
        return;
      }
      
      if (!data.user) {
        setError("Signup failed — no user returned.");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
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
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Full Name Field ── */}
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            placeholder="e.g. Ahmed Ali"
            onChange={(e) => setFullName(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* ── Username Field with Real-time Validation ── */}
        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
            Username
          </label>
          <div className="relative">
            <input
              id="username"
              type="text"
              required
              value={username}
              placeholder="e.g. ahmed_99"
              onChange={(e) => setUsername(e.target.value)}
              className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none ${
                usernameStatus === "taken" 
                  ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                  : usernameStatus === "available"
                  ? "border-green-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              }`}
            />
            {/* Status Icons */}
            <div className="absolute right-3 top-2.5">
              {usernameStatus === "checking" && <span className="text-gray-400">⏳</span>}
              {usernameStatus === "available" && <span className="text-green-500">✅</span>}
              {usernameStatus === "taken" && <span className="text-red-500">❌</span>}
            </div>
          </div>
          
          {/* Suggestions if taken */}
          {usernameStatus === "taken" && (
            <div className="mt-2 text-xs">
              <span className="text-red-600 font-medium">Username is taken. Try: </span>
              <div className="mt-1 flex gap-2">
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setUsername(sug)}
                    className="rounded bg-blue-50 px-2 py-1 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Email Field ── */}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            placeholder="you@example.com"
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* ── Password Field ── */}
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            placeholder="Min. 6 characters"
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* ── Confirm Password Field ── */}
        <div>
          <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-gray-700">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            required
            value={confirmPassword}
            placeholder="Re-enter password"
            autoComplete="new-password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || usernameStatus === "checking" || usernameStatus === "taken"}
          className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Register"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Sign in
        </a>
      </p>
    </div>
  );
}
