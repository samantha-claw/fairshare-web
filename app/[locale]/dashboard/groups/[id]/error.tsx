// app/dashboard/groups/[id]/error.tsx
"use client";

import { RouteErrorBoundary } from "@/components/ui/route-error-boundary";

export default function GroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {

  return <RouteErrorBoundary error={error} reset={reset} context="this group" />;
}
