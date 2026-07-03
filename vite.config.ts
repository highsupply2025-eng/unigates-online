import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  define: {
    // Unique build ID baked into the client. Used to detect stale bundles and
    // force a hard reload (+ Service Worker eviction) when the deployed
    // version differs from what the browser last loaded.
    __UNIGATES_BUILD_ID__: JSON.stringify(
      process.env.LOVABLE_BUILD_ID || `${Date.now()}-${mode}`,
    ),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    minify: "esbuild",
    chunkSizeWarningLimit: 1200,
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {},
    },

  },
  esbuild: {
    legalComments: "none",
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
}));
