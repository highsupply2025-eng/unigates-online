import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEVICE_KEY = "unigates_device_id";
const STALE_MS = 2 * 60 * 1000; // 2 minutes
const HEARTBEAT_MS = 60 * 1000; // 1 minute
const EXEMPT_ROLES = new Set<string>(["admin"]);

const getDeviceId = (): string => {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
};

/**
 * Enforces a single active session per user (admins exempt).
 * If another device already has an active session (heartbeat within 2 min),
 * this device is signed out with an alert.
 */
export const useSingleSession = () => {
  const intervalRef = useRef<number | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    const deviceId = getDeviceId();

    const claimSession = async (userId: string) => {
      // Check current row
      const { data: existing } = await supabase
        .from("active_sessions")
        .select("device_id, last_seen")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing && existing.device_id !== deviceId) {
        const lastSeen = new Date(existing.last_seen).getTime();
        const fresh = Date.now() - lastSeen < STALE_MS;
        if (fresh) {
          alert(
            "لديك جلسة نشطة على جهاز آخر. الرجاء تسجيل الخروج من الجهاز الآخر أولاً.\n\nYou have an active session on another device. Please sign out there first."
          );
          await supabase.auth.signOut();
          window.location.href = "/login";
          return false;
        }
      }

      // Take ownership
      await supabase.from("active_sessions").upsert(
        {
          user_id: userId,
          device_id: deviceId,
          user_agent: navigator.userAgent.slice(0, 200),
          last_seen: new Date().toISOString(),
        },
        { onConflict: "user_id" }
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

    const watchTakeover = (userId: string) => {
      channelRef.current = supabase
        .channel(`session:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "active_sessions",
            filter: `user_id=eq.${userId}`,
          },
          (payload: any) => {
            if (payload.new?.device_id && payload.new.device_id !== deviceId) {
              alert(
                "تم تسجيل الدخول من جهاز آخر. سيتم تسجيل خروجك.\n\nSigned in from another device. You will be signed out."
              );
              supabase.auth.signOut().then(() => {
                window.location.href = "/login";
              });
            }
          }
        )
        .subscribe();
    };

    const start = async (userId: string) => {
      // Check role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const isExempt = (roles || []).some((r: any) => EXEMPT_ROLES.has(r.role));
      if (isExempt) return;

      const ok = await claimSession(userId);
      if (!ok || cancelled) return;

      watchTakeover(userId);

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

    // Initial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !cancelled) start(session.user.id);
    });

    // Auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setTimeout(() => start(session.user.id), 0);
      } else if (event === "SIGNED_OUT") {
        stop();
      }
    });

    // Best-effort cleanup on tab close
    const onUnload = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          navigator.sendBeacon?.(
            `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/active_sessions?user_id=eq.${session.user.id}&device_id=eq.${deviceId}`
          );
        }
      });
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      cancelled = true;
      window.removeEventListener("beforeunload", onUnload);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      sub.subscription.unsubscribe();
    };
  }, []);
};
