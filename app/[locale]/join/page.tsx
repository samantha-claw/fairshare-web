"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { JoinGroupConfirmModal } from "@/components/modals/join-group-confirm-modal";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";

function JoinGroupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("joinGroupConfirmModal");
  const [supabase] = useState(() => createClient());

  const groupId = searchParams.get("id") || searchParams.get("joinGroupId");
  const inviteToken = searchParams.get("token");

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        const nextQuery =
          groupId && inviteToken
            ? `/join?id=${encodeURIComponent(groupId)}&token=${encodeURIComponent(inviteToken)}`
            : "/dashboard/groups";
        router.replace(`/login?next=${encodeURIComponent(nextQuery)}`);
        return;
      }

      setIsAuthenticated(true);
      setCheckingAuth(false);
    }

    verifyAuth();

    return () => {
      cancelled = true;
    };
  }, [supabase, router, groupId, inviteToken]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
          </div>
          <p className="text-sm font-medium text-text-secondary">
            {t("verifyingLink")}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!groupId || !inviteToken) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <ShieldAlert className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-text-primary">
            {t("invalidLinkTitle")}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {t("invalidTokenError")}
          </p>
          <button
            onClick={() => router.push("/dashboard/groups")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 rtl-flip" />
            {t("close")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <JoinGroupConfirmModal
        isOpen={true}
        onClose={() => router.push("/dashboard/groups")}
        groupId={groupId}
        inviteToken={inviteToken}
      />
    </div>
  );
}

export default function JoinGroupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
        </div>
      }
    >
      <JoinGroupContent />
    </Suspense>
  );
}
