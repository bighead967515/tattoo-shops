import type { SubscriptionTier } from "./const";

export type ArtistCanonicalTier = Extract<
  SubscriptionTier,
  "artist_free" | "artist_paygo" | "artist_pro" | "artist_elite"
>;

export type LegacyArtistTier =
  | "free"
  | "amateur"
  | "professional"
  | "frontPage";

const FREE_ARTIST_TIERS = ["artist_free", "free"] as const;
const AI_BID_ASSISTANT_TIERS = [
  "artist_paygo",
  "artist_pro",
  "artist_elite",
  "amateur",
  "frontPage",
  "professional",
] as const;

function hasTierValue(
  tier: string | null | undefined,
  allowed: readonly string[],
): boolean {
  return !!tier && allowed.includes(tier);
}

export function isFreeArtistTier(tier: string | null | undefined): boolean {
  return hasTierValue(tier, FREE_ARTIST_TIERS);
}

export function canUseAiBidAssistant(tier: string | null | undefined): boolean {
  return hasTierValue(tier, AI_BID_ASSISTANT_TIERS);
}

export function isFreeClientTier(tier: string | null | undefined): boolean {
  return tier === "client_free" || tier === "free";
}

const LEGACY_ARTIST_TIER_BY_CANONICAL: Record<
  ArtistCanonicalTier,
  LegacyArtistTier
> = {
  artist_free: "free",
  artist_paygo: "amateur",
  artist_pro: "professional",
  artist_elite: "frontPage",
};

export function toLegacyArtistTier(
  tier: ArtistCanonicalTier,
): LegacyArtistTier {
  return LEGACY_ARTIST_TIER_BY_CANONICAL[tier];
}
