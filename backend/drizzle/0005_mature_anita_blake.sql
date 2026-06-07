CREATE TABLE "flash_art" (
	"id" serial PRIMARY KEY NOT NULL,
	"artistId" integer NOT NULL,
	"imageUrl" varchar(1000) NOT NULL,
	"imageKey" varchar(500) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"depositAmount" integer NOT NULL,
	"isLocked" boolean DEFAULT false NOT NULL,
	"lockedByUserId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flash_art" ADD CONSTRAINT "flash_art_artistId_artists_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flash_art" ADD CONSTRAINT "flash_art_lockedByUserId_users_id_fk" FOREIGN KEY ("lockedByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists" DROP COLUMN "subscriptionTier";--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "subscriptionTier";