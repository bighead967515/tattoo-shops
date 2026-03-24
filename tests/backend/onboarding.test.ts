import { describe, expect, it } from "vitest";
import {
  ARTIST_ONBOARDING_TIER,
  CLIENT_ONBOARDING_TIER,
  buildArtistOnboardingUserUpdate,
  buildClientOnboardingUserUpdate,
} from "../../backend/server/_core/onboarding";

describe("Onboarding user updates", () => {
  it("builds artist onboarding role and canonical tier", () => {
    const now = new Date("2026-03-13T00:00:00.000Z");
    const update = buildArtistOnboardingUserUpdate(now);

    expect(update.role).toBe("artist");
    expect(update.subscriptionTier).toBe(ARTIST_ONBOARDING_TIER);
    expect(update.updatedAt).toBe(now);
  });

  it("builds client onboarding role and canonical tier", () => {
    const now = new Date("2026-03-13T00:00:00.000Z");
    const update = buildClientOnboardingUserUpdate(now);

    expect(update.role).toBe("client");
    expect(update.subscriptionTier).toBe(CLIENT_ONBOARDING_TIER);
    expect(update.updatedAt).toBe(now);
  });
});
