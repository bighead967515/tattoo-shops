import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  ArrowRight,
  Ruler,
  Palette,
  MapPin,
  Layers,
  Trophy,
  DollarSign,
  Info,
  Loader2,
  ChevronDown,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type TattooStyle =
  | "Realism"
  | "Traditional"
  | "Neo-Traditional"
  | "Watercolor"
  | "Japanese"
  | "Blackwork"
  | "Geometric"
  | "Illustrative"
  | "Other";

type TattooSize =
  | "tiny"
  | "small"
  | "medium"
  | "large"
  | "xlarge"
  | "sleeve"
  | "full_back";

type Complexity = "simple" | "moderate" | "detailed" | "highly_detailed";

type ArtistExperience = "any" | "mid" | "senior" | "award";

type ColorType = "color" | "black_grey";

interface EstimateForm {
  style: TattooStyle | "";
  size: TattooSize | "";
  placement: string;
  colorType: ColorType;
  complexity: Complexity | "";
  experience: ArtistExperience;
}

interface EstimateResult {
  low: number;
  high: number;
}

// ── Pricing config ─────────────────────────────────────────────────────────

const SIZE_MULTIPLIERS: Record<TattooSize, number> = {
  tiny: 1,
  small: 1.6,
  medium: 2.5,
  large: 4,
  xlarge: 6,
  sleeve: 10,
  full_back: 14,
};

const COMPLEXITY_MULTIPLIERS: Record<Complexity, number> = {
  simple: 1,
  moderate: 1.4,
  detailed: 1.9,
  highly_detailed: 2.6,
};

const EXPERIENCE_MULTIPLIERS: Record<ArtistExperience, number> = {
  any: 1,
  mid: 1.25,
  senior: 1.6,
  award: 2.2,
};

const COLOR_MULTIPLIER: Record<ColorType, number> = {
  black_grey: 1,
  color: 1.3,
};

const BASE_PRICE = 150; // base price in USD
const HIGH_ANCHOR = 1.4; // intentional high-anchor multiplier
const RANGE = 0.2; // ±20% range

function calculateEstimate(form: EstimateForm): EstimateResult {
  const size = form.size as TattooSize;
  const complexity = form.complexity as Complexity;
  const sizeM = SIZE_MULTIPLIERS[size] ?? 1;
  const complexityM = COMPLEXITY_MULTIPLIERS[complexity] ?? 1;
  const experienceM = EXPERIENCE_MULTIPLIERS[form.experience] ?? 1;
  const colorM = COLOR_MULTIPLIER[form.colorType] ?? 1;

  const midpoint =
    BASE_PRICE * sizeM * complexityM * experienceM * colorM * HIGH_ANCHOR;

  return {
    low: Math.round(midpoint * (1 - RANGE) / 5) * 5,
    high: Math.round(midpoint * (1 + RANGE) / 5) * 5,
  };
}

// ── Info cards data ────────────────────────────────────────────────────────

const infoCards = [
  {
    icon: Ruler,
    title: "Size",
    color: "from-violet-500/20 to-violet-600/10",
    border: "border-violet-500/30",
    iconColor: "text-violet-400",
    body: "Size is the biggest cost driver. A tiny wrist piece might take 1 hour, while a full sleeve can require 20+ hours across multiple sessions.",
  },
  {
    icon: Layers,
    title: "Complexity",
    color: "from-blue-500/20 to-blue-600/10",
    border: "border-blue-500/30",
    iconColor: "text-blue-400",
    body: "Fine line portraits with micro-detail cost far more than simple bold linework. Shading, texture, and intricate patterns all add to the time and skill required.",
  },
  {
    icon: MapPin,
    title: "Placement",
    color: "from-green-500/20 to-green-600/10",
    border: "border-green-500/30",
    iconColor: "text-green-400",
    body: "Ribs, hands, necks, and feet are harder to tattoo and require more care from the artist. Difficult placements often command a premium.",
  },
  {
    icon: Palette,
    title: "Color vs. Black & Grey",
    color: "from-amber-500/20 to-amber-600/10",
    border: "border-amber-500/30",
    iconColor: "text-amber-400",
    body: "Full color work takes longer to apply and requires more ink. Vibrant color tattoos also need more touch-up sessions over time.",
  },
  {
    icon: Trophy,
    title: "Artist Experience",
    color: "from-rose-500/20 to-rose-600/10",
    border: "border-rose-500/30",
    iconColor: "text-rose-400",
    body: "Award-winning and sought-after artists charge more, often $300–$500/hr. Their booking waitlists and reputation speak to the quality difference.",
  },
  {
    icon: DollarSign,
    title: "Studio Location",
    color: "from-cyan-500/20 to-cyan-600/10",
    border: "border-cyan-500/30",
    iconColor: "text-cyan-400",
    body: "Studios in major cities (NYC, LA, Chicago) typically charge 30–50% more than rural studios, reflecting higher overheads and demand.",
  },
];

