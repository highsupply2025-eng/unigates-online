import { useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Lightweight fade-in transition on every route change.
 * No external dependencies — uses CSS opacity + translate.
 */
const PageTransition = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(false);
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div
      key={pathname}
      className={`transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      }`}
    >
      {children}
    </div>
  );
};

export default PageTransition;
