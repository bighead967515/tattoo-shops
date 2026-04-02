import { expect, test } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function gotoFast(page: Parameters<typeof test>[0]["page"], path: string) {
  await page.goto(`${BASE_URL}${path}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
}

test.describe("Launch Journey Smoke", () => {
  test("public browse journey renders artist discovery entry", async ({ page }) => {
    await gotoFast(page, "/artists");
    await expect(page.getByRole("heading", { name: /Browse Artists|Tattoo Discovery/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Discover/i })).toBeVisible();
  });

  test("public request board journey renders list shell", async ({ page }) => {
    await gotoFast(page, "/requests");
    await expect(page.getByRole("heading", { name: /Tattoo Request Board/i })).toBeVisible();
  });

  test("protected dashboard journey redirects unauthenticated users to sign-in UX", async ({ page }) => {
    await gotoFast(page, "/dashboard");

    await expect
      .poll(async () => {
        const url = page.url();
        if (url.includes("/login")) return "login-route";
        const content = await page.textContent("body");
        return /Please Sign In|Sign in|Welcome Back/i.test(content || "")
          ? "sign-in-ui"
          : "pending";
      }, { timeout: 20000 })
      .toMatch(/login-route|sign-in-ui/);
  });

  test("protected client dashboard journey shows auth gate when unauthenticated", async ({ page }) => {
    await gotoFast(page, "/client/dashboard");

    await expect
      .poll(async () => {
        const content = await page.textContent("body");
        if (/Please Sign In/i.test(content || "")) return "sign-in-ui";
        if (/Welcome Back/i.test(content || "")) return "login-page";
        return "pending";
      }, { timeout: 20000 })
      .toMatch(/sign-in-ui|login-page/);
  });

  test("protected license upload journey shows auth gate or login route", async ({ page }) => {
    await gotoFast(page, "/license-upload");

    await expect
      .poll(async () => {
        const url = page.url();
        if (url.includes("/login")) return "login-route";
        const content = await page.textContent("body");
        return /Please Sign In|Sign in|Welcome Back/i.test(content || "")
          ? "sign-in-ui"
          : "pending";
      }, { timeout: 20000 })
      .toMatch(/login-route|sign-in-ui/);
  });
});
