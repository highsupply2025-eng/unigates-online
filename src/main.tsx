import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import AppErrorBoundary from "./components/AppErrorBoundary";
import "./index.css";

// Boot native (Capacitor) integrations if we're running inside the APK/IPA.
// Safe no-op in normal browsers. Dynamic import keeps @capacitor/core
// out of the critical web bundle.
import("./lib/native-app").then(({ initNativeApp }) => initNativeApp());

// Global safety-net for lazy-chunk load failures triggered outside React render.
const isChunkErr = (msg: string) =>
  /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
    msg,
  );
const RELOAD_KEY = "__unigates_chunk_reload__";
const tryReloadOnce = () => {
  try {
    if (!sessionStorage.getItem(RELOAD_KEY)) {
      sessionStorage.setItem(RELOAD_KEY, "1");
      window.location.reload();
    }
  } catch {
    window.location.reload();
  }
};
window.addEventListener("error", (e) => {
  if (isChunkErr(`${e.message} ${e.error?.stack || ""}`)) tryReloadOnce();
});
window.addEventListener("unhandledrejection", (e) => {
  const reason: any = e.reason;
  const msg = reason instanceof Error ? `${reason.name} ${reason.message}` : String(reason);
  if (isChunkErr(msg)) tryReloadOnce();
});

// Build-time constant injected by Vite (`define` in vite.config.ts).
declare const __UNIGATES_BUILD_ID__: string;
const BUILD_ID: string =
  typeof __UNIGATES_BUILD_ID__ !== "undefined" ? __UNIGATES_BUILD_ID__ : "dev";
const BUILD_ID_KEY = "__unigates_build_id__";
const BUILD_RELOAD_KEY = "__unigates_build_reload__";

/**
 * Strict version-mismatch guard.
 * Compares the build ID baked into this bundle with the last one the browser
 * saw. If they differ (new deploy), we:
 *   1. unregister every Service Worker (any scope, any script)
 *   2. wipe Cache Storage
 *   3. persist the new build ID
 *   4. hard-reload the page ONCE per new build to fetch fresh JS/CSS.
 *
 * NOTE: The index.html inline script already handles SW unregistration for
 * stale deploys before React loads. We intentionally skip the "same build"
 * eviction here to avoid destroying cached JS/CSS/images on every visit,
 * which was causing the 8-second boot timeout.
 */
(function enforceBuildFreshness() {
  try {
    const previous = localStorage.getItem(BUILD_ID_KEY);
    const changed = previous !== null && previous !== BUILD_ID;
    // Always record the current build ID so future loads can compare.
    localStorage.setItem(BUILD_ID_KEY, BUILD_ID);

    if (changed) {
      const evictAll = async () => {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
        }
      };

      // New build detected — force a clean reload exactly once per new build.
      const reloadedFor = sessionStorage.getItem(BUILD_RELOAD_KEY);
      if (reloadedFor !== BUILD_ID) {
        sessionStorage.setItem(BUILD_RELOAD_KEY, BUILD_ID);
        evictAll().finally(() => window.location.reload());
      }
    }
  } catch {
    /* storage unavailable — skip silently */
  }
})();

const rootEl = document.getElementById("root")!;
// Clear the static HTML fallback loader before React takes over.
rootEl.innerHTML = "";

createRoot(rootEl).render(
  <AppErrorBoundary>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </AppErrorBoundary>,
);
