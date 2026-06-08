"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface RouteErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  context?: string;
}

export function RouteErrorBoundary({
  error,
  reset,
  context = "page",
}: RouteErrorBoundaryProps) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(`[${context}] Error:`, error);
  }, [error, context]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-surface p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">{t("somethingWentWrong")}</h2>
        <p className="mt-2 text-sm text-text-secondary">
          {t("errorLoading", { context: t(`context_${context}`) })}
        </p>

        {/* 🚨 شاشة كشف التفاصيل (Debugger) 🚨 */}
        <details className="mt-4 w-full rounded-xl bg-red-50 p-4 text-left border border-red-200" open>
          <summary className="cursor-pointer text-sm font-bold text-red-700 outline-none">
            🚨 {t("errorDetails")}
          </summary>
          <div className="mt-3 text-xs text-red-900">
            <p className="font-bold border-b border-red-200 pb-1 mb-2">{t("message")}</p>
            <p className="whitespace-pre-wrap font-mono mb-4 text-sm font-semibold">{error.message}</p>

            {error.stack && (
              <>
                <p className="font-bold border-b border-red-200 pb-1 mb-2">{t("stackTrace")}</p>
                <pre className="max-h-60 overflow-auto whitespace-pre-wrap font-mono bg-surface p-3 rounded border border-red-100">
                  {error.stack}
                </pre>
              </>
            )}

            {error.digest && (
              <p className="mt-4 font-mono text-text-secondary border-t border-red-200 pt-2">
                {t("digest")} {error.digest}
              </p>
            )}
          </div>
        </details>

        <div className="mt-6 flex gap-3">
          <button
            onClick={reset}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-text-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <RotateCcw className="h-4 w-4" />
            {t("tryAgain")}
          </button>
          <Link
            href="/dashboard"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-2"
          >
            <Home className="h-4 w-4" />
            {t("dashboard")}
          </Link>
        </div>
      </div>
    </div>
  );
}
