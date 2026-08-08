import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

/**
 * Automatically logs out the user after 30 minutes of inactivity.
 * Resets the timer on any mouse, keyboard, touch, or scroll interaction.
 * Only active when a Supabase session exists.
 */
export const useAutoLogout = () => {
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);

  const logout = useCallback(async () => {
    activeRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (!activeRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (session?.user) {
        activeRef.current = true;
        timerRef.current = setTimeout(logout, TIMEOUT_MS);

        for (const event of EVENTS) {
          window.addEventListener(event, resetTimer, { passive: true });
        }
      }
    };

    checkSession();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user && !activeRef.current) {
        activeRef.current = true;
        timerRef.current = setTimeout(logout, TIMEOUT_MS);

        for (const event of EVENTS) {
          window.addEventListener(event, resetTimer, { passive: true });
        }
      } else if (event === "SIGNED_OUT") {
        activeRef.current = false;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        for (const event of EVENTS) {
          window.removeEventListener(event, resetTimer);
        }
      }
    });

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
      sub.subscription.unsubscribe();
    };
  }, [logout, resetTimer]);
};
