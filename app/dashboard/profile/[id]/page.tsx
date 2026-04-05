"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useState } from "react";
import { useParams } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import { Spinner } from "@/components/ui/spinner";
import { User, QrCode } from "lucide-react";
import { ProfileHeader } from "../_components/profile-header";
import { ShareProfileModal } from "../_components/share-profile-modal";
import { StatsWidgets } from "../_components/stats-widgets";
import { ActivityLog } from "../_components/activity-log";
import { ProfileInfoCard } from "../_components/profile-info-card";
import { QRShareModal } from "@/components/modals/qr/qr-share-modal";

// ==========================================
// 🎨 UI RENDER
// ==========================================
export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const p = useProfile({ userId });

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  /* ── Loading ─────────────────────────────────────── */
  if (p.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Spinner className="h-5 w-5" />
          Loading Profile…
        </div>
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────── */
  if (p.error || !p.profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <div className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <User className="h-7 w-7 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">User Not Found</h2>
          <p className="mt-2 max-w-xs text-sm text-text-secondary">
            {p.error || "This profile doesn't exist or is private."}
          </p>
          <button
            onClick={p.handleBack}
            className="mt-6 rounded-2xl bg-surface-2 px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-gray-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const profileQRUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/dashboard/profile/${p.profile.username}`
      : "";

  const profileDisplayName =
    p.profile.display_name || p.profile.full_name || p.profile.username;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="space-y-6">
        {/* Header */}
        <ProfileHeader
          profile={p.profile}
          isOwnProfile={p.isOwnProfile}
          friendStatus={p.friendStatus}
          isProcessing={p.isProcessing}
          onAddFriend={p.handleAddFriend}
          onCancelRequest={p.handleCancelRequest}
          onShareProfile={p.openShareModal}
        />

        {/* ★ My QR Button (only on own profile) ★ */}
        {p.isOwnProfile && (
          <div className="flex justify-center">
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-2.5 text-sm font-semibold text-purple-700 shadow-sm transition-all hover:shadow-md hover:shadow-purple-500/10 active:scale-[0.98]"
            >
              <QrCode className="h-4 w-4" />
              My QR Code
            </button>
          </div>
        )}

        {/* Stats */}
        <StatsWidgets
          stats={p.stats}
          groups={p.groups}
          isOwnProfile={p.isOwnProfile}
        />

        {/* Info + Activity Grid */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className={p.isOwnProfile ? "lg:col-span-2" : "lg:col-span-5"}>
            <ProfileInfoCard profile={p.profile} />
          </div>
          {p.isOwnProfile && (
            <div className="lg:col-span-3">
              <ActivityLog
                activities={p.activities}
                isOwnProfile={p.isOwnProfile}
              />
            </div>
          )}
        </div>
      </div>

      {/* Share Modal (existing) */}
      <ShareProfileModal
        isOpen={p.isShareModalOpen}
        onClose={p.closeShareModal}
        profileUrl={p.profileUrl}
        displayName={profileDisplayName}
        username={p.profile.username}
      />

      {/* ★ QR Share Modal ★ */}
      <QRShareModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        value={profileQRUrl}
        title={profileDisplayName}
        subtitle={`@${p.profile.username}`}
        type="profile"
      />
    </div>
  );
}