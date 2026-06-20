import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface RealtimeTableConfig {
  event: string;
  table: string;
}

interface UseRealtimeSubscriptionOptions {
  /** Unique channel name to avoid collisions between subscriptions. */
  channelName: string;
  /** Tables to subscribe to (event + table name). */
  tables: RealtimeTableConfig[];
  /** Callback invoked (debounced) when any subscribed table changes. */
  onChange: () => void;
  /** Debounce window in ms. Default 300. */
  debounceMs?: number;
  /** Optional callback for connection status changes. */
  onStatusChange?: (status: "connecting" | "connected" | "disconnected") => void;
}

/**
 * Shared Supabase Realtime subscription hook.
 * Handles channel creation, debounced event batching, and cleanup.
 * Consumers only need to provide which tables to watch and what to refetch.
 */
export function useRealtimeSubscription({
  channelName,
  tables,
  onChange,
  debounceMs = 300,
  onStatusChange,
}: UseRealtimeSubscriptionOptions) {
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const channelRef = useRef<ReturnType<SupabaseClient["channel"]> | null>(null);
  const wasDisconnected = useRef(false);

  const debouncedOnChange = useCallback(() => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(onChange, debounceMs);
  }, [onChange, debounceMs]);

  useEffect(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    const supabase = supabaseRef.current;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = supabase.channel(channelName);
    for (const { event, table } of tables) {
      channel = channel.on(
        "postgres_changes",
        { event, schema: "public", table },
        debouncedOnChange
      );
    }

    channel = channel.subscribe((status: string) => {
      if (status === "SUBSCRIBED") {
        onStatusChange?.("connected");
        if (wasDisconnected.current) {
          wasDisconnected.current = false;
          onChange();
        }
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        onStatusChange?.("disconnected");
        wasDisconnected.current = true;
      } else {
        onStatusChange?.("connecting");
      }
    });

    channelRef.current = channel;

    return () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
