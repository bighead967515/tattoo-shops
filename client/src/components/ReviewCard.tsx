import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, CheckCircle } from "lucide-react";
import { useState } from "react";

interface ReviewCardProps {
  review: {
    id: number;
    userName: string | null;
    rating: number;
    comment: string | null;
    createdAt: Date;
    helpfulVotes?: number | null;
    verifiedBooking?: number | null;
    photos?: string | null;
    artistResponse?: string | null;
    artistResponseDate?: Date | null;
  };
  onHelpfulClick?: (reviewId: number) => void;
}

export default function ReviewCard({ review, onHelpfulClick }: ReviewCardProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const photos = review.photos ? review.photos.split(",").filter(Boolean) : [];

  const handleHelpfulClick = () => {
    if (!hasVoted && onHelpfulClick) {
      onHelpfulClick(review.id);
      setHasVoted(true);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold">{review.userName || "Anonymous"}</p>
            {review.verifiedBooking === 1 && (
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Verified Booking
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(review.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= review.rating
                  ? "fill-primary text-primary"
                  : "text-muted-foreground"
              }`}
            />
          ))}
        </div>
      </div>

      {review.comment && (
        <p className="text-muted-foreground mb-4">{review.comment}</p>
      )}

      {/* Review Photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="aspect-square rounded-lg overflow-hidden bg-muted"
            >
              <img
                src={photo}
                alt={`Review photo ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
              />
            </div>
          ))}
        </div>
      )}

      {/* Helpful Button */}
      <div className="flex items-center gap-4 pt-3 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHelpfulClick}
          disabled={hasVoted}
          className={hasVoted ? "text-primary" : ""}
        >
          <ThumbsUp className={`w-4 h-4 mr-1 ${hasVoted ? "fill-primary" : ""}`} />
          Helpful {review.helpfulVotes ? `(${review.helpfulVotes})` : ""}
        </Button>
      </div>

      {/* Artist Response */}
      {review.artistResponse && (
        <div className="mt-4 pl-4 border-l-2 border-primary/20 bg-muted/30 p-4 rounded-r">
          <p className="text-sm font-semibold mb-1">Response from Artist</p>
          <p className="text-sm text-muted-foreground mb-2">
            {review.artistResponse}
          </p>
          {review.artistResponseDate && (
            <p className="text-xs text-muted-foreground">
              {new Date(review.artistResponseDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
