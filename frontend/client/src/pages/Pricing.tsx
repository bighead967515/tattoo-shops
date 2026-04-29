import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, Crown, Zap } from "lucide-react";
import { Link } from "wouter";
import { TIER_LIMITS, TIER_PRICING } from "@shared/tierLimits";
import {
  toLegacyArtistTier,
  type ArtistCanonicalTier,
} from "@shared/tierCompat";
import { cn } from "@/lib/utils";

const tierOrder: ArtistCanonicalTier[] = [
  "artist_free",
  "artist_amateur",
  "artist_pro",
];

export default function Pricing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container text-center">
            <h1 className="text-5xl font-bold mb-6">
              Choose Your <span className="text-primary">Artist Plan</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
              Start free, upgrade to Pro, or stay flexible with pay-as-you-go.
              Pick the model that matches how you run your studio.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16 container">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {tierOrder.map((tier) => {
              const legacyTier = toLegacyArtistTier(tier);
              const limits = TIER_LIMITS[legacyTier];
              const pricing = TIER_PRICING[legacyTier];
              const isMostPopular = tier === "artist_amateur";

              return (
                <Card
                  key={tier}
                  className={cn(
                    "p-8 flex flex-col relative",
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

                  <div className="text-center mb-8 flex-grow">
                    <h2 className="text-3xl font-bold mb-2">{limits.name}</h2>
                    <div className="text-5xl font-bold mb-4">
                      ${pricing.monthly / 100}
                      <span className="text-2xl text-muted-foreground">
                        /mo
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm h-10">
                      {tier === "artist_free"
                        ? "A free profile to get discovered"
                        : tier === "artist_amateur"
                          ? "Subscription plan with lower transaction fees"
                          : "No subscription. Bid and pay per win."}
                    </p>
                  </div>

                  <Button
                    className="w-full mb-8 group"
                    variant={isMostPopular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/artist/billing">
                      <Zap className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                      {tier === "artist_free" ? "Start Free" : "Choose Plan"}
                    </Link>
                  </Button>

                  <div className="space-y-4 text-sm">
                    <div className="flex items-center gap-3">
                      {limits.portfolioPhotos === Number.MAX_SAFE_INTEGER ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                      <span>
                        <b>
                          {limits.portfolioPhotos === Number.MAX_SAFE_INTEGER
                            ? "Unlimited"
                            : limits.portfolioPhotos}
                        </b>{" "}
                        Portfolio Photos
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {limits.canAcceptBookings ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-destructive" />
                      )}
                      <span>Accept Bookings</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {limits.canShowDirectContact ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-destructive" />
                      )}
                      <span>Show Direct Contact</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {limits.canRespondToReviews ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-destructive" />
                      )}
                      <span>Respond to Reviews</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {limits.hasAnalytics ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-destructive" />
                      )}
                      <span>Profile Analytics</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5" />
                      <span>
                        Transaction Fee: <b>{Math.round((limits.transactionFeeRate ?? 0) * 100)}%</b>
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 max-w-5xl mx-auto rounded-xl border border-amber-300 bg-amber-50/70 p-6">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-amber-900">Founding Artist Offer (First 50-100 Artists)</h3>
            </div>
            <p className="text-sm text-amber-900/90">
              Get Pro access free for 6 months, then lock in $19/month for life, plus a Founding Artist badge.
              Eligibility requires a complete portfolio and at least 3 bid responses in the first 60 days.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
