import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export const useSmartBack = (fallback = "/") => {
  const navigate = useNavigate();

  return useCallback(() => {
    // If there's browser history, go back
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }, [fallback, navigate]);
};
