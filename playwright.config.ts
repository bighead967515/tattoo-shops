import { defineConfig, devices } from "@playwright/test";

const appPort = process.env.PORT || "3000";
const appBaseUrl = process.env.BASE_URL || `http://localhost:${appPort}`;
const useManagedWebServer = process.env.SKIP_WEB_SERVER !== "1";

// Ensure all tests use the correct base URL and port
process.env.BASE_URL = appBaseUrl;

/**
 * Playwright Configuration for E2E and Performance Tests
 *
 * Setup:
 * 1. Install: pnpm add -D @playwright/test
 * 2. Install browsers: npx playwright install
 * 3. Run tests: npx playwright test
 * 4. View report: npx playwright show-report
 */

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html"],
    ["list"],
    ["json", { outputFile: "test-results/results.json" }],
  ],

  use: {
    baseURL: appBaseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Run local dev server before tests if not running
  webServer: useManagedWebServer
    ? {
        command:
          "cross-env NODE_ENV=test node -r dotenv/config dist/index.js dotenv_config_path=.env",
        url: `${appBaseUrl}/api/health`,
        timeout: 120000,
        reuseExistingServer: false,
        stdout: "ignore",
        stderr: "pipe",
        env: {
          JWT_SECRET: "test-jwt-secret-at-least-32-characters-long!",
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
      }
    : undefined,
});
