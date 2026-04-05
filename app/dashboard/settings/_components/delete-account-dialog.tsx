// File: app/dashboard/settings/_components/delete-account-dialog.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/providers/toast-provider";
import { Modal } from "@/components/ui/modal";
import {
  AlertTriangle,
  Trash2,
  Loader2,
  ShieldAlert,
  UserX,
  Users,
  Bell,
  Database,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────
interface DeleteAccountDialogProps {
  username: string;
}

// ── Component ───────────────────────────────────────────
export function DeleteAccountDialog({ username }: DeleteAccountDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const abortRef = useRef(false);

  // Reset state whenever dialog opens or closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmationText("");
      setIsDeleting(false);
    }
    abortRef.current = false;

    return () => {
      abortRef.current = true;
    };
  }, [isOpen]);

  const isConfirmed =
    confirmationText.trim().toLowerCase() === username.trim().toLowerCase();

  const handleDelete = useCallback(async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.rpc("delete_my_account");

      if (abortRef.current) return;

      if (error) {
        // Check for the specific debt-prevention error
        if (
          error.message?.includes("CANNOT_DELETE_HAS_DEBT") ||
          error.code === "P0001" // Postgres RAISE EXCEPTION code
        ) {
          toast.error(
            "Cannot delete account: You have outstanding debts. Please settle all balances first."
          );
        } else {
          toast.error(
            `Deletion failed: ${error.message || "Something went wrong. Please try again."}`
          );
        }
        setIsDeleting(false);
        return;
      }

      // Success — sign out and redirect
      toast.success(
        "Account deleted. Your profile has been anonymized and removed."
      );

      await supabase.auth.signOut();

      // Small delay so the toast is visible before redirect
      setTimeout(() => {
        if (!abortRef.current) {
          router.replace("/login");
        }
      }, 500);
    } catch (err) {
      if (abortRef.current) return;
      console.error("Account deletion error:", err);
      toast.error("Unexpected error. Please try again later.");
      setIsDeleting(false);
    }
  }, [isConfirmed, isDeleting, toast, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-100 hover:shadow active:scale-[0.98]"
      >
        <Trash2 className="h-4 w-4" />
        Delete Account
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (!isDeleting) setIsOpen(false);
        }}
        title="Delete account"
        maxWidth="lg"
        position="center"
      >
        <div className="p-6 sm:p-7">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <ShieldAlert className="h-7 w-7 text-red-600" />
          </div>
          <h2 className="text-center text-xl font-black text-text-primary">
            Delete your account?
          </h2>
          <div className="space-y-4 pt-2">
            <p className="text-center text-sm text-text-secondary">
              This action is{" "}
              <span className="font-bold text-red-600">permanent</span> and
              cannot be undone. Here is what will happen:
            </p>

            {/* What happens list */}
            <div className="space-y-2.5 rounded-xl border border-red-100 bg-red-50/50 p-4">
              <div className="flex items-start gap-3">
                <UserX className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="text-sm text-text-primary">
                  Your profile will be <span className="font-semibold">anonymized</span> to{" "}
                  <code className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-700">
                    [Deleted User]
                  </code>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="text-sm text-text-primary">
                  You will be <span className="font-semibold">removed from all groups</span>{" "}
                  (except ones you own)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Bell className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="text-sm text-text-primary">
                  All <span className="font-semibold">friendships and notifications</span> will be deleted
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="text-sm text-text-primary">
                  Expense records are preserved for group integrity but de-identified
                </p>
              </div>
            </div>

            {/* Warning callout */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <p className="text-xs text-amber-800">
                If you have outstanding debts, deletion will be blocked. Settle
                all balances first.
              </p>
            </div>

            {/* Confirmation input */}
            <div className="space-y-2 pt-1">
              <label
                htmlFor="delete-confirm-input"
                className="text-sm font-semibold text-text-primary"
              >
                Type{" "}
                <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs font-bold text-text-primary">
                  {username}
                </code>{" "}
                to confirm
              </label>
              <input
                id="delete-confirm-input"
                type="text"
                placeholder={username}
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                disabled={isDeleting}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 font-mono text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                aria-describedby="delete-confirm-hint"
              />
              <p id="delete-confirm-hint" className="text-xs text-text-secondary">
                This ensures you do not accidentally delete your account.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-2 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!isConfirmed || isDeleting}
              onClick={handleDelete}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Permanently Delete Account
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}