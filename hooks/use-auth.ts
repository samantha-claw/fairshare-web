"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────
interface AuthError {
  message: string;
  field?:
    | "email"
    | "password"
    | "confirm_password"
    | "username"
    | "full_name"
    | "general";
}

interface SignUpPayload {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  fullName: string;
}

interface SignInPayload {
  email: string;
  password: string;
}

export type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "error";

// ─── Suggestion Generator ─────────────────────────────────────
function generateCandidates(base: string): string[] {
  const shortYear = String(new Date().getFullYear()).slice(2);
  const rand2 = () => Math.floor(Math.random() * 90) + 10;
  const rand3 = () => Math.floor(Math.random() * 900) + 100;
  const rand4 = () => Math.floor(Math.random() * 9000) + 1000;

  const candidates = new Set<string>([
    `${base}${rand2()}`,
    `${base}${rand3()}`,
    `${base}${rand4()}`,
    `${base}_${rand2()}`,
    `${base}_sd`,
    `${base}_eg`,
    `${base}_x`,
    `${base}_pro`,
    `${base}_go`,
    `${base}_io`,
    `${base}${shortYear}`,
    `${base}_${shortYear}`,
  ]);

  const regex = /^[a-z0-9_]{3,30}$/;
  return [...candidates].filter((c) => regex.test(c));
}

