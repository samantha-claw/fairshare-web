// app/join/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { JoinGroupConfirmModal } from "@/components/modals/join-group-confirm-modal";
import { useRouter } from "next/navigation";

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupId = searchParams.get("id");

  if (!groupId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
          <h2 className="text-xl font-bold text-gray-900">Invalid Link</h2>
          <p className="mt-2 text-sm text-gray-500">
            This invite link is missing a group ID.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <JoinGroupConfirmModal
        isOpen={true}
        onClose={() => router.push("/dashboard")}
        groupId={groupId}
      />
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading…
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}