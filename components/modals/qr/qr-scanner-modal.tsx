"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import {
  X,
  Camera,
  CameraOff,
  Loader2,
  AlertTriangle,
  QrCode,
} from "lucide-react";

// ==========================================
// 🧩 TYPES
// ==========================================
interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupScanned?: (groupId: string, token: string | null) => void;
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

  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ── Cleanup scanner ──────────────────────────────────
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const scannerState = scannerRef.current.getState();
        if (scannerState === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Scanner cleanup warning:", err);
      }
      scannerRef.current = null;
    }
  }, []);

  // ── Parse scanned URL ────────────────────────────────
  const handleScannedUrl = useCallback(
    (url: string) => {
      setScannedValue(url);
      setState("success");

      try {
        const parsed = new URL(url);
        const pathname = parsed.pathname;
        const searchParams = parsed.searchParams;

        // Group join link
        if (pathname === "/join" && searchParams.has("id")) {
          const groupId = searchParams.get("id")!;
          const token = searchParams.get("token");

          stopScanner();
          setTimeout(() => {
            onClose();
            if (onGroupScanned) {
              onGroupScanned(groupId, token);
            } else {
              const joinUrl = token
                ? `/join?id=${groupId}&token=${token}`
                : `/join?id=${groupId}`;
              router.push(joinUrl);
            }
          }, 800);
          return;
        }

        // Profile link
        const profileMatch = pathname.match(
          /\/(?:dashboard\/)?profile\/([a-zA-Z0-9_\-.]+)/
        );
        if (profileMatch) {
          stopScanner();
          setTimeout(() => {
            onClose();
            router.push(`/dashboard/profile/${profileMatch[1]}`);
          }, 800);
          return;
        }

        // Same-origin generic URL
        if (parsed.origin === window.location.origin) {
          stopScanner();
          setTimeout(() => {
            onClose();
            router.push(pathname + parsed.search);
          }, 800);
          return;
        }

        // External / unknown
        setErrorMessage("This QR code is not a FairShare link.");
        setState("error");
        setTimeout(() => setState("scanning"), 2500);
      } catch {
        setErrorMessage("Unrecognized QR code format.");
        setState("error");
        setTimeout(() => setState("scanning"), 2500);
      }
    },
    [onClose, onGroupScanned, router, stopScanner]
  );

  // ── Start scanner when modal opens ───────────────────
  useEffect(() => {
    if (!isOpen) return;

    setState("initializing");
    setErrorMessage("");
    setScannedValue("");

    let mounted = true;

    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted) return;

        const readerId = "qr-reader-container";
        let container = document.getElementById(readerId);
        if (!container) {
          await new Promise((r) => requestAnimationFrame(r));
          container = document.getElementById(readerId);
        }
        if (!container || !mounted) return;

        const scanner = new Html5Qrcode(readerId, { verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          (decodedText) => {
            if (mounted) handleScannedUrl(decodedText);
          },
          () => {}
        );

        if (mounted) setState("scanning");
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

    const timer = setTimeout(initScanner, 400);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, handleScannedUrl, stopScanner]);

  // ── Close handler (stops scanner first) ──────────────
  const handleClose = useCallback(() => {
    stopScanner();
    onClose();
  }, [onClose, stopScanner]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Scan QR Code" maxWidth="sm" position="center">
      {/* Dark-themed container covers the Modal's white bg */}
      <div className="overflow-hidden bg-gray-950">
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-text-text-primary/20">
              <QrCode className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Scan QR Code</h2>
              <p className="text-xs text-text-tertiary">
                Point your camera at a FairShare QR
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/10 text-text-tertiary transition-colors hover:bg-surface/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Camera View ── */}
        <div className="relative aspect-square w-full bg-black" ref={containerRef}>
          <div
            id="qr-reader-container"
            className="h-full w-full [&>video]:!h-full [&>video]:!w-full [&>video]:!object-cover [&_img]:hidden [&_select]:hidden [&_button]:hidden [&>div]:!border-none"
          />

          {/* Scanning Overlay */}
          {state === "scanning" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-64 w-64">
                <div className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-[3px] border-t-[3px] border-indigo-400" />
                <div className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-[3px] border-t-[3px] border-indigo-400" />
                <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-[3px] border-l-[3px] border-indigo-400" />
                <div className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-[3px] border-r-[3px] border-indigo-400" />
                <div className="absolute left-2 right-2 top-0 h-0.5 animate-[scanline_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
              </div>
              <div
                className="absolute inset-0 bg-black/40"
                style={{
                  maskImage:
                    "radial-gradient(circle 130px, transparent 128px, black 130px)",
                  WebkitMaskImage:
                    "radial-gradient(circle 130px, transparent 128px, black 130px)",
                }}
              />
            </div>
          )}

          {/* Initializing */}
          {state === "initializing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-indigo-400" />
              <p className="text-sm text-text-tertiary">Starting camera…</p>
            </div>
          )}

          {/* Permission Denied */}
          {state === "permission_denied" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
                <CameraOff className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-base font-bold text-white">
                Camera Access Denied
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-tertiary">
                {errorMessage}
              </p>
              <button
                onClick={handleClose}
                className="mt-5 rounded-xl bg-surface/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-surface/20"
              >
                Close
              </button>
            </div>
          )}

          {/* Success */}
          {state === "success" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/95">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                <Camera className="h-8 w-8 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-emerald-400">
                QR Code detected!
              </p>
              <p className="mt-1 max-w-[80%] truncate text-xs text-text-secondary">
                {scannedValue}
              </p>
              <Loader2 className="mt-3 h-5 w-5 animate-spin text-text-secondary" />
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/95 px-6 text-center">
              <AlertTriangle className="mb-3 h-8 w-8 text-amber-400" />
              <p className="text-sm text-amber-300">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-center text-xs text-text-secondary">
            Scan a FairShare group invite or profile QR code
          </p>
        </div>
      </div>
    </Modal>
  );
}