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
  "artist_amateur",
  "artist_pro",
  "artist_icon",
  "client_free",
  "client_plus",
  "client_elite",
]);

export type SubscriptionTier = z.infer<typeof SubscriptionTiers>;

export const TIER_LIMITS: Record<
  SubscriptionTier,
  { portfolioMax: number; aiCredits: number; canBook: boolean }
> = {
  artist_free: { portfolioMax: 3, aiCredits: 0, canBook: false },
  artist_amateur: { portfolioMax: 15, aiCredits: 0, canBook: true },
  artist_pro: { portfolioMax: 999, aiCredits: 0, canBook: true },
  artist_icon: { portfolioMax: 999, aiCredits: 0, canBook: true },

  client_free: { portfolioMax: 0, aiCredits: 0, canBook: true },
  client_plus: { portfolioMax: 0, aiCredits: 10, canBook: true },
  client_elite: { portfolioMax: 0, aiCredits: 999, canBook: true },
};
