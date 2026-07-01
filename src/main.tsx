import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import AppErrorBoundary from "./components/AppErrorBoundary";
import "./index.css";

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
