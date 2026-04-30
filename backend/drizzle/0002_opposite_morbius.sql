-- Add Founding Artist fields to artists table
ALTER TABLE "artists" ADD COLUMN "isFoundingArtist" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "artists" ADD COLUMN "foundingTrialEndsAt" timestamp;
