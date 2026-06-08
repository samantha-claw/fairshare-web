"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import {
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Globe,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

// ==========================================
// 🧩 TYPES
// ==========================================
interface JoinGroupConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  token?: string | null;
}

interface GroupInfo {
  id: string;
  name: string;
  currency: string;
  memberCount: number;
  ownerName: string;
}

type ModalState =
  | "loading"
  | "ready"
  | "joining"
  | "success"
  | "already_member"
  | "invalid_token"
  | "error";

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function JoinGroupConfirmModal({
  isOpen,
  onClose,
  groupId,
  token = null,
}: JoinGroupConfirmModalProps) {
  const t = useTranslations("joinGroupConfirmModal");
  const [state, setState] = useState<ModalState>("loading");
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();
  const supabase = createClient();

  // ── Fetch group details on open ──────────────────────
  useEffect(() => {
    if (!isOpen || !groupId) return;

    setState("loading");
    setErrorMsg("");

    async function fetchGroup() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setErrorMsg(t("signInRequired"));
          setState("error");
          return;
        }

        // Check if already a member
        const { data: existing } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", groupId)
          .eq("user_id", user.id)
          .maybeSingle();

        let groupData: any = null;

        if (token) {
          // SECURE PATH: Validate token via RPC
          const { data: rpcResult, error: rpcError } = await supabase.rpc(
            "get_group_preview_with_token",
            { p_group_id: groupId, p_token: token }
          );

          if (rpcError) {
            console.error("Token validation RPC error:", rpcError);
            if (
              rpcError.message.includes("Invalid") ||
              rpcError.message.includes("token") ||
              rpcError.message.includes("expired")
            ) {
              setState("invalid_token");
              setErrorMsg(t("invalidTokenMsg"));
              return;
            }
            setErrorMsg(rpcError.message || t("somethingWrong"));
            setState("error");
            return;
          }

          if (!rpcResult) {
            setState("invalid_token");
            setErrorMsg(t("invalidTokenMsg"));
            return;
          }

          groupData =
            typeof rpcResult === "object" && !Array.isArray(rpcResult)
              ? rpcResult
              : Array.isArray(rpcResult) && rpcResult.length > 0
                ? rpcResult[0]
                : null;

          if (!groupData) {
            setState("invalid_token");
            setErrorMsg(t("invalidTokenMsg"));
            return;
          }
        } else {
          // LEGACY PATH: Direct query
          const { data: group, error: groupErr } = await supabase
            .from("groups")
            .select("id, name, currency, owner_id")
            .eq("id", groupId)
            .single();

          if (groupErr || !group) {
            setErrorMsg(t("groupNotFound"));
            setState("error");
            return;
          }
          groupData = group;
        }

        // Already a member
        if (existing) {
          setState("already_member");
          setGroupInfo({
            id: groupData.id,
            name: groupData.name,
            currency: groupData.currency || "USD",
            memberCount: 0,
            ownerName: "",
          });
          return;
        }

        // Member count
        const { count } = await supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", groupId);

        // Owner name
        const ownerId = groupData.owner_id;
        let ownerName = t("unknownOwner");
        if (ownerId) {
          const { data: ownerProfile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", ownerId)
            .single();
          ownerName = ownerProfile?.display_name || t("unknownOwner");
        }

        setGroupInfo({
          id: groupData.id,
          name: groupData.name,
          currency: groupData.currency || "USD",
          memberCount: count || 0,
          ownerName,
        });
        setState("ready");
      } catch (err) {
        console.error("Fetch group error:", err);
        setErrorMsg(t("somethingWrong"));
        setState("error");
      }
    }

    fetchGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, groupId, token]);

  // ── Join group ───────────────────────────────────────
  const handleJoin = useCallback(async () => {
    setState("joining");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMsg(t("authRequired"));
        setState("error");
        return;
      }

      if (token) {
        const { error } = await supabase.rpc("join_group_securely", {
          p_group_id: groupId,
          p_token: token,
        });
        if (error) {
          if (error.message.includes("already a member")) {
            setState("already_member");
            return;
          }
          throw new Error(error.message);
        }
      } else {
        setState("error");
        setErrorMsg(t("missingToken"));
        return;
      }

      setState("success");
      setTimeout(() => {
        onClose();
        router.push(`/dashboard/groups/${groupId}`);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error("Join error:", err);
      setState("error");
      setErrorMsg(err.message || t("failedToJoin"));
    }
  }, [supabase, groupId, token, router, onClose]);

  // ── Go to group ──────────────────────────────────────
  const handleGoToGroup = useCallback(() => {
    onClose();
    router.push(`/dashboard/groups/${groupId}`);
  }, [onClose, router, groupId]);

  // ── Prevent closing while joining ────────────────────
  const handleClose = useCallback(() => {
    if (state === "joining") return;
    onClose();
  }, [state, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("title")} maxWidth="sm">
      {/* ── Loading ── */}
      {state === "loading" && (
        <div className="flex flex-col items-center justify-center px-6 py-16">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-text-primary" />
          <p className="text-sm text-text-secondary">
            {token ? t("verifyingToken") : t("loadingDetails")}
          </p>
        </div>
      )}

      {/* ── Ready ── */}
      {state === "ready" && groupInfo && (
        <div className="px-6 py-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
              <Users className="h-8 w-8 text-text-primary" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">{t("joinGroupTitle")}</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {t("invitedToJoin")}
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-surface-2 p-4">
            <h3 className="text-lg font-bold text-text-primary">
              {groupInfo.name}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {t("members", { count: groupInfo.memberCount })}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {groupInfo.currency}
              </span>
            </div>
            <p className="mt-2 text-xs text-text-tertiary">
              {t("createdBy", { name: groupInfo.ownerName })}
            </p>

            {token && (
              <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-[11px] font-medium text-emerald-700">
                  {t("verifiedInvite")}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-2"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleJoin}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:scale-[0.98]"
            >
              <LogIn className="h-4 w-4" />
              {t("joinGroup")}
            </button>
          </div>
        </div>
      )}

      {/* ── Joining ── */}
      {state === "joining" && (
        <div className="flex flex-col items-center justify-center px-6 py-16">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-text-primary" />
          <p className="text-sm font-medium text-text-primary">{t("joiningGroup")}</p>
        </div>
      )}

      {/* ── Success ── */}
      {state === "success" && (
        <div className="flex flex-col items-center justify-center px-6 py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">{t("successTitle")}</h3>
          <p className="mt-1 text-sm text-text-secondary">
            {t("redirecting")}
          </p>
        </div>
      )}

      {/* ── Already Member ── */}
      {state === "already_member" && groupInfo && (
        <div className="px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Users className="h-8 w-8 text-text-primary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">
            {t("alreadyMember")}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {t("alreadyInGroup", { name: groupInfo.name })}
          </p>
          <button
            onClick={handleGoToGroup}
            className="mt-5 w-full rounded-xl bg-text-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            {t("goToGroup")}
          </button>
        </div>
      )}

      {/* ── Invalid Token ── */}
      {state === "invalid_token" && (
        <div className="px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <ShieldAlert className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">
            {t("invalidInvite")}
          </h3>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-text-secondary">
            {errorMsg}
          </p>
          <button
            onClick={handleClose}
            className="mt-5 w-full rounded-xl bg-surface-2 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-gray-200"
          >
            {t("close")}
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {state === "error" && (
        <div className="px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">{t("unableToJoin")}</h3>
          <p className="mt-2 text-sm text-text-secondary">{errorMsg}</p>
          <button
            onClick={handleClose}
            className="mt-5 w-full rounded-xl bg-surface-2 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-gray-200"
          >
            {t("close")}
          </button>
        </div>
      )}
    </Modal>
  );
}
