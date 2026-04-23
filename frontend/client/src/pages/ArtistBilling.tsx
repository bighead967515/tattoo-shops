import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Check, X, Crown, Zap, Star, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const BASE_URL = "https://tattoo-artist-directory.onrender.com";

// ── New 3-layer plan definitions ─────────────────────────────────────────────
type TierKey = "free" | "payg" | "pro" | "founding";

interface PlanDef {
  key: TierKey;
  canonicalTier: string;
  name: string;
  tagline: string;
  Icon: React.ElementType;
  monthlyPrice: number; // cents
  yearlyPrice: number;  // cents
  transactionFee: string | null;
  stripeTierArg: "artist_amateur" | "artist_pro" | "artist_icon" | null;
  badge: string | null;
  isMostPopular: boolean;
  isFounder: boolean;
  features: { label: string; included: boolean }[];
}

const PLANS: PlanDef[] = [
  {
    key: "free",
    canonicalTier: "artist_free",
    name: "Free",
    tagline: "Get discovered. No credit card needed.",
    Icon: Users,
    monthlyPrice: 0,
    yearlyPrice: 0,
    transactionFee: null,
    stripeTierArg: null,
    badge: null,
    isMostPopular: false,
    isFounder: false,
    features: [
      { label: "10 portfolio photos", included: true },
      { label: "Directory listing & search visibility", included: true },
      { label: "Receive client inquiries", included: true },
      { label: "Style tags & location profile", included: true },
      { label: "Bidding on client posts", included: false },
      { label: "Booking calendar", included: false },
      { label: "Stripe payment processing", included: false },
      { label: "Verified artist badge", included: false },
      { label: "Analytics & profile insights", included: false },
    ],
  },
  {
    key: "payg",
    canonicalTier: "artist_pro",
    name: "Pay-as-you-go",
    tagline: "Bid on clients. Pay only when you win.",
    Icon: Zap,
    monthlyPrice: 0,
    yearlyPrice: 0,
    transactionFee: "10% on accepted bids",
    stripeTierArg: "artist_pro",
    badge: "No subscription",
    isMostPopular: false,
    isFounder: false,
    features: [
      { label: "10 portfolio photos", included: true },
      { label: "Directory listing & search visibility", included: true },
      { label: "Receive client inquiries", included: true },
      { label: "Unlimited bidding on client posts", included: true },
      { label: "10% platform fee on accepted bids", included: true },
      { label: "Booking calendar", included: false },
      { label: "Stripe payment processing", included: false },
      { label: "Verified artist badge", included: false },
      { label: "Analytics & profile insights", included: false },
    ],
  },
  {
    key: "pro",
    canonicalTier: "artist_amateur",
    name: "Pro",
    tagline: "The full toolkit. Grow your clientele.",
    Icon: Star,
    monthlyPrice: 2900, // $29/mo
    yearlyPrice: 23200, // $232/yr ≈ $19.33/mo
    transactionFee: "5% on accepted bids",
    stripeTierArg: "artist_amateur",
    badge: "Most Popular",
    isMostPopular: true,
    isFounder: false,
    features: [
      { label: "Unlimited portfolio photos", included: true },
      { label: "Directory listing & search visibility", included: true },
      { label: "Receive client inquiries", included: true },
      { label: "Unlimited bidding on client posts", included: true },
      { label: "Reduced 5% platform fee on accepted bids", included: true },
      { label: "Integrated booking calendar", included: true },
      { label: "Stripe-powered payment processing", included: true },
      { label: "Verified artist badge (after credential check)", included: true },
      { label: "Analytics & profile insights", included: true },
    ],
  },
  {
    key: "founding",
    canonicalTier: "artist_icon",
    name: "Founding Artist",
    tagline: "Pro features. Locked-in rate for life.",
    Icon: Crown,
    monthlyPrice: 1900, // $19/mo locked
    yearlyPrice: 19000, // $190/yr
    transactionFee: "5% on accepted bids",
    stripeTierArg: "artist_icon",
    badge: "Limited — First 100",
    isMostPopular: false,
    isFounder: true,
    features: [
      { label: "Everything in Pro", included: true },
      { label: "$19/mo locked for life (vs. $29 standard)", included: true },
      { label: "6 months FREE — use code FOUNDING_ARTIST_6MO", included: true },
      { label: "Exclusive Founding Artist badge on profile", included: true },
      { label: "Homepage carousel placement", included: true },
      { label: "5% platform fee on accepted bids", included: true },
      { label: "Early access to new features", included: true },
      { label: "Founding Artist community access", included: true },
    ],
  },
];

