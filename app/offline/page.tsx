import { WifiOff } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline | Fairshare",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <WifiOff className="mb-4 h-16 w-16 text-gray-300" />
      <h1 className="text-2xl font-bold text-gray-900">You&apos;re offline</h1>
      <p className="mt-2 text-gray-500">
        Check your connection and try again. Your data will sync when you&apos;re back online.
      </p>
    </div>
  );
}