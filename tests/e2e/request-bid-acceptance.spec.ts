import { expect, test } from "@playwright/test";
import {
  buildSeededRequestDetail,
  SEEDED_CLIENT_USER,
  SEEDED_REQUEST_ID,
} from "./fixtures/requestBidFixtures";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function trpcResult(json: unknown) {
  return [{ result: { data: { json } } }];
}

test.describe("Request To Bid Acceptance", () => {
  test("shows secure payment trust copy and cancellation policy link in accept dialog", async ({
    page,
  }) => {
    await page.route("**/api/trpc/**", async (route) => {
      const url = route.request().url();

      if (url.includes("/api/trpc/auth.me")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(trpcResult(SEEDED_CLIENT_USER)),
        });
        return;
      }

      if (url.includes("/api/trpc/requests.getById")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(trpcResult(buildSeededRequestDetail(false))),
        });
        return;
      }

      await route.continue();
    });

    await page.goto(`${BASE_URL}/requests/${SEEDED_REQUEST_ID}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.getByRole("button", { name: /Accept This Bid/i }).click();

    await expect(
      page.getByText(/Deposits are processed securely via Stripe\./i),
    ).toBeVisible();
    await expect(
      page.getByText(/Card details are not shared with the artist\./i),
    ).toBeVisible();

    const policyLink = page.getByRole("link", {
      name: /View cancellation policy/i,
    });
    await expect(policyLink).toBeVisible();
    await expect(policyLink).toHaveAttribute("href", "/cancellation-policy");
    await expect(policyLink).toHaveAttribute("target", "_blank");
  });

  test("accepts a pending bid using seeded fixtures", async ({ page }) => {
    let accepted = false;

    await page.route("**/api/trpc/**", async (route) => {
      const url = route.request().url();

      if (url.includes("/api/trpc/auth.me")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(trpcResult(SEEDED_CLIENT_USER)),
        });
        return;
      }

      if (url.includes("/api/trpc/requests.getById")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(trpcResult(buildSeededRequestDetail(accepted))),
        });
        return;
      }

      if (url.includes("/api/trpc/bids.accept")) {
        accepted = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(trpcResult({ success: true })),
        });
        return;
      }

      await route.continue();
    });

    await page.goto(`${BASE_URL}/requests/${SEEDED_REQUEST_ID}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await expect(
      page.getByRole("heading", {
        name: /Phoenix sleeve with geometric accents/i,
      }),
    ).toBeVisible();

    const acceptButton = page.getByRole("button", { name: /Accept This Bid/i });
    await expect(acceptButton).toBeVisible();
    await acceptButton.click();

    const acceptedCard = page.locator(".space-y-4 > *", {
      hasText: "Golden Needle",
    });
    await expect(acceptedCard.getByText("Accepted")).toBeVisible();

    const rejectedCard = page.locator(".space-y-4 > *", {
      hasText: "Ink Haven",
    });
    await expect(rejectedCard.getByText("Not Selected")).toBeVisible();
  });
});
