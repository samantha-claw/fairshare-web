"use client";

import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center bg-background">
      <WifiOff className="h-12 w-12 text-text-tertiary" />
      <h1 className="text-xl font-bold text-text-primary">You&apos;re offline</h1>
      <p className="text-sm text-text-secondary max-w-xs">
        Check your connection and try again. Your data will sync when you&apos;re back online.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-primary hover:bg-surface-2 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
