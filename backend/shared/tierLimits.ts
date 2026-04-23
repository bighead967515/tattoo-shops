/**
 * Artist subscription tier limits and features
 *
 * ── NEW 3-LAYER MONETIZATION MODEL ────────────────────────────────────────
 *
 * Layer 1 — Free (artist_free)
 *   The artist acquisition funnel. No barriers to joining.
 *   10 portfolio photos, directory listing, receive inquiries.
 *   NO bidding access, NO booking calendar, NO payment processing.
 *
 * Layer 2 — Pro Subscription (artist_pro)
 *   $19–29/mo (monthly) or $190–290/yr (annual, 2 months free).
 *   Unlimited portfolio, bidding access, booking calendar, Stripe payments,
 *   verified badge, messaging, analytics. Transaction fee: 5% on accepted bids.
 *   Founding Artists: 6 months free, then $19/mo locked for life.
 *
 * Layer 3 — Pay-as-you-go (artist_payg)
 *   $0/mo subscription. Bidding access with 10–12% transaction fee on
 *   accepted bids. For artists who hate subscriptions.
 *   Converts to Pro once they do the math.
 *
 * ── LEGACY KEY MAPPING ────────────────────────────────────────────────────
 *   free         → artist_free  (Layer 1)
 *   amateur      → artist_pro   (Layer 2 — Pro subscriber)
 *   professional → artist_payg  (Layer 3 — Pay-as-you-go)
 *   frontPage    → artist_founding (Founding Artist — Pro + badge)
 *
 * NOTE: The canonical SubscriptionTier Zod enum lives in @shared/const.ts.
 * Legacy keys below are kept for backward-compatibility with feature-flag look-ups.
 */

import {
  SubscriptionTiers,
  type SubscriptionTier,
  TIER_LIMITS as UNIFIED_TIER_LIMITS,
} from "./const";

// Re-export for consumers that import from this file
export { SubscriptionTiers, UNIFIED_TIER_LIMITS };
export type { SubscriptionTier };

// ─── Transaction fee rates ────────────────────────────────────────────────────
/** Platform fee as a decimal (e.g. 0.05 = 5%) charged on accepted bid transactions */
export const TRANSACTION_FEE_RATES = {
  /** Free tier — no bidding, no fee */
  free: 0,
  /** Pro subscriber — reduced fee as reward for subscription */
  amateur: 0.05,  // 5%
  /** Pay-as-you-go — higher fee, no subscription cost */
  professional: 0.10, // 10%
  /** Founding Artist — same as Pro (5%) */
  frontPage: 0.05,  // 5%
} as const;

