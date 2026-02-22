// hooks/use-realtime.ts
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Tables we want to watch for live changes
const WATCHED_TABLES = [
  "expenses",
  "settlements",
  "group_members",
  "friendships",
] as const;

// Events we care about
const WATCHED_EVENTS = ["INSERT", "UPDATE", "DELETE"] as const;

type WatchedEvent = (typeof WATCHED_EVENTS)[number];

export function useRealtime() {
  const router = useRouter();
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Build one channel that listens to all tables + all events
    let channel = supabase.channel("global-realtime-sync", {
      config: {
        // Broadcast self — useful if the same user has multiple tabs
        broadcast: { self: false },
      },
    });

    // Attach a postgres_changes listener for every table × event combo
    for (const table of WATCHED_TABLES) {
      for (const event of WATCHED_EVENTS) {
        channel = channel.on(
          "postgres_changes" as any,
          {
            event: event as string,
            schema: "public",
            table,
          },
          (payload: any) => {
            console.log(
              `[Realtime] ${payload.eventType} on "${table}":`,
              payload
            );

            // Trigger Next.js server-component refetch
            router.refresh();
          }
        );
      }
    }

    // Subscribe and store reference
    channel.subscribe((status: string, err?: Error) => {
      if (status === "SUBSCRIBED") {
        console.log(
          "[Realtime] ✅ Subscribed to:",
          WATCHED_TABLES.join(", ")
        );
      }
      if (status === "CHANNEL_ERROR") {
        console.error("[Realtime] ❌ Channel error:", err);
      }
      if (status === "TIMED_OUT") {
        console.warn("[Realtime] ⏱ Subscription timed out, retrying…");
      }
    });

    channelRef.current = channel;

    // ── Cleanup on unmount ──
    return () => {
      if (channelRef.current) {
        console.log("[Realtime] 🔌 Removing channel…");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    // We intentionally run this once on mount.
    // supabase and router are stable refs from their respective hooks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}