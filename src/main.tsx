import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import AppErrorBoundary from "./components/AppErrorBoundary";
import "./index.css";

// Boot native (Capacitor) integrations if we're running inside the APK/IPA.
// Safe no-op in normal browsers. Dynamic import keeps @capacitor/core
// out of the critical web bundle.
import("./lib/native-app").then(({ initNativeApp }) => initNativeApp());

// Build-time constant injected by Vite (`define` in vite.config.ts).
declare const __UNIGATES_BUILD_ID__: string;
const BUILD_ID: string =
  typeof __UNIGATES_BUILD_ID__ !== "undefined" ? __UNIGATES_BUILD_ID__ : "dev";
const BUILD_ID_KEY = "__unigates_build_id__";

/**
 * Build-ID tracker (no reload).
 * Records the current build ID so we can detect stale deploys. On a new
 * deploy we unregister leftover Service Workers so the browser fetches
 * fresh assets, but we do NOT reload the page — that caused a visible
 * double-load on every deploy. Instead the current page keeps running
 * (its code is still valid) and the user naturally gets the new code on
 * their next navigation because Vite content-hashes all asset filenames.
 */
(function recordBuildId() {
  try {
    localStorage.setItem(BUILD_ID_KEY, BUILD_ID);
    // Also unregister any stale Service Workers left from a previous deploy.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) r.unregister().catch(() => {});
      }).catch(() => {});
    }
  } catch {
    /* storage unavailable — skip silently */
  }
})();

const rootEl = document.getElementById("root")!;

createRoot(rootEl).render(
  <AppErrorBoundary>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </AppErrorBoundary>,
);
