import { type ReactNode } from "react";

/**
 * Instant route swap — no fade — so navigation feels immediate.
 * Removed the prior opacity fade because it added ~150ms of perceived lag
 * on every navigation inside the student dashboard.
 */
const PageTransition = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export default PageTransition;
