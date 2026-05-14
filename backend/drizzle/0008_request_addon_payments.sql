-- Add structured add-on fields for tattoo requests and Stripe payment tracking
ALTER TABLE "tattooRequests"
  ADD COLUMN "addOnPriorityBoost" boolean DEFAULT false NOT NULL,
  ADD COLUMN "addOnFeaturedBadge" boolean DEFAULT false NOT NULL,
  ADD COLUMN "addOnDirectMessageCredits" integer DEFAULT 0 NOT NULL,
  ADD COLUMN "addOnTotalCents" integer DEFAULT 0 NOT NULL,
  ADD COLUMN "addOnPaymentStatus" varchar(30) DEFAULT 'not_requested' NOT NULL,
  ADD COLUMN "addOnStripeCheckoutSessionId" varchar(255),
  ADD COLUMN "addOnStripePaymentIntentId" varchar(255),
  ADD COLUMN "addOnPaidAt" timestamp;
