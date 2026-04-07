"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { Modal } from "@/components/ui/modal";
import {
  X,
  Copy,
  Check,
  Share2,
  QrCode,
  ExternalLink,
} from "lucide-react";

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileUrl: string;
  displayName: string;
  username: string;
}

export function ShareProfileModal({
  isOpen,
  onClose,
  profileUrl,
  displayName,
  username,
}: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = profileUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} on FairShare`,
          text: `Check out @${username}'s profile on FairShare`,
          url: profileUrl,
        });
      } catch {
        // User cancelled
      }
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Profile" maxWidth="sm">
      {/* Header Gradient */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 px-6 pb-8 pt-6">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-surface/10 blur-xl" />
        <div className="absolute -bottom-6 left-8 h-20 w-20 rounded-full bg-purple-400/20 blur-lg" />

        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl bg-surface/15 p-1.5 text-white/80 backdrop-blur-sm transition-colors hover:bg-surface/25 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface/20 backdrop-blur-sm">
            <QrCode className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Share Profile</h3>
            <p className="text-xs text-indigo-200">@{username}</p>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center px-6 py-6">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <QRCode
            value={profileUrl}
            size={180}
            level="M"
            bgColor="#FFFFFF"
            fgColor="#312e81"
          />
        </div>
        <p className="mt-3 text-center text-xs text-text-tertiary">
          Scan to view {displayName}&apos;s profile
        </p>
      </div>

      {/* URL + Actions */}
      <div className="border-t border-border px-6 pb-6 pt-4">
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2.5">
          <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-text-tertiary" />
          <p className="flex-1 truncate text-xs font-medium text-text-secondary">
            {profileUrl}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
              copied
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-surface-2 text-text-primary hover:bg-gray-200"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Link
              </>
            )}
          </button>

          {typeof navigator !== "undefined" &&
            typeof navigator.share === "function" && (
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-text-primary to-text-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-indigo-200"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            )}
        </div>
      </div>
    </Modal>
  );
}