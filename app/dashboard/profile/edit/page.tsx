"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useProfileEdit } from "@/hooks/use-profile-edit";
import { Spinner } from "@/components/ui/spinner";
import {
  User,
  AtSign,
  Type,
  Image,
  FileText,
  Save,
  ArrowLeft,
  RotateCcw,
  Check,
  AlertCircle,
  Sparkles,
  Shield,
  Camera,
  Trash2,
} from "lucide-react";

// ==========================================
// 🧩 TYPES
// ==========================================

interface InputFieldProps {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  hint?: string;
  required?: boolean;
  maxLength?: number;
  type?: "text" | "url";
  disabled?: boolean;
}

// ==========================================
// ⚙️ LOGIC — Reusable Input Component
// ==========================================

function InputField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  error,
  hint,
  required = false,
  maxLength,
  type = "text",
  disabled = false,
}: InputFieldProps) {
  return (
    <div>
      <label className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-rose-400">*</span>}
        </span>
        {maxLength && (
          <span
            className={`text-[10px] font-medium ${
              value.length > maxLength ? "text-rose-500" : "text-gray-400"
            }`}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
          <Icon
            className={`h-4 w-4 ${
              error ? "text-rose-400" : "text-gray-400"
            }`}
          />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`block w-full rounded-2xl border bg-gray-50/50 py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            error
              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
              : "border-gray-200 focus:border-indigo-300 focus:ring-indigo-100"
          }`}
        />
      </div>

      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
}

function TextAreaField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  error,
  hint,
  maxLength,
}: {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  hint?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          {label}
        </span>
        {maxLength && (
          <span
            className={`text-[10px] font-medium ${
              value.length > maxLength ? "text-rose-500" : "text-gray-400"
            }`}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-3.5">
          <Icon
            className={`h-4 w-4 ${
              error ? "text-rose-400" : "text-gray-400"
            }`}
          />
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`block w-full resize-none rounded-2xl border bg-gray-50/50 py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 ${
            error
              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
              : "border-gray-200 focus:border-indigo-300 focus:ring-indigo-100"
          }`}
        />
      </div>

      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
}

// ==========================================
// 🎨 UI RENDER — SKELETON
// ==========================================

function EditSkeleton() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse px-4 py-8 sm:px-6">
      <div className="mb-8 h-6 w-40 rounded-lg bg-gray-200" />
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-8 flex justify-center">
          <div className="h-32 w-32 rounded-full bg-gray-200" />
        </div>
        <div className="space-y-6">
          <div className="h-12 rounded-2xl bg-gray-100" />
          <div className="h-12 rounded-2xl bg-gray-100" />
          <div className="h-12 rounded-2xl bg-gray-100" />
          <div className="h-24 rounded-2xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🔧 HELPER — Fallback avatar URL
// ==========================================

function getFallbackAvatar(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=e0e7ff&color=4338ca&bold=true&size=256`;
}

// ==========================================
// 🎨 UI RENDER — PAGE
// ==========================================

export default function EditProfilePage() {
  const e = useProfileEdit();

  if (e.loading) return <EditSkeleton />;

  const displayName =
    e.formData.display_name || e.formData.full_name || e.formData.username || "User";

  // Resolve the avatar source: local preview > saved URL > fallback
  const resolvedAvatarSrc = e.avatarPreviewUrl
    ? e.avatarPreviewUrl
    : e.formData.avatar_url.trim().length > 0
      ? e.formData.avatar_url
      : getFallbackAvatar(displayName);

  // Determine if user has a photo (either a pending file or a saved URL)
  const hasPhoto =
    e.avatarFile !== null ||
    (!e.avatarRemoved && e.formData.avatar_url.trim().length > 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      {/* ── Back Button ──────────────────────────── */}
      <button
        onClick={e.handleCancel}
        className="mb-6 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-500 transition-all hover:bg-white hover:text-gray-900 hover:shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profile
      </button>

      {/* ── Main Form Card ───────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        {/* Decorative Background */}
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-100/50 to-purple-100/30 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-gradient-to-tr from-blue-100/30 to-cyan-100/20 blur-2xl" />

        {/* Header Banner */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 px-8 pb-20 pt-8">
          {/* Decorative */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
          <div className="absolute bottom-4 left-1/4 h-16 w-16 rounded-full bg-purple-400/15 blur-lg" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Edit Profile</h1>
              <p className="text-sm text-indigo-200">
                Update your personal information
              </p>
            </div>
          </div>
        </div>

        {/* ── Clickable Avatar with Camera Overlay ── */}
        <div className="relative flex flex-col items-center">
          {/* Hidden file input */}
          <input
            ref={e.fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(ev) => {
              const file = ev.target.files?.[0] ?? null;
              if (file) e.handleAvatarSelect(file);
            }}
          />

          <button
            type="button"
            onClick={e.triggerFileInput}
            className="group -mt-16 relative rounded-full bg-white p-2 shadow-xl transition-all duration-200 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-indigo-200"
            aria-label="Change profile photo"
          >
            <img
              src={resolvedAvatarSrc}
              alt={displayName}
              className="h-32 w-32 rounded-full object-cover transition-all duration-200 group-hover:brightness-75"
              onError={(ev) => {
                (ev.target as HTMLImageElement).src =
                  getFallbackAvatar(displayName);
              }}
            />
            {/* Camera overlay */}
            <div className="absolute inset-2 flex items-center justify-center rounded-full bg-black/0 transition-all duration-200 group-hover:bg-black/20">
              <Camera className="h-8 w-8 text-white opacity-0 drop-shadow-lg transition-all duration-200 group-hover:opacity-100" />
            </div>
          </button>

          {/* Change / Remove buttons */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={e.triggerFileInput}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-all hover:bg-indigo-50"
            >
              <Camera className="h-3.5 w-3.5" />
              Change Photo
            </button>

            {hasPhoto && (
              <button
                type="button"
                onClick={e.handleAvatarRemove}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-500 transition-all hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove Photo
              </button>
            )}
          </div>

          {/* Avatar error */}
          {e.errors.avatar_url && (
            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-rose-600">
              <AlertCircle className="h-3 w-3" />
              {e.errors.avatar_url}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={e.handleSave} className="relative px-6 pb-8 pt-4 sm:px-8">
          {/* General Error */}
          {e.errors.general && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500" />
              <p className="text-sm font-medium text-rose-700">
                {e.errors.general}
              </p>
            </div>
          )}

          {/* Success Message */}
          {e.saveSuccess && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <Check className="h-4 w-4 flex-shrink-0 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-700">
                Profile updated successfully!
              </p>
            </div>
          )}

          <div className="space-y-5">
            {/* Display Name */}
            <InputField
              label="Display Name"
              icon={Type}
              value={e.formData.display_name}
              onChange={(v) => e.updateField("display_name", v)}
              placeholder="How others see you"
              error={e.errors.display_name}
              hint="This is your public name visible to everyone."
              required
              maxLength={50}
            />

            {/* Username */}
            <InputField
              label="Username"
              icon={AtSign}
              value={e.formData.username}
              onChange={(v) => e.updateField("username", v)}
              placeholder="your_username"
              error={e.errors.username}
              hint="Lowercase letters, numbers, and underscores only."
              required
              maxLength={30}
            />

            {/* Full Name */}
            <InputField
              label="Full Name"
              icon={User}
              value={e.formData.full_name}
              onChange={(v) => e.updateField("full_name", v)}
              placeholder="Your full name"
              error={e.errors.full_name}
              maxLength={100}
            />

            {/* Bio */}
            <TextAreaField
              label="Bio"
              icon={FileText}
              value={e.formData.bio}
              onChange={(v) => e.updateField("bio", v)}
              placeholder="Tell people about yourself…"
              error={e.errors.bio}
              hint="A short description visible on your profile."
              maxLength={250}
            />
          </div>

          {/* ── Divider ──────────────────────────── */}
          <div className="my-6 border-t border-gray-100" />

          {/* ── Security Note ────────────────────── */}
          <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
            <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" />
            <p className="text-xs leading-relaxed text-indigo-700">
              Your profile information is stored securely. Only your
              display name, username, and avatar are publicly visible.
            </p>
          </div>

          {/* ── Action Buttons ───────────────────── */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            {/* Left: Cancel + Reset */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={e.handleCancel}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition-all duration-200 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </button>

              {e.hasChanges && (
                <button
                  type="button"
                  onClick={e.handleReset}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-200 hover:bg-gray-50 hover:text-gray-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>

            {/* Right: Save */}
            <button
              type="submit"
              disabled={e.saving || !e.hasChanges}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {e.saving ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Saving…
                </>
              ) : e.saveSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Avatar Preview Card ──────────────────── */}
      {(e.avatarPreviewUrl || e.formData.avatar_url.trim().length > 0) &&
        !e.avatarRemoved && (
          <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                <Image className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                Avatar Preview
              </h3>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-gray-50/50 p-4">
              {/* Multiple Sizes */}
              <div className="flex items-end gap-3">
                <div className="text-center">
                  <img
                    src={resolvedAvatarSrc}
                    alt="Preview"
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-white shadow-md"
                    onError={(ev) => {
                      (ev.target as HTMLImageElement).src =
                        getFallbackAvatar(displayName);
                    }}
                  />
                  <p className="mt-1 text-[10px] text-gray-400">Large</p>
                </div>
                <div className="text-center">
                  <img
                    src={resolvedAvatarSrc}
                    alt="Preview"
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                    onError={(ev) => {
                      (ev.target as HTMLImageElement).src =
                        getFallbackAvatar(displayName);
                    }}
                  />
                  <p className="mt-1 text-[10px] text-gray-400">Med</p>
                </div>
                <div className="text-center">
                  <img
                    src={resolvedAvatarSrc}
                    alt="Preview"
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-white shadow-sm"
                    onError={(ev) => {
                      (ev.target as HTMLImageElement).src =
                        getFallbackAvatar(displayName);
                    }}
                  />
                  <p className="mt-1 text-[10px] text-gray-400">Sm</p>
                </div>
              </div>

              {/* Profile Preview */}
              <div className="ml-auto rounded-2xl border border-gray-100 bg-white p-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={resolvedAvatarSrc}
                    alt="Preview"
                    className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200"
                    onError={(ev) => {
                      (ev.target as HTMLImageElement).src =
                        getFallbackAvatar(displayName);
                    }}
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {e.formData.display_name || "Display Name"}
                    </p>
                    <p className="text-xs text-gray-400">
                      @{e.formData.username || "username"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}