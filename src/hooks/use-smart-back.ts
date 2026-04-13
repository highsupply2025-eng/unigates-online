import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const useSmartBack = (fallback = "/") => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasPreviousRoute = useRef(false);

  useEffect(() => {
    // After the first render, any subsequent location change means we have internal history
    return () => {
      hasPreviousRoute.current = true;
    };
  }, [location.key]);

  return useCallback(() => {
    if (hasPreviousRoute.current && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }, [fallback, navigate]);
};
