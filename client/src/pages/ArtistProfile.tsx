import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, MapPin, Phone, Globe, Instagram, Facebook, Heart, Calendar, Upload } from "lucide-react";
import { toast } from "sonner";
import BookingDialog from "@/components/BookingDialog";
import ReviewCard from "@/components/ReviewCard";
import ReviewFilters from "@/components/ReviewFilters";

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
  const [sortBy, setSortBy] = useState<"recent" | "highest" | "helpful">("recent");

  const { data: artist, isLoading: artistLoading } = trpc.artists.getById.useQuery({ id: artistId });
  const { data: portfolio, isLoading: portfolioLoading } = trpc.portfolio.get.useQuery({ artistId });
  const { data: reviews, isLoading: reviewsLoading, refetch: refetchReviews } = trpc.reviews.getByArtistId.useQuery({ artistId });
  const { data: isFav, refetch: refetchFavorite } = trpc.favorites.isFavorite.useQuery(
    { artistId },
    { enabled: !!user }
  );

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
          <Button onClick={() => setLocation("/artist-finder")}>Find Artists</Button>
        </div>
      </div>
    );
  }

  const avgRating = artist.averageRating ? parseFloat(artist.averageRating) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4">{artist.shopName}</h1>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= avgRating ? "fill-primary text-primary" : "text-muted-foreground"
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
                    <span className="font-semibold">{artist.experience}</span> years of experience
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
                    <span className="text-muted-foreground">Extra Large (10"+)</span>
                    <span className="font-medium">$1,200+</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">*Prices vary based on complexity and detail</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-6">
                {artist.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{artist.address}, {artist.city}, {artist.state} {artist.zipCode}</span>
                  </div>
                )}
                {artist.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${artist.phone}`} className="hover:text-primary">{artist.phone}</a>
                  </div>
                )}
                {artist.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a href={artist.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                      Website
                    </a>
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className="flex gap-4 mb-6">
                {artist.instagram && (
                  <a href={artist.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {artist.facebook && (
                  <a href={artist.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[200px]">
              <Button size="lg" className="w-full" onClick={handleBookNow}>
                <Calendar className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={handleToggleFavorite}
              >
                <Heart className={`w-4 h-4 mr-2 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                {isFav ? "Saved" : "Save Artist"}
              </Button>
              <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
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
                      <label className="block text-sm font-medium mb-2">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= reviewRating ? "fill-primary text-primary" : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Comment</label>
                      <Textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Photos (Optional)</label>
                      <div className="flex gap-2 flex-wrap">
                        {reviewPhotos.map((photo, index) => (
                          <div key={index} className="relative w-20 h-20 rounded border">
                            <img src={photo} alt="Review" className="w-full h-full object-cover rounded" />
                            <button
                              onClick={() => setReviewPhotos(reviewPhotos.filter((_, i) => i !== index))}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {reviewPhotos.length < 4 && (
                          <button
                            onClick={() => toast.info("Photo upload feature coming soon!")}
                            className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center hover:bg-muted"
                          >
                            <Upload className="w-6 h-6 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Add up to 4 photos</p>
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
            {portfolio.map((image) => (
              <Card key={image.id} className="overflow-hidden group cursor-pointer">
                <div className="aspect-square relative">
                  <img
                    src={image.imageUrl}
                    alt={image.caption || "Portfolio image"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                {image.caption && (
                  <div className="p-3">
                    <p className="text-sm text-muted-foreground">{image.caption}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No portfolio images yet.</p>
        )}
      </div>

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
                .filter(review => selectedRating === null || review.rating === selectedRating)
                .sort((a, b) => {
                  if (sortBy === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  if (sortBy === "highest") return b.rating - a.rating;
                  if (sortBy === "helpful") return (b.helpfulVotes || 0) - (a.helpfulVotes || 0);
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
          <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
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
    </div>
  );
}
