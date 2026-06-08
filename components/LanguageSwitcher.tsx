"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";

const LOCALES = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
];

const localeColors: Record<string, string> = {
  en: "text-blue-500",
  ar: "text-emerald-500",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("languageSwitcher");

  const otherLocale = LOCALES.find((l) => l.code !== locale) ?? LOCALES[1];
  const colorClass = localeColors[otherLocale.code] ?? "text-text-secondary";

  return (
    <Link
      href={pathname}
      locale={otherLocale.code}
      className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass} hover:bg-surface-2 transition-colors`}
      title={t("switchTo", { language: otherLocale.label })}
      aria-label={t("switchTo", { language: otherLocale.label })}
    >
      <Globe className="h-4 w-4" />
    </Link>
  );
}
