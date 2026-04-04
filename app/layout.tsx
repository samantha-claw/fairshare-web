// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/providers/toast-provider";

// 1. إعدادات الـ Metadata
export const metadata: Metadata = {
  title: "FairShare",
  description: "Financial collaboration made simple",
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-icon.png",
  },
};

// 2. إعدادات شاشة الموبايل
export const viewport: Viewport = {
  themeColor: "#00E676",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        {/* Google Fonts - Inter */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Material Icons */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary antialiased font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
