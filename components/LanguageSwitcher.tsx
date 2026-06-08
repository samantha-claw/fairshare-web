"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

const LOCALES = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
];

const localeColors: Record<string, string> = {
  en: "text-blue-500",
  ar: "text-emerald-500",
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const fullPathname = usePathname();
  const t = useTranslations("languageSwitcher");

  const currentLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  const otherLocale = LOCALES.find((l) => l.code !== locale) ?? LOCALES[1];
  const colorClass = localeColors[locale] ?? "text-text-secondary";

  const parts = fullPathname.split("/");
  parts[1] = otherLocale.code;
  const newPath = parts.join("/") || "/";

  return (
    <a
      href={newPath}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium ${colorClass} hover:bg-surface-2 transition-colors ${className ?? ""}`}
      title={t("switchTo", { language: otherLocale.label })}
      aria-label={t("switchTo", { language: otherLocale.label })}
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{currentLocale.label}</span>
    </a>
  );
}
