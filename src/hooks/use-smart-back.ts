import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export const useSmartBack = (fallback = "/") => {
  const navigate = useNavigate();

  return useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  }, [navigate, fallback]);
};
