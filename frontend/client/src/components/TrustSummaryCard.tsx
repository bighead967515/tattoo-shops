import { ShieldCheck, Star, MessageSquare, BadgeCheck, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TrustSummaryCardProps {
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  verifiedBookingReviews?: number;
  acceptsDeposit: boolean;
}

/**
 * TrustSummaryCard — compact trust signal aggregator for the artist profile hero.
 * Renders verified status, rating, review count, verified booking review count,
 * and deposit availability in a scannable grid. All data degrades gracefully when absent.
 *
 * Issue #29 — Add trust summary component on artist profile.
 */
export default function TrustSummaryCard({
  isVerified,
  averageRating,
  totalReviews,
  verifiedBookingReviews = 0,
  acceptsDeposit,
}: TrustSummaryCardProps) {
  const hasRating = averageRating > 0 && totalReviews > 0;

  return (
    <Card className="bg-card/60 border border-border/50 shadow-sm p-4 w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        {/* Verified Status */}
        <div className="flex flex-col items-center gap-1 text-center">
          {isVerified ? (
            <>
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span className="text-xs font-semibold text-green-700 dark:text-green-400 leading-tight">
                Verified Artist
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                ID &amp; license confirmed
              </span>
            </>
          ) : (
            <>
              <BadgeCheck className="w-5 h-5 text-muted-foreground/50" />
              <span className="text-xs font-medium text-muted-foreground leading-tight">
                Not Verified
              </span>
              <span className="text-[10px] text-muted-foreground/60 leading-tight">
                Verification pending
              </span>
            </>
          )}
        </div>

        {/* Rating */}
        <div className="flex flex-col items-center gap-1 text-center">
          <Star
            className={`w-5 h-5 ${hasRating ? "fill-primary text-primary" : "text-muted-foreground/50"}`}
          />
          {hasRating ? (
            <>
              <span className="text-xs font-semibold leading-tight">
                {averageRating.toFixed(1)} / 5
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
              </span>
            </>
          ) : (
            <>
              <span className="text-xs font-medium text-muted-foreground leading-tight">
                No ratings yet
              </span>
              <span className="text-[10px] text-muted-foreground/60 leading-tight">
                Be the first to review
              </span>
            </>
          )}
        </div>

        {/* Verified Booking Reviews */}
        <div className="flex flex-col items-center gap-1 text-center">
          <MessageSquare
            className={`w-5 h-5 ${verifiedBookingReviews > 0 ? "text-primary" : "text-muted-foreground/50"}`}
          />
          {verifiedBookingReviews > 0 ? (
            <>
              <span className="text-xs font-semibold leading-tight">
                {verifiedBookingReviews}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                verified booking {verifiedBookingReviews === 1 ? "review" : "reviews"}
              </span>
            </>
          ) : (
            <>
              <span className="text-xs font-medium text-muted-foreground leading-tight">
                No verified bookings
              </span>
              <span className="text-[10px] text-muted-foreground/60 leading-tight">
                yet
              </span>
            </>
          )}
        </div>

        {/* Deposit Available */}
        <div className="flex flex-col items-center gap-1 text-center">
          <CreditCard
            className={`w-5 h-5 ${acceptsDeposit ? "text-primary" : "text-muted-foreground/50"}`}
          />
          {acceptsDeposit ? (
            <>
              <span className="text-xs font-semibold leading-tight">
                Secure Deposit
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                available via Stripe
              </span>
            </>
          ) : (
            <>
              <span className="text-xs font-medium text-muted-foreground leading-tight">
                No deposit
              </span>
              <span className="text-[10px] text-muted-foreground/60 leading-tight">
                contact directly
              </span>
            </>
          )}
        </div>

      </div>
    </Card>
  );
}
