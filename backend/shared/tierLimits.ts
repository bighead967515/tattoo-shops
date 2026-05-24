export function readRuntimeEnv(key: string): string | null {
  if (typeof process !== "undefined" && process.env) {
    if (process.env[key] !== undefined) return process.env[key] as string;
  }
  if (typeof import.meta !== "undefined" && (import.meta as any).env) {
    const viteKey = `VITE_${key}`;
    if ((import.meta as any).env[viteKey] !== undefined) {
      return (import.meta as any).env[viteKey] as string;
    }
  }
  return null;
}

export const ARTIST_TIER_LIMITS = {
  artist_free: {
    name: "Directory Profile",
    portfolioPhotos: 10,
    canBid: false,
    freeBidsPerMonth: 0,
    transactionFeePercent: 0, // Cannot book
    aiGenerationsPerMonth: 0,
    chatTokensPerMonth: 0,
    sponsoredListing: false,
    verifiedBadge: true,
  },
  artist_paygo: {
    name: "Pay-as-you-go",
    portfolioPhotos: 20,
    canBid: true,
    freeBidsPerMonth: 5,
    transactionFeePercent: 15,
    aiGenerationsPerMonth: 0,
    chatTokensPerMonth: 0,
    sponsoredListing: false,
    verifiedBadge: true,
  },
  artist_pro: {
    name: "Pro Studio",
    portfolioPhotos: Number.MAX_SAFE_INTEGER,
    canBid: true,
    freeBidsPerMonth: Number.MAX_SAFE_INTEGER,
    transactionFeePercent: 5,
    aiGenerationsPerMonth: 50,
    chatTokensPerMonth: 0, // Still must buy extra if client didn't pay
    sponsoredListing: false,
    verifiedBadge: true,
  },
  artist_elite: {
    name: "Elite Icon",
    portfolioPhotos: Number.MAX_SAFE_INTEGER,
    canBid: true,
    freeBidsPerMonth: Number.MAX_SAFE_INTEGER,
    transactionFeePercent: 3,
    aiGenerationsPerMonth: Number.MAX_SAFE_INTEGER,
    chatTokensPerMonth: Number.MAX_SAFE_INTEGER, // Unlimited free chats
    sponsoredListing: true,
    verifiedBadge: true, // "Elite Sponsored" badge applied via UI
  },
} as const;

export const ARTIST_TIER_PRICING = {
  artist_free: {
    monthly: 0,
    yearly: 0,
    stripePriceIdMonth: null,
    stripePriceIdYear: null,
  },
  artist_paygo: {
    monthly: 0,
    yearly: 0,
    stripePriceIdMonth: null,
    stripePriceIdYear: null,
  },
  artist_pro: {
    monthly: 4900,   // $49.00/mo
    yearly: 49000,   // $490.00/yr (2 months free)
    stripePriceIdMonth: readRuntimeEnv("STRIPE_ARTIST_PRO_PRICE_ID_MONTH"),
    stripePriceIdYear:  readRuntimeEnv("STRIPE_ARTIST_PRO_PRICE_ID_YEAR"),
  },
  artist_elite: {
    monthly: 9900,   // $99.00/mo
    yearly: 99000,   // $990.00/yr (2 months free)
    stripePriceIdMonth: readRuntimeEnv("STRIPE_ARTIST_ELITE_PRICE_ID_MONTH"),
    stripePriceIdYear:  readRuntimeEnv("STRIPE_ARTIST_ELITE_PRICE_ID_YEAR"),
  },
} as const;

export type ArtistSubscriptionTier = keyof typeof ARTIST_TIER_LIMITS;

export function getArtistTierLimits(tier: ArtistSubscriptionTier) {
  return ARTIST_TIER_LIMITS[tier] || ARTIST_TIER_LIMITS.artist_free;
}

export function getArtistTierPricing(tier: ArtistSubscriptionTier) {
  return ARTIST_TIER_PRICING[tier] || ARTIST_TIER_PRICING.artist_free;
}

export function canArtistAddMorePhotos(tier: ArtistSubscriptionTier, currentCount: number) {
  const limits = getArtistTierLimits(tier);
  return currentCount < limits.portfolioPhotos;
}

// ============================================
// CLIENT SUBSCRIPTION TIERS
// ============================================

export const CLIENT_TIER_LIMITS = {
  client_free: {
    name: "Collector",
    requestsPerMonth: Number.MAX_SAFE_INTEGER,
    aiGenerationsPerMonth: 0,
    directChatWithArtists: false,
    priorityRequestBoard: false,
    depositFeeWaived: false,
  },
} as const;

export const CLIENT_TIER_PRICING = {
  client_free: {
    monthly: 0,
    stripePriceIdMonth: null,
  },
} as const;

export type ClientSubscriptionTier = keyof typeof CLIENT_TIER_LIMITS;

export function getClientTierLimits(tier: ClientSubscriptionTier) {
  return CLIENT_TIER_LIMITS[tier] || CLIENT_TIER_LIMITS.client_free;
}

export function getClientTierPricing(tier: ClientSubscriptionTier) {
  return CLIENT_TIER_PRICING[tier] || CLIENT_TIER_PRICING.client_free;
}