export default function ArtistBilling() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [yearly, setYearly] = useState(false);
  const [loadingTier, setLoadingTier] = useState<TierKey | null>(null);

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

  const currentCanonical = artist.subscriptionTier ?? "artist_free";
  const currentPlan = PLANS.find((p) => p.canonicalTier === currentCanonical) ?? PLANS[0];

  const handleSubscribe = async (plan: PlanDef) => {
    if (!plan.stripeTierArg) return;
    setLoadingTier(plan.key);
    await checkoutMutation.mutateAsync({
      tier: plan.stripeTierArg,
      interval: yearly ? "year" : "month",
      successUrl: `${BASE_URL}/artist/billing/success?tier=${plan.canonicalTier}`,
      cancelUrl: `${BASE_URL}/artist/billing`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="py-14 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container text-center">
            <h1 className="text-4xl font-bold mb-3">
              Choose Your <span className="text-primary">Artist Plan</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-5">
              Start free and grow at your own pace. Upgrade when you're ready to
              take on more clients.
            </p>

            {/* Current plan pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-sm font-medium text-primary mb-6">
              <currentPlan.Icon className="h-4 w-4" />
              Current plan: <span className="font-bold">{currentPlan.name}</span>
            </div>

            {/* Billing toggle */}
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
                Annual{" "}
                <span className="ml-1 text-xs text-green-600 font-semibold">
                  2 months free
                </span>
              </Label>
            </div>
          </div>
        </section>

        {/* Founding Artist Banner */}
        <section className="container mb-2">
          <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Crown className="h-8 w-8 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-300">
                🚀 Founding Artist Offer — First 100 Artists Only
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-400 mt-0.5">
                Lock in <strong>$19/mo for life</strong> (vs. $29 standard) and get your first{" "}
                <strong>6 months completely free</strong>. Apply coupon{" "}
                <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded font-mono text-xs">
                  FOUNDING_ARTIST_6MO
                </code>{" "}
                at checkout. In exchange: set up your full portfolio and respond to 3+ client
                bids in your first 60 days.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-400 text-amber-800 hover:bg-amber-100 shrink-0"
              onClick={() => {
                document
                  .getElementById("founding-card")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Claim Offer
            </Button>
          </div>
        </section>

        {/* Plan Cards */}
        <section className="py-10 container">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {PLANS.map((plan) => {
              const isCurrent = plan.key === currentPlan.key;
              const isLoading = loadingTier === plan.key;
              const price =
                plan.monthlyPrice === 0
                  ? 0
                  : yearly
                  ? plan.yearlyPrice / 100
                  : plan.monthlyPrice / 100;

              return (
                <Card
                  key={plan.key}
                  id={plan.key === "founding" ? "founding-card" : undefined}
                  className={cn(
                    "p-6 flex flex-col relative transition-all",
                    plan.isMostPopular
                      ? "border-2 border-primary bg-gradient-to-br from-primary/10 to-background shadow-lg scale-[1.02]"
                      : plan.isFounder
                      ? "border-2 border-amber-400 bg-amber-50/50 dark:bg-amber-950/10"
                      : plan.key === "payg"
                      ? "border-2 border-blue-300 bg-blue-50/50 dark:bg-blue-950/10"
                      : isCurrent
                      ? "border-2 border-green-500/60 bg-green-500/5"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {/* Top badge */}
                  {plan.badge && !isCurrent && (
                    <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                      <div
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1",
                          plan.isMostPopular
                            ? "bg-primary text-primary-foreground"
                            : plan.isFounder
                            ? "bg-amber-500 text-white"
                            : "bg-blue-500 text-white",
                        )}
                      >
                        {plan.isMostPopular && <Crown className="h-3 w-3" />}
                        {plan.badge}
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
                  <div className="text-center mb-5">
                    <div className="flex justify-center mb-3">
                      <div
                        className={cn(
                          "p-3 rounded-full",
                          plan.isMostPopular
                            ? "bg-primary/20"
                            : plan.isFounder
                            ? "bg-amber-100 dark:bg-amber-900/30"
                            : plan.key === "payg"
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : "bg-muted",
                        )}
                      >
                        <plan.Icon
                          className={cn(
                            "h-6 w-6",
                            plan.isMostPopular
                              ? "text-primary"
                              : plan.isFounder
                              ? "text-amber-500"
                              : plan.key === "payg"
                              ? "text-blue-500"
                              : "text-muted-foreground",
                          )}
                        />
                      </div>
                    </div>
                    <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
                    <p className="text-xs text-muted-foreground mb-3">{plan.tagline}</p>

                    {/* Price */}
                    {price === 0 && !plan.transactionFee ? (
                      <div className="text-4xl font-bold">Free</div>
                    ) : price === 0 ? (
                      <div>
                        <span className="text-4xl font-bold">$0</span>
                        <span className="text-sm text-muted-foreground">/mo</span>
                        <p className="text-xs text-blue-600 font-medium mt-1">
                          + {plan.transactionFee}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-4xl font-bold">${price}</span>
                        <span className="text-sm text-muted-foreground">
                          /{yearly ? "yr" : "mo"}
                        </span>
                        {yearly && plan.monthlyPrice > 0 && (
                          <p className="text-xs text-green-600 font-medium mt-1">
                            ${(price / 12).toFixed(2)}/mo billed annually
                          </p>
                        )}
                        {plan.transactionFee && (
                          <p className="text-xs text-muted-foreground mt-1">
                            + {plan.transactionFee}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <Button
                    className={cn(
                      "w-full mb-5",
                      plan.isFounder && !isCurrent
                        ? "bg-amber-500 hover:bg-amber-600 text-white border-0"
                        : plan.key === "payg" && !isCurrent
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-0"
                        : "",
                    )}
                    variant={
                      isCurrent || plan.key === "free"
                        ? "outline"
                        : plan.isMostPopular
                        ? "default"
                        : "outline"
                    }
                    disabled={isCurrent || plan.key === "free" || isLoading}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {isCurrent
                      ? "Current Plan"
                      : plan.key === "free"
                      ? "Always Free"
                      : plan.key === "founding"
                      ? "Claim Founding Rate"
                      : plan.key === "payg"
                      ? "Start Bidding Free"
                      : isLoading
                      ? "Redirecting..."
                      : "Upgrade to Pro"}
                  </Button>

                  {/* Feature list */}
                  <div className="space-y-2.5 text-sm flex-1">
                    {plan.features.map((f) => (
                      <div key={f.label} className="flex items-start gap-2">
                        {f.included ? (
                          <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                        )}
                        <span className={f.included ? "" : "text-muted-foreground/60"}>
                          {f.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Transaction fee explainer */}
          <div className="mt-10 rounded-xl border bg-muted/40 p-6 max-w-3xl mx-auto">
            <h3 className="font-semibold text-base mb-2">How transaction fees work</h3>
            <p className="text-sm text-muted-foreground mb-3">
              When a client accepts your bid, Ink Connect charges a small platform fee on
              the agreed price. This aligns our success with yours — we only earn when you
              earn.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-background rounded-lg p-3 border">
                <p className="font-medium">Free tier</p>
                <p className="text-muted-foreground text-xs">No bidding access</p>
              </div>
              <div className="bg-background rounded-lg p-3 border border-primary/30">
                <p className="font-medium">Pro / Founding Artist</p>
                <p className="text-muted-foreground text-xs">
                  5% fee — reduced as a reward for subscribing
                </p>
              </div>
              <div className="bg-background rounded-lg p-3 border border-blue-200">
                <p className="font-medium">Pay-as-you-go</p>
                <p className="text-muted-foreground text-xs">
                  10% fee — no monthly subscription required
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              💡 <strong>Pro tip:</strong> Once you win 3+ bids per month, a Pro
              subscription pays for itself — you'll save more on fees than the $29/mo cost.
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            All paid plans are billed via Stripe. Cancel anytime. No contracts.{" "}
            <a href="mailto:support@universalinc.pro" className="underline hover:text-foreground">
              Contact support
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
