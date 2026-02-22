// hooks/use-auth.ts
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
    // Number suffixes
    `${base}${rand2()}`,
    `${base}${rand3()}`,
    `${base}${rand4()}`,
    `${base}_${rand2()}`,
    // Stylised suffixes
    `${base}_sd`,
    `${base}_eg`,
    `${base}_x`,
    `${base}_pro`,
    `${base}_go`,
    `${base}_io`,
    // Year variants
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

  // Username availability state
  const [usernameStatus, setUsernameStatus] =
    useState<UsernameStatus>("idle");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  const router = useRouter();
  const supabase = createClient();

  // Refs for debounce + race-condition guard
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const latestCheckRef = useRef<string>("");

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // ─── CHECK USERNAME (debounced, 500 ms) ─────────────────────
  const checkUsername = useCallback(
    (username: string) => {
      // Clear any pending timer
      if (debounceRef.current) clearTimeout(debounceRef.current);

      const trimmed = username.trim().toLowerCase();
      const usernameRegex = /^[a-z0-9_]{3,30}$/;

      // Reset when empty or format-invalid
      if (!trimmed || !usernameRegex.test(trimmed)) {
        setUsernameStatus("idle");
        setUsernameSuggestions([]);
        latestCheckRef.current = "";
        return;
      }

      // Show spinner immediately
      setUsernameStatus("checking");
      setUsernameSuggestions([]);
      latestCheckRef.current = trimmed;

      debounceRef.current = setTimeout(async () => {
        // Stale guard — user kept typing
        if (latestCheckRef.current !== trimmed) return;

        try {
          // 1. Check if username exists
          const { data: existing, error: lookupErr } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", trimmed)
            .maybeSingle();

          // Stale guard after await
          if (latestCheckRef.current !== trimmed) return;

          if (lookupErr && lookupErr.code !== "PGRST116") {
            setUsernameStatus("error");
            return;
          }

          if (existing) {
            // ── TAKEN → generate & verify suggestions ──
            setUsernameStatus("taken");

            const candidates = generateCandidates(trimmed);

            // Single query to find which candidates are already taken
            const { data: takenRows } = await supabase
              .from("profiles")
              .select("username")
              .in("username", candidates);

            if (latestCheckRef.current !== trimmed) return;

            const takenSet = new Set(
              takenRows?.map((r) => r.username) ?? []
            );

            const verified = candidates
              .filter((c) => !takenSet.has(c))
              .slice(0, 3);

            setUsernameSuggestions(verified);
          } else {
            // ── AVAILABLE ──
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

  // ─── SELECT SUGGESTION ──────────────────────────────────────
  const selectSuggestion = useCallback(() => {
    // We already verified it's available in checkUsername
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setUsernameStatus("available");
    setUsernameSuggestions([]);
  }, []);

  // ─── RESET USERNAME CHECK ───────────────────────────────────
  const resetUsernameCheck = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    latestCheckRef.current = "";
    setUsernameStatus("idle");
    setUsernameSuggestions([]);
  }, []);

  // ─── SIGN IN ────────────────────────────────────────────────
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
          router.push("/dashboard");
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
        // ── Validation ──

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

        // ── Confirm Password check ──
        if (password !== confirmPassword) {
          setError({
            message: "Passwords do not match.",
            field: "confirm_password",
          });
          setLoading(false);
          return;
        }

        // ── Safety-net: check username uniqueness at submit time ──
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

        // ── Create Auth User ──
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

        // ── CRITICAL: Update the profiles row (trigger-created) ──
        const profilePayload = {
          username: username.trim().toLowerCase(),
          full_name: fullName.trim(),
          display_name: fullName.trim(),
          is_public: true,
        };

        console.log("PROFILE UPDATE PAYLOAD:", profilePayload);

        const { error: profileError } = await supabase
          .from("profiles")
          .update(profilePayload)
          .eq("id", authData.user.id);

        if (profileError) {
          console.error("PROFILE INSERT ERROR DETAILS:", profileError);
          console.error("Error code:", profileError.code);
          console.error("Error message:", profileError.message);
          console.error("Error details:", profileError.details);
          console.error("Error hint:", profileError.hint);
          console.error("Auth user ID used:", authData.user.id);
          console.error("Auth session present:", !!authData.session);

          setError({
            message: `Account created but profile setup failed: ${profileError.message} (Code: ${profileError.code}). Check browser console for full details.`,
            field: "general",
          });
          setLoading(false);
          return;
        }

        console.log(
          "PROFILE INSERT SUCCESS for user:",
          authData.user.id
        );

        // ── Success: redirect ──
        if (authData.session) {
          router.push("/dashboard");
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
    // Username checker
    usernameStatus,
    usernameSuggestions,
    checkUsername,
    selectSuggestion,
    resetUsernameCheck,
  };
}