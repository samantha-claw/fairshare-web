"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  X,
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
  const [state, setState] = useState<ModalState>("loading");
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [animateIn, setAnimateIn] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  /*
   * ════════════════════════════════════════════════════
   * FETCH GROUP DETAILS
   *
   * Two paths:
   *
   * 1. WITH token → call secure RPC:
   *    get_group_preview_with_token(p_group_id, p_token)
   *    → Returns group details ONLY if token matches
   *    → Invalid token = rejection
   *
   * 2. WITHOUT token (legacy) → direct query:
   *    SELECT from groups WHERE id = groupId
   *    → Less secure, but backwards compatible
   * ════════════════════════════════════════════════════
   */
  useEffect(() => {
    if (!isOpen || !groupId) return;

    setAnimateIn(true);
    setState("loading");
    setErrorMsg("");

    async function fetchGroup() {
      try {
        // 1. Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setErrorMsg("Please sign in to join a group.");
          setState("error");
          return;
        }

        // 2. Check if already a member (fast-path)
        const { data: existing } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", groupId)
          .eq("user_id", user.id)
          .maybeSingle();

        let groupData: any = null;

        // 3. Fetch group details via secure or legacy path
        if (token) {
          // ── SECURE PATH: Validate token via RPC ──
          const { data: rpcResult, error: rpcError } = await supabase.rpc(
            "get_group_preview_with_token",
            {
              p_group_id: groupId,
              p_token: token,
            }
          );

          if (rpcError) {
            console.error("Token validation RPC error:", rpcError);

            // Check if the error is specifically about an invalid token
            if (
              rpcError.message.includes("Invalid") ||
              rpcError.message.includes("token") ||
              rpcError.message.includes("expired")
            ) {
              setState("invalid_token");
              setErrorMsg(
                "This invite link is invalid or has been reset by the group owner. Please ask for a new link."
              );
              return;
            }

            setErrorMsg(rpcError.message || "Unable to verify invite link.");
            setState("error");
            return;
          }

          if (!rpcResult) {
            setState("invalid_token");
            setErrorMsg(
              "This invite link is no longer valid. The group owner may have reset it."
            );
            return;
          }

          // RPC returns group details (adapt to your RPC return shape)
          groupData =
            typeof rpcResult === "object" && !Array.isArray(rpcResult)
              ? rpcResult
              : Array.isArray(rpcResult) && rpcResult.length > 0
                ? rpcResult[0]
                : null;

          if (!groupData) {
            setState("invalid_token");
            setErrorMsg("Invalid invite token.");
            return;
          }
        } else {
          // ── LEGACY PATH: Direct query (no token) ──
          const { data: group, error: groupErr } = await supabase
            .from("groups")
            .select("id, name, currency, owner_id")
            .eq("id", groupId)
            .single();

          if (groupErr || !group) {
            setErrorMsg("Group not found. The invite link may be expired.");
            setState("error");
            return;
          }

          groupData = group;
        }

        // 4. If already a member, show that state
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

        // 5. Get member count
        const { count } = await supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", groupId);

        // 6. Get owner name
        const ownerId = groupData.owner_id;
        let ownerName = "Unknown";

        if (ownerId) {
          const { data: ownerProfile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", ownerId)
            .single();

          ownerName = ownerProfile?.display_name || "Unknown";
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
        setErrorMsg("Something went wrong. Please try again.");
        setState("error");
      }
    }

    fetchGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, groupId, token]);

  // ── Join group ──


const handleJoin = useCallback(async () => {
  setState("joining");

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("Authentication required.");
      setState("error");
      return;
    }

    if (token) {
      // Secure path: use RPC with token validation
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
      // No token: reject — all invite links should have tokens
      setState("error");
      setErrorMsg("This invite link is missing a security token. Please ask the group owner for a new link.");
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
    setErrorMsg(err.message || "Failed to join the group.");
  }
}, [supabase, groupId, token, router, onClose]);
  // ── Go to group ──
  const handleGoToGroup = useCallback(() => {
    onClose();
    router.push(`/dashboard/groups/${groupId}`);
  }, [onClose, router, groupId]);

  // ── Escape ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state !== "joining") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose, state]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          animateIn ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => state !== "joining" && onClose()}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-sm transform transition-all duration-300 ${
          animateIn
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
      >
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
          {/* ── Loading ── */}
          {state === "loading" && (
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-sm text-gray-500">
                {token
                  ? "Verifying invite link…"
                  : "Loading group details…"}
              </p>
            </div>
          )}

          {/* ── Ready ── */}
          {state === "ready" && groupInfo && (
            <div className="px-6 py-8">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                  <Users className="h-8 w-8 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Join Group?
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  You&apos;ve been invited to join
                </p>
              </div>

              {/* Group Info */}
              <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {groupInfo.name}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {groupInfo.memberCount} member
                    {groupInfo.memberCount !== 1 && "s"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    {groupInfo.currency}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Created by {groupInfo.ownerName}
                </p>

                {/* Security badge */}
                {token && (
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[11px] font-medium text-emerald-700">
                      Verified invite link
                    </span>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoin}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:scale-[0.98]"
                >
                  <LogIn className="h-4 w-4" />
                  Join Group
                </button>
              </div>
            </div>
          )}

          {/* ── Joining ── */}
          {state === "joining" && (
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-sm font-medium text-gray-700">
                Joining group…
              </p>
            </div>
          )}

          {/* ── Success ── */}
          {state === "success" && (
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                You&apos;re in!
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Redirecting to the group…
              </p>
            </div>
          )}

          {/* ── Already Member ── */}
          {state === "already_member" && groupInfo && (
            <div className="px-6 py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Already a Member
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You&apos;re already in{" "}
                <strong>{groupInfo.name}</strong>
              </p>
              <button
                onClick={handleGoToGroup}
                className="mt-5 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Go to Group
              </button>
            </div>
          )}

          {/* ── Invalid Token ── */}
          {state === "invalid_token" && (
            <div className="px-6 py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                <ShieldAlert className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Invalid Invite Link
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
                {errorMsg}
              </p>
              <button
                onClick={onClose}
                className="mt-5 w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          )}

          {/* ── Error ── */}
          {state === "error" && (
            <div className="px-6 py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Unable to Join
              </h3>
              <p className="mt-2 text-sm text-gray-500">{errorMsg}</p>
              <button
                onClick={onClose}
                className="mt-5 w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}