-- Migration: Add structured add-on fields for tattoo requests and Stripe payment tracking
ALTER TABLE "tattooRequests"
  ADD COLUMN IF NOT EXISTS "addOnPriorityBoost" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "addOnFeaturedBadge" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "addOnDirectMessageCredits" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "addOnTotalCents" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "addOnPaymentStatus" varchar(30) DEFAULT 'not_requested' NOT NULL,
  ADD COLUMN IF NOT EXISTS "addOnStripeCheckoutSessionId" varchar(255),
  ADD COLUMN IF NOT EXISTS "addOnStripePaymentIntentId" varchar(255),
  ADD COLUMN IF NOT EXISTS "addOnPaidAt" timestamp;