// ─── Hook ─────────────────────────────────────────────────────
export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const [usernameStatus, setUsernameStatus] =
    useState<UsernameStatus>("idle");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  const router = useRouter();
  const supabase = createClient();

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const latestCheckRef = useRef<string>("");

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // ─── CHECK USERNAME (debounced, 500 ms) ─────────────────────
  const checkUsername = useCallback(
    (username: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      const trimmed = username.trim().toLowerCase();
      const usernameRegex = /^[a-z0-9_]{3,30}$/;

      if (!trimmed || !usernameRegex.test(trimmed)) {
        setUsernameStatus("idle");
        setUsernameSuggestions([]);
        latestCheckRef.current = "";
        return;
      }

      setUsernameStatus("checking");
      setUsernameSuggestions([]);
      latestCheckRef.current = trimmed;

      debounceRef.current = setTimeout(async () => {
        if (latestCheckRef.current !== trimmed) return;

        try {
          const { data: existing, error: lookupErr } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", trimmed)
            .maybeSingle();

          if (latestCheckRef.current !== trimmed) return;

          if (lookupErr && lookupErr.code !== "PGRST116") {
            setUsernameStatus("error");
            return;
          }

          if (existing) {
            setUsernameStatus("taken");

            const candidates = generateCandidates(trimmed);

            const { data: takenRows } = await supabase
              .from("profiles")
              .select("username")
              .in("username", candidates);

            if (latestCheckRef.current !== trimmed) return;

            const takenSet = new Set(
              takenRows?.map((r: { username: string }) => r.username) ?? []
            );

            const verified = candidates
              .filter((c) => !takenSet.has(c))
              .slice(0, 3);

            setUsernameSuggestions(verified);
          } else {
            setUsernameStatus("available");
            setUsernameSuggestions([]);
          }
        } catch {
          if (latestCheckRef.current === trimmed) {
            setUsernameStatus("error");
          }
        }
      }, 500);
    },
    [supabase]
  );

  const selectSuggestion = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setUsernameStatus("available");
    setUsernameSuggestions([]);
  }, []);

  const resetUsernameCheck = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    latestCheckRef.current = "";
    setUsernameStatus("idle");
    setUsernameSuggestions([]);
  }, []);

  // ─── SIGN IN (with ?next= redirect support) ────────────────
  const signIn = useCallback(
    async ({ email, password }: SignInPayload) => {
      setLoading(true);
      setError(null);

      try {
        if (!email.trim()) {
          setError({ message: "Email is required.", field: "email" });
          setLoading(false);
          return;
        }

        if (!password) {
          setError({ message: "Password is required.", field: "password" });
          setLoading(false);
          return;
        }

        const { data, error: authError } =
          await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });

        if (authError) {
          let friendlyMessage = authError.message;
          if (authError.message.includes("Invalid login credentials")) {
            friendlyMessage =
              "Invalid email or password. Please check your credentials.";
          } else if (authError.message.includes("Email not confirmed")) {
            friendlyMessage =
              "Please verify your email address before signing in.";
          }

          setError({ message: friendlyMessage, field: "general" });
          setLoading(false);
          return;
        }

        if (data.session) {
          // ── Read ?next= param for post-login redirect ──
          // This is critical for invite flows:
          //   /login?next=/join?id=GROUP_ID&token=TOKEN
          // Without this, users who click an invite link while
          // logged out would lose the invite context after login.
          const params = new URLSearchParams(window.location.search);
          const next = params.get("next");

          // Security: only allow relative paths (starts with "/")
          // to prevent open-redirect attacks via ?next=https://evil.com
          const redirectTo =
            next && next.startsWith("/") ? next : "/dashboard";

          router.push(redirectTo);
          router.refresh();
        }
      } catch (err) {
        setError({
          message: "An unexpected error occurred. Please try again.",
          field: "general",
        });
      } finally {
        setLoading(false);
      }
    },
    [supabase, router]
  );

  // ─── SIGN UP ────────────────────────────────────────────────
  const signUp = useCallback(
    async ({
      email,
      password,
      confirmPassword,
      username,
      fullName,
    }: SignUpPayload) => {
      setLoading(true);
      setError(null);

      try {
        if (!fullName.trim()) {
          setError({ message: "Full name is required.", field: "full_name" });
          setLoading(false);
          return;
        }

        if (!username.trim()) {
          setError({ message: "Username is required.", field: "username" });
          setLoading(false);
          return;
        }

        const usernameRegex = /^[a-z0-9_]{3,30}$/;
        if (!usernameRegex.test(username.trim())) {
          setError({
            message:
              "Username must be 3-30 characters: lowercase letters, numbers, and underscores only.",
            field: "username",
          });
          setLoading(false);
          return;
        }

        if (!email.trim()) {
          setError({ message: "Email is required.", field: "email" });
          setLoading(false);
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          setError({
            message: "Please enter a valid email address.",
            field: "email",
          });
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError({
            message: "Password must be at least 6 characters.",
            field: "password",
          });
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError({
            message: "Passwords do not match.",
            field: "confirm_password",
          });
          setLoading(false);
          return;
        }

        const { data: existingUser, error: lookupError } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username.trim().toLowerCase())
          .maybeSingle();

        if (lookupError && lookupError.code !== "PGRST116") {
          setError({
            message: "Unable to verify username. Please try again.",
            field: "username",
          });
          setLoading(false);
          return;
        }

        if (existingUser) {
          setUsernameStatus("taken");
          setError({
            message:
              "This username was just taken. Please choose another one.",
            field: "username",
          });
          setLoading(false);
          return;
        }

        const { data: authData, error: signUpError } =
          await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: {
              data: {
                username: username.trim().toLowerCase(),
                full_name: fullName.trim(),
              },
            },
          });

        if (signUpError) {
          let friendlyMessage = signUpError.message;
          if (signUpError.message.includes("already registered")) {
            friendlyMessage =
              "An account with this email already exists. Try signing in instead.";
          }

          setError({ message: friendlyMessage, field: "general" });
          setLoading(false);
          return;
        }

        if (!authData.user) {
          setError({
            message: "Registration failed. No user was returned.",
            field: "general",
          });
          setLoading(false);
          return;
        }

        const profilePayload = {
          username: username.trim().toLowerCase(),
          full_name: fullName.trim(),
          display_name: fullName.trim(),
          is_public: true,
        };

        const { error: profileError } = await supabase
          .from("profiles")
          .update(profilePayload)
          .eq("id", authData.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
          setError({
            message: `Account created but profile setup failed: ${profileError.message}`,
            field: "general",
          });
          setLoading(false);
          return;
        }

        if (authData.session) {
          // ── Same ?next= redirect logic for sign-up ──
          const params = new URLSearchParams(window.location.search);
          const next = params.get("next");
          const redirectTo =
            next && next.startsWith("/") ? next : "/dashboard";

          router.push(redirectTo);
          router.refresh();
        } else {
          setLoading(false);
          return { confirmEmail: true };
        }
      } catch (err) {
        console.error("Sign up error:", err);
        setError({
          message: "An unexpected error occurred. Please try again.",
          field: "general",
        });
      } finally {
        setLoading(false);
      }
    },
    [supabase, router]
  );

  // ─── SIGN OUT ───────────────────────────────────────────────
  const signOut = useCallback(async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
    setLoading(false);
  }, [supabase, router]);

  return {
    signIn,
    signUp,
    signOut,
    loading,
    error,
    clearError,
    usernameStatus,
    usernameSuggestions,
    checkUsername,
    selectSuggestion,
    resetUsernameCheck,
  };
}