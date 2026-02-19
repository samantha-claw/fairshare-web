"use client";

import React, { useEffect, useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/* ════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════ */

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
}

/* ════════════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════════════ */

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/* ════════════════════════════════════════════════════════════
   SKELETON LOADER
   ════════════════════════════════════════════════════════════ */

function ProfileSkeleton() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg animate-pulse rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center">
          <div className="h-24 w-24 rounded-full bg-gray-200" />
          <div className="mt-4 h-5 w-32 rounded bg-gray-200" />
        </div>
        <div className="mt-8 space-y-5">
          <div className="h-10 w-full rounded-lg bg-gray-200" />
          <div className="h-10 w-full rounded-lg bg-gray-200" />
          <div className="h-24 w-full rounded-lg bg-gray-200" />
          <div className="h-10 w-full rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Auth state ──────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Profile state ───────────────────────────────────────
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // ── Original username for comparison ────────────────────
  const [originalUsername, setOriginalUsername] = useState("");

  // ── Avatar upload state ─────────────────────────────────
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── UI state ────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // ── Init: fetch session + profile ───────────────────────

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setUser(session.user);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile) {
        setError("Failed to load profile.");
        setLoading(false);
        return;
      }

      const p = profile as Profile;
      setUsername(p.username || "");
      setFullName(p.full_name || "");
      setBio(p.bio || "");
      setAvatarUrl(p.avatar_url || "");
      setOriginalUsername(p.username || "");
      setLoading(false);
    }

    init();
  }, [router, supabase]);

  // ── Username validation ─────────────────────────────────

  function validateUsername(value: string): string | null {
    if (!value.trim()) {
      return "Username is required.";
    }
    if (value.length < 3) {
      return "Username must be at least 3 characters.";
    }
    if (value.length > 20) {
      return "Username must be 20 characters or fewer.";
    }
    if (!USERNAME_REGEX.test(value)) {
      return "Only letters, numbers, and underscores allowed.";
    }
    return null;
  }

  function handleUsernameChange(value: string) {
    setUsername(value);
    setUsernameError(null);
    setSuccess(null);
  }

  async function handleUsernameBlur() {
    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    // Skip check if username hasn't changed
    if (username.toLowerCase() === originalUsername.toLowerCase()) {
      setUsernameError(null);
      return;
    }

    // Check uniqueness
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .neq("id", user?.id ?? "")
      .single();

    if (existing) {
      setUsernameError("This username is already taken.");
    }
  }

  // ── Avatar handling ─────────────────────────────────────

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!avatarFile || !user) return null;

    setUploadingAvatar(true);

    try {
      // Determine extension
      const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "png";
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL with cache buster
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      return urlWithCacheBust;
    } catch (err) {
      throw err;
    } finally {
      setUploadingAvatar(false);
    }
  }

  // ── Save handler ────────────────────────────────────────

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError("You must be signed in.");
      return;
    }

    // Validate username
    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    // Check username uniqueness if changed
    if (username.toLowerCase() !== originalUsername.toLowerCase()) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", username)
        .neq("id", user.id)
        .single();

      if (existing) {
        setUsernameError("This username is already taken.");
        return;
      }
    }

    setSaving(true);

    try {
      // Upload avatar if changed
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl;
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: username.trim().toLowerCase(),
          full_name: fullName.trim(),
          bio: bio.trim(),
          avatar_url: newAvatarUrl,
        })
        .eq("id", user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Update local state
      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      setOriginalUsername(username.trim().toLowerCase());
      setSuccess("Profile updated successfully!");

      // Clear success after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Loading ─────────────────────────────────────────────

  if (loading) return <ProfileSkeleton />;

  // ── Computed ────────────────────────────────────────────

  const displayAvatar = avatarPreview || avatarUrl;
  const initials = (fullName || username || "?")
    .split(/[_\s]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isSaving = saving || uploadingAvatar;

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* ── Back link ───────────────────────────────── */}
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Back to dashboard
        </button>

        {/* ── Card ────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl"
        >
          {/* ── Header ────────────────────────────────── */}
          <h1 className="text-center text-xl font-semibold text-gray-900">
            Edit Profile
          </h1>
          <p className="mt-1 text-center text-sm text-gray-500">
            {user?.email}
          </p>

          {/* ── Messages ──────────────────────────────── */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* ── Avatar ────────────────────────────────── */}
          <div className="mt-6 flex flex-col items-center">
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isSaving}
              className="group relative h-24 w-24 overflow-hidden rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-blue-100 text-xl font-bold text-blue-700">
                  {initials}
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                  />
                </svg>
              </div>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <p className="mt-2 text-xs text-gray-400">
              Click to upload · JPG, PNG, WebP · Max 5MB
            </p>

            {avatarFile && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-blue-600">
                  {avatarFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* ── Fields ────────────────────────────────── */}
          <div className="mt-8 space-y-5">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-400">
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  required
                  maxLength={20}
                  value={username}
                  placeholder="your_username"
                  disabled={isSaving}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  onBlur={handleUsernameBlur}
                  className={`
                    block w-full rounded-lg border bg-white py-2.5 pl-8
                    pr-3 text-sm text-gray-900 placeholder-gray-400
                    shadow-sm transition-colors
                    focus:outline-none focus:ring-1
                    disabled:cursor-not-allowed disabled:bg-gray-50
                    disabled:opacity-60
                    ${
                      usernameError
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }
                  `}
                />
              </div>
              {usernameError && (
                <p className="mt-1 text-xs text-red-600">{usernameError}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                3-20 characters · Letters, numbers, underscores
              </p>
            </div>

            {/* Full name */}
            <div>
              <label
                htmlFor="full-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Full name
              </label>
              <input
                id="full-name"
                type="text"
                maxLength={100}
                value={fullName}
                placeholder="Jane Doe"
                disabled={isSaving}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setSuccess(null);
                }}
                className="
                  block w-full rounded-lg border border-gray-300 bg-white
                  px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400
                  shadow-sm transition-colors
                  focus:border-blue-500 focus:outline-none focus:ring-1
                  focus:ring-blue-500
                  disabled:cursor-not-allowed disabled:bg-gray-50
                  disabled:opacity-60
                "
              />
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                maxLength={300}
                value={bio}
                placeholder="Tell others a little about yourself..."
                disabled={isSaving}
                onChange={(e) => {
                  setBio(e.target.value);
                  setSuccess(null);
                }}
                className="
                  block w-full resize-none rounded-lg border border-gray-300
                  bg-white px-3 py-2.5 text-sm text-gray-900
                  placeholder-gray-400 shadow-sm transition-colors
                  focus:border-blue-500 focus:outline-none focus:ring-1
                  focus:ring-blue-500
                  disabled:cursor-not-allowed disabled:bg-gray-50
                  disabled:opacity-60
                "
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {bio.length}/300
              </p>
            </div>
          </div>

          {/* ── Submit ────────────────────────────────── */}
          <button
            type="submit"
            disabled={isSaving || !!usernameError}
            className="
              mt-6 flex w-full items-center justify-center rounded-lg
              bg-blue-600 px-4 py-2.5 text-sm font-medium text-white
              shadow-sm transition-colors hover:bg-blue-700
              focus:outline-none focus:ring-2 focus:ring-blue-500
              focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {isSaving ? (
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
                {uploadingAvatar ? "Uploading avatar…" : "Saving…"}
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}