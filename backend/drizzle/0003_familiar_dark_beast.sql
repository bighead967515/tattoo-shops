ALTER TABLE "tattooRequests" ADD COLUMN "selectedAddons" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tattooRequests" ADD COLUMN "addOnTotalCents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tattooRequests" ADD COLUMN "addOnPaymentStatus" varchar(30) DEFAULT 'not_requested' NOT NULL;--> statement-breakpoint
ALTER TABLE "tattooRequests" ADD COLUMN "addOnStripeCheckoutSessionId" varchar(255);--> statement-breakpoint
ALTER TABLE "tattooRequests" ADD COLUMN "addOnStripePaymentIntentId" varchar(255);--> statement-breakpoint
ALTER TABLE "tattooRequests" ADD COLUMN "addOnPaidAt" timestamp;