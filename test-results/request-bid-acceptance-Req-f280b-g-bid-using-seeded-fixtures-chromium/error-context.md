# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: request-bid-acceptance.spec.ts >> Request To Bid Acceptance >> accepts a pending bid using seeded fixtures
- Location: tests\e2e\request-bid-acceptance.spec.ts:15:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /Phoenix sleeve with geometric accents/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /Phoenix sleeve with geometric accents/i })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - complementary [ref=e3]:
    - generic [ref=e4]:
      - link "Ink Connect Ink Connect" [ref=e6] [cursor=pointer]:
        - /url: /
        - img "Ink Connect" [ref=e7]
        - generic [ref=e8]: Ink Connect
      - link "Post Your Idea" [ref=e10] [cursor=pointer]:
        - /url: /client/new-request
        - button "Post Your Idea" [ref=e11]:
          - img
          - text: Post Your Idea
      - navigation [ref=e12]:
        - link "Browse Artists" [ref=e13] [cursor=pointer]:
          - /url: /artists
          - img [ref=e14]
          - text: Browse Artists
        - link "How It Works" [ref=e19] [cursor=pointer]:
          - /url: /#how-it-works
          - img [ref=e20]
          - text: How It Works
        - link "For Artists" [ref=e23] [cursor=pointer]:
          - /url: /for-artists
          - img [ref=e24]
          - text: For Artists
        - link "Dashboard" [ref=e30] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e31]
          - text: Dashboard
      - generic [ref=e36]:
        - button "Settings & Account" [ref=e37] [cursor=pointer]:
          - img [ref=e38]
          - generic [ref=e41]: Settings & Account
          - img [ref=e42]
        - generic [ref=e44]:
          - button "Light Mode" [ref=e45] [cursor=pointer]:
            - img [ref=e46]
            - text: Light Mode
          - link "Help" [ref=e52] [cursor=pointer]:
            - /url: /help
            - img [ref=e53]
            - text: Help
          - link "Dashboard" [ref=e56] [cursor=pointer]:
            - /url: /dashboard
            - img [ref=e57]
            - text: Dashboard
          - button "Sign Out" [ref=e62] [cursor=pointer]:
            - img [ref=e63]
            - text: Sign Out
  - main [ref=e66]:
    - generic [ref=e67]:
      - link "Back to Request Board" [ref=e68] [cursor=pointer]:
        - /url: /requests
        - button "Back to Request Board" [ref=e69]:
          - img
          - text: Back to Request Board
      - generic [ref=e70]:
        - generic [ref=e71]:
          - generic [ref=e72]:
            - generic [ref=e74]:
              - generic [ref=e75]:
                - generic [ref=e76]: Phoenix sleeve with geometric accents
                - generic [ref=e77]:
                  - img [ref=e78]
                  - text: Posted by Fixture Client
              - generic [ref=e81]: open
            - generic [ref=e82]:
              - button "Select image 7001 for text overlay" [ref=e84] [cursor=pointer]:
                - img "Primary inspiration" [ref=e85]
              - generic [ref=e86]:
                - heading "Description" [level=3] [ref=e87]
                - paragraph [ref=e88]: Looking for a full sleeve phoenix concept with geometric fillers and black/grey shading.
              - generic [ref=e89]:
                - generic [ref=e90]:
                  - img [ref=e91]
                  - generic [ref=e97]:
                    - strong [ref=e98]: "Style:"
                    - text: Blackwork
                - generic [ref=e99]:
                  - img [ref=e100]
                  - generic [ref=e106]:
                    - strong [ref=e107]: "Size:"
                    - text: Large
                - generic [ref=e108]:
                  - img [ref=e109]
                  - generic [ref=e112]:
                    - strong [ref=e113]: "Placement:"
                    - text: Full Sleeve
                - generic [ref=e114]:
                  - img [ref=e115]
                  - generic [ref=e121]:
                    - strong [ref=e122]: "Color:"
                    - text: black & and_grey
                - generic [ref=e123]:
                  - img [ref=e124]
                  - generic [ref=e126]:
                    - strong [ref=e127]: "Budget:"
                    - text: $1200 - $2200
                - generic [ref=e128]:
                  - img [ref=e129]
                  - generic [ref=e132]:
                    - strong [ref=e133]: "Timeframe:"
                    - text: Within 2 months
                - generic [ref=e134]:
                  - img [ref=e135]
                  - generic [ref=e138]:
                    - strong [ref=e139]: "Location:"
                    - text: Austin, TX (willing to travel)
          - generic [ref=e140]:
            - generic [ref=e141]:
              - generic [ref=e142]: Bids (2)
              - generic [ref=e143]: Review bids from artists interested in your project
            - generic [ref=e145]:
              - generic [ref=e146]:
                - generic [ref=e148]:
                  - generic [ref=e149]:
                    - generic [ref=e151]: GO
                    - generic [ref=e152]:
                      - link "Golden Needle" [ref=e153] [cursor=pointer]:
                        - /url: /artist/301
                      - generic [ref=e154]:
                        - img [ref=e155]
                        - text: "4.9"
                  - generic [ref=e157]:
                    - paragraph [ref=e158]: $1850
                    - paragraph [ref=e159]: ~24 hours
                - generic [ref=e160]:
                  - paragraph [ref=e161]: I can start with a custom phoenix sketch and stage sessions over 4 weekends.
                  - paragraph [ref=e162]:
                    - img [ref=e163]
                    - text: "Available: 4/11/2026"
                - button "Accept This Bid" [ref=e166] [cursor=pointer]:
                  - img
                  - text: Accept This Bid
              - generic [ref=e167]:
                - generic [ref=e169]:
                  - generic [ref=e170]:
                    - generic [ref=e172]: IN
                    - generic [ref=e173]:
                      - link "Ink Haven" [ref=e174] [cursor=pointer]:
                        - /url: /artist/302
                      - generic [ref=e175]:
                        - img [ref=e176]
                        - text: "4.7"
                  - generic [ref=e178]:
                    - paragraph [ref=e179]: $1720
                    - paragraph [ref=e180]: ~22 hours
                - generic [ref=e181]:
                  - paragraph [ref=e182]: I specialize in blackwork sleeves and can finalize linework in two sessions.
                  - paragraph [ref=e183]:
                    - img [ref=e184]
                    - text: "Available: 4/19/2026"
                - button "Accept This Bid" [ref=e187] [cursor=pointer]:
                  - img
                  - text: Accept This Bid
        - generic [ref=e188]:
          - generic [ref=e189]:
            - generic [ref=e190]:
              - generic [ref=e191]: Text & Font Tools
              - generic [ref=e192]: Style this request text and preview text overlays on your reference images.
            - generic [ref=e193]:
              - generic [ref=e194]:
                - heading "Request Text Styling" [level=3] [ref=e195]
                - generic [ref=e196]:
                  - generic [ref=e197]:
                    - generic [ref=e198]: Font Family
                    - combobox "Font Family" [ref=e199] [cursor=pointer]:
                      - generic: System Sans
                      - img
                  - generic [ref=e200]:
                    - generic [ref=e201]: Font Weight
                    - combobox "Font Weight" [ref=e202] [cursor=pointer]:
                      - generic: Medium
                      - img
                  - generic [ref=e203]:
                    - generic [ref=e204]:
                      - generic [ref=e205]: Title Size
                      - spinbutton "Title Size" [ref=e206]: "30"
                    - generic [ref=e207]:
                      - generic [ref=e208]: Body Size
                      - spinbutton "Body Size" [ref=e209]: "14"
                  - generic [ref=e210]:
                    - generic [ref=e211]: Text Color
                    - textbox "Text Color" [ref=e212]: "#111827"
              - generic [ref=e213]:
                - heading "Image Text Overlay" [level=3] [ref=e214]
                - generic [ref=e215]:
                  - generic [ref=e216]: Target Image
                  - combobox "Target Image" [ref=e217] [cursor=pointer]:
                    - generic: Image 1 (Main)
                    - img
                - generic [ref=e218]:
                  - generic [ref=e219]: Overlay Text
                  - textbox "Overlay Text" [ref=e220]:
                    - /placeholder: Add text to preview on the selected image...
                - generic [ref=e221]:
                  - generic [ref=e222]: Overlay Font Family
                  - combobox "Overlay Font Family" [ref=e223] [cursor=pointer]:
                    - generic: System Sans
                    - img
                - generic [ref=e224]:
                  - generic [ref=e225]: Overlay Font Weight
                  - combobox "Overlay Font Weight" [ref=e226] [cursor=pointer]:
                    - generic: Bold
                    - img
                - generic [ref=e227]:
                  - generic [ref=e228]:
                    - generic [ref=e229]: Font Size
                    - spinbutton "Font Size" [ref=e230]: "26"
                  - generic [ref=e231]:
                    - generic [ref=e232]: Text Color
                    - textbox "Text Color" [ref=e233]: "#ffffff"
                - generic [ref=e234]:
                  - generic [ref=e235]:
                    - generic [ref=e236]: X Position (%)
                    - spinbutton "X Position (%)" [ref=e237]: "50"
                  - generic [ref=e238]:
                    - generic [ref=e239]: Y Position (%)
                    - spinbutton "Y Position (%)" [ref=e240]: "80"
            - generic [ref=e241]:
              - button "Reset Text Style" [ref=e242] [cursor=pointer]
              - button "Clear Overlay" [ref=e243] [cursor=pointer]
          - generic [ref=e244]:
            - generic [ref=e246]: Client
            - generic [ref=e248]:
              - generic [ref=e250]: FI
              - paragraph [ref=e252]: Fixture Client
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import {
  3  |   buildSeededRequestDetail,
  4  |   SEEDED_CLIENT_USER,
  5  |   SEEDED_REQUEST_ID,
  6  | } from "./fixtures/requestBidFixtures";
  7  | 
  8  | const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
  9  | 
  10 | function trpcResult(json: unknown) {
  11 |   return [{ result: { data: { json } } }];
  12 | }
  13 | 
  14 | test.describe("Request To Bid Acceptance", () => {
  15 |   test("accepts a pending bid using seeded fixtures", async ({ page }) => {
  16 |     let accepted = false;
  17 | 
  18 |     await page.route("**/api/trpc/**", async (route) => {
  19 |       const url = route.request().url();
  20 | 
  21 |       if (url.includes("/api/trpc/auth.me")) {
  22 |         await route.fulfill({
  23 |           status: 200,
  24 |           contentType: "application/json",
  25 |           body: JSON.stringify(trpcResult(SEEDED_CLIENT_USER)),
  26 |         });
  27 |         return;
  28 |       }
  29 | 
  30 |       if (url.includes("/api/trpc/requests.getById")) {
  31 |         await route.fulfill({
  32 |           status: 200,
  33 |           contentType: "application/json",
  34 |           body: JSON.stringify(trpcResult(buildSeededRequestDetail(accepted))),
  35 |         });
  36 |         return;
  37 |       }
  38 | 
  39 |       if (url.includes("/api/trpc/bids.accept")) {
  40 |         accepted = true;
  41 |         await route.fulfill({
  42 |           status: 200,
  43 |           contentType: "application/json",
  44 |           body: JSON.stringify(trpcResult({ success: true })),
  45 |         });
  46 |         return;
  47 |       }
  48 | 
  49 |       await route.continue();
  50 |     });
  51 | 
  52 |     await page.goto(`${BASE_URL}/requests/${SEEDED_REQUEST_ID}`, {
  53 |       waitUntil: "domcontentloaded",
  54 |       timeout: 60000,
  55 |     });
  56 | 
  57 |     await expect(
  58 |       page.getByRole("heading", {
  59 |         name: /Phoenix sleeve with geometric accents/i,
  60 |       }),
> 61 |     ).toBeVisible();
     |       ^ Error: expect(locator).toBeVisible() failed
  62 | 
  63 |     const acceptButton = page.getByRole("button", { name: /Accept This Bid/i });
  64 |     await expect(acceptButton).toBeVisible();
  65 |     await acceptButton.click();
  66 | 
  67 |     const acceptedCard = page.locator(".space-y-4 > *", {
  68 |       hasText: "Golden Needle",
  69 |     });
  70 |     await expect(acceptedCard.getByText("Accepted")).toBeVisible();
  71 | 
  72 |     const rejectedCard = page.locator(".space-y-4 > *", {
  73 |       hasText: "Ink Haven",
  74 |     });
  75 |     await expect(rejectedCard.getByText("Not Selected")).toBeVisible();
  76 |   });
  77 | });
  78 | 
```