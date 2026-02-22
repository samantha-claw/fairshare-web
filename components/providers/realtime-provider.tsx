// components/providers/realtime-provider.tsx
"use client";

import type { ReactNode } from "react";
import { useRealtime } from "@/hooks/use-realtime";

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  // Activate the global realtime listener
  useRealtime();

  // Transparent wrapper — no extra DOM, no layout shift
  return <>{children}</>;
}