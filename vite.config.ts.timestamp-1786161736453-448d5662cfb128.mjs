// vite.config.ts
import { defineConfig } from "file:///C:/Users/Elsay/OneDrive/Documents/GitHub/unigates-online/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Elsay/OneDrive/Documents/GitHub/unigates-online/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Users/Elsay/OneDrive/Documents/GitHub/unigates-online/node_modules/lovable-tagger/dist/index.js";
import { mcpPlugin } from "file:///C:/Users/Elsay/OneDrive/Documents/GitHub/unigates-online/node_modules/@lovable.dev/mcp-js/dist/stacks/supabase/vite.js";
var __vite_injected_original_dirname = "C:\\Users\\Elsay\\OneDrive\\Documents\\GitHub\\unigates-online";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false
    }
  },
  define: {
    // Unique build ID baked into the client. Used to detect stale bundles and
    // force a hard reload (+ Service Worker eviction) when the deployed
    // version differs from what the browser last loaded.
    __UNIGATES_BUILD_ID__: JSON.stringify(
      process.env.LOVABLE_BUILD_ID || `${Date.now()}-${mode}`
    )
  },
  plugins: [react(), mode === "development" && componentTagger(), mcpPlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
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
            "@radix-ui/react-slot"
          ],
          "vendor-charts": ["recharts"],
          "vendor-pdf": ["jspdf", "html2canvas"]
        }
      }
    }
  },
  esbuild: {
    legalComments: "none",
    drop: mode === "production" ? ["console", "debugger"] : []
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxFbHNheVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudHNcXFxcR2l0SHViXFxcXHVuaWdhdGVzLW9ubGluZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcRWxzYXlcXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRzXFxcXEdpdEh1YlxcXFx1bmlnYXRlcy1vbmxpbmVcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0Vsc2F5L09uZURyaXZlL0RvY3VtZW50cy9HaXRIdWIvdW5pZ2F0ZXMtb25saW5lL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcclxuaW1wb3J0IHsgbWNwUGx1Z2luIH0gZnJvbSBcIkBsb3ZhYmxlLmRldi9tY3AtanMvc3RhY2tzL3N1cGFiYXNlL3ZpdGVcIjtcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiBcIjo6XCIsXHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gICAgaG1yOiB7XHJcbiAgICAgIG92ZXJsYXk6IGZhbHNlLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIGRlZmluZToge1xyXG4gICAgLy8gVW5pcXVlIGJ1aWxkIElEIGJha2VkIGludG8gdGhlIGNsaWVudC4gVXNlZCB0byBkZXRlY3Qgc3RhbGUgYnVuZGxlcyBhbmRcclxuICAgIC8vIGZvcmNlIGEgaGFyZCByZWxvYWQgKCsgU2VydmljZSBXb3JrZXIgZXZpY3Rpb24pIHdoZW4gdGhlIGRlcGxveWVkXHJcbiAgICAvLyB2ZXJzaW9uIGRpZmZlcnMgZnJvbSB3aGF0IHRoZSBicm93c2VyIGxhc3QgbG9hZGVkLlxyXG4gICAgX19VTklHQVRFU19CVUlMRF9JRF9fOiBKU09OLnN0cmluZ2lmeShcclxuICAgICAgcHJvY2Vzcy5lbnYuTE9WQUJMRV9CVUlMRF9JRCB8fCBgJHtEYXRlLm5vdygpfS0ke21vZGV9YCxcclxuICAgICksXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbcmVhY3QoKSwgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpLCBtY3BQbHVnaW4oKV0uZmlsdGVyKEJvb2xlYW4pLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIGJ1aWxkOiB7XHJcbiAgICB0YXJnZXQ6IFwiZXMyMDIwXCIsXHJcbiAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXHJcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxyXG4gICAgbWluaWZ5OiBcImVzYnVpbGRcIixcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTIwMCxcclxuICAgIG1vZHVsZVByZWxvYWQ6IHsgcG9seWZpbGw6IHRydWUgfSxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICBcInZlbmRvci1yZWFjdFwiOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiXSxcclxuICAgICAgICAgIFwidmVuZG9yLXJvdXRlclwiOiBbXCJyZWFjdC1yb3V0ZXItZG9tXCJdLFxyXG4gICAgICAgICAgXCJ2ZW5kb3ItcXVlcnlcIjogW1wiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCJdLFxyXG4gICAgICAgICAgXCJ2ZW5kb3Itc3VwYWJhc2VcIjogW1wiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCJdLFxyXG4gICAgICAgICAgXCJ2ZW5kb3ItcmFkaXhcIjogW1xyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1kaWFsb2dcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtZHJvcGRvd24tbWVudVwiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1zZWxlY3RcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdGFic1wiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC10b29sdGlwXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXBvcG92ZXJcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtYXZhdGFyXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWNoZWNrYm94XCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWxhYmVsXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWFjY29yZGlvblwiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1hbGVydC1kaWFsb2dcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtY29udGV4dC1tZW51XCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWhvdmVyLWNhcmRcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtbWVudWJhclwiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1uYXZpZ2F0aW9uLW1lbnVcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2Nyb2xsLWFyZWFcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2VwYXJhdG9yXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXNsaWRlclwiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1zd2l0Y2hcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdG9nZ2xlXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXRvZ2dsZS1ncm91cFwiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1jb2xsYXBzaWJsZVwiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1wcm9ncmVzc1wiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1yYWRpby1ncm91cFwiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1hc3BlY3QtcmF0aW9cIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2xvdFwiLFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIFwidmVuZG9yLWNoYXJ0c1wiOiBbXCJyZWNoYXJ0c1wiXSxcclxuICAgICAgICAgIFwidmVuZG9yLXBkZlwiOiBbXCJqc3BkZlwiLCBcImh0bWwyY2FudmFzXCJdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG5cclxuICB9LFxyXG4gIGVzYnVpbGQ6IHtcclxuICAgIGxlZ2FsQ29tbWVudHM6IFwibm9uZVwiLFxyXG4gICAgZHJvcDogbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCIgPyBbXCJjb25zb2xlXCIsIFwiZGVidWdnZXJcIl0gOiBbXSxcclxuICB9LFxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBd1csU0FBUyxvQkFBb0I7QUFDclksT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLGlCQUFpQjtBQUoxQixJQUFNLG1DQUFtQztBQU96QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBSU4sdUJBQXVCLEtBQUs7QUFBQSxNQUMxQixRQUFRLElBQUksb0JBQW9CLEdBQUcsS0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJO0FBQUEsSUFDdkQ7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTLENBQUMsTUFBTSxHQUFHLFNBQVMsaUJBQWlCLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxFQUFFLE9BQU8sT0FBTztBQUFBLEVBQzNGLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGNBQWM7QUFBQSxJQUNkLFdBQVc7QUFBQSxJQUNYLFFBQVE7QUFBQSxJQUNSLHVCQUF1QjtBQUFBLElBQ3ZCLGVBQWUsRUFBRSxVQUFVLEtBQUs7QUFBQSxJQUNoQyxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixnQkFBZ0IsQ0FBQyxTQUFTLFdBQVc7QUFBQSxVQUNyQyxpQkFBaUIsQ0FBQyxrQkFBa0I7QUFBQSxVQUNwQyxnQkFBZ0IsQ0FBQyx1QkFBdUI7QUFBQSxVQUN4QyxtQkFBbUIsQ0FBQyx1QkFBdUI7QUFBQSxVQUMzQyxnQkFBZ0I7QUFBQSxZQUNkO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBLGlCQUFpQixDQUFDLFVBQVU7QUFBQSxVQUM1QixjQUFjLENBQUMsU0FBUyxhQUFhO0FBQUEsUUFDdkM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBRUY7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLGVBQWU7QUFBQSxJQUNmLE1BQU0sU0FBUyxlQUFlLENBQUMsV0FBVyxVQUFVLElBQUksQ0FBQztBQUFBLEVBQzNEO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
