-- ============================================================
-- Migration: 0003_constraint_improvements
-- Description: Implements all six database constraint improvements:
--   Fix #1: Ensure FK constraints on bookings table
--   Fix #2: Add booking_status and webhook_status enums
--   Fix #3: Unique constraint on reviews(userId, artistId)
--   Fix #4: Change averageRating from text to numeric(3,2)
--   Fix #5: Replace bookings.budget varchar with budgetMin/budgetMax integers + budgetNotes
--   Fix #6: CHECK constraint on reviews.rating (1-5)
--   Bonus:  Add performance indexes
-- ============================================================

-- ============================================================
-- FIX #2: Create new enum types for booking and webhook status
-- ============================================================
DO $$ BEGIN
  CREATE TYPE "booking_status" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "webhook_status" AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- ============================================================
-- FIX #1: Ensure FK constraints exist on bookings table
-- (Safe: uses IF NOT EXISTS pattern via DO block)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_artistId_artists_id_fk'
      AND table_name = 'bookings'
  ) THEN
    ALTER TABLE "bookings"
      ADD CONSTRAINT "bookings_artistId_artists_id_fk"
      FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_userId_users_id_fk'
      AND table_name = 'bookings'
  ) THEN
    ALTER TABLE "bookings"
      ADD CONSTRAINT "bookings_userId_users_id_fk"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;
--> statement-breakpoint

-- ============================================================
-- FIX #2: Migrate bookings.status from varchar to booking_status enum
-- ============================================================
ALTER TABLE "bookings"
  ALTER COLUMN "status" TYPE "booking_status"
  USING "status"::"booking_status";
--> statement-breakpoint

-- ============================================================
-- FIX #2: Migrate webhookQueue.status from varchar to webhook_status enum
-- ============================================================
ALTER TABLE "webhookQueue"
  ALTER COLUMN "status" TYPE "webhook_status"
  USING "status"::"webhook_status";
--> statement-breakpoint

-- ============================================================
-- FIX #3: Add unique constraint on reviews(userId, artistId)
-- Prevents duplicate reviews from the same user for the same artist
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reviews_user_artist_unique'
      AND table_name = 'reviews'
  ) THEN
    ALTER TABLE "reviews"
      ADD CONSTRAINT "reviews_user_artist_unique" UNIQUE ("userId", "artistId");
  END IF;
END $$;
--> statement-breakpoint

-- ============================================================
-- FIX #4: Change artists.averageRating from text to numeric(3,2)
-- Allows proper indexing and eliminates runtime CAST overhead
-- ============================================================
ALTER TABLE "artists"
  ALTER COLUMN "averageRating" TYPE NUMERIC(3, 2)
  USING CASE
    WHEN "averageRating" IS NULL OR "averageRating" = '' THEN NULL
    ELSE CAST("averageRating" AS NUMERIC(3, 2))
  END;
--> statement-breakpoint

-- ============================================================
-- FIX #5: Replace bookings.budget (varchar) with integer cents fields
-- Add budgetMin, budgetMax (integers, cents) and budgetNotes (varchar)
-- The old budget column is renamed to budgetNotes for backward compat
-- ============================================================
DO $$ BEGIN
  -- Rename old budget column to budgetNotes (preserves existing data)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'budget'
  ) THEN
    ALTER TABLE "bookings" RENAME COLUMN "budget" TO "budgetNotes";
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'budgetMin'
  ) THEN
    ALTER TABLE "bookings" ADD COLUMN "budgetMin" INTEGER;
  END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'budgetMax'
  ) THEN
    ALTER TABLE "bookings" ADD COLUMN "budgetMax" INTEGER;
  END IF;
END $$;
--> statement-breakpoint

-- ============================================================
-- FIX #6: Add CHECK constraint on reviews.rating (must be 1-5)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reviews_rating_range'
      AND table_name = 'reviews'
  ) THEN
    ALTER TABLE "reviews"
      ADD CONSTRAINT "reviews_rating_range" CHECK ("rating" >= 1 AND "rating" <= 5);
  END IF;
END $$;
--> statement-breakpoint

-- ============================================================
-- BONUS: Add performance indexes for common query patterns
-- ============================================================

-- Artists: city/state for location-based filtering
CREATE INDEX IF NOT EXISTS "artists_city_state_idx" ON "artists" ("city", "state");
--> statement-breakpoint

-- Artists: rating for sorted/filtered listings
CREATE INDEX IF NOT EXISTS "artists_rating_idx" ON "artists" ("averageRating");
--> statement-breakpoint

-- Artists: approval status filter
CREATE INDEX IF NOT EXISTS "artists_approved_idx" ON "artists" ("isApproved");
--> statement-breakpoint

-- Reviews: artist lookup
CREATE INDEX IF NOT EXISTS "reviews_artist_id_idx" ON "reviews" ("artistId");
--> statement-breakpoint

-- Portfolio images: artist lookup
CREATE INDEX IF NOT EXISTS "portfolio_artist_id_idx" ON "portfolioImages" ("artistId");
--> statement-breakpoint

-- Bookings: artist and user lookups, status filter
CREATE INDEX IF NOT EXISTS "bookings_artist_id_idx" ON "bookings" ("artistId");
CREATE INDEX IF NOT EXISTS "bookings_user_id_idx" ON "bookings" ("userId");
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings" ("status");
--> statement-breakpoint

-- Webhook queue: status + nextRetryAt for efficient queue processing
CREATE INDEX IF NOT EXISTS "webhook_queue_status_retry_idx" ON "webhookQueue" ("status", "nextRetryAt");
--> statement-breakpoint

-- Tattoo requests: client lookup and status filter
CREATE INDEX IF NOT EXISTS "tattoo_requests_client_id_idx" ON "tattooRequests" ("clientId");
CREATE INDEX IF NOT EXISTS "tattoo_requests_status_idx" ON "tattooRequests" ("status");
--> statement-breakpoint

-- Bids: request and artist lookups
CREATE INDEX IF NOT EXISTS "bids_request_id_idx" ON "bids" ("requestId");
CREATE INDEX IF NOT EXISTS "bids_artist_id_idx" ON "bids" ("artistId");
--> statement-breakpoint

-- Request messages: request lookup
CREATE INDEX IF NOT EXISTS "request_messages_request_id_idx" ON "requestMessages" ("requestId");
