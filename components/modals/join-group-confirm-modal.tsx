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
} from "lucide-react";

// ==========================================
// 🧩 TYPES
// ==========================================
interface JoinGroupConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
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
  | "error";

// ==========================================
// 🎨 UI RENDER
// ==========================================
export function JoinGroupConfirmModal({
  isOpen,
  onClose,
  groupId,
}: JoinGroupConfirmModalProps) {
  const [state, setState] = useState<ModalState>("loading");
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [animateIn, setAnimateIn] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // ── Fetch group details ──
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

        // 2. Get group details
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

        // 3. Check if already a member
        const { data: existing } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", groupId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          setState("already_member");
          setGroupInfo({
            id: group.id,
            name: group.name,
            currency: group.currency || "USD",
            memberCount: 0,
            ownerName: "",
          });
          return;
        }

        // 4. Get member count
        const { count } = await supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", groupId);

        // 5. Get owner name
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", group.owner_id)
          .single();

        setGroupInfo({
          id: group.id,
          name: group.name,
          currency: group.currency || "USD",
          memberCount: count || 0,
          ownerName: ownerProfile?.display_name || "Unknown",
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
  }, [isOpen, groupId]);

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

      const { error: insertErr } = await supabase
        .from("group_members")
        .insert({
          group_id: groupId,
          user_id: user.id,
        });

      if (insertErr) {
        if (insertErr.code === "23505") {
          // Unique violation — already a member
          setState("already_member");
          return;
        }
        console.error("Join group error:", insertErr);
        setErrorMsg(`Failed to join: ${insertErr.message}`);
        setState("error");
        return;
      }

      setState("success");

      setTimeout(() => {
        onClose();
        router.push(`/dashboard/groups/${groupId}`);
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error("Join error:", err);
      setErrorMsg("Something went wrong.");
      setState("error");
    }
  }, [supabase, groupId, router, onClose]);

  // ── Go to group (already member) ──
  const handleGoToGroup = useCallback(() => {
    onClose();
    router.push(`/dashboard/groups/${groupId}`);
  }, [onClose, router, groupId]);

  // ── Close on Escape ──
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
      {/* ── Backdrop ── */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          animateIn ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => state !== "joining" && onClose()}
      />

      {/* ── Modal ── */}
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
              <p className="text-sm text-gray-500">Loading group details…</p>
            </div>
          )}

          {/* ── Ready (confirm join) ── */}
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

              {/* Group Info Card */}
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

          {/* ── Already a Member ── */}
          {state === "already_member" && groupInfo && (
            <div className="px-6 py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Already a Member
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You&apos;re already in <strong>{groupInfo.name}</strong>
              </p>
              <button
                onClick={handleGoToGroup}
                className="mt-5 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Go to Group
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