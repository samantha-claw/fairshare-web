"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { ToastContainer } from "@/components/ui/toast-container";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/* ── Types ──────────────────────────────────────────── */
interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ConfirmOptions {
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmState extends ConfirmOptions {
  message: string;
  resolve: (value: boolean) => void;
}

export interface ToastActions {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
  dismiss: (id: string) => void;
  confirm: (
    message: string,
    options?: ConfirmOptions
  ) => Promise<boolean>;
}

/* ── Context ────────────────────────────────────────── */
const ToastContext = createContext<ToastActions | null>(null);

/* ── Provider ───────────────────────────────────────── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmation, setConfirmation] = useState<ConfirmState | null>(
    null
  );
  const confirmRef = useRef<ConfirmState | null>(null);

  /* — toast actions (stable, never recreated) — */
  const addToast = useCallback(
    (type: Toast["type"], message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* — confirm (promise-based, non-blocking) — */
  const confirmFn = useCallback(
    (
      message: string,
      options?: ConfirmOptions
    ): Promise<boolean> =>
      new Promise((resolve) => {
        // reject any already-open dialog
        if (confirmRef.current) confirmRef.current.resolve(false);

        const state: ConfirmState = { message, ...options, resolve };
        confirmRef.current = state;
        setConfirmation(state);
      }),
    []
  );

  const handleConfirm = useCallback(() => {
    confirmRef.current?.resolve(true);
    confirmRef.current = null;
    setConfirmation(null);
  }, []);

  const handleCancel = useCallback(() => {
    confirmRef.current?.resolve(false);
    confirmRef.current = null;
    setConfirmation(null);
  }, []);

  /* — stable context value — */
  const actions = useMemo<ToastActions>(
    () => ({
      success: (msg) => addToast("success", msg),
      error: (msg) => addToast("error", msg),
      info: (msg) => addToast("info", msg),
      dismiss,
      confirm: confirmFn,
    }),
    [addToast, dismiss, confirmFn]
  );

  return (
    <ToastContext.Provider value={actions}>
      {children}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {confirmation && (
        <ConfirmDialog
          message={confirmation.message}
          confirmLabel={confirmation.confirmLabel}
          cancelLabel={confirmation.cancelLabel}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ToastContext.Provider>
  );
}

/* ── Hook ───────────────────────────────────────────── */
export function useToast(): ToastActions {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}