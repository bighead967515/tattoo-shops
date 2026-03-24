import type { SubscriptionTier } from "@shared/const";

export const ARTIST_ONBOARDING_TIER: SubscriptionTier = "artist_free";
export const CLIENT_ONBOARDING_TIER: SubscriptionTier = "client_free";

export function buildArtistOnboardingUserUpdate(updatedAt = new Date()) {
  return {
    role: "artist" as const,
    subscriptionTier: ARTIST_ONBOARDING_TIER,
    updatedAt,
  };
}

export function buildClientOnboardingUserUpdate(updatedAt = new Date()) {
  return {
    role: "client" as const,
    subscriptionTier: CLIENT_ONBOARDING_TIER,
    updatedAt,
  };
}
