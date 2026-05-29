"use client";

import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";

export default function OfflinePage() {
  const t = useTranslations("offline");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center bg-background">
      <WifiOff className="h-12 w-12 text-text-tertiary" />
      <h1 className="text-xl font-bold text-text-primary">{t("title")}</h1>
      <p className="text-sm text-text-secondary max-w-xs">
        {t("description")}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-primary hover:bg-surface-2 transition-colors"
      >
        {t("tryAgain")}
      </button>
    </div>
  );
}
