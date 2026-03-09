// app/dashboard/groups/[id]/error.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GroupErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error("Group page error:", error);
    // TODO: Send to Sentry/LogRocket
    // captureException(error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
        <p className="mt-2 text-sm text-gray-500">
          We encountered an error loading this group. Please try again.
        </p>

                {/* شيلنا شرط الـ isDev عشان نعرض الخطأ في كل الحالات مؤقتاً */}
        <details className="mt-4 w-full rounded-xl bg-red-50 p-3 text-left border border-red-100">
          <summary className="cursor-pointer text-sm font-bold text-red-700">
            🚨 Show Detailed Error (Debug)
          </summary>
          <div className="mt-2 text-xs text-red-800">
            <p className="font-bold border-b border-red-200 pb-1 mb-2">Error Message:</p>
            <p className="whitespace-pre-wrap font-mono mb-4">{error.message}</p>
            
            {error.stack && (
              <>
                <p className="font-bold border-b border-red-200 pb-1 mb-2">Stack Trace (Where it happened):</p>
                <pre className="max-h-60 overflow-auto whitespace-pre-wrap font-mono bg-white p-2 rounded border border-red-100">
                  {error.stack}
                </pre>
              </>
            )}

            {error.digest && (
              <p className="mt-4 font-mono text-gray-500 border-t border-red-200 pt-2">
                Digest: {error.digest}
              </p>
            )}
  </div>
</details>

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