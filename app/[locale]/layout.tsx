import type { Metadata } from "next";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  return {
    title: locale === "ar" ? "فير شير" : "FairShare",
    description: locale === "ar" ? "أداة بسيطة لتقسيم المصروفات مع الأصدقاء" : "Financial collaboration made simple",
    manifest: "/manifest.json",
    icons: {
      apple: "/apple-icon.png",
    },
  };
}

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
