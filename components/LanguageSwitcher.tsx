"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";

const LOCALES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("languageSwitcher");

  const currentLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  const otherLocale = LOCALES.find((l) => l.code !== locale) ?? LOCALES[1];

  return (
    <Link
      href={pathname}
      locale={otherLocale.code}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
      title={t("switchTo", { language: otherLocale.label })}
      aria-label={t("switchTo", { language: otherLocale.label })}
    >
      <span className="text-sm">{otherLocale.flag}</span>
    </Link>
  );
}
