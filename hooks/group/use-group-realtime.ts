"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Subscribes to realtime Postgres changes for the group.
 * Uses refs for `refetch` to avoid tearing down the channel
 * every time the callback reference changes.
 */
export function useGroupRealtime(groupId: string, refetch: () => void) {
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Always point to the latest refetch without re-running the effect
  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  });

  useEffect(() => {
    const handler = () => refetchRef.current();

    const channel = supabase
      .channel(`group-details-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `group_id=eq.${groupId}`,
        },
        handler
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expense_splits" },
        handler
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settlements",
          filter: `group_id=eq.${groupId}`,
        },
        handler
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activity_log",
          filter: `group_id=eq.${groupId}`,
        },
        handler
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_members",
          filter: `group_id=eq.${groupId}`,
        },
        handler
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [groupId, supabase]);
}