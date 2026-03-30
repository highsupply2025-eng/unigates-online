import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export const useSmartBack = (fallback = "/") => {
  const navigate = useNavigate();

  return useCallback(() => {
    const historyState = window.history.state as { idx?: number } | null;

    if (typeof historyState?.idx === "number" && historyState.idx > 0) {
      navigate(-1);
      return;
    }

    if (document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        const currentUrl = new URL(window.location.href);

        if (
          referrerUrl.origin === currentUrl.origin &&
          referrerUrl.pathname !== currentUrl.pathname
        ) {
          window.history.back();
          return;
        }
      } catch {
        // Ignore invalid referrer and use fallback.
      }
    }

    navigate(fallback);
  }, [fallback, navigate]);
};
