// app/dashboard/profile/error.tsx
"use client";
import { RouteErrorBoundary } from "@/components/ui/route-error-boundary";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary error={error} reset={reset} context="profile" />;
}