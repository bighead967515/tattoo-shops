import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, X, Crown, Zap, Palette } from "lucide-react";
import { Link } from "wouter";
import { ARTIST_TIER_LIMITS, ARTIST_TIER_PRICING, type ArtistSubscriptionTier } from "@shared/tierLimits";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const artistTierOrder: ArtistSubscriptionTier[] = [
  "artist_free",
  "artist_paygo",
  "artist_pro",
  "artist_elite",
];

const ARTIST_TIER_DESCRIPTIONS: Record<ArtistSubscriptionTier, string> = {
  artist_free: "Start free, build your profile, and get discovered.",
  artist_paygo: "Flexible option for occasional artists who want to pay only when it pays off.",
  artist_pro: "The main growth tier for artists ready to take on more clients.",
  artist_elite: "Premium visibility and tools for studios that want maximum momentum.",
};

const TIER_FEATURES: Record<ArtistSubscriptionTier, Array<{ label: string; included: boolean }>> = {
  artist_free: [
    { label: "Profile, styles, and location", included: true },
    { label: "10 portfolio photos", included: true },
    { label: "Appear in search results", included: true },
    { label: "Receive direct inquiries", included: true },
    { label: "Bid on client requests", included: false },
    { label: "Booking calendar + deposits", included: false },
    { label: "AI design generation", included: false },
    { label: "Verified badge", included: false },
  ],
  artist_paygo: [
    { label: "Keep your profile live", included: true },
    { label: "Flexible pace for occasional work", included: true },
    { label: "Pay only when you win a booking", included: true },
    { label: "3 lightweight bids to stay active", included: true },
    { label: "Upgrade later for lower fees", included: true },
    { label: "Verified badge", included: false },
    { label: "Priority visibility", included: false },
  ],
  artist_pro: [
    { label: "Unlimited portfolio photos", included: true },
    { label: "Unlimited bidding", included: true },
    { label: "Lower 5% booking fee", included: true },
    { label: "50 AI generations per month", included: true },
    { label: "Booking calendar + deposits", included: true },
    { label: "Verified badge", included: true },
    { label: "Messaging credits", included: true },
  ],
  artist_elite: [
    { label: "Everything in Pro Studio", included: true },
    { label: "Lowest 3% booking fee", included: true },
    { label: "Unlimited AI generations", included: true },
    { label: "Sponsored placement", included: true },
    { label: "Priority support", included: true },
    { label: "Advanced analytics", included: true },
    { label: "Unlimited messaging credits", included: true },
  ],
};

export default function Pricing() {
  const { data: foundingStatus } = trpc.artists.getFoundingStatus.useQuery();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container text-center">
            <h1 className="text-5xl font-bold mb-6">
              Pricing that grows with <span className="text-primary">your studio</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Start free, get discovered, and upgrade when you are ready to take on more clients.
              Clients can still post requests and compare artists without paying anything.
            </p>
          </div>
        </section>

        {/* Artist Tiers */}
        <section className="py-16 container">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Artist Plans</h2>
            <p className="text-muted-foreground">Choose how you want to grow your studio</p>
          </div>

          <div className="grid xl:grid-cols-4 lg:grid-cols-2 md:grid-cols-1 gap-6 max-w-6xl mx-auto">
            {artistTierOrder.map((tier) => {
              const limits = ARTIST_TIER_LIMITS[tier];
              const pricing = ARTIST_TIER_PRICING[tier];
              const isMostPopular = tier === "artist_pro";
              const isElite = tier === "artist_elite";
              const isFoundingActive = isMostPopular && foundingStatus && !foundingStatus.isSoldOut;
              const displayedPrice = isFoundingActive ? 1900 : pricing.monthly;
              const tierFeatures = TIER_FEATURES[tier];

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
                        {isFoundingActive ? "FOUNDING OFFER" : "MOST POPULAR"}
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
                      ${displayedPrice / 100}
                      <span className="text-xl text-muted-foreground">/mo</span>
                    </div>
                    {isFoundingActive ? (
                      <>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                          🔒 Locked-in price + 3-Month Free Trial!
                        </div>
                        <div className="text-xs text-green-600 font-semibold mb-1">
                          or $9.99/mo ($119.88/yr) billed annually
                        </div>
                      </>
                    ) : isMostPopular ? (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                        🎁 Includes 1-Month Free Trial!
                      </div>
                    ) : null}
                    {tier === "artist_pro" && !isFoundingActive && (
                      <div className="text-xs text-muted-foreground mb-1">or $290/yr</div>
                    )}
                    {tier === "artist_elite" && (
                      <div className="text-xs text-muted-foreground mb-1">or $790/yr</div>
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
                      {tier === "artist_free"
                        ? "Start Free"
                        : tier === "artist_paygo"
                        ? "Choose Flex Plan"
                        : isElite
                        ? "Go Elite"
                        : "Choose Pro"}
                    </Link>
                  </Button>

                  <div className="space-y-3 text-sm flex-1">
                    {tierFeatures.map((feature) => (
                      <FeatureRow
                        key={feature.label}
                        enabled={feature.included}
                        label={feature.label}
                        highlight={tier === "artist_pro" && feature.label.includes("Unlimited")}
                        neutral={tier === "artist_free" && !feature.included}
                      />
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {foundingStatus?.isSoldOut ? (
              <span>👑 Founding Artist Offer is now SOLD OUT! Standard pricing applies.</span>
            ) : (
              <span>
                Founding Artist spots are limited to the first 50 qualifying artists ({50 - (foundingStatus?.count ?? 0)} spots remaining).
                Requires a complete portfolio and 3+ bid responses within 60 days.
              </span>
            )}
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
