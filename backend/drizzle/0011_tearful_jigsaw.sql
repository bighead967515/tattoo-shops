ALTER TABLE "requestImages" ADD COLUMN "isExistingTattoo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tattooRequests" ADD COLUMN "isCoverUp" boolean DEFAULT false NOT NULL;