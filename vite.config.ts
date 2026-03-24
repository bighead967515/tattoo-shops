import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

const plugins = [react(), tailwindcss(), jsxLocPlugin()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "frontend/client", "src"),
      "@shared": path.resolve(import.meta.dirname, "backend/shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "frontend/client"),
  publicDir: path.resolve(import.meta.dirname, "frontend/client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          // Core React runtime + router primitives
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/wouter/") ||
            id.includes("/scheduler/")
          ) {
            return "vendor-react";
          }

          // Data and API layer
          if (
            id.includes("/@tanstack/react-query/") ||
            id.includes("/@trpc/") ||
            id.includes("/superjson/") ||
            id.includes("/@supabase/supabase-js/")
          ) {
            return "vendor-data";
          }

          // UI primitives and animation ecosystem
          if (
            id.includes("/@radix-ui/") ||
            id.includes("/cmdk/") ||
            id.includes("/vaul/") ||
            id.includes("/framer-motion/") ||
            id.includes("/embla-carousel-react/")
          ) {
            return "vendor-ui";
          }

          // Visualization and date utilities
          if (id.includes("/recharts/") || id.includes("/date-fns/")) {
            return "vendor-viz";
          }

          // Icon packs are large and can be isolated.
          if (id.includes("/lucide-react/") || id.includes("/react-icons/")) {
            return "vendor-icons";
          }

          return "vendor-misc";
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
