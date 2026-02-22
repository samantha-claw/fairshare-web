// hooks/use-auth.ts
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
        // ── Validation ──────────────────────────────────────────

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

        // ── NEW: Confirm Password validation ──
        if (password !== confirmPassword) {
          setError({
            message: "Passwords do not match.",
            field: "confirm_password",
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
        const profilePayload = {
          id: authData.user.id,
          username: username.trim().toLowerCase(),
          full_name: fullName.trim(),
          display_name: fullName.trim(),
          avatar_url: null,
          bio: null,
          is_public: true,
        };

        console.log("PROFILE INSERT PAYLOAD:", profilePayload);

        // ── استخدمنا update لأن الـ Trigger في قاعدة البيانات بيكريت البروفايل تلقائياً ──
const { error: profileError } = await supabase
.from("profiles")
.update({
  username: username.trim().toLowerCase(),
  full_name: fullName.trim(),
  display_name: fullName.trim(),
  is_public: true,
})
.eq("id", authData.user.id); // بنحدد له البروفايل بتاع المستخدم الجديد بالظبط

        if (profileError) {
          // ── ENHANCED DEBUG LOGGING ──
          console.error("PROFILE INSERT ERROR DETAILS:", profileError);
          console.error("Error code:", profileError.code);
          console.error("Error message:", profileError.message);
          console.error("Error details:", profileError.details);
          console.error("Error hint:", profileError.hint);
          console.error(
            "Auth user ID used:",
            authData.user.id
          );
          console.error(
            "Auth session present:",
            !!authData.session
          );

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
        console.error("Sign up unexpected error:", err);
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