import type { SubscriptionTier } from "./const";

export type ArtistCanonicalTier = Extract<
  SubscriptionTier,
  "artist_free" | "artist_amateur" | "artist_pro" | "artist_icon"
>;

export type LegacyArtistTier =
  | "free"
  | "amateur"
  | "professional"
  | "frontPage";

const FREE_ARTIST_TIERS = ["artist_free", "free"] as const;
const AI_BID_ASSISTANT_TIERS = [
  "artist_pro",
  "artist_icon",
  "professional",
  "frontPage",
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
  artist_amateur: "amateur",
  artist_pro: "professional",
  artist_icon: "frontPage",
};

export function toLegacyArtistTier(
  tier: ArtistCanonicalTier,
): LegacyArtistTier {
  return LEGACY_ARTIST_TIER_BY_CANONICAL[tier];
}
