ALTER TABLE "bookings" ADD COLUMN "cancelledBy" varchar(50);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "refundStatus" varchar(50) DEFAULT 'not_requested' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "refundReason" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "refundRequestedAt" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "refundProcessedAt" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "stripeRefundId" varchar(255);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "source" varchar(100) DEFAULT 'ink_connect' NOT NULL;