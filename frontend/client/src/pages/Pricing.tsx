import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, X, Crown, Zap, Palette } from "lucide-react";
import { Link } from "wouter";
import { TIER_LIMITS, TIER_PRICING, CLIENT_TIER_LIMITS, CLIENT_TIER_PRICING } from "@shared/tierLimits";
import {
  toLegacyArtistTier,
  type ArtistCanonicalTier,
} from "@shared/tierCompat";
import { cn } from "@/lib/utils";

const artistTierOrder: ArtistCanonicalTier[] = [
  "artist_free",
  "artist_amateur",
  "artist_pro",
  "artist_icon",
];

const clientTierOrder = ["client_free", "client_plus", "client_elite"] as const;

const ARTIST_TIER_DESCRIPTIONS: Record<ArtistCanonicalTier, string> = {
  artist_free: "A free profile to get discovered.",
  artist_amateur: "Subscription plan with lower transaction fees.",
  artist_pro: "No subscription. Bid and pay only when you win.",
  artist_icon: "Founding member perks. Pro features. Rate locked for life.",
};

export default function Pricing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container text-center">
            <h1 className="text-5xl font-bold mb-6">
              Pricing for <span className="text-primary">Every Path</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Artists: start free, subscribe to Pro, or pay per win.
              Clients: post requests and find your perfect artist.
            </p>
          </div>
        </section>

        {/* Artist Tiers */}
        <section className="py-16 container">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Artist Plans</h2>
            <p className="text-muted-foreground">Choose how you want to grow your studio</p>
          </div>

          <div className="grid xl:grid-cols-4 lg:grid-cols-2 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {artistTierOrder.map((tier) => {
              const legacyTier = toLegacyArtistTier(tier);
              const limits = TIER_LIMITS[legacyTier];
              const pricing = TIER_PRICING[legacyTier];
              const isMostPopular = tier === "artist_amateur";
              const isFoundingArtist = tier === "artist_icon";

              return (
                <Card
                  key={tier}
                  className={cn(
                    "p-7 flex flex-col relative",
                    isMostPopular && "border-2 border-primary bg-gradient-to-br from-primary/10 to-background",
                    isFoundingArtist && "border-2 border-amber-400 bg-gradient-to-br from-amber-50/60 to-background dark:from-amber-950/20",
                    !isMostPopular && !isFoundingArtist && "border-border",
                  )}
                >
                  {isMostPopular && (
                    <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                      <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        MOST POPULAR
                      </div>
                    </div>
                  )}
                  {isFoundingArtist && (
                    <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                      <div className="bg-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        FOUNDING ARTIST
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h2 className={cn(
                      "text-2xl font-bold mb-2",
                      isFoundingArtist && "text-amber-700 dark:text-amber-400",
                    )}>
                      {limits.name}
                    </h2>
                    <div className="text-4xl font-bold mb-1">
                      ${pricing.monthly / 100}
                      <span className="text-xl text-muted-foreground">/mo</span>
                    </div>
                    {isFoundingArtist && (
                      <div className="text-xs text-amber-600 font-semibold mb-1">
                        6 months FREE · then $19/mo locked for life
                      </div>
                    )}
                    {tier === "artist_amateur" && (
                      <div className="text-xs text-muted-foreground mb-1">or $232/yr (2 months free)</div>
                    )}
                    <p className="text-muted-foreground text-xs mt-2">
                      {ARTIST_TIER_DESCRIPTIONS[tier]}
                    </p>
                  </div>

                  <Button
                    className={cn("w-full mb-6 group", isFoundingArtist && "bg-amber-500 hover:bg-amber-600 text-white border-0")}
                    variant={isMostPopular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/artist/billing">
                      <Zap className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                      {tier === "artist_free" ? "Start Free" : isFoundingArtist ? "Claim Spot" : "Choose Plan"}
                    </Link>
                  </Button>

                  <div className="space-y-3 text-sm flex-1">
                    <FeatureRow
                      enabled
                      label={`${limits.portfolioPhotos === Number.MAX_SAFE_INTEGER ? "Unlimited" : limits.portfolioPhotos} portfolio photos`}
                      highlight={limits.portfolioPhotos === Number.MAX_SAFE_INTEGER}
                    />
                    <FeatureRow enabled={limits.canAcceptBookings} label="Accept bookings" />
                    <FeatureRow enabled={limits.canShowDirectContact} label="Direct contact info" />
                    <FeatureRow enabled={limits.canRespondToReviews} label="Respond to reviews" />
                    <FeatureRow enabled={limits.hasAnalytics} label="Profile analytics" />
                    <FeatureRow enabled={isFoundingArtist} label="Featured badge + homepage placement" />
                    <FeatureRow
                      enabled
                      label={`${Math.round((limits.transactionFeeRate ?? 0) * 100)}% transaction fee`}
                      neutral={limits.transactionFeeRate === 0}
                    />
                  </div>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Founding Artist spots are limited to the first 100 qualifying artists.
            Requires a complete portfolio and 3+ bid responses within 60 days.
          </p>
        </section>

        <Separator className="max-w-5xl mx-auto" />

        {/* Client Tiers */}
        <section className="py-16 container">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Client Plans</h2>
            <p className="text-muted-foreground">Post requests, compare bids, and book the perfect artist</p>
          </div>

          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {clientTierOrder.map((tier) => {
              const limits = CLIENT_TIER_LIMITS[tier];
              const pricing = CLIENT_TIER_PRICING[tier];
              const isMostPopular = tier === "client_plus";

              return (
                <Card
                  key={tier}
                  className={cn(
                    "p-7 flex flex-col relative",
                    isMostPopular
                      ? "border-2 border-primary bg-gradient-to-br from-primary/10 to-background"
                      : "border-border",
                  )}
                >
                  {isMostPopular && (
                    <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                      <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">{limits.name}</h2>
                    <div className="text-4xl font-bold mb-1">
                      ${pricing.monthly / 100}
                      <span className="text-xl text-muted-foreground">/mo</span>
                    </div>
                  </div>

                  <Button
                    className="w-full mb-6 group"
                    variant={isMostPopular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/client/onboarding">
                      <Palette className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                      {tier === "client_free" ? "Start Free" : "Get Started"}
                    </Link>
                  </Button>

                  <div className="space-y-3 text-sm flex-1">
                    <FeatureRow
                      enabled
                      label={`${limits.requestsPerMonth === Number.MAX_SAFE_INTEGER ? "Unlimited" : limits.requestsPerMonth} request${limits.requestsPerMonth === 1 ? "" : "s"}/month`}
                      highlight={limits.requestsPerMonth === Number.MAX_SAFE_INTEGER}
                    />
                    <FeatureRow
                      enabled={limits.aiGenerationsPerMonth > 0}
                      label={`${limits.aiGenerationsPerMonth === Number.MAX_SAFE_INTEGER ? "Unlimited" : limits.aiGenerationsPerMonth} AI design generation${limits.aiGenerationsPerMonth !== 1 ? "s" : ""}/month`}
                      highlight={limits.aiGenerationsPerMonth === Number.MAX_SAFE_INTEGER}
                    />
                    <FeatureRow enabled={limits.priorityRequestBoard} label="Priority on request board" />
                    <FeatureRow enabled={limits.directChatWithArtists} label="Direct chat with artists" />
                    <FeatureRow enabled={limits.depositFeeWaived} label="Deposit booking fee waived" />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureRow({
  enabled,
  label,
  highlight = false,
  neutral = false,
}: {
  enabled: boolean;
  label: string;
  highlight?: boolean;
  neutral?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {enabled ? (
        <Check className={cn("w-4 h-4 flex-shrink-0", highlight ? "text-green-500" : "text-green-500")} />
      ) : (
        <X className="w-4 h-4 flex-shrink-0 text-destructive" />
      )}
      <span className={cn(neutral && "text-muted-foreground")}>{label}</span>
    </div>
  );
}
