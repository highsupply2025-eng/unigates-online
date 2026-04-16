import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export const useSmartBack = (fallback = "/") => {
  const navigate = useNavigate();
  const hasPrevPage = useRef(false);

  useEffect(() => {
    const onPopState = () => { hasPrevPage.current = true; };
    window.addEventListener("popstate", onPopState);
    // If navigation entry count > 1 at mount, there's history
    if ((performance.getEntriesByType?.("navigation")?.[0] as any)?.type !== "navigate" || window.history.length > 2) {
      hasPrevPage.current = true;
    }
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return useCallback(() => {
    if (hasPrevPage.current && window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  }, [navigate, fallback]);
};
