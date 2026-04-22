import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Crown, Loader2, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { TIER_LIMITS, type ArtistTierKey } from "@shared/tierLimits";
import { toLegacyArtistTier, type ArtistCanonicalTier } from "@shared/tierCompat";

const TIER_NAMES: Record<string, string> = {
  artist_amateur: TIER_LIMITS.amateur.name,
  artist_pro: TIER_LIMITS.professional.name,
  artist_icon: TIER_LIMITS.frontPage.name,
};

export default function SubscriptionSuccess() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tier = params.get("tier") ?? "";
  const tierName = TIER_NAMES[tier] ?? "your new plan";

  const [ready, setReady] = useState(false);

  // Poll the artist profile until the webhook has updated the tier
  const { data: artist, refetch } = trpc.artists.getByUserId.useQuery(undefined, {
    refetchInterval: ready ? false : 3000,
  });

  useEffect(() => {
    if (!artist) return;
    const currentTier = artist.subscriptionTier ?? "artist_free";
    if (currentTier === tier) {
      setReady(true);
    }
  }, [artist, tier]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-20 flex flex-col items-center text-center max-w-lg mx-auto">
        {!ready ? (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
            <h1 className="text-2xl font-bold mb-2">Activating your plan...</h1>
            <p className="text-muted-foreground">
              We're confirming your payment with Stripe. This usually takes a few
              seconds.
            </p>
          </>
        ) : (
          <>
            <div className="p-5 rounded-full bg-green-500/10 mb-6">
              <CheckCircle2 className="w-14 h-14 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-3">You're all set!</h1>
            <p className="text-muted-foreground mb-8">
              Welcome to the{" "}
              <span className="font-semibold text-foreground">{tierName}</span>{" "}
              plan. Your new features are now active.
            </p>

            <Card className="w-full p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Crown className="h-5 w-5 text-primary" />
                <span className="font-semibold">What's unlocked for you</span>
              </div>
              {tier && (
                <ul className="text-sm text-left space-y-2">
                  {[
                    tier !== "artist_free" && "✓ Accept bookings from clients",
                    tier !== "artist_free" && "✓ Show direct contact info",
                    tier !== "artist_free" && "✓ Verified badge on your profile",
                    (tier === "artist_pro" || tier === "artist_icon") &&
                      "✓ Unlimited portfolio photos",
                    (tier === "artist_pro" || tier === "artist_icon") &&
                      "✓ Profile analytics dashboard",
                    (tier === "artist_pro" || tier === "artist_icon") &&
                      "✓ Respond to client reviews",
                    tier === "artist_icon" && "✓ Homepage carousel feature placement",
                  ]
                    .filter(Boolean)
                    .map((item, i) => (
                      <li key={i} className="text-muted-foreground">
                        {item}
                      </li>
                    ))}
                </ul>
              )}
            </Card>

            <div className="flex gap-4 flex-wrap justify-center">
              <Button onClick={() => setLocation("/artist-dashboard")}>
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/artist/billing")}
              >
                Manage Billing
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
