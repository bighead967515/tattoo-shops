import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, X, Crown, Zap, Palette } from "lucide-react";
import { Link } from "wouter";
import { ARTIST_TIER_LIMITS, ARTIST_TIER_PRICING, type ArtistSubscriptionTier } from "@shared/tierLimits";
import { cn } from "@/lib/utils";

const artistTierOrder: ArtistSubscriptionTier[] = [
  "artist_free",
  "artist_paygo",
  "artist_pro",
  "artist_elite",
];

const ARTIST_TIER_DESCRIPTIONS: Record<ArtistSubscriptionTier, string> = {
  artist_free: "A free profile to get discovered.",
  artist_paygo: "Pay-as-you-go bidding. Pay only when booked.",
  artist_pro: "Pro Studio features to supercharge your business.",
  artist_elite: "Elite status, sponsored placement, ultimate growth.",
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
              const limits = ARTIST_TIER_LIMITS[tier];
              const pricing = ARTIST_TIER_PRICING[tier];
              const isMostPopular = tier === "artist_pro";
              const isElite = tier === "artist_elite";

              return (
                <Card
                  key={tier}
                  className={cn(
                    "p-7 flex flex-col relative",
                    isMostPopular && "border-2 border-primary bg-gradient-to-br from-primary/10 to-background",
                    isElite && "border-2 border-amber-400 bg-gradient-to-br from-amber-50/60 to-background dark:from-amber-950/20",
                    !isMostPopular && !isElite && "border-border",
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
                  {isElite && (
                    <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                      <div className="bg-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        ELITE STATUS
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h2 className={cn(
                      "text-2xl font-bold mb-2",
                      isElite && "text-amber-700 dark:text-amber-400",
                    )}>
                      {limits.name}
                    </h2>
                    <div className="text-4xl font-bold mb-1">
                      ${pricing.monthly / 100}
                      <span className="text-xl text-muted-foreground">/mo</span>
                    </div>
                    {tier === "artist_pro" && (
                      <div className="text-xs text-muted-foreground mb-1">or $490/yr (2 months free)</div>
                    )}
                    {tier === "artist_elite" && (
                      <div className="text-xs text-muted-foreground mb-1">or $990/yr (2 months free)</div>
                    )}
                    <p className="text-muted-foreground text-xs mt-2">
                      {ARTIST_TIER_DESCRIPTIONS[tier]}
                    </p>
                  </div>

                  <Button
                    className={cn("w-full mb-6 group", isElite && "bg-amber-500 hover:bg-amber-600 text-white border-0")}
                    variant={isMostPopular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/artist/billing">
                      <Zap className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                      {tier === "artist_free" ? "Start Free" : isElite ? "Go Elite" : "Choose Plan"}
                    </Link>
                  </Button>

                  <div className="space-y-3 text-sm flex-1">
                    <FeatureRow
                      enabled
                      label={`${limits.portfolioPhotos === Number.MAX_SAFE_INTEGER ? "Unlimited" : limits.portfolioPhotos} portfolio photos`}
                      highlight={limits.portfolioPhotos === Number.MAX_SAFE_INTEGER}
                    />
                    <FeatureRow enabled={limits.canBid} label="Bid on client requests" />
                    <FeatureRow enabled={limits.freeBidsPerMonth > 0} label={`${limits.freeBidsPerMonth === Number.MAX_SAFE_INTEGER ? "Unlimited" : limits.freeBidsPerMonth} free bids/month`} />
                    <FeatureRow enabled={limits.aiGenerationsPerMonth > 0} label={`${limits.aiGenerationsPerMonth === Number.MAX_SAFE_INTEGER ? "Unlimited" : limits.aiGenerationsPerMonth} AI design generations`} />
                    <FeatureRow enabled={limits.chatTokensPerMonth > 0} label="Free client messaging credits" />
                    <FeatureRow enabled={limits.sponsoredListing} label="Sponsored placement" />
                    <FeatureRow enabled={limits.verifiedBadge} label="Verified Badge" />
                    <FeatureRow
                      enabled
                      label={`${limits.transactionFeePercent}% booking fee`}
                      neutral={limits.transactionFeePercent === 0}
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

        {/* Client Section */}
        <section className="py-16 container">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">For Clients</h2>
            <p className="text-muted-foreground">Post requests, compare bids, and book the perfect artist — free</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <Palette className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Always Free</h3>
              <p className="text-muted-foreground mb-6">
                Creating an account, posting tattoo requests, and browsing artist bids is completely free.
                Pay only for optional add-ons that enhance your experience.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm text-left mb-6">
                <FeatureRow enabled label="Post tattoo requests" />
                <FeatureRow enabled label="Receive and compare bids" />
                <FeatureRow enabled label="Browse all artists" />
                <FeatureRow enabled label="Secure deposits via Stripe" />
                <FeatureRow enabled label="Priority placement (add-on)" />
                <FeatureRow enabled label="AI price estimate (add-on)" />
                <FeatureRow enabled label="Concept art matching (add-on)" />
                <FeatureRow enabled label="AI design credits (add-on)" />
              </div>
              <Button asChild>
                <Link href="/client/onboarding">
                  <Palette className="h-4 w-4 mr-2" />
                  Get Started Free
                </Link>
              </Button>
            </Card>
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
