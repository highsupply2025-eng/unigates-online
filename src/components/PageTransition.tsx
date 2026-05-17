import { useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Very fast fade-in on route change. Kept short to feel near-instant.
 */
const PageTransition = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const [show, setShow] = useState(true);

  useEffect(() => {
    setShow(false);
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div
      key={pathname}
      className={`transition-opacity duration-150 ease-out ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </div>
  );
};

export default PageTransition;
