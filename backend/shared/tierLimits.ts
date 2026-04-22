/**
 * Artist subscription tier limits and features
 *
 * NOTE: The canonical SubscriptionTier Zod enum lives in @shared/const.ts
 * (artist_free | artist_amateur | artist_pro | artist_icon |
 *  client_free | client_plus | client_elite).
 * The legacy keys below (free, amateur, professional, frontPage) are kept
 * for backward-compatibility with existing feature-flag look-ups.
 */

import {
  SubscriptionTiers,
  type SubscriptionTier,
  TIER_LIMITS as UNIFIED_TIER_LIMITS,
} from "./const";

// Re-export for consumers that import from this file
export { SubscriptionTiers, UNIFIED_TIER_LIMITS };
export type { SubscriptionTier };

export const TIER_LIMITS = {
  free: {
    name: "Apprentice", // "Free"
    portfolioPhotos: 3,
    canAcceptBookings: false,
    canShowDirectContact: false,
    canRespondToReviews: false,
    hasAnalytics: false,
    showExactLocation: false,
    isFeatured: false,
    isVerifiedBadge: false,
    /** Monthly bid quota — 0 means bidding is blocked on free tier */
    bidsPerMonth: 0,
  },
  amateur: {
    name: "Artist", // "Amateur"
    portfolioPhotos: 15,
    canAcceptBookings: true, // Unlocks booking
    canShowDirectContact: true, // Unlocks social links
    canRespondToReviews: false,
    hasAnalytics: false,
    showExactLocation: true,
    isFeatured: false,
    isVerifiedBadge: true, // Must be verified to pay
    /** Monthly bid quota */
    bidsPerMonth: 15,
  },
  professional: {
    name: "Professional",
    portfolioPhotos: Number.MAX_SAFE_INTEGER, // Unlimited
    canAcceptBookings: true,
    canShowDirectContact: true,
    canRespondToReviews: true, // Reputation management
    hasAnalytics: true, // Business insights
    showExactLocation: true,
    isFeatured: false,
    isVerifiedBadge: true,
    /** Monthly bid quota */
    bidsPerMonth: 50,
  },
  frontPage: {
    name: "Icon", // "Front Page"
    portfolioPhotos: Number.MAX_SAFE_INTEGER,
    canAcceptBookings: true,
    canShowDirectContact: true,
    canRespondToReviews: true,
    hasAnalytics: true,
    showExactLocation: true,
    isFeatured: true, // <--- This triggers the Homepage Carousel logic
    isVerifiedBadge: true,
    /** Monthly bid quota — MAX_SAFE_INTEGER means unlimited */
    bidsPerMonth: Number.MAX_SAFE_INTEGER,
  },
} as const;

// New Object to handle your Billing Logic
export const TIER_PRICING = {
  free: {
    monthly: 0,
    yearly: 0,
    stripePriceIdMonth: null,
    stripePriceIdYear: null,
  },
  amateur: {
    monthly: 900,   // $9.00/mo
    yearly: 9000,   // $90.00/yr
    stripePriceIdMonth: "price_1TOraXQRJTQEheTOvLHhTihz",
    stripePriceIdYear:  "price_1TOraXQRJTQEheTOVr8zI9O4",
  },
  professional: {
    monthly: 1900,  // $19.00/mo
    yearly: 19000,  // $190.00/yr
    stripePriceIdMonth: "price_1TOraYQRJTQEheTO3k4MS3PR",
    stripePriceIdYear:  "price_1TOraYQRJTQEheTOHNQL82m3",
  },
  frontPage: {
    monthly: 3900,  // $39.00/mo
    yearly: 39000,  // $390.00/yr
    stripePriceIdMonth: "price_1TOraZQRJTQEheTOofBdpJwM",
    stripePriceIdYear:  "price_1TOraaQRJTQEheTOwDiBtF35",
  },
} as const;

/** @deprecated Use SubscriptionTier from @shared/const instead */
export type ArtistTierKey = keyof typeof TIER_LIMITS;

export function getTierLimits(tier: ArtistTierKey) {
  // Fallback to free if the tier string is invalid
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function getTierPricing(tier: ArtistTierKey) {
  return TIER_PRICING[tier] || TIER_PRICING.free;
}

export function canUploadMorePhotos(
  tier: ArtistTierKey,
  currentCount: number,
): boolean {
  const limits = getTierLimits(tier);
  return currentCount < limits.portfolioPhotos;
}

// ============================================
// CLIENT SUBSCRIPTION TIERS
// ============================================

export const CLIENT_TIER_LIMITS = {
  client_free: {
    name: "Collector",
    requestsPerMonth: 1,
    aiGenerationsPerMonth: 0,
    directChatWithArtists: false,
    priorityRequestBoard: false,
    depositFeeWaived: false,
  },
  client_plus: {
    name: "Enthusiast",
    requestsPerMonth: 10,
    aiGenerationsPerMonth: 10,
    directChatWithArtists: false,
    priorityRequestBoard: true,
    depositFeeWaived: false,
  },
  client_elite: {
    name: "Elite Ink",
    requestsPerMonth: Number.MAX_SAFE_INTEGER, // Unlimited
    aiGenerationsPerMonth: Number.MAX_SAFE_INTEGER, // Unlimited
    directChatWithArtists: true,
    priorityRequestBoard: true,
    depositFeeWaived: true,
  },
} as const;

export const CLIENT_TIER_PRICING = {
  client_free: {
    monthly: 0,
    stripePriceIdMonth: null,
  },
  client_plus: {
    monthly: 900, // $9.00
    // TODO: Create client_plus product in Stripe and set STRIPE_CLIENT_PLUS_PRICE_ID env var
    stripePriceIdMonth: process.env.STRIPE_CLIENT_PLUS_PRICE_ID ?? null,
  },
  client_elite: {
    monthly: 1900, // $19.00
    // TODO: Create client_elite product in Stripe and set STRIPE_CLIENT_ELITE_PRICE_ID env var
    stripePriceIdMonth: process.env.STRIPE_CLIENT_ELITE_PRICE_ID ?? null,
  },
} as const;

export type ClientSubscriptionTier = keyof typeof CLIENT_TIER_LIMITS;

export function getClientTierLimits(tier: ClientSubscriptionTier) {
  return CLIENT_TIER_LIMITS[tier] || CLIENT_TIER_LIMITS.client_free;
}

export function getClientTierPricing(tier: ClientSubscriptionTier) {
  return CLIENT_TIER_PRICING[tier] || CLIENT_TIER_PRICING.client_free;
}
