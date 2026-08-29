import { describe, it, expect } from "vitest";
import { preloadRoute, ROUTE_LOADERS } from "@/PrefetchRoutes";

describe("Ultra-Fast Turbo Route Prefetcher", () => {
  it("maps core platform routes to valid dynamic module loaders", () => {
    expect(ROUTE_LOADERS.length).toBeGreaterThan(30);

    const platformRoutes = [
      "/university-platform",
      "/school-platform",
      "/courses",
      "/book-store",
      "/login",
      "/signup",
      "/institution/dashboard",
      "/leadership/dashboard",
      "/student/dashboard",
      "/lecturer/dashboard",
    ];

    for (const path of platformRoutes) {
      const match = ROUTE_LOADERS.some(([re]) => re.test(path));
      expect(match).toBe(true);
    }
  });

  it("safely preloads routes without crashing or throwing", () => {
    expect(() => {
      preloadRoute("/university-platform");
      preloadRoute("/login");
      preloadRoute("/institution/dashboard");
      preloadRoute("/unknown-route");
    }).not.toThrow();
  });
});
