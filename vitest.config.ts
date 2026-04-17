import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()] as any,
  test: {
    globals: true,
    environment: "node",
    hookTimeout: 60000,
    include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
    exclude: ["node_modules", "dist", "build", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules",
        "dist",
        "build",
        "**/*.config.*",
        "**/types.ts",
        "**/const.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./frontend/client/src"),
      "@shared": path.resolve(__dirname, "./backend/shared"),
      "@server": path.resolve(__dirname, "./backend/server"),
    },
  },
});
