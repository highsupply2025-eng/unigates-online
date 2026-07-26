import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to postgres_changes on the given tables and call `refresh`
 * whenever any change (INSERT/UPDATE/DELETE) is detected.
 *
 * Used to keep student-facing pages in sync with lecturer actions
 * (new lecture, new live stream, new schedule, etc.).
 */
export function useRealtimeRefresh(
  tables: string[],
  refresh: () => void,
  enabled: boolean = true
) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!enabled || tables.length === 0) return;

    const channelName = `rt-${tables.join("-")}-${Math.random().toString(36).slice(2, 8)}`;
    let channel = supabase.channel(channelName);

    // Debounce so a burst of changes triggers only one refetch
    let timer: number | undefined;
    const trigger = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => refreshRef.current(), 300);
    };

    for (const table of tables) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        trigger
      );
    }

    channel.subscribe();

    return () => {
      if (timer) window.clearTimeout(timer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tables.join("|")]);
}
