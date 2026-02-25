"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useEffect, useState, useCallback, useRef, type FormEvent } from "react";
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

  /* ── Avatar File State ───────────────────────────── */
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Derived ─────────────────────────────────────── */

  const hasChanges =
    formData.display_name !== originalData.display_name ||
    formData.username !== originalData.username ||
    formData.full_name !== originalData.full_name ||
    formData.avatar_url !== originalData.avatar_url ||
    formData.bio !== originalData.bio ||
    avatarFile !== null ||
    avatarRemoved;

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

  /* ── Cleanup object URL on unmount or change ─────── */

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

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

  /* ── Avatar File Selection ───────────────────────── */

  function handleAvatarSelect(file: File | null) {
    // Revoke previous preview URL
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
    }

    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          avatar_url: "Please select a valid image file.",
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          avatar_url: "Image must be under 5MB.",
        }));
        return;
      }

      setAvatarFile(file);
      setAvatarRemoved(false);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreviewUrl(previewUrl);

      // Clear any avatar errors
      if (errors.avatar_url) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.avatar_url;
          return next;
        });
      }
    } else {
      setAvatarFile(null);
    }

    // Clear success on any change
    if (saveSuccess) setSaveSuccess(false);
  }

  /* ── Avatar Remove ───────────────────────────────── */

  function handleAvatarRemove() {
    // Revoke previous preview URL
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
    }

    setAvatarFile(null);
    setAvatarRemoved(true);
    setFormData((prev) => ({ ...prev, avatar_url: "" }));

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Clear any avatar errors
    if (errors.avatar_url) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.avatar_url;
        return next;
      });
    }

    // Clear success on any change
    if (saveSuccess) setSaveSuccess(false);
  }

  /* ── Trigger File Input ──────────────────────────── */

  function triggerFileInput() {
    fileInputRef.current?.click();
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

    // Bio
    if (formData.bio.trim().length > 250) {
      newErrors.bio = "Bio must be under 250 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  /* ── Upload Avatar to Supabase Storage ───────────── */

  async function uploadAvatar(file: File, uid: string): Promise<string> {
    // Use a constant path per user so upsert actually overwrites the same file
    const filePath = `${uid}/profile_image`;

    // Upload file to the 'avatars' bucket
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // Append cache-busting param so browsers/CDNs fetch the new image
    return `${publicUrl}?t=${Date.now()}`;
  }

  /* ── Delete Old Avatar from Storage ──────────────── */

  async function deleteOldAvatar(avatarUrl: string, uid: string) {
    try {
      // Skip external avatars (e.g. Google OAuth profile pictures)
      if (!avatarUrl.includes("supabase.co")) return;

      // Extract the file path from the URL
      // The URL format is typically: .../storage/v1/object/public/avatars/{uid}/filename
      const url = new URL(avatarUrl);
      const pathParts = url.pathname.split("/avatars/");
      if (pathParts.length > 1) {
        // Decode any URI-encoded characters (e.g. %20 → space)
        const filePath = decodeURIComponent(pathParts[1]);
        const { error: removeError } = await supabase.storage
          .from("avatars")
          .remove([filePath]);

        if (removeError) {
          console.error("Failed to remove old avatar:", removeError);
        }
      }
    } catch (err) {
      // Silently fail — old avatar cleanup is best-effort
      console.warn("Could not delete old avatar file:", err);
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

      // Handle avatar upload / removal
      let finalAvatarUrl = formData.avatar_url.trim();

      if (avatarFile) {
        // Upload new avatar
        finalAvatarUrl = await uploadAvatar(avatarFile, userId);

        // Delete old avatar if it existed
        if (originalData.avatar_url.trim()) {
          await deleteOldAvatar(originalData.avatar_url, userId);
        }
      } else if (avatarRemoved && originalData.avatar_url.trim()) {
        // User removed their avatar — delete old file
        await deleteOldAvatar(originalData.avatar_url, userId);
        finalAvatarUrl = "";
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: formData.display_name.trim(),
          username: trimmedUsername,
          full_name: formData.full_name.trim(),
          avatar_url: finalAvatarUrl,
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
        avatar_url: finalAvatarUrl,
        bio: formData.bio.trim(),
      };
      setOriginalData(updatedData);
      setFormData(updatedData);

      // Clear avatar file state
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
        setAvatarPreviewUrl(null);
      }
      setAvatarFile(null);
      setAvatarRemoved(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

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

    // Reset avatar file state
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
    }
    setAvatarFile(null);
    setAvatarRemoved(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

    // Avatar
    avatarFile,
    avatarPreviewUrl,
    avatarRemoved,
    fileInputRef,

    // Actions
    updateField,
    handleSave,
    handleReset,
    handleCancel,
    handleAvatarSelect,
    handleAvatarRemove,
    triggerFileInput,
  };
}