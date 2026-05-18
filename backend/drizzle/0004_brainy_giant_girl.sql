ALTER TABLE "artists" ADD COLUMN "bidTokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "artists" ADD COLUMN "chatTokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "artists" ADD COLUMN "aiCredits" integer DEFAULT 0 NOT NULL;