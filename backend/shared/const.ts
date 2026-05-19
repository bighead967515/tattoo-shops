import { z } from "zod";

export {
  COOKIE_NAME,
  ONE_YEAR_MS,
  AXIOS_TIMEOUT_MS,
  UNAUTHED_ERR_MSG,
  NOT_ADMIN_ERR_MSG,
} from "./clientConst";

// ============================================
// SUBSCRIPTION TIERS — Shared Zod Schema
// ============================================

export const SubscriptionTiers = z.enum([
  "artist_free",
  "artist_paygo",
  "artist_pro",
  "artist_elite",
  "client_free",
  "client_plus",
  "client_elite",
]);

export type SubscriptionTier = z.infer<typeof SubscriptionTiers>;

export const TIER_LIMITS: Record<
  SubscriptionTier,
  { portfolioMax: number; aiCredits: number; canBook: boolean }
> = {
  // Free: strictly a directory listing.
  artist_free: { portfolioMax: 10, aiCredits: 0, canBook: false },
  
  // Pay-as-you-go: booking unlocked, 15% fee, limited free bids.
  artist_paygo: { portfolioMax: 20, aiCredits: 0, canBook: true },
  
  // Pro: $49/mo, 5% fee, unlimited bids, 50 AI credits.
  artist_pro: {
    portfolioMax: Number.MAX_SAFE_INTEGER,
    aiCredits: 50,
    canBook: true,
  },
  
  // Elite: $99/mo, 3% fee, unlimited bids, high AI allowance, sponsored listing.
  artist_elite: {
    portfolioMax: Number.MAX_SAFE_INTEGER,
    aiCredits: 999,
    canBook: true,
  },

  client_free: { portfolioMax: 0, aiCredits: 0, canBook: true },
  client_plus: { portfolioMax: 0, aiCredits: 10, canBook: true },
  client_elite: { portfolioMax: 0, aiCredits: Number.MAX_SAFE_INTEGER, canBook: true },
};