export const TIER_LIMITS = {
  // ── Layer 1: Free (Artist Acquisition Funnel) ─────────────────────────────
  free: {
    name: "Free",
    displayName: "Free",
    description: "Get discovered. Build your presence.",
    portfolioPhotos: 10,
    canAcceptBookings: false,
    canShowDirectContact: false,
    canRespondToReviews: false,
    hasAnalytics: false,
    showExactLocation: false,
    isFeatured: false,
    isVerifiedBadge: false,
    /** 0 = bidding completely blocked on free tier */
    bidsPerMonth: 0,
    /** Platform transaction fee on accepted bids */
    transactionFeeRate: TRANSACTION_FEE_RATES.free,
    isFoundingArtist: false,
  },

  // ── Layer 2: Pro Subscription ($19–29/mo) ─────────────────────────────────
  amateur: {
    name: "Pro",
    displayName: "Pro",
    description: "The full toolkit. Grow your clientele.",
    portfolioPhotos: Number.MAX_SAFE_INTEGER, // Unlimited
    canAcceptBookings: true,
    canShowDirectContact: true,
    canRespondToReviews: true,
    hasAnalytics: true,
    showExactLocation: true,
    isFeatured: false,
    isVerifiedBadge: true,
    /** Unlimited bids for Pro subscribers */
    bidsPerMonth: Number.MAX_SAFE_INTEGER,
    /** Reduced 5% fee as reward for subscription */
    transactionFeeRate: TRANSACTION_FEE_RATES.amateur,
    isFoundingArtist: false,
  },

  // ── Layer 3: Pay-as-you-go (No subscription, higher fee) ─────────────────
  professional: {
    name: "Pay-as-you-go",
    displayName: "Pay-as-you-go",
    description: "Bid on clients. Pay only when you win.",
    portfolioPhotos: 10,
    canAcceptBookings: false,
    canShowDirectContact: false,
    canRespondToReviews: false,
    hasAnalytics: false,
    showExactLocation: false,
    isFeatured: false,
    isVerifiedBadge: false,
    /** Unlimited bids — they pay per transaction instead */
    bidsPerMonth: Number.MAX_SAFE_INTEGER,
    /** 10% fee on accepted bids — no subscription required */
    transactionFeeRate: TRANSACTION_FEE_RATES.professional,
    isFoundingArtist: false,
  },

  // ── Founding Artist: Pro features + lifetime $19/mo lock-in ──────────────
  frontPage: {
    name: "Founding Artist",
    displayName: "Founding Artist",
    description: "Founding member. Pro features. Locked-in rate for life.",
    portfolioPhotos: Number.MAX_SAFE_INTEGER,
    canAcceptBookings: true,
    canShowDirectContact: true,
    canRespondToReviews: true,
    hasAnalytics: true,
    showExactLocation: true,
    isFeatured: true, // Featured badge on profile + homepage carousel
    isVerifiedBadge: true,
    /** Unlimited bids — same as Pro */
    bidsPerMonth: Number.MAX_SAFE_INTEGER,
    /** Same 5% fee as Pro */
    transactionFeeRate: TRANSACTION_FEE_RATES.frontPage,
    isFoundingArtist: true,
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
    monthly: 2900,   // $29.00/mo (standard)
    yearly: 23200,   // $232.00/yr ($19.33/mo — 2 months free)
    stripePriceIdMonth: "price_1TPRL5QRJTQEheTOSH3mNyqG",
    stripePriceIdYear:  "price_1TPRL5QRJTQEheTOSfZmYLxK",
  },
  professional: {
    // Pay-as-you-go: $0 subscription, 10% transaction fee
    monthly: 0,
    yearly: 0,
    stripePriceIdMonth: null,
    stripePriceIdYear: null,
  },
  frontPage: {
    // Founding Artist: $19/mo locked for life
    monthly: 1900,   // $19.00/mo (lifetime lock-in)
    yearly: 19000,   // $190.00/yr
    stripePriceIdMonth: "price_1TPRL7QRJTQEheTO4JP4apjA",
    stripePriceIdYear:  "price_1TPRL8QRJTQEheTOrzqCXrTj",
  },
} as const;

/** @deprecated Use SubscriptionTier from @shared/const instead */
export type ArtistTierKey = keyof typeof TIER_LIMITS;

export function getTierLimits(tier: ArtistTierKey) {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function getTierPricing(tier: ArtistTierKey) {
  return TIER_PRICING[tier] || TIER_PRICING.free;
}

/**
 * Returns the transaction fee rate (as a decimal) for a given tier.
 * e.g. 0.05 = 5%, 0.10 = 10%, 0 = no fee (free tier, no bidding)
 */
export function getTransactionFeeRate(tier: ArtistTierKey): number {
  return TIER_LIMITS[tier]?.transactionFeeRate ?? 0;
}

/**
 * Calculates the platform fee amount in cents for a given bid price.
 * @param priceInCents - The accepted bid price in cents
 * @param tier - The artist's subscription tier
 * @returns The platform fee in cents (rounded to nearest cent)
 */
export function calculatePlatformFee(priceInCents: number, tier: ArtistTierKey): number {
  const rate = getTransactionFeeRate(tier);
  return Math.round(priceInCents * rate);
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
    stripePriceIdMonth: process.env.STRIPE_CLIENT_PLUS_PRICE_ID ?? null,
  },
  client_elite: {
    monthly: 1900, // $19.00
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
