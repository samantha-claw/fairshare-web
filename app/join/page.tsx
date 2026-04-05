"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Globe,
  LogIn,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";

// ==========================================
// 🧩 TYPES
// ==========================================
interface GroupInfo {
  id: string;
  name: string;
  currency: string;
  memberCount: number;
  ownerName: string;
}

type PageState =
  | "loading"
  | "auth_required"
  | "ready"
  | "joining"
  | "success"
  | "already_member"
  | "invalid_token"
  | "error";

// ==========================================
// ⚙️ JOIN LOGIC (separated for Suspense)
// ==========================================
function JoinGroupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const groupId = searchParams.get("id");
  const token = searchParams.get("token");

  const [state, setState] = useState<PageState>("loading");
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ── Fetch group info and validate ──
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      // 1. Validate URL params
      if (!groupId) {
        if (mounted) {
          setState("error");
          setErrorMsg("Invalid invite link. No group ID found.");
        }
        return;
      }

      // 2. Check authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!user || authError) {
        if (mounted) {
          setState("auth_required");
        }
        return;
      }

      if (mounted) setCurrentUserId(user.id);

      // 3. Check if already a member
      const { data: existing } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .maybeSingle();

      // 4. Fetch group details
      let groupData: any = null;

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
          if (
            rpcError.message.includes("Invalid") ||
            rpcError.message.includes("token") ||
            rpcError.message.includes("expired")
          ) {
            if (mounted) {
              setState("invalid_token");
              setErrorMsg(
                "This invite link is invalid or has been reset by the group owner. Please ask for a new link."
              );
            }
            return;
          }

          if (mounted) {
            setState("error");
            setErrorMsg(rpcError.message || "Unable to verify invite link.");
          }
          return;
        }

        if (!rpcResult) {
          if (mounted) {
            setState("invalid_token");
            setErrorMsg(
              "This invite link is no longer valid. The group owner may have reset it."
            );
          }
          return;
        }

        groupData =
          typeof rpcResult === "object" && !Array.isArray(rpcResult)
            ? rpcResult
            : Array.isArray(rpcResult) && rpcResult.length > 0
              ? rpcResult[0]
              : null;
      } else {
        // ── LEGACY PATH: Direct query ──
        const { data: group, error: groupErr } = await supabase
          .from("groups")
          .select("id, name, currency, owner_id")
          .eq("id", groupId)
          .single();

        if (groupErr || !group) {
          if (mounted) {
            setState("error");
            setErrorMsg("Group not found. The invite link may be invalid.");
          }
          return;
        }

        groupData = group;
      }

      if (!groupData) {
        if (mounted) {
          setState("error");
          setErrorMsg("Could not load group details.");
        }
        return;
      }

      // 5. Get member count
      const { count } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", groupId);

      // 6. Get owner name
      let ownerName = "Unknown";
      if (groupData.owner_id) {
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", groupData.owner_id)
          .single();
        ownerName = ownerProfile?.display_name || "Unknown";
      }

      const info: GroupInfo = {
        id: groupData.id,
        name: groupData.name,
        currency: groupData.currency || "USD",
        memberCount: count || 0,
        ownerName,
      };

      if (mounted) {
        setGroupInfo(info);

        if (existing) {
          setState("already_member");
        } else {
          setState("ready");
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [groupId, token, supabase]);

  // ── Redirect to login with return URL ──
  const handleLoginRedirect = useCallback(() => {
    const returnUrl = `/join?id=${groupId}${token ? `&token=${token}` : ""}`;
    router.push(`/login?next=${encodeURIComponent(returnUrl)}`);
  }, [groupId, token, router]);

  // ── Join group ──
  // app/join/page.tsx
// FIND the handleJoin function and REPLACE the body:

const handleJoin = useCallback(async () => {
  if (!currentUserId || !groupId) return;

  setState("joining");

  try {
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
      setErrorMsg("This invite link is missing a security token. Please ask the group owner for a new link.");
      return;
    }

    setState("success");
    setTimeout(() => {
      router.push(`/dashboard/groups/${groupId}`);
    }, 1500);
  } catch (err: any) {
    console.error("Join error:", err);
    setState("error");
    setErrorMsg(err.message || "Failed to join the group.");
  }
}, [currentUserId, groupId, token, supabase, router]);
  // ── Go to group (already member) ──
  const handleGoToGroup = useCallback(() => {
    router.push(`/dashboard/groups/${groupId}`);
  }, [router, groupId]);

  // ── Render ──
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4">
      <div className="w-full max-w-sm">
        {/* ── Loading ── */}
        {state === "loading" && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface px-6 py-16 shadow-xl">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-text-primary" />
            <h2 className="text-lg font-bold text-text-primary">
              {token ? "Verifying Invite Link…" : "Loading Group…"}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Please wait a moment
            </p>
          </div>
        )}

        {/* ── Auth Required ── */}
        {state === "auth_required" && (
          <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-xl">
            <div className="bg-gradient-to-br bg-text-primary px-6 py-8 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface/20 backdrop-blur-sm">
                <LogIn className="h-7 w-7 text-surface" />
              </div>
              <h2 className="text-xl font-bold text-surface">
                Sign In Required
              </h2>
              <p className="mt-1 text-sm text-surface/70">
                You need to sign in before joining this group
              </p>
            </div>
            <div className="px-6 py-6">
              <button
                onClick={handleLoginRedirect}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r bg-text-primary py-3.5 text-sm font-bold text-surface shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:scale-[0.98]"
              >
                <LogIn className="h-4 w-4" />
                Sign In to Continue
              </button>
              <button
                onClick={() => router.push("/")}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl py-3 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Go Home
              </button>
            </div>
          </div>
        )}

        {/* ── Ready to Join ── */}
        {state === "ready" && groupInfo && (
          <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-xl">
            <div className="bg-gradient-to-br bg-text-primary px-6 py-8 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface/20 backdrop-blur-sm">
                <Users className="h-7 w-7 text-surface" />
              </div>
              <h2 className="text-xl font-bold text-surface">
                You&apos;re Invited!
              </h2>
              <p className="mt-1 text-sm text-surface/70">
                Join this group to start sharing expenses
              </p>
            </div>

            <div className="px-6 py-6">
              {/* Group Info Card */}
              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <h3 className="text-lg font-bold text-text-primary">
                  {groupInfo.name}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
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
                <p className="mt-2 text-xs text-text-tertiary">
                  Created by {groupInfo.ownerName}
                </p>

                {token && (
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[11px] font-medium text-emerald-700">
                      Verified invite link
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoin}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r bg-text-primary py-3 text-sm font-bold text-surface shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:scale-[0.98]"
                >
                  <LogIn className="h-4 w-4" />
                  Join Group
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Joining ── */}
        {state === "joining" && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface px-6 py-16 shadow-xl">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-text-primary" />
            <h2 className="text-lg font-bold text-text-primary">
              Joining Group…
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Please wait a moment
            </p>
          </div>
        )}

        {/* ── Success ── */}
        {state === "success" && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface px-6 py-16 shadow-xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">
              Welcome Aboard! 🎉
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Redirecting to the group…
            </p>
          </div>
        )}

        {/* ── Already a Member ── */}
        {state === "already_member" && (
          <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-xl">
            <div className="px-6 py-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <Users className="h-8 w-8 text-text-primary" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">
                Already a Member
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                You&apos;re already in{" "}
                {groupInfo ? (
                  <strong>{groupInfo.name}</strong>
                ) : (
                  "this group"
                )}
              </p>
              <button
                onClick={handleGoToGroup}
                className="mt-5 w-full rounded-xl bg-text-primary py-3 text-sm font-bold text-surface transition-colors hover:bg-indigo-700"
              >
                Go to Group
              </button>
            </div>
          </div>
        )}

        {/* ── Invalid Token ── */}
        {state === "invalid_token" && (
          <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-xl">
            <div className="px-6 py-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                <ShieldAlert className="h-8 w-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">
                Invalid Invite Link
              </h2>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-text-secondary">
                {errorMsg}
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="mt-5 w-full rounded-xl bg-surface-2 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-gray-200"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {state === "error" && (
          <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-xl">
            <div className="px-6 py-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">
                Unable to Join
              </h2>
              <p className="mt-2 text-sm text-text-secondary">{errorMsg}</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="mt-5 w-full rounded-xl bg-surface-2 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-gray-200"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 🎨 PAGE EXPORT (with Suspense boundary)
// ==========================================
export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
          <Loader2 className="h-8 w-8 animate-spin text-text-primary" />
        </div>
      }
    >
      <JoinGroupContent />
    </Suspense>
  );
}