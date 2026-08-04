ALTER TABLE "requestImages" ADD COLUMN "status" varchar(20) DEFAULT 'reserved' NOT NULL;--> statement-breakpoint
UPDATE "requestImages" SET "status" = 'finalized';--> statement-breakpoint
ALTER TABLE "requestImages" ADD CONSTRAINT "requestImages_imageKey_unique" UNIQUE("imageKey");