"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import {
  Share2,
  Pencil,
  UserPlus,
  UserCheck,
  X,
  CalendarDays,
  AtSign,
  Shield,
  Sparkles,
} from "lucide-react";
import type { UserProfile, FriendStatus } from "@/types/profile";

// ==========================================
// 🧩 TYPES
// ==========================================
interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  friendStatus: FriendStatus;
  isProcessing: boolean;
  onAddFriend: () => void;
  onCancelRequest: () => void;
  onShareProfile: () => void;
  onEditProfile?: () => void;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function ProfileHeader({
  profile,
  isOwnProfile,
  friendStatus,
  isProcessing,
  onAddFriend,
  onCancelRequest,
  onShareProfile,
  onEditProfile,
}: ProfileHeaderProps) {
  const displayName =
    profile.display_name || profile.full_name || profile.username;
  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      {/* ── Banner Gradient ───────────────────────── */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 sm:h-52">
        {/* Decorative Elements */}
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-purple-400/15 blur-xl" />
        <div className="absolute -bottom-8 right-1/3 h-40 w-40 rounded-full bg-indigo-300/10 blur-2xl" />
        <div className="absolute left-1/2 top-1/3 h-24 w-24 -translate-x-1/2 rounded-full bg-white/5 blur-2xl" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Top Actions — Glassmorphism */}
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <button
            onClick={onShareProfile}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/20 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/30 active:scale-95"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>

          {isOwnProfile && onEditProfile && (
            <button
              onClick={onEditProfile}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/20 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/30 active:scale-95"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* ── Centered Profile Content ─────────────── */}
      <div className="relative flex flex-col items-center px-6 pb-8">
        {/* Avatar — centered, overlapping the banner */}
        <div className="relative -mt-16 mb-1 sm:-mt-[4.5rem]">
          <div className="rounded-full border-4 border-white bg-white shadow-xl">
            <Avatar src={profile.avatar_url} name={displayName} size="lg" />
          </div>
          {/* Online Indicator */}
          {isOwnProfile && (
            <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-[3px] border-white bg-emerald-400 shadow-sm" />
          )}
        </div>

        {/* Display Name + Friend Badge */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            {displayName}
          </h1>
          {friendStatus === "friends" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-inset ring-emerald-200">
              <UserCheck className="h-2.5 w-2.5" />
              Friend
            </span>
          )}
        </div>

        {/* Username */}
        <div className="mt-1 flex items-center justify-center gap-1 text-sm text-gray-500">
          <AtSign className="h-3.5 w-3.5" />
          <span className="font-medium">{profile.username}</span>
        </div>

        {/* Bio */}
        {profile.bio && profile.bio.trim().length > 0 && (
          <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-gray-600">
            {profile.bio}
          </p>
        )}

        {/* Meta — Joined & Public */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <CalendarDays className="h-3 w-3" />
            <span>Joined {joinDate}</span>
          </div>
          {profile.is_public && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Shield className="h-3 w-3" />
              <span>Public profile</span>
            </div>
          )}
        </div>

        {/* Friend Action Buttons — centered below meta */}
        {!isOwnProfile && (
          <div className="mt-5">
            {friendStatus === "none" && (
              <button
                onClick={onAddFriend}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Add Friend
              </button>
            )}

            {friendStatus === "pending" && (
              <button
                onClick={onCancelRequest}
                disabled={isProcessing}
                className="group inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-2.5 text-sm font-semibold text-amber-700 transition-all duration-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <>
                    <span className="flex items-center gap-1.5 group-hover:hidden">
                      <UserCheck className="h-4 w-4" />
                      Requested
                    </span>
                    <span className="hidden items-center gap-1.5 group-hover:flex">
                      <X className="h-4 w-4" />
                      Cancel
                    </span>
                  </>
                )}
              </button>
            )}

            {friendStatus === "friends" && (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-2.5 text-sm font-semibold text-emerald-700">
                <UserCheck className="h-4 w-4" />
                Friends
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}