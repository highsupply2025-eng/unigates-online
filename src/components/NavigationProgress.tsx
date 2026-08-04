import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import RouteProgressBar from "./RouteProgressBar";

const SHOW_DELAY_MS = 180;
const SAFETY_TIMEOUT_MS = 15_000;

const NavigationProgress = () => {
  const location = useLocation();
  const [show, setShow] = useState(false);
  const showTimer = useRef<number>();
  const safetyTimer = useRef<number>();

  useEffect(() => {
    window.clearTimeout(showTimer.current);
    window.clearTimeout(safetyTimer.current);
    setShow(false);
  }, [location.key]);

  useEffect(() => {
    const clear = () => {
      window.clearTimeout(showTimer.current);
      window.clearTimeout(safetyTimer.current);
      setShow(false);
    };

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href") ?? "";
      if (href.startsWith("#")) return;

      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (
        destination.origin !== current.origin ||
        (destination.pathname === current.pathname && destination.search === current.search)
      ) return;

      clear();
      showTimer.current = window.setTimeout(() => setShow(true), SHOW_DELAY_MS);
      safetyTimer.current = window.setTimeout(clear, SAFETY_TIMEOUT_MS);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(showTimer.current);
      window.clearTimeout(safetyTimer.current);
    };
  }, []);

  return show ? <RouteProgressBar /> : null;
};

export default NavigationProgress;
