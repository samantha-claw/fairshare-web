"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useState, useCallback, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  X,
  Copy,
  Check,
  Download,
  Share2,
  Wallet,
  RefreshCw,
  Loader2,
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
  const [animateIn, setAnimateIn] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // ── Animate in ──
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setAnimateIn(true));
      // Reset internal state when modal opens
      setIsResetting(false);
      setShowConfirm(false); // ✅ Reset confirmation state
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  // ── Copy link ──
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

  // ── Download QR ──
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

  // ── Native share ──
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `FairShare — ${title}`,
          text: subtitle || `Join ${title} on FairShare`,
          url: value,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  }, [title, subtitle, value, handleCopy]);

  // ── Reset invite token ──
  // استبدل handleResetToken بالكامل
  const [showConfirm, setShowConfirm] = useState(false);
  const handleResetToken = useCallback(async () => {
  if (!onResetToken) return;
  setShowConfirm(true); // فقط أظهر التأكيد - بدون blocking
}, [onResetToken]);

const confirmReset = useCallback(async () => {
  if (!onResetToken) return;
  setShowConfirm(false);
  setIsResetting(true);
  try {
    await onResetToken();
  } catch (err) {
    console.error("Reset token error:", err);
  } finally {
    setIsResetting(false);
  }
}, [onResetToken]);


{/* ✅ أضف هذا بعد زر Reset Invite Link مباشرة */}
{showConfirm && (
  <div className="mx-6 mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
    <p className="text-xs text-amber-800 mb-2">
      Are you sure? All previously shared QR codes and links will stop working.
    </p>
    <div className="flex gap-2">
      <button
        onClick={() => setShowConfirm(false)}
        className="flex-1 rounded-lg border border-gray-200 bg-white py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        onClick={confirmReset}
        className="flex-1 rounded-lg bg-red-600 py-1.5 text-xs font-medium text-white hover:bg-red-700"
      >
        Yes, Reset
      </button>
    </div>
  </div>
)} 

  // ── Close on Escape ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const gradientFrom =
    type === "group" ? "from-indigo-600" : "from-purple-600";
  const gradientTo =
    type === "group" ? "to-blue-600" : "to-pink-600";

  const showResetButton = isOwner && type === "group" && !!onResetToken;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* ── Backdrop ── */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          animateIn ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* ── Modal ── */}
      <div
        className={`relative w-full max-w-sm transform transition-all duration-300 ${
          animateIn
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
      >
        <div className="overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
          {/* ── Gradient Header ── */}
          <div
            className={`relative bg-gradient-to-br ${gradientFrom} ${gradientTo} px-6 pb-12 pt-6`}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/30 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-white">
                  {title}
                </h2>
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

          {/* ── URL Preview ── */}
          <div className="mx-6 mt-5">
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
          {showResetButton && (
            <div className="mx-6 mt-3">
              <button
                onClick={handleResetToken}
                disabled={isResetting}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Resetting…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reset Invite Link
                  </>
                )}
              </button>
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
        </div>
      </div>
    </div>
  );
}