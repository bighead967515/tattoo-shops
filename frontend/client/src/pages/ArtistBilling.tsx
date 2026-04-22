import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Check, X, Crown, Zap, Star, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { TIER_LIMITS, TIER_PRICING, type ArtistTierKey } from "@shared/tierLimits";
import {
  toLegacyArtistTier,
  type ArtistCanonicalTier,
} from "@shared/tierCompat";

const BASE_URL = "https://tattoo-artist-directory.onrender.com";

const TIER_ORDER: ArtistCanonicalTier[] = [
  "artist_free",
  "artist_amateur",
  "artist_pro",
  "artist_icon",
];

const TIER_ICONS: Record<ArtistCanonicalTier, React.ElementType> = {
  artist_free: Zap,
  artist_amateur: Star,
  artist_pro: Crown,
  artist_icon: Sparkles,
};

const TIER_DESCRIPTIONS: Record<ArtistCanonicalTier, string> = {
  artist_free: "A free profile to get you started — no credit card required.",
  artist_amateur: "Unlock bookings, direct contact, and a verified badge.",
  artist_pro: "Full suite: unlimited portfolio, analytics, and review management.",
  artist_icon: "Maximum visibility with homepage carousel feature placement.",
};

export default function ArtistBilling() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [yearly, setYearly] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const { data: artist, isLoading: artistLoading } =
    trpc.artists.getByUserId.useQuery(undefined, { enabled: !!user });

  const checkoutMutation = trpc.artists.createSubscriptionCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout. Please try again.");
      setLoadingTier(null);
    },
  });

  if (loading || artistLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    setLocation("/login");
    return null;
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">No Artist Profile Found</h1>
          <p className="text-muted-foreground mb-8">
            You need to register as an artist before managing your subscription.
          </p>
          <Button onClick={() => setLocation("/for-artists")}>
            Register as Artist
          </Button>
        </div>
      </div>
    );
  }

  const currentTier = (artist.subscriptionTier ?? "artist_free") as ArtistCanonicalTier;

  const handleSubscribe = async (tier: ArtistCanonicalTier) => {
    if (tier === "artist_free") return;
    setLoadingTier(tier);
    await checkoutMutation.mutateAsync({
      tier: tier as "artist_amateur" | "artist_pro" | "artist_icon",
      interval: yearly ? "year" : "month",
      successUrl: `${BASE_URL}/artist/billing/success?tier=${tier}`,
      cancelUrl: `${BASE_URL}/artist/billing`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container text-center">
            <h1 className="text-4xl font-bold mb-4">
              Your <span className="text-primary">Artist Plan</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
              Upgrade your plan to unlock more portfolio slots, bookings, analytics,
              and homepage visibility.
            </p>

            {/* Current plan badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-sm font-medium text-primary mb-8">
              <Crown className="h-4 w-4" />
              Current plan:{" "}
              <span className="font-bold">
                {TIER_LIMITS[toLegacyArtistTier(currentTier) as ArtistTierKey].name}
              </span>
            </div>

            {/* Monthly / Yearly toggle */}
            <div className="flex items-center justify-center gap-3">
              <Label htmlFor="billing-toggle" className="text-sm font-medium">
                Monthly
              </Label>
              <Switch
                id="billing-toggle"
                checked={yearly}
                onCheckedChange={setYearly}
              />
              <Label htmlFor="billing-toggle" className="text-sm font-medium">
                Yearly{" "}
                <span className="ml-1 text-xs text-green-600 font-semibold">
                  Save 2 months
                </span>
              </Label>
            </div>
          </div>
        </section>

        {/* Plan Cards */}
        <section className="py-12 container">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {TIER_ORDER.map((tier) => {
              const legacy = toLegacyArtistTier(tier);
              const limits = TIER_LIMITS[legacy as ArtistTierKey];
              const pricing = TIER_PRICING[legacy as ArtistTierKey];
              const isCurrent = tier === currentTier;
              const isMostPopular = tier === "artist_pro";
              const isLoading = loadingTier === tier;
              const isFree = tier === "artist_free";
              const Icon = TIER_ICONS[tier];

              const price = isFree
                ? 0
                : yearly
                ? pricing.yearly / 100
                : pricing.monthly / 100;

              const isDowngrade =
                TIER_ORDER.indexOf(tier) < TIER_ORDER.indexOf(currentTier);

              return (
                <Card
                  key={tier}
                  className={cn(
                    "p-6 flex flex-col relative transition-all",
                    isMostPopular
                      ? "border-2 border-primary bg-gradient-to-br from-primary/10 to-background shadow-lg scale-[1.02]"
                      : isCurrent
                      ? "border-2 border-green-500/60 bg-green-500/5"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {/* Badges */}
                  {isMostPopular && !isCurrent && (
                    <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                      <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        MOST POPULAR
                      </div>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        CURRENT PLAN
                      </div>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="text-center mb-6 flex-grow">
                    <div className="flex justify-center mb-3">
                      <div
                        className={cn(
                          "p-3 rounded-full",
                          isMostPopular
                            ? "bg-primary/20"
                            : "bg-muted",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-6 w-6",
                            isMostPopular ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{limits.name}</h2>
                    <div className="text-4xl font-bold mb-2">
                      ${price}
                      {!isFree && (
                        <span className="text-lg text-muted-foreground font-normal">
                          /{yearly ? "yr" : "mo"}
                        </span>
                      )}
                    </div>
                    {!isFree && yearly && (
                      <p className="text-xs text-green-600 font-medium mb-2">
                        ${pricing.monthly / 100}/mo billed annually
                      </p>
                    )}
                    <p className="text-muted-foreground text-sm">
                      {TIER_DESCRIPTIONS[tier]}
                    </p>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className="w-full mb-6"
                    variant={isMostPopular && !isCurrent ? "default" : "outline"}
                    disabled={isCurrent || isLoading || isDowngrade}
                    onClick={() => handleSubscribe(tier)}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : isCurrent ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : isFree ? (
                      <Zap className="h-4 w-4 mr-2" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    {isCurrent
                      ? "Current Plan"
                      : isDowngrade
                      ? "Contact Support"
                      : isFree
                      ? "Free Plan"
                      : isLoading
                      ? "Redirecting..."
                      : "Subscribe"}
                  </Button>

                  {/* Feature list */}
                  <div className="space-y-3 text-sm">
                    <FeatureRow
                      enabled={true}
                      label={
                        <>
                          <b>
                            {limits.portfolioPhotos === Number.MAX_SAFE_INTEGER
                              ? "Unlimited"
                              : limits.portfolioPhotos}
                          </b>{" "}
                          Portfolio Photos
                        </>
                      }
                    />
                    <FeatureRow
                      enabled={limits.canAcceptBookings}
                      label="Accept Bookings"
                    />
                    <FeatureRow
                      enabled={limits.canShowDirectContact}
                      label="Show Direct Contact"
                    />
                    <FeatureRow
                      enabled={limits.canRespondToReviews}
                      label="Respond to Reviews"
                    />
                    <FeatureRow
                      enabled={limits.hasAnalytics}
                      label="Profile Analytics"
                    />
                    <FeatureRow
                      enabled={limits.isFeatured}
                      label="Homepage Feature"
                    />
                    <FeatureRow
                      enabled={limits.isVerifiedBadge}
                      label="Verified Badge"
                    />
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-muted-foreground mt-10">
            All paid plans are billed via Stripe. Cancel anytime from your billing
            portal. Downgrade requests require contacting support.
          </p>
        </section>
      </main>
    </div>
  );
}

function FeatureRow({
  enabled,
  label,
}: {
  enabled: boolean;
  label: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {enabled ? (
        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <X className="w-4 h-4 text-destructive flex-shrink-0" />
      )}
      <span className={enabled ? "" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
