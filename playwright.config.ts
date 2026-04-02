import { defineConfig, devices } from "@playwright/test";

const appPort = process.env.PORT || "300";
const appBaseUrl = process.env.BASE_URL || `http://localhost:${appPort}`;
const useManagedWebServer = process.env.SKIP_WEB_SERVER !== "1";

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
          "node -r dotenv/config ./node_modules/tsx/dist/cli.mjs watch backend/server/_core/index.ts dotenv_config_path=.env",
        url: `${appBaseUrl}/api/health`,
        reuseExistingServer: !process.env.CI,
        stdout: "ignore",
        stderr: "pipe",
      }
    : undefined,
});
