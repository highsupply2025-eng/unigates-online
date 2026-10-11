import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// Local dev server handler for /api/cloud-sync
function devCloudSyncPlugin() {
  const devStore = {
    authors: new Map(),
    submissions: new Map(),
    invoices: new Map(),
    contracts: new Map(),
    messages: new Map()
  };
  return {
    name: "dev-cloud-sync",
    configureServer(server: any) {
      server.middlewares.use("/api/cloud-sync", (req: any, res: any) => {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        if (req.method === "GET") {
          res.end(JSON.stringify({
            authors: Array.from(devStore.authors.values()),
            submissions: Array.from(devStore.submissions.values()),
            invoices: Array.from(devStore.invoices.values()),
            contracts: Array.from(devStore.contracts.values()),
            timestamp: new Date().toISOString()
          }));
          return;
        }
        if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk: any) => { body += chunk; });
          req.on("end", () => {
            try {
              const payload = JSON.parse(body);
              const { eventType, entityId, data } = payload;
              if (data && (data.id || entityId)) {
                const id = data.id || entityId;
                if (eventType.includes("AUTHOR")) devStore.authors.set(id, data);
                if (eventType.includes("SUBMISSION")) devStore.submissions.set(id, data);
                if (eventType.includes("INVOICE")) devStore.invoices.set(id, data);
                if (eventType.includes("CONTRACT")) devStore.contracts.set(id, data);
              }
              res.end(JSON.stringify({ success: true, eventType }));
            } catch (e: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }
        res.end(JSON.stringify({ ok: true }));
      });
    }
  };
}

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
  plugins: [
    react(), 
    mode === "development" && devCloudSyncPlugin(),
    mode === "development" && componentTagger(), 
    mode === "development" && mcpPlugin()
  ].filter(Boolean),
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
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-router": ["react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-menubar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-switch",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-slot",
          ],
          "vendor-charts": ["recharts"],
          "vendor-pdf": ["jspdf", "html2canvas"],
        },
      },
    },

  },
  esbuild: {
    legalComments: "none",
    // Keep console.error/warn in production for error reporting; only drop console.log and debugger
    drop: mode === "production" ? ["debugger"] : [],
    pure: mode === "production" ? ["console.log", "console.info", "console.debug"] : [],
  },
}));
