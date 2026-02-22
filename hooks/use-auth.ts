// hooks/use-auth.ts
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AuthError {
  message: string;
  field?: "email" | "password" | "username" | "full_name" | "general";
}

interface SignUpPayload {
  email: string;
  password: string;
  username: string;
  fullName: string;
}

interface SignInPayload {
  email: string;
  password: string;
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const clearError = useCallback(() => setError(null), []);

  // ─── SIGN IN ────────────────────────────────────────────────
  const signIn = useCallback(
    async ({ email, password }: SignInPayload) => {
      setLoading(true);
      setError(null);

      try {
        // Basic client-side validation
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
          // Map Supabase errors to user-friendly messages
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
    async ({ email, password, username, fullName }: SignUpPayload) => {
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

        // Username: lowercase letters, numbers, underscores only
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

        // ── Check username uniqueness ──
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
          setError({
            message:
              "This username is already taken. Please choose another one.",
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

        // ── CRITICAL: Insert into profiles table ──
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          username: username.trim().toLowerCase(),
          full_name: fullName.trim(),
          display_name: fullName.trim(),
          avatar_url: null,
          bio: null,
          is_public: true,
        });

        if (profileError) {
          // If profile creation fails, we should still inform the user
          // The auth account was created but the profile wasn't
          console.error("Profile creation error:", profileError);

          // Attempt cleanup: delete the auth user if profile insert fails
          // (In production, handle this with a database trigger or edge function)
          setError({
            message:
              "Account created but profile setup failed. Please contact support or try signing in.",
            field: "general",
          });
          setLoading(false);
          return;
        }

        // ── Success: redirect ──
        // If email confirmation is enabled, the session might be null
        if (authData.session) {
          router.push("/dashboard");
          router.refresh();
        } else {
          // Email confirmation is required — we return success
          // The calling component can check for this state
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
  };
}