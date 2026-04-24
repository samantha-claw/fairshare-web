"use client";

import { useEffect, useRef, type ReactNode } from "react";
import FocusTrap from "focus-trap-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  maxWidth?: "sm" | "md" | "lg";
  position?: "bottom" | "center";
}

const MAX_WIDTH_MAP = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  maxWidth = "md",
  position = "bottom",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store previous focus and trap focus inside modal
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Choose position classes based on the `position` prop.
  const positionClass =
    position === "center"
      ? "items-center" // Centered modals
      : "items-end sm:items-center"; // Bottom on mobile, centered on sm+ screens

  return (
    <div
      className={`fixed inset-0 z-[100] flex justify-center p-0 sm:p-4 ${positionClass}`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      <FocusTrap
        focusTrapOptions={{
          // Let inner controls keep their own autofocus behavior when present.
          initialFocus: false,
          fallbackFocus: () => dialogRef.current as HTMLElement,
        }}
      >
        {/* Dialog */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className={`relative w-full ${MAX_WIDTH_MAP[maxWidth]} transform rounded-t-2xl sm:rounded-2xl bg-surface text-left shadow-2xl outline-none sm:my-8 max-h-[100dvh] sm:max-h-[90vh]`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {children}
        </div>
      </FocusTrap>
    </div>
  );
}
