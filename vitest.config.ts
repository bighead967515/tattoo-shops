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
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-jwt-secret-at-least-32-characters-long!",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      OWNER_OPEN_ID: "test-owner-open-id",
      STRIPE_SECRET_KEY: "sk_test_placeholder",
      STRIPE_WEBHOOK_SECRET: "whsec_test_placeholder",
      STRIPE_ARTIST_AMATEUR_PRICE_ID_MONTH: "price_test_amateur_month",
      STRIPE_ARTIST_AMATEUR_PRICE_ID_YEAR: "price_test_amateur_year",
      STRIPE_ARTIST_PRO_PRICE_ID_MONTH: "price_test_pro_month",
      STRIPE_ARTIST_PRO_PRICE_ID_YEAR: "price_test_pro_year",
      STRIPE_ARTIST_ICON_PRICE_ID_MONTH: "price_test_icon_month",
      STRIPE_ARTIST_ICON_PRICE_ID_YEAR: "price_test_icon_year",
      STRIPE_FOUNDING_ARTIST_PRICE_ID: "price_test_founding",
      RESEND_API_KEY: "re_test_placeholder",
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_KEY: "test-service-key",
      SUPABASE_ANON_KEY: "test-anon-key",
      GROQ_API_KEY: "gsk_test_placeholder",
      HUGGINGFACE_API_KEY: "hf_test_placeholder",
    },
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
