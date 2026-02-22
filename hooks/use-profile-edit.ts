"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ==========================================
// 🧩 TYPES
// ==========================================

interface ProfileFormData {
  display_name: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
}

interface FormErrors {
  display_name?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  general?: string;
}

// ==========================================
// ⚙️ LOGIC & STATE
// ==========================================

export function useProfileEdit() {
  const router = useRouter();
  const supabase = createClient();

  /* ── State ───────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [originalData, setOriginalData] = useState<ProfileFormData>({
    display_name: "",
    username: "",
    full_name: "",
    avatar_url: "",
    bio: "",
  });

  const [formData, setFormData] = useState<ProfileFormData>({
    display_name: "",
    username: "",
    full_name: "",
    avatar_url: "",
    bio: "",
  });

  /* ── Derived ─────────────────────────────────────── */

  const hasChanges =
    formData.display_name !== originalData.display_name ||
    formData.username !== originalData.username ||
    formData.full_name !== originalData.full_name ||
    formData.avatar_url !== originalData.avatar_url ||
    formData.bio !== originalData.bio;

  /* ── Fetch Current Profile ───────────────────────── */

  const fetchProfile = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setUserId(session.user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, username, full_name, avatar_url, bio")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;

      if (data) {
        const profileData: ProfileFormData = {
          display_name: data.display_name || "",
          username: data.username || "",
          full_name: data.full_name || "",
          avatar_url: data.avatar_url || "",
          bio: data.bio || "",
        };
        setFormData(profileData);
        setOriginalData(profileData);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      setErrors({ general: "Failed to load your profile data." });
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* ── Field Update ────────────────────────────────── */

  function updateField(field: keyof ProfileFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    // Clear success on any change
    if (saveSuccess) setSaveSuccess(false);
  }

  /* ── Validation ──────────────────────────────────── */

  function validate(): boolean {
    const newErrors: FormErrors = {};

    // Display name
    const trimmedDisplay = formData.display_name.trim();
    if (!trimmedDisplay) {
      newErrors.display_name = "Display name is required.";
    } else if (trimmedDisplay.length < 2) {
      newErrors.display_name = "Display name must be at least 2 characters.";
    } else if (trimmedDisplay.length > 50) {
      newErrors.display_name = "Display name must be under 50 characters.";
    }

    // Username
    const trimmedUsername = formData.username.trim().toLowerCase();
    if (!trimmedUsername) {
      newErrors.username = "Username is required.";
    } else if (trimmedUsername.length < 3) {
      newErrors.username = "Username must be at least 3 characters.";
    } else if (trimmedUsername.length > 30) {
      newErrors.username = "Username must be under 30 characters.";
    } else if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      newErrors.username =
        "Username can only contain lowercase letters, numbers, and underscores.";
    }

    // Full name (optional but validate length)
    if (formData.full_name.trim().length > 100) {
      newErrors.full_name = "Full name must be under 100 characters.";
    }

    // Avatar URL (optional but validate format)
    const trimmedAvatar = formData.avatar_url.trim();
    if (trimmedAvatar && !isValidUrl(trimmedAvatar)) {
      newErrors.avatar_url = "Please enter a valid URL.";
    }

    // Bio
    if (formData.bio.trim().length > 250) {
      newErrors.bio = "Bio must be under 250 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /* ── Save ────────────────────────────────────────── */

  async function handleSave(e: FormEvent) {
    e.preventDefault();

    if (!validate()) return;
    if (!userId) return;

    setSaving(true);
    setErrors({});
    setSaveSuccess(false);

    try {
      // Check username uniqueness if changed
      const trimmedUsername = formData.username.trim().toLowerCase();

      if (trimmedUsername !== originalData.username.toLowerCase()) {
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", trimmedUsername)
          .neq("id", userId)
          .maybeSingle();

        if (existingUser) {
          setErrors({ username: "This username is already taken." });
          setSaving(false);
          return;
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: formData.display_name.trim(),
          username: trimmedUsername,
          full_name: formData.full_name.trim(),
          avatar_url: formData.avatar_url.trim(),
          bio: formData.bio.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      // Update original data reference
      const updatedData: ProfileFormData = {
        display_name: formData.display_name.trim(),
        username: trimmedUsername,
        full_name: formData.full_name.trim(),
        avatar_url: formData.avatar_url.trim(),
        bio: formData.bio.trim(),
      };
      setOriginalData(updatedData);
      setFormData(updatedData);
      setSaveSuccess(true);

      // Auto-clear success after delay
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Save error:", err);
      setErrors({
        general: err.message || "Failed to save changes. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  /* ── Reset ───────────────────────────────────────── */

  function handleReset() {
    setFormData({ ...originalData });
    setErrors({});
    setSaveSuccess(false);
  }

  /* ── Navigation ──────────────────────────────────── */

  function handleCancel() {
    router.push("/dashboard/profile");
  }

  /* ── Return ──────────────────────────────────────── */

  return {
    // State
    loading,
    saving,
    errors,
    formData,
    hasChanges,
    saveSuccess,

    // Actions
    updateField,
    handleSave,
    handleReset,
    handleCancel,
  };
}