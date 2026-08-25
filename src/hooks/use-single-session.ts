import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DEVICE_KEY = "unigates_device_id";
const STALE_MS = 2 * 60 * 1000; // 2 minutes
const HEARTBEAT_MS = 60 * 1000; // 1 minute

// Max simultaneous active devices per role. Default = 1.
const ROLE_DEVICE_LIMIT: Record<string, number> = {
  admin: 2,
};
const DEFAULT_LIMIT = 1;

const getDeviceId = (): string => {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
};

/**
 * Enforces a per-role limit on simultaneously active devices.
 * - Default: 1 device (students, lecturers, leadership, institution admins...)
 * - Admin (platform): 2 devices
 * Heartbeat every 60s; sessions older than 2 min are considered stale.
 */
export const useSingleSession = () => {
  const navigate = useNavigate();
  const intervalRef = useRef<number | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    const deviceId = getDeviceId();

    const getLimit = async (userId: string): Promise<number> => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const list = (roles || []).map((r: any) => r.role as string);
      const limits = list.map((r) => ROLE_DEVICE_LIMIT[r] ?? DEFAULT_LIMIT);
      return limits.length ? Math.max(...limits) : DEFAULT_LIMIT;
    };

    const claimSession = async (userId: string, limit: number) => {
      const { data: sessions } = await supabase
        .from("active_sessions")
        .select("device_id, last_seen")
        .eq("user_id", userId);

      const now = Date.now();
      const fresh = (sessions || []).filter(
        (s: any) => now - new Date(s.last_seen).getTime() < STALE_MS
      );
      const mine = fresh.find((s: any) => s.device_id === deviceId);

      if (!mine && fresh.length >= limit) {
        toast({
          title: `Maximum active devices reached (${limit})`,
          description: "You reached the maximum active devices. Please sign out from another device first.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
        return false;
      }

      await supabase.from("active_sessions").upsert(
        {
          user_id: userId,
          device_id: deviceId,
          user_agent: navigator.userAgent.slice(0, 200),
          last_seen: new Date().toISOString(),
        },
        { onConflict: "user_id,device_id" }
      );
      return true;
    };

    const heartbeat = async (userId: string) => {
      await supabase
        .from("active_sessions")
        .update({ last_seen: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("device_id", deviceId);
    };

    const start = async (userId: string) => {
      const limit = await getLimit(userId);
      if (cancelled) return;
      const ok = await claimSession(userId, limit);
      if (!ok || cancelled) return;

      intervalRef.current = window.setInterval(() => {
        heartbeat(userId);
      }, HEARTBEAT_MS);
    };

    const stop = async (userId?: string) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (userId) {
        await supabase
          .from("active_sessions")
          .delete()
          .eq("user_id", userId)
          .eq("device_id", deviceId);
      }
    };

    // Defer session check until after first paint so it never blocks
    // the initial page render. This avoids 2-3 sequential Supabase
    // round-trips (getSession → user_roles → active_sessions) on boot.
    const bootTimer = setTimeout(() => {
      if (cancelled) return;
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user && !cancelled) start(session.user.id).catch(() => {});
      }).catch(() => {});
    }, 500);

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setTimeout(() => start(session.user.id).catch(() => {}), 0);
      } else if (event === "SIGNED_OUT") {
        stop();
      }
    });

    const onUnload = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/active_sessions?user_id=eq.${session.user.id}&device_id=eq.${deviceId}`,
            {
              method: "DELETE",
              headers: {
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                Authorization: `Bearer ${session.access_token}`,
              },
              keepalive: true,
            }
          );
        }
      });
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      cancelled = true;
      clearTimeout(bootTimer);
      window.removeEventListener("beforeunload", onUnload);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      sub.subscription.unsubscribe();
    };
  }, [navigate]);
};
