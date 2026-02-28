// components/ui/route-error-boundary.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface RouteErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  context?: string;
}

export function RouteErrorBoundary({
  error,
  reset,
  context = "this page",
}: RouteErrorBoundaryProps) {
  useEffect(() => {
    console.error(`[${context}] Error:`, error);
    // TODO: captureException(error);
  }, [error, context]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
        <p className="mt-2 text-sm text-gray-500">
          We encountered an error loading {context}. Please try again.
        </p>
        {isDev && (
          <details className="mt-4 rounded-xl bg-gray-50 p-3 text-left">
            <summary className="cursor-pointer text-xs font-medium text-gray-500">
              Debug Info (dev only)
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto text-xs text-red-600">
              {error.message}
            </pre>
          </details>
        )}
        <div className="mt-6 flex gap-3">
          <button
            onClick={reset}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}