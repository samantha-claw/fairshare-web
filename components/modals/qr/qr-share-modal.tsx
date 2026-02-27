"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";
import { Modal } from "@/components/ui/modal";
import {
  X,
  Copy,
  Check,
  Download,
  Share2,
  Wallet,
  RefreshCw,
  Loader2,
  ShieldAlert,
} from "lucide-react";

// ==========================================
// 🧩 TYPES
// ==========================================
interface QRShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  title: string;
  subtitle?: string;
  type?: "group" | "profile";
  isOwner?: boolean;
  onResetToken?: () => Promise<void>;
}

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function QRShareModal({
  isOpen,
  onClose,
  value,
  title,
  subtitle,
  type = "group",
  isOwner = false,
  onResetToken,
}: QRShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // ── Copy link ────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [value]);

  // ── Download QR ──────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 1024;
      canvas.height = 1024;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 1024, 1024);
        ctx.drawImage(img, 112, 112, 800, 800);
      }
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `fairshare-${type}-qr.png`;
      downloadLink.href = pngUrl;
      downloadLink.click();
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  }, [type]);

  // ── Native share ─────────────────────────────────────
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `FairShare — ${title}`,
          text: subtitle || `Join ${title} on FairShare`,
          url: value,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  }, [title, subtitle, value, handleCopy]);

  // ── Reset token ──────────────────────────────────────
  const handleResetToken = useCallback(async () => {
    if (!onResetToken) return;
    setResetting(true);
    try {
      await onResetToken();
      setResetSuccess(true);
      setShowResetConfirm(false);
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (err) {
      console.error("Reset token error:", err);
    } finally {
      setResetting(false);
    }
  }, [onResetToken]);

  // ── Close handler ────────────────────────────────────
  // If reset confirm is showing, dismiss it first instead of closing the modal
  const handleClose = useCallback(() => {
    if (showResetConfirm) {
      setShowResetConfirm(false);
      return;
    }
    // Reset internal state for next open
    setShowResetConfirm(false);
    setResetting(false);
    setResetSuccess(false);
    onClose();
  }, [showResetConfirm, onClose]);

  const gradientFrom = type === "group" ? "from-indigo-600" : "from-purple-600";
  const gradientTo = type === "group" ? "to-blue-600" : "to-pink-600";
  const showResetButton = isOwner && type === "group" && onResetToken;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="sm">
      {/* ── Gradient Header ── */}
      <div
        className={`relative bg-gradient-to-br ${gradientFrom} ${gradientTo} px-6 pb-12 pt-6`}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/30 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-white">{title}</h2>
            {subtitle && (
              <p className="truncate text-sm text-white/70">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── QR Code ── */}
      <div className="relative z-10 -mt-6 px-6">
        <div
          ref={qrRef}
          className="mx-auto flex w-fit items-center justify-center rounded-2xl border-4 border-white bg-white p-5 shadow-lg"
        >
          <QRCodeSVG
            value={value}
            size={200}
            level="H"
            includeMargin
            bgColor="#ffffff"
            fgColor="#1e1b4b"
          />
        </div>
      </div>

      {/* ── Reset Success Toast ── */}
      {resetSuccess && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 transition-all">
          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-xs font-medium text-emerald-700">
            Invite link reset! Old links are now invalid.
          </p>
        </div>
      )}

      {/* ── URL Preview ── */}
      <div className="mx-6 mt-4">
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
          <p className="flex-1 truncate text-xs text-gray-500">{value}</p>
          <button
            onClick={handleCopy}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all ${
              copied
                ? "bg-emerald-100 text-emerald-600"
                : "bg-gray-200 text-gray-500 hover:bg-gray-300"
            }`}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Reset Invite Link (Owner Only) ── */}
      {showResetButton && !showResetConfirm && (
        <div className="mx-6 mt-3">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50/50 py-2.5 text-xs font-semibold text-red-600 transition-all hover:border-red-200 hover:bg-red-50 active:scale-[0.99]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Invite Link
          </button>
        </div>
      )}

      {/* ── Reset Confirmation Panel ── */}
      {showResetButton && showResetConfirm && (
        <div className="mx-6 mt-3">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="mb-3 flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100">
                <ShieldAlert className="h-4 w-4 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-red-900">
                  Reset invite link?
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-red-600/80">
                  This will invalidate all previously shared QR codes and links.
                  Anyone who hasn&apos;t joined yet will need the new link.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="flex flex-1 items-center justify-center rounded-xl border border-red-200 bg-white py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetToken}
                disabled={resetting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"
              >
                {resetting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Resetting…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Yes, Reset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className="flex gap-2 px-6 pb-6 pt-4">
        <button
          onClick={handleCopy}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
            copied
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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

        <button
          onClick={handleDownload}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
          title="Download QR"
        >
          <Download className="h-4 w-4" />
        </button>

        <button
          onClick={handleNativeShare}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]`}
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </Modal>
  );
}