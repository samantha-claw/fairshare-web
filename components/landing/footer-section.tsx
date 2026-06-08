"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Wallet } from "lucide-react";

export function FooterSection() {
  const t = useTranslations("landing.footer");

  const links = [
    { title: t("features"), href: "#features" },
    { title: t("howItWorks"), href: "#how-it-works" },
    { title: t("faq"), href: "#faq" },
    { title: t("privacy"), href: "/privacy" },
    { title: t("terms"), href: "/terms" },
  ];

  // Social media links - placeholders for user to fill in
  const socialLinks = [
    { name: "Twitter", href: "#" },
    { name: "Discord", href: "#" },
    { name: "GitHub", href: "#" },
  ];

  return (
    <footer className="border-t border-border bg-surface py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Top section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-text-primary">
              <Wallet className="h-4 w-4 text-surface" />
            </div>
            <span className="text-lg font-semibold text-text-primary">
              FairShare
            </span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6">
            {links.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                {link.title}
              </Link>
            ))}
          </nav>
        </div>

        {/* Social links - placeholder section */}
        <div className="mt-8 flex justify-center gap-6">
          {socialLinks.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-tertiary hover:text-text-primary transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-border" />

        {/* Bottom section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-tertiary">
          <p>
            &copy; {new Date().getFullYear()} {t("copyright")}
          </p>
          <p className="text-xs">
            {t("madeWith")}
          </p>
        </div>
      </div>
    </footer>
  );
}
