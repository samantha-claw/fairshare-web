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
}: QRShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // ── Animate in ──
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setAnimateIn(true));
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
      // Fallback for older browsers
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
            className={`relative bg-gradient-to-br ${gradientFrom} ${gradientTo} px-6 pb-16 pt-6`}
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
          <div className="-mt-10 px-6">
            <div
              ref={qrRef}
              className="mx-auto flex w-fit items-center justify-center rounded-2xl border-4 border-white bg-white p-4 shadow-lg"
            >
              <QRCodeSVG
                value={value}
                size={200}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#1e1b4b"
                imageSettings={{
                  src: "",
                  height: 0,
                  width: 0,
                  excavate: false,
                }}
              />
            </div>
          </div>

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