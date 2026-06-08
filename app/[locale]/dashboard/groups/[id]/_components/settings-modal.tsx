"use client";

import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";
import type { Group, Member } from "@/types/group";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  members: Member[];
  isOwner: boolean;
  canLeave: boolean;
  myNetBalance: number;
  deleteConfirmText: string;
  onDeleteConfirmTextChange: (text: string) => void;
  deletingGroup: boolean;
  leavingGroup: boolean;
  onDeleteGroup: () => void;
  onLeaveGroup: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  group,
  members,
  isOwner,
  canLeave,
  myNetBalance,
  deleteConfirmText,
  onDeleteConfirmTextChange,
  deletingGroup,
  leavingGroup,
  onDeleteGroup,
  onLeaveGroup,
}: SettingsModalProps) {
  const t = useTranslations("groupSettings");
  const tGroups = useTranslations("groups");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const handleClose = () => {
    onDeleteConfirmTextChange("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("modalTitle")}>
      {/* ── Header ── */}
      <div className="border-b border-border px-6 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">{t("modalTitle")}</h3>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-text-tertiary hover:bg-surface-2 hover:text-text-secondary"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-6 py-6">
        {/* Group Info */}
        <div className="mb-6 rounded-lg border border-border bg-surface-2 p-4">
          <p className="text-sm text-text-secondary">{tGroups("groupNameLabel")}</p>
          <p className="text-lg font-semibold text-text-primary">{group.name}</p>
          <p className="mt-1 text-xs text-text-tertiary">
            {t("createdInfo", {
              date: new Date(group.created_at).toLocaleDateString(locale),
              members: members.length,
            })}
          </p>
        </div>

        {isOwner ? (
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <svg
                className="h-5 w-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <h4 className="text-sm font-bold text-red-800">{t("dangerZone")}</h4>
            </div>
            <p className="mb-4 text-xs text-red-700">
              {t("deleteWarning")}
            </p>
            <label className="mb-2 block text-xs font-medium text-red-700">
              {t("typeToConfirm", { name: group.name })}
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => onDeleteConfirmTextChange(e.target.value)}
              placeholder={group.name}
              className="mb-3 w-full rounded-lg border border-red-300 bg-surface p-2.5 text-sm text-red-900 placeholder-red-300 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <button
              onClick={onDeleteGroup}
              disabled={deletingGroup || deleteConfirmText !== group.name}
              className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deletingGroup ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4" /> {t("deleting")}
                </span>
              ) : (
                t("deletePermanently")
              )}
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface-2/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <svg
                className="h-5 w-5 text-text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
              <h4 className="text-sm font-bold text-text-primary">{t("leaveGroup")}</h4>
            </div>

            {!canLeave ? (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                <p className="text-xs text-amber-800">
                  {t("settleFirst")}{" "}
                  {myNetBalance > 0
                    ? t("settleFirstOwed", { amount: formatCurrency(myNetBalance, group.currency, locale) })
                    : t("settleFirstOwe", { amount: formatCurrency(Math.abs(myNetBalance), group.currency, locale) })}
                </p>
              </div>
            ) : (
              <p className="mb-4 text-xs text-text-secondary">
                {t("canLeave")}
              </p>
            )}

            <button
              onClick={onLeaveGroup}
              disabled={leavingGroup || !canLeave}
              className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              title={!canLeave ? t("settleFirstTitle") : undefined}
            >
              {leavingGroup ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4" /> {t("leaving")}
                </span>
              ) : (
                t("leaveGroup")
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-border bg-surface-2 px-6 py-3">
        <button
          onClick={handleClose}
          className="w-full rounded-lg py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          {tCommon("close")}
        </button>
      </div>
    </Modal>
  );
}
