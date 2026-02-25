"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { Spinner } from "@/components/ui/spinner";
import {
  Share2,
  Pencil,
  UserPlus,
  UserCheck,
  X,
  Check,
  CalendarDays,
  AtSign,
  Shield,
  Sparkles,
} from "lucide-react";
import type { UserProfile, FriendStatus } from "@/types/profile";

// ==========================================
// 🧩 TYPES
// ==========================================
type FriendshipDirection = "incoming" | "outgoing" | null;

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  friendStatus: FriendStatus;
  friendshipDirection?: FriendshipDirection;
  isProcessing: boolean;
  onAddFriend: () => void;
  onCancelRequest: () => void;
  onAcceptRequest?: () => void;
  onShareProfile: () => void;
  onEditProfile?: () => void;
}

// ==========================================
// 🎨 AVATAR FALLBACK HELPER
// ==========================================
function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function ProfileHeader({
  profile,
  isOwnProfile,
  friendStatus,
  friendshipDirection = null,
  isProcessing,
  onAddFriend,
  onCancelRequest,
  onAcceptRequest,
  onShareProfile,
  onEditProfile,
}: ProfileHeaderProps) {
  const displayName =
    profile.display_name || profile.full_name || profile.username || "User";
  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
      {/* ── Banner Gradient ───────────────────────── */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 sm:h-56">
        {/* Decorative Elements */}
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-purple-400/20 blur-2xl" />
        <div className="absolute left-1/2 top-1/3 h-24 w-24 -translate-x-1/2 rounded-full bg-white/10 blur-2xl" />

        {/* Top Actions — Glassmorphism */}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          <button
            onClick={onShareProfile}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 active:scale-95"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>

          {isOwnProfile && onEditProfile && (
            <button
              onClick={onEditProfile}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 active:scale-95"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* ── Centered Profile Content ─────────────── */}
      <div className="relative flex flex-col items-center px-6 pb-10">
        {/* Avatar — Large, centered, overlapping the banner */}
        <div className="relative -mt-20 z-10 sm:-mt-24">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-[6px] border-white bg-white shadow-xl ring-1 ring-black/5 sm:h-36 sm:w-36">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-3xl font-bold text-indigo-600">
                {getInitials(displayName)}
              </div>
            )}
          </div>

          {/* Online Indicator */}
          {isOwnProfile && (
            <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full border-4 border-white bg-emerald-500 shadow-sm" />
          )}
        </div>

        {/* Display Name */}
        <div className="mt-4 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            {displayName}
          </h1>

          {/* Username */}
          <div className="mt-1 flex items-center gap-1 text-base font-medium text-gray-500">
            <AtSign className="h-4 w-4" />
            <span>{profile.username}</span>
          </div>
        </div>

        {/* Friend Badge (If Applicable) */}
        {friendStatus === "friends" && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 ring-1 ring-inset ring-emerald-200">
              <UserCheck className="h-3 w-3" />
              Friend
            </span>
          </div>
        )}

        {/* Bio */}
        {profile.bio && profile.bio.trim().length > 0 && (
          <p className="mt-4 max-w-md text-center text-sm leading-relaxed text-gray-600">
            {profile.bio}
          </p>
        )}

        {/* Meta — Joined & Public */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Joined {joinDate}</span>
          </div>
          {profile.is_public && (
            <>
              <span className="h-1 w-1 rounded-full bg-gray-300"></span>
              <div className="flex items-center gap-1 text-xs font-medium text-gray-400">
                <Shield className="h-3.5 w-3.5" />
                <span>Public Profile</span>
              </div>
            </>
          )}
        </div>

        {/* Friend Action Buttons */}
        {!isOwnProfile && (
          <div className="mt-6 w-full max-w-xs">
            {/* ── No friendship → "Add Friend" ── */}
            {friendStatus === "none" && (
              <button
                onClick={onAddFriend}
                disabled={isProcessing}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <UserPlus className="h-5 w-5" />
                )}
                Add Friend
              </button>
            )}

            {/* ── Pending: I sent it (outgoing) → "Cancel Request" ── */}
            {friendStatus === "pending" && friendshipDirection === "outgoing" && (
              <button
                onClick={onCancelRequest}
                disabled={isProcessing}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 py-3.5 text-sm font-bold text-amber-700 transition-all duration-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <>
                    <span className="flex items-center gap-1.5 group-hover:hidden">
                      <UserCheck className="h-5 w-5" />
                      Request Sent
                    </span>
                    <span className="hidden items-center gap-1.5 group-hover:flex">
                      <X className="h-5 w-5" />
                      Cancel Request
                    </span>
                  </>
                )}
              </button>
            )}

            {/* ── Pending: They sent it (incoming) → "Accept" + "Decline" ── */}
            {friendStatus === "pending" && friendshipDirection === "incoming" && (
              <div className="space-y-2.5">
                {/* Info badge */}
                <div className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2">
                  <UserPlus className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="text-xs font-semibold text-indigo-600">
                    Sent you a friend request
                  </span>
                </div>

                {/* Accept + Decline buttons */}
                <div className="flex gap-2.5">
                  <button
                    onClick={onCancelRequest}
                    disabled={isProcessing}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-600 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        Decline
                      </>
                    )}
                  </button>
                  <button
                    onClick={onAcceptRequest}
                    disabled={isProcessing}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Accept
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── Pending: direction unknown (fallback) → "Cancel" ── */}
            {friendStatus === "pending" && !friendshipDirection && (
              <button
                onClick={onCancelRequest}
                disabled={isProcessing}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 py-3.5 text-sm font-bold text-amber-700 transition-all duration-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <>
                    <span className="flex items-center gap-1.5 group-hover:hidden">
                      <UserCheck className="h-5 w-5" />
                      Requested
                    </span>
                    <span className="hidden items-center gap-1.5 group-hover:flex">
                      <X className="h-5 w-5" />
                      Cancel
                    </span>
                  </>
                )}
              </button>
            )}

            {/* ── Already friends ── */}
            {friendStatus === "friends" && (
              <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 py-3.5 text-sm font-bold text-emerald-700">
                <UserCheck className="h-5 w-5" />
                Friends
                <Sparkles className="h-4 w-4 text-emerald-400" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}