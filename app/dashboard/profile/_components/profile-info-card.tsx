"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import {
  User,
  CalendarDays,
  AtSign,
  FileText,
} from "lucide-react";
import type { UserProfile } from "@/types/profile";

// ==========================================
// 🧩 TYPES
// ==========================================
interface ProfileInfoCardProps {
  profile: UserProfile;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function ProfileInfoCard({ profile }: ProfileInfoCardProps) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
          <FileText className="h-3.5 w-3.5 text-indigo-600" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">
          Profile Information
        </h3>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div className="flex items-center gap-3 rounded-2xl bg-gray-50/50 p-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Full Name
            </p>
            <p className="text-sm font-medium text-gray-900">
              {profile.full_name || "Not provided"}
            </p>
          </div>
        </div>

        {/* Username */}
        <div className="flex items-center gap-3 rounded-2xl bg-gray-50/50 p-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <AtSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Username
            </p>
            <p className="text-sm font-medium text-gray-900">
              @{profile.username}
            </p>
          </div>
        </div>

        {/* Joined Date */}
        <div className="flex items-center gap-3 rounded-2xl bg-gray-50/50 p-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Joined FairShare
            </p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(profile.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && profile.bio.trim().length > 0 && (
          <div className="flex items-start gap-3 rounded-2xl bg-gray-50/50 p-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Bio
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-gray-700">
                {profile.bio}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}