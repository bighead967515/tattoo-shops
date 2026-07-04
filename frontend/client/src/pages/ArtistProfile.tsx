import { useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { safeJsonParse } from "@/lib/utils";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Star,
  MapPin,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Heart,
  Calendar,
  Upload,
  Sparkles,
  ShieldCheck,
  Crown,
  Info,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ReviewCard from "@/components/ReviewCard";
import ReviewFilters from "@/components/ReviewFilters";
import BookingDialog from "@/components/BookingDialog";
import { usePageSeo } from "@/hooks/usePageSeo";

export default function ArtistProfile() {
  const { id } = useParams();
  const artistId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "highest" | "helpful">(
    "recent",
  );

  const isValidArtistId = !isNaN(artistId) && artistId > 0;

  const { data: artist, isLoading: artistLoading } =
    trpc.artists.getById.useQuery({ id: artistId }, { enabled: isValidArtistId });
  const { data: portfolio, isLoading: portfolioLoading } =
    trpc.portfolio.get.useQuery({ artistId }, { enabled: isValidArtistId });
  const {
    data: reviews,
    isLoading: reviewsLoading,
    refetch: refetchReviews,
  } = trpc.reviews.getByArtistId.useQuery({ artistId }, { enabled: isValidArtistId });
  const { data: isFav, refetch: refetchFavorite } =
    trpc.favorites.isFavorite.useQuery({ artistId }, { enabled: !!user && isValidArtistId });

  const [selectedFlash, setSelectedFlash] = useState<any | null>(null);
  const [preferredDate, setPreferredDate] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const { data: flashItems, isLoading: flashItemsLoading } =
    trpc.flash.getByArtistId.useQuery({ artistId }, { enabled: isValidArtistId });

  const createCheckoutMutation = trpc.flash.createLockCheckout.useMutation({
    onSuccess: (res) => {
      if (res && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        toast.error("Failed to initiate checkout session.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start deposit payment.");
    },
  });

  const handleLockFlashClick = (flash: any) => {
    if (!isAuthenticated) {
      toast.info("Please log in to purchase and lock flash art.");
      setLocation("/login");
      return;
    }
    setSelectedFlash(flash);
  };

  const handleConfirmLock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlash) return;

    if (!preferredDate) {
      toast.error("Please select a preferred date and time.");
      return;
    }
    if (!customerPhone.trim()) {
      toast.error("Please enter a contact phone number.");
      return;
    }

    createCheckoutMutation.mutate({
      flashId: selectedFlash.id,
      preferredDate: new Date(preferredDate).toISOString(),
      customerPhone,
      successUrl: `${window.location.origin}/client/dashboard?booking_success=true`,
      cancelUrl: `${window.location.origin}/artist/${artistId}`,
    });
  };

  const addFavoriteMutation = trpc.favorites.add.useMutation({
    onSuccess: () => {
      toast.success("Added to favorites!");
      refetchFavorite();
    },
  });

  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      toast.success("Removed from favorites");
      refetchFavorite();
    },
  });

  const createReviewMutation = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success("Review submitted!");
      setShowReviewDialog(false);
      setReviewComment("");
      setReviewRating(5);
      setReviewPhotos([]);
      refetchReviews();
    },
  });

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (isFav) {
      removeFavoriteMutation.mutate({ artistId });
    } else {
      addFavoriteMutation.mutate({ artistId });
    }
  };

  const handleSubmitReview = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    createReviewMutation.mutate({
      artistId,
      rating: reviewRating,
      comment: reviewComment,
    });
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setShowBookingDialog(true);
  };

  const handleSendRequest = () => {
    const params = new URLSearchParams({
      artistId: String(artistId),
      artistName: artist?.shopName || "",
      artistStyle: artist?.styles || "",
      artistCity: artist?.city || "",
      artistState: artist?.state || "",
    });
    setLocation(`/client/new-request?${params.toString()}`);
  };

  const seo = useMemo(() => {
    const fallbackTitle = "Tattoo Artist Profile | Ink Connect";
    const fallbackDescription =
      "View tattoo artist portfolios, reviews, specialties, and booking availability on Ink Connect.";

    if (!artist) {
      return { title: fallbackTitle, description: fallbackDescription };
    }

    const name = artist.shopName?.trim() || "Tattoo Artist";
    const location = [artist.city, artist.state].filter(Boolean).join(", ");

    const primarySpecialty =
      artist.styles?.split(",")[0]?.trim() ||
      artist.specialties?.split(",")[0]?.trim() ||
      "Custom Tattoos";

    const title = location
      ? `${name}, ${primarySpecialty} in ${location} | Ink Connect`
      : `${name}, ${primarySpecialty} | Ink Connect`;

    const description = location
      ? `Book a tattoo with ${name} in ${location}. Specializing in ${primarySpecialty}. View portfolio, reviews, and pricing on Ink Connect.`
      : `Book a tattoo with ${name}. Specializing in ${primarySpecialty}. View portfolio, reviews, and pricing on Ink Connect.`;

    return { title, description };
  }, [artist]);

  usePageSeo(seo);

  if (artistLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Loading artist profile...</p>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Artist Not Found</h1>
          <Button onClick={() => setLocation("/artist-finder")}>
            Find Artists
          </Button>
        </div>
      </div>
    );
  }

  const avgRating = artist.averageRating ? parseFloat(artist.averageRating) : 0;
  const isVerifiedArtist =
    (artist as { verificationStatus?: string }).verificationStatus ===
    "verified";

  const isPremium =
    artist.subscriptionTier === "artist_pro" ||
    artist.subscriptionTier === "artist_elite";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-4xl font-bold">{artist.shopName}</h1>
                {isVerifiedArtist && (
                  <span
                    title="This artist has been verified by Ink Connect — license and identity confirmed."
                    className="inline-flex"
                  >
                    <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/50 gap-1.5 px-3 py-1.5 text-sm font-semibold shadow-sm ring-2 ring-green-500/20 ring-offset-1 ring-offset-background animate-in fade-in duration-500">
                      <ShieldCheck className="w-4 h-4" />
                      Verified Artist
                    </Badge>
                  </span>
                )}
                {portfolio && portfolio.length >= 3 && (
                  <Badge className="bg-primary/15 text-primary border border-primary/30 gap-1.5 px-3 py-1 text-sm font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    Vibe Verified
                  </Badge>
                )}
                {artist.isFoundingArtist && (
                  <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 gap-1.5 px-3 py-1 text-sm font-semibold">
                    <Crown className="w-4 h-4" />
                    Founding Artist
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= avgRating
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {avgRating.toFixed(1)} ({artist.totalReviews} reviews)
                  </span>
                </div>
              </div>

              {artist.bio && (
                <p className="text-muted-foreground mb-6">{artist.bio}</p>
              )}

              {artist.specialties && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Specialties</h3>
                  <p className="text-muted-foreground">{artist.specialties}</p>
                </div>
              )}

              {artist.experience && (
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">{artist.experience}</span>{" "}
                    years of experience
                  </p>
                </div>
              )}

              {/* Pricing Tiers */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Pricing</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Small (2-4")</span>
                    <span className="font-medium">$100 - $300</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Medium (4-6")</span>
                    <span className="font-medium">$300 - $600</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Large (6-10")</span>
                    <span className="font-medium">$600 - $1,200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Extra Large (10"+)
                    </span>
                    <span className="font-medium">$1,200+</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    *Typical industry pricing. Actual prices vary based on
                    complexity and detail. Contact artist for quote.
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-6">
                {isPremium ? (
                  <>
                    {artist.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {artist.address}, {artist.city}, {artist.state}{" "}
                          {artist.zipCode}
                        </span>
                      </div>
                    )}
                    {artist.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={`tel:${artist.phone}`}
                          className="hover:text-primary"
                        >
                          {artist.phone}
                        </a>
                      </div>
                    )}
                    {artist.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={artist.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {artist.city}, {artist.state} (Exact address masked)
                      </span>
                    </div>
                    <Card className="p-4 bg-muted/50 border border-dashed mt-4 max-w-md">
                      <div className="flex gap-2">
                        <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="text-xs space-y-1">
                          <p className="font-semibold text-foreground">
                            Contact Information Masked
                          </p>
                          <p className="text-muted-foreground">
                            Direct contact info is hidden for amateur/free artists.
                            Please use the <strong>Send a Request</strong> or <strong>Book Appointment</strong> buttons to contact this artist directly.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </>
                )}
              </div>

              {/* Social Links */}
              <div className="flex gap-4 mb-6">
                {artist.instagram && (
                  <a
                    href={artist.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {artist.facebook && (
                  <a
                    href={artist.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[200px]">
              <Button size="lg" className="w-full" onClick={handleSendRequest}>
                <Sparkles className="w-4 h-4 mr-2" />
                Send a Request
              </Button>
              <Button size="lg" variant="outline" className="w-full" onClick={handleBookNow}>
                <Calendar className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={handleToggleFavorite}
              >
                <Heart
                  className={`w-4 h-4 mr-2 ${isFav ? "fill-red-500 text-red-500" : ""}`}
                />
                {isFav ? "Saved" : "Save Artist"}
              </Button>
              <Dialog
                open={showReviewDialog}
                onOpenChange={setShowReviewDialog}
              >
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline" className="w-full">
                    <Star className="w-4 h-4 mr-2" />
                    Write Review
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label
                        id="review-rating-label"
                        className="block text-sm font-medium mb-2"
                      >
                        Rating
                      </label>
                      <div
                        role="radiogroup"
                        aria-labelledby="review-rating-label"
                        className="flex gap-2"
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            role="radio"
                            aria-checked={star === reviewRating}
                            aria-label={`${star} star${star > 1 ? "s" : ""}`}
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= reviewRating
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="review-comment"
                        className="block text-sm font-medium mb-2"
                      >
                        Comment
                      </label>
                      <Textarea
                        id="review-comment"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Photos (Optional)
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {reviewPhotos.map((photo, index) => (
                          <div
                            key={index}
                            className="relative w-20 h-20 rounded border"
                          >
                            <img
                              src={photo}
                              alt="Review"
                              className="w-full h-full object-cover rounded"
                            />
                            <button
                              onClick={() =>
                                setReviewPhotos(
                                  reviewPhotos.filter((_, i) => i !== index),
                                )
                              }
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {reviewPhotos.length < 4 && (
                          <button
                            onClick={() =>
                              toast.info("Photo upload feature coming soon!")
                            }
                            className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center hover:bg-muted"
                          >
                            <Upload className="w-6 h-6 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add up to 4 photos
                      </p>
                    </div>
                    <Button onClick={handleSubmitReview} className="w-full">
                      Submit Review
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Section */}
      <div className="container py-16">
        <h2 className="text-3xl font-bold mb-8">Portfolio</h2>
        {portfolioLoading ? (
          <p className="text-muted-foreground">Loading portfolio...</p>
        ) : portfolio && portfolio.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {portfolio.map((image) => {
              const aiStyles: string[] = safeJsonParse<string[]>(
                image.aiStyles,
                [],
              );
              const aiTags: string[] = safeJsonParse<string[]>(
                image.aiTags,
                [],
              );
              const hasAI = aiStyles.length > 0 || aiTags.length > 0;

              return (
                <Card
                  key={image.id}
                  className="overflow-hidden group cursor-pointer"
                >
                  <div className="aspect-square relative">
                    <img
                      src={image.imageUrl}
                      alt={
                        image.aiDescription ||
                        image.caption ||
                        "Portfolio image"
                      }
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {hasAI && (
                      <div className="absolute top-2 right-2">
                        <Sparkles className="h-4 w-4 text-primary drop-shadow" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    {image.caption && (
                      <p className="text-sm text-muted-foreground">
                        {image.caption}
                      </p>
                    )}
                    {aiStyles.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {aiStyles.map((style) => (
                          <Badge
                            key={`style-${style}`}
                            variant="secondary"
                            className="text-xs"
                          >
                            {style}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {aiTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {aiTags.slice(0, 4).map((tag) => (
                          <Badge
                            key={`tag-${tag}`}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">No portfolio images yet.</p>
        )}
      </div>

      {/* Flash Art Catalog Section */}
      {flashItems && flashItems.length > 0 && (
        <div className="container py-16 border-t bg-gradient-to-b from-background via-amber-500/5 to-background">
          <div className="mb-8">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold uppercase tracking-wider mb-3">
              <Crown className="w-3.5 h-3.5" />
              Available Flash Designs
            </div>
            <h2 className="text-3xl font-bold">Catalog & Quick Picks</h2>
            <p className="text-muted-foreground mt-2">
              Original, exclusive designs by {artist.shopName}. Select a design to lock it with a deposit and claim it for your session.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {flashItems.map((item) => (
              <Card key={item.id} className="overflow-hidden bg-card border-border hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 group flex flex-col h-full">
                <div className="aspect-square relative overflow-hidden bg-muted">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none font-semibold flex items-center gap-1 shadow-md">
                      <Crown className="w-3 h-3" /> Exclusive
                    </Badge>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-t pt-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Price</p>
                        <p className="font-extrabold text-xl text-foreground">
                          ${(item.price / 100).toFixed(0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">To Lock</p>
                        <p className="font-bold text-sm text-amber-600 dark:text-amber-400">
                          ${(item.depositAmount / 100).toFixed(0)} Deposit
                        </p>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-md shadow-amber-500/10 gap-1.5"
                      onClick={() => handleLockFlashClick(item)}
                    >
                      <Sparkles className="w-4 h-4 fill-current" />
                      Lock Design
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="container py-16 border-t">
        <h2 className="text-3xl font-bold mb-8">Reviews</h2>
        {reviewsLoading ? (
          <p className="text-muted-foreground">Loading reviews...</p>
        ) : reviews && reviews.length > 0 ? (
          <>
            <ReviewFilters
              selectedRating={selectedRating}
              sortBy={sortBy}
              onRatingChange={setSelectedRating}
              onSortChange={setSortBy}
            />
            <div className="space-y-6">
              {reviews
                .filter(
                  (review) =>
                    selectedRating === null || review.rating === selectedRating,
                )
                .sort((a, b) => {
                  if (sortBy === "recent")
                    return (
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                    );
                  if (sortBy === "highest") return b.rating - a.rating;
                  if (sortBy === "helpful")
                    return (b.helpfulVotes || 0) - (a.helpfulVotes || 0);
                  return 0;
                })
                .map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onHelpfulClick={(reviewId) => {
                      toast.success("Thanks for your feedback!");
                    }}
                  />
                ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">
            No reviews yet. Be the first to review!
          </p>
        )}
      </div>

      {/* Booking Dialog */}
      {showBookingDialog && (
        <BookingDialog
          open={showBookingDialog}
          onOpenChange={setShowBookingDialog}
          artistId={artistId}
          artistName={artist.shopName}
        />
      )}

      {/* Lock Flash Art Booking Dialog */}
      <Dialog open={!!selectedFlash} onOpenChange={(open) => { if (!open) setSelectedFlash(null); }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 font-bold text-xl">
              <Crown className="w-5 h-5 text-amber-500" />
              Lock Flash Design
            </DialogTitle>
          </DialogHeader>
          {selectedFlash && (
            <form onSubmit={handleConfirmLock} className="space-y-4 pt-4">
              <div className="flex gap-4 items-start border-b pb-4">
                <img
                  src={selectedFlash.imageUrl}
                  alt={selectedFlash.title}
                  className="w-16 h-16 object-cover rounded-lg border flex-shrink-0"
                />
                <div className="space-y-1">
                  <h4 className="font-bold text-foreground leading-tight">{selectedFlash.title}</h4>
                  <p className="text-xs text-muted-foreground">by {artist.shopName}</p>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    ${(selectedFlash.depositAmount / 100).toFixed(0)} deposit required
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lock-date">Preferred Appointment Date & Time</Label>
                <Input
                  id="lock-date"
                  type="datetime-local"
                  required
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  disabled={createCheckoutMutation.isPending}
                />
                <p className="text-[10px] text-muted-foreground">
                  Choose a tentative date. The artist will verify and confirm final scheduling with you.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lock-phone">Your Phone Number</Label>
                <Input
                  id="lock-phone"
                  type="tel"
                  placeholder="(555) 555-5555"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  disabled={createCheckoutMutation.isPending}
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Paying the <strong>${(selectedFlash.depositAmount / 100).toFixed(0)} deposit</strong> locks this custom design exclusively for you. Other users will no longer be able to purchase it, and a pending booking will be created on the artist's schedule.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedFlash(null)}
                  disabled={createCheckoutMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                  disabled={createCheckoutMutation.isPending}
                >
                  {createCheckoutMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    "Proceed to Deposit"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
