import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Award, Crown, ArrowRight, ShieldCheck, Sparkles, Loader2 } from "lucide-react";

export default function FeaturedArtistSection() {
  const [, setLocation] = useLocation();
  const { data: artists, isLoading: artistsLoading } = trpc.artists.getAll.useQuery();

  const featuredArtist = useMemo(() => {
    if (!artists || artists.length === 0) return null;
    // Rotate deterministically per week
    const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    return artists[weekNumber % artists.length];
  }, [artists]);

  const artistId = featuredArtist?.id ?? 0;
  const { data: portfolio, isLoading: portfolioLoading } = trpc.portfolio.get.useQuery(
    { artistId },
    { enabled: !!featuredArtist }
  );

  if (artistsLoading) {
    return (
      <section className="container py-16">
        <Card className="rounded-[2rem] border-primary/10 p-8 md:p-12 animate-pulse bg-muted/20">
          <div className="h-6 w-48 bg-muted rounded mb-4" />
          <div className="h-10 w-96 bg-muted rounded mb-6" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-5/6 bg-muted rounded" />
              <div className="h-4 w-4/5 bg-muted rounded" />
            </div>
            <div className="h-48 bg-muted rounded-2xl" />
          </div>
        </Card>
      </section>
    );
  }

  if (!featuredArtist) return null;

  const avgRating = featuredArtist.averageRating ? parseFloat(featuredArtist.averageRating) : 0;
  const isVerifiedArtist = (featuredArtist as any).verificationStatus === "verified";
  
  const stylesList = featuredArtist.styles
    ? featuredArtist.styles.split(",").map((s: string) => s.trim())
    : [];

  const specialtiesList = featuredArtist.specialties
    ? featuredArtist.specialties.split(",").map((s: string) => s.trim())
    : [];

  const displayTags = Array.from(new Set([...stylesList, ...specialtiesList])).slice(0, 4);

  return (
    <section className="container py-16">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider mb-4">
          <Award className="w-3.5 h-3.5" />
          Spotlight Artist
        </div>
        <h2 className="text-3xl font-bold md:text-4xl">Featured Artist this Week</h2>
        <p className="mx-auto max-w-2xl text-muted-foreground mt-2">
          Discover outstanding craftsmanship and original tattoo designs from our vetted creators.
        </p>
      </div>

      <Card className="rounded-[2rem] border-border/80 bg-gradient-to-br from-background via-primary/5 to-background p-8 md:p-12 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative group">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        
        {/* Dynamic decorative backdrop radial gradient */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-primary/10 blur-[80px] pointer-events-none group-hover:bg-primary/15 transition-all duration-500" />
        
        <div className="relative grid md:grid-cols-[1.2fr_1fr] gap-8 md:gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {isVerifiedArtist && (
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-2 py-0.5 text-xs font-medium">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                )}
                {featuredArtist.isFoundingArtist && (
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 text-xs font-medium">
                    <Crown className="w-3 h-3 mr-1" /> Founding Artist
                  </Badge>
                )}
              </div>
              <h3 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                {featuredArtist.shopName}
              </h3>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-primary/70" />
                  {featuredArtist.city}, {featuredArtist.state}
                </span>
                {featuredArtist.experience && (
                  <>
                    <span>•</span>
                    <span>{featuredArtist.experience} years experience</span>
                  </>
                )}
              </div>
            </div>

            {featuredArtist.bio && (
              <p className="text-muted-foreground text-base leading-relaxed line-clamp-3">
                {featuredArtist.bio}
              </p>
            )}

            {displayTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {displayTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1 text-xs bg-muted/65 hover:bg-muted font-medium">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {avgRating > 0 && (
              <div className="flex items-center gap-2 bg-background/50 border border-border/40 backdrop-blur-sm px-4 py-2.5 rounded-2xl w-fit">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= avgRating ? "fill-amber-500 text-amber-500" : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-foreground">
                  {avgRating.toFixed(1)}
                </span>
                {featuredArtist.totalReviews && featuredArtist.totalReviews > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({featuredArtist.totalReviews} review{featuredArtist.totalReviews !== 1 ? "s" : ""})
                  </span>
                )}
              </div>
            )}

            <div className="pt-2">
              <Link href={`/artist/${featuredArtist.id}`}>
                <Button size="lg" className="px-8 font-semibold shadow-md shadow-primary/10">
                  View Full Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative w-full h-full min-h-[220px] md:min-h-[300px]">
            {portfolioLoading ? (
              <div className="absolute inset-0 flex items-center justify-center border border-dashed rounded-3xl bg-muted/30">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : portfolio && portfolio.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-lg border border-border/40 group-hover:scale-[1.02] transition-all duration-500">
                  <img
                    src={portfolio[0].imageUrl}
                    alt={portfolio[0].caption || "Tattoo Art"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-rows-2 gap-4">
                  {portfolio.slice(1, 3).map((img, i) => (
                    <div
                      key={img.id}
                      className="rounded-2xl overflow-hidden shadow-md border border-border/40 aspect-[4/3] group-hover:scale-[1.02] transition-all duration-500"
                      style={{ transitionDelay: `${(i + 1) * 75}ms` }}
                    >
                      <img
                        src={img.imageUrl}
                        alt={img.caption || "Tattoo Art"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {portfolio.length === 1 && (
                    <div className="flex items-center justify-center border border-dashed rounded-2xl bg-muted/20 text-xs text-muted-foreground">
                      Explore full portfolio to view more work
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-[2rem] bg-muted/20 p-6 text-center">
                <Sparkles className="w-10 h-10 text-muted-foreground/50 mb-3" />
                <p className="font-semibold text-sm text-foreground mb-1">Portfolio Coming Soon</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  This artist is currently finalizing their online tattoo gallery.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </section>
  );
}
