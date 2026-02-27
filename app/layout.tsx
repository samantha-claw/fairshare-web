// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

// 1. إعدادات الـ Metadata (الاسم، الوصف، الـ Manifest، وأيقونة الآيفون)
export const metadata: Metadata = {
  title: "FairShare",
  description: "Financial collaboration made simple",
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-icon.png",
  },
};

// 2. إعدادات شاشة الموبايل (لون شريط الهاتف من الأعلى) - خاص بـ Next.js 14
export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}