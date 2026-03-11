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
  "artist_icon",
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
              From a free basic listing to a full-feature professional plan, we
              have the right tools to help you grow your client base and manage
              your business.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16 container">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {tierOrder.map((tier) => {
              const legacyTier = toLegacyArtistTier(tier);
              const limits = TIER_LIMITS[legacyTier];
              const pricing = TIER_PRICING[legacyTier];
              const isMostPopular = tier === "artist_pro";

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
                        ? "A free profile to get you started"
                        : tier === "artist_amateur"
                          ? "Unlock bookings and direct contact"
                          : tier === "artist_pro"
                            ? "Full suite for growing your business"
                            : "Maximum visibility and front page feature"}
                    </p>
                  </div>

                  <Button
                    className="w-full mb-8 group"
                    variant={isMostPopular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/for-artists">
                      <Zap className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                      {tier === "artist_free" ? "Get Started" : "Choose Plan"}
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
                      {limits.isFeatured ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-destructive" />
                      )}
                      <span>Homepage Feature</span>
                    </div>
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
