"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Camera,
  CameraOff,
  Loader2,
  AlertTriangle,
  ScanLine,
  QrCode,
} from "lucide-react";

// ==========================================
// 🧩 TYPES
// ==========================================
interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupScanned?: (groupId: string) => void;
}

type ScannerState =
  | "initializing"
  | "scanning"
  | "success"
  | "error"
  | "permission_denied";

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function QRScannerModal({
  isOpen,
  onClose,
  onGroupScanned,
}: QRScannerModalProps) {
  const [state, setState] = useState<ScannerState>("initializing");
  const [errorMessage, setErrorMessage] = useState("");
  const [scannedValue, setScannedValue] = useState("");
  const [animateIn, setAnimateIn] = useState(false);

  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ── Cleanup scanner ──
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const scannerState = scannerRef.current.getState();
        if (scannerState === 2) {
          // SCANNING
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Scanner cleanup warning:", err);
      }
      scannerRef.current = null;
    }
  }, []);

  // ── Parse scanned URL ──
  const handleScannedUrl = useCallback(
    (url: string) => {
      setScannedValue(url);
      setState("success");

      try {
        const parsed = new URL(url);
        const pathname = parsed.pathname;
        const searchParams = parsed.searchParams;

        // Case 1: Group join link → /join?id=GROUP_ID
        if (
          pathname === "/join" &&
          searchParams.has("id")
        ) {
          const groupId = searchParams.get("id")!;
          stopScanner();
          setTimeout(() => {
            onClose();
            if (onGroupScanned) {
              onGroupScanned(groupId);
            } else {
              router.push(`/join?id=${groupId}`);
            }
          }, 800);
          return;
        }

        // Case 2: Profile link → /profile/USERNAME or /dashboard/profile/USERNAME
        const profileMatch = pathname.match(
          /\/(?:dashboard\/)?profile\/([a-z0-9_]+)/i
        );
        if (profileMatch) {
          const username = profileMatch[1];
          stopScanner();
          setTimeout(() => {
            onClose();
            router.push(`/dashboard/profile/${username}`);
          }, 800);
          return;
        }

        // Case 3: Generic FairShare URL → just navigate
        if (parsed.origin === window.location.origin) {
          stopScanner();
          setTimeout(() => {
            onClose();
            router.push(pathname + parsed.search);
          }, 800);
          return;
        }

        // Unknown URL
        setErrorMessage("This QR code is not a FairShare link.");
        setState("error");
        setTimeout(() => setState("scanning"), 2500);
      } catch {
        // Not a URL — could be plain text
        setErrorMessage("Unrecognized QR code format.");
        setState("error");
        setTimeout(() => setState("scanning"), 2500);
      }
    },
    [onClose, onGroupScanned, router, stopScanner]
  );

  // ── Start scanner ──
  useEffect(() => {
    if (!isOpen) return;

    setAnimateIn(true);
    setState("initializing");
    setErrorMessage("");
    setScannedValue("");

    let mounted = true;

    const initScanner = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!mounted) return;

        // Ensure container exists
        const readerId = "qr-reader-container";
        let container = document.getElementById(readerId);
        if (!container) {
          // Wait a frame for DOM
          await new Promise((r) => requestAnimationFrame(r));
          container = document.getElementById(readerId);
        }
        if (!container || !mounted) return;

        const scanner = new Html5Qrcode(readerId, {
          verbose: false,
        });

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (mounted) {
              handleScannedUrl(decodedText);
            }
          },
          () => {
            // QR code not detected in frame — no action needed
          }
        );

        if (mounted) {
          setState("scanning");
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error("Scanner init error:", err);

        if (
          err?.toString().includes("NotAllowedError") ||
          err?.toString().includes("Permission")
        ) {
          setState("permission_denied");
          setErrorMessage(
            "Camera access was denied. Please allow camera access in your browser settings."
          );
        } else {
          setState("error");
          setErrorMessage(
            err?.message || "Failed to start camera. Please try again."
          );
        }
      }
    };

    // Small delay to let modal animate in
    const timer = setTimeout(initScanner, 400);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, handleScannedUrl, stopScanner]);

  // ── Close handler ──
  const handleClose = useCallback(() => {
    setAnimateIn(false);
    stopScanner();
    setTimeout(onClose, 200);
  }, [onClose, stopScanner]);

  // ── Escape key ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* ── Backdrop ── */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${
          animateIn ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* ── Modal ── */}
      <div
        className={`relative w-full max-w-sm transform transition-all duration-300 ${
          animateIn
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
      >
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gray-950 shadow-2xl">
          {/* ── Header ── */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20">
                <QrCode className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Scan QR Code
                </h2>
                <p className="text-xs text-gray-400">
                  Point your camera at a FairShare QR
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gray-400 transition-colors hover:bg-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── Camera View ── */}
          <div className="relative aspect-square w-full bg-black" ref={containerRef}>
            {/* Scanner mounts here */}
            <div
              id="qr-reader-container"
              className="h-full w-full [&>video]:!h-full [&>video]:!w-full [&>video]:!object-cover [&_img]:hidden [&_select]:hidden [&_button]:hidden [&>div]:!border-none"
            />

            {/* ── Scanning Overlay (crosshairs) ── */}
            {state === "scanning" && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                {/* Corners */}
                <div className="relative h-64 w-64">
                  {/* Top-left */}
                  <div className="absolute left-0 top-0 h-8 w-8 border-l-[3px] border-t-[3px] border-indigo-400 rounded-tl-lg" />
                  {/* Top-right */}
                  <div className="absolute right-0 top-0 h-8 w-8 border-r-[3px] border-t-[3px] border-indigo-400 rounded-tr-lg" />
                  {/* Bottom-left */}
                  <div className="absolute bottom-0 left-0 h-8 w-8 border-b-[3px] border-l-[3px] border-indigo-400 rounded-bl-lg" />
                  {/* Bottom-right */}
                  <div className="absolute bottom-0 right-0 h-8 w-8 border-b-[3px] border-r-[3px] border-indigo-400 rounded-br-lg" />
                  {/* Scan line animation */}
                  <div className="absolute left-2 right-2 top-0 h-0.5 animate-[scanline_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
                </div>

                {/* Dim outside the scanning area */}
                <div className="absolute inset-0 bg-black/40" style={{
                  maskImage: "radial-gradient(circle 130px, transparent 128px, black 130px)",
                  WebkitMaskImage: "radial-gradient(circle 130px, transparent 128px, black 130px)",
                }} />
              </div>
            )}

            {/* ── Initializing State ── */}
            {state === "initializing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-indigo-400" />
                <p className="text-sm text-gray-400">Starting camera…</p>
              </div>
            )}

            {/* ── Permission Denied ── */}
            {state === "permission_denied" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 px-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
                  <CameraOff className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Camera Access Denied
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {errorMessage}
                </p>
                <button
                  onClick={handleClose}
                  className="mt-5 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                >
                  Close
                </button>
              </div>
            )}

            {/* ── Success State ── */}
            {state === "success" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/95">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                  <Camera className="h-8 w-8 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-emerald-400">
                  QR Code detected!
                </p>
                <p className="mt-1 max-w-[80%] truncate text-xs text-gray-500">
                  {scannedValue}
                </p>
                <Loader2 className="mt-3 h-5 w-5 animate-spin text-gray-500" />
              </div>
            )}

            {/* ── Error State ── */}
            {state === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/95 px-6 text-center">
                <AlertTriangle className="mb-3 h-8 w-8 text-amber-400" />
                <p className="text-sm text-amber-300">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-white/10 px-5 py-4">
            <p className="text-center text-xs text-gray-500">
              Scan a FairShare group invite or profile QR code
            </p>
          </div>
        </div>
      </div>

      {/* ── Scanline keyframes ── */}
      <style jsx global>{`
        @keyframes scanline {
          0%,
          100% {
            top: 0;
          }
          50% {
            top: calc(100% - 2px);
          }
        }
      `}</style>
    </div>
  );
}