// ── Component ──────────────────────────────────────────────────────────────

export default function PriceEstimator() {
  const [form, setForm] = useState<EstimateForm>({
    style: "",
    size: "",
    placement: "",
    colorType: "black_grey",
    complexity: "",
    experience: "any",
  });

  const [result, setResult] = useState<EstimateResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isFormValid =
    form.style !== "" && form.size !== "" && form.complexity !== "";

  const handleEstimate = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    setResult(null);
    setRevealed(false);

    // Simulate tRPC call to ai.estimatePrice (mock — backend not yet deployed)
    await new Promise<void>((resolve) => setTimeout(resolve, 1800));

    const estimate = calculateEstimate(form);
    setResult(estimate);
    setIsLoading(false);

    // Trigger reveal animation after a short delay
    setTimeout(() => setRevealed(true), 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(112,255,112,0.12),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(139,92,246,0.10),_transparent_60%)]" />
        <div className="container relative py-16 md:py-20">
          <div className="max-w-2xl">
            <Badge className="mb-4 gap-1.5 bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
              <Sparkles className="h-3.5 w-3.5" />
              Free AI Estimator — No Account Required
            </Badge>
            <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl">
              What will your tattoo cost?
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Get an instant AI-powered estimate. Then compare real bids from
              artists — they&apos;re often lower than you&apos;d expect.
            </p>
          </div>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px]">
          {/* ── Left column: info ── */}
          <div className="order-2 lg:order-1">
            <h2 className="mb-8 text-2xl font-bold">
              What affects tattoo pricing?
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {infoCards.map(({ icon: Icon, title, color, border, iconColor, body }) => (
                <Card
                  key={title}
                  className={`rounded-2xl border bg-gradient-to-br ${color} ${border} p-6`}
                >
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-background/50`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <h3 className="mb-2 font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* ── Right column: form ── */}
          <div className="order-1 lg:order-2">
            <Card className="sticky top-6 rounded-3xl border-border/60 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
              {/* Card header gradient bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-violet-500 to-primary" />

              <CardContent className="p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold">Get My Estimate</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Fill in the details below for your instant estimate
                  </p>
                </div>

                {/* Style */}
                <div className="space-y-2">
                  <Label htmlFor="style-select">Tattoo Style</Label>
                  <Select
                    value={form.style}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, style: v as TattooStyle }))
                    }
                  >
                    <SelectTrigger id="style-select" className="rounded-xl">
                      <SelectValue placeholder="Select a style..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        [
                          "Realism",
                          "Traditional",
                          "Neo-Traditional",
                          "Watercolor",
                          "Japanese",
                          "Blackwork",
                          "Geometric",
                          "Illustrative",
                          "Other",
                        ] as TattooStyle[]
                      ).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <Label htmlFor="size-select">Size</Label>
                  <Select
                    value={form.size}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, size: v as TattooSize }))
                    }
                  >
                    <SelectTrigger id="size-select" className="rounded-xl">
                      <SelectValue placeholder="Select a size..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tiny">Tiny (&lt;2 in)</SelectItem>
                      <SelectItem value="small">Small (2–4 in)</SelectItem>
                      <SelectItem value="medium">Medium (4–6 in)</SelectItem>
                      <SelectItem value="large">Large (6–10 in)</SelectItem>
                      <SelectItem value="xlarge">Extra Large (10 in+)</SelectItem>
                      <SelectItem value="sleeve">Full Sleeve</SelectItem>
                      <SelectItem value="full_back">Full Back</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Placement */}
                <div className="space-y-2">
                  <Label htmlFor="placement-input">
                    Placement{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="placement-input"
                    placeholder="e.g. forearm, ribs, upper back..."
                    value={form.placement}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, placement: e.target.value }))
                    }
                    className="rounded-xl"
                    maxLength={80}
                  />
                </div>

                {/* Color vs B&G */}
                <div className="space-y-2">
                  <Label>Color Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        { value: "black_grey", label: "Black & Grey" },
                        { value: "color", label: "Full Color" },
                      ] as const
                    ).map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, colorType: value }))
                        }
                        className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                          form.colorType === value
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Complexity */}
                <div className="space-y-2">
                  <Label htmlFor="complexity-select">Complexity</Label>
                  <Select
                    value={form.complexity}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, complexity: v as Complexity }))
                    }
                  >
                    <SelectTrigger id="complexity-select" className="rounded-xl">
                      <SelectValue placeholder="Select complexity..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple (bold lines, minimal detail)</SelectItem>
                      <SelectItem value="moderate">Moderate (some shading/detail)</SelectItem>
                      <SelectItem value="detailed">Detailed (heavy shading, fine lines)</SelectItem>
                      <SelectItem value="highly_detailed">Highly Detailed (portrait-level realism)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Artist Experience */}
                <div className="space-y-2">
                  <Label htmlFor="experience-select">Artist Experience Preferred</Label>
                  <Select
                    value={form.experience}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        experience: v as ArtistExperience,
                      }))
                    }
                  >
                    <SelectTrigger id="experience-select" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any (most affordable)</SelectItem>
                      <SelectItem value="mid">Mid-Level (3–7 years)</SelectItem>
                      <SelectItem value="senior">Senior (7+ years)</SelectItem>
                      <SelectItem value="award">Award-Winning / Celebrity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* CTA */}
                <Button
                  className="w-full gap-2 rounded-xl py-5 text-base font-semibold shadow-[0_0_20px_rgba(112,255,112,0.3)] hover:shadow-[0_0_30px_rgba(112,255,112,0.6)] transition-all duration-300"
                  onClick={handleEstimate}
                  disabled={!isFormValid || isLoading}
                  id="get-estimate-btn"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calculating your estimate...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Get My Estimate
                    </>
                  )}
                </Button>

                {!isFormValid && (
                  <p className="text-center text-xs text-muted-foreground">
                    Please fill in Style, Size, and Complexity to continue
                  </p>
                )}

                {/* ── Result section ── */}
                {result && (
                  <div
                    className={`transition-all duration-700 ease-out ${
                      revealed
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }`}
                  >
                    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-violet-500/10 p-6 text-center space-y-4">
                      {/* Animated price reveal */}
                      <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mb-2">
                          Estimated Range
                        </p>
                        <div
                          className={`text-4xl font-extrabold tracking-tight transition-all duration-700 delay-200 ${
                            revealed
                              ? "opacity-100 scale-100"
                              : "opacity-0 scale-90"
                          }`}
                        >
                          <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                            ${result.low.toLocaleString()} – $
                            {result.high.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 rounded-xl bg-background/50 p-3 text-left">
                        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Actual bids from artists may be lower — quality varies
                          by studio and experience. These estimates intentionally
                          include market-rate premiums.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Link href="/client/new-request">
                          <Button
                            className="w-full gap-1.5 rounded-xl font-semibold"
                            id="post-request-cta"
                          >
                            Post a Request
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Link href="/artists">
                          <Button
                            variant="outline"
                            className="w-full gap-1.5 rounded-xl"
                            id="browse-artists-cta"
                          >
                            Browse Artists
                          </Button>
                        </Link>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Get real bids from verified artists — they often come in
                        below this estimate.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
