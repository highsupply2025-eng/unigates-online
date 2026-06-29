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
      output: {
        // Group large stable deps into long-cached vendor chunks so route
        // chunks stay small and navigation feels instant.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || id.includes("react-router") || id.includes("/react/")) return "react-vendor";
          if (id.includes("@supabase")) return "supabase-vendor";
          if (id.includes("@radix-ui")) return "radix-vendor";
          if (id.includes("recharts") || id.includes("d3-")) return "charts-vendor";
          if (id.includes("framer-motion")) return "motion-vendor";
          if (id.includes("lucide-react")) return "icons-vendor";
          if (id.includes("@tanstack")) return "query-vendor";
          return "vendor";
        },
      },
    },
  },
  esbuild: {
    legalComments: "none",
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
}));
