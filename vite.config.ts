import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

const plugins = [react(), tailwindcss()];

if (process.env.VITE_ENABLE_JSX_LOC === "true") {
  // jsxLocPlugin returns a single Plugin; cast to any to satisfy the typed array
  plugins.push(jsxLocPlugin() as any);
}

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
  },
  server: {
    host: true,
    hmr: {
      overlay: false,
    },
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
