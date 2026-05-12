import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Scrolls to top on PUSH/REPLACE navigation.
 * Restores previous scroll position on POP (back/forward) navigation.
 */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (navType === "POP") return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, search, navType]);

  return null;
};

export default ScrollToTop;
