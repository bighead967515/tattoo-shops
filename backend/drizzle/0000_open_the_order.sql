CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'artist');--> statement-breakpoint
CREATE TABLE "artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"shopName" varchar(255) NOT NULL,
	"bio" text,
	"specialties" text,
	"styles" text,
	"experience" integer,
	"address" text,
	"city" varchar(100),
	"state" varchar(50),
	"zipCode" varchar(20),
	"phone" varchar(50),
	"website" varchar(500),
	"instagram" varchar(255),
	"facebook" varchar(500),
	"lat" text,
	"lng" text,
	"averageRating" text,
	"totalReviews" integer DEFAULT 0,
	"isApproved" boolean DEFAULT false,
	"subscriptionTier" varchar(20) DEFAULT 'free' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"artistId" integer NOT NULL,
	"userId" integer,
	"customerName" varchar(255) NOT NULL,
	"customerEmail" varchar(320) NOT NULL,
	"customerPhone" varchar(50) NOT NULL,
	"preferredDate" timestamp NOT NULL,
	"tattooDescription" text NOT NULL,
	"placement" varchar(255) NOT NULL,
	"size" varchar(100) NOT NULL,
	"budget" varchar(100),
	"additionalNotes" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"stripePaymentIntentId" varchar(255),
	"depositAmount" integer,
	"depositPaid" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"artistId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_userId_artistId_unique" UNIQUE("userId","artistId")
);
--> statement-breakpoint
CREATE TABLE "portfolioImages" (
	"id" serial PRIMARY KEY NOT NULL,
	"artistId" integer NOT NULL,
	"imageUrl" varchar(1000) NOT NULL,
	"imageKey" varchar(500) NOT NULL,
	"caption" text,
	"style" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"artistId" integer NOT NULL,
	"userId" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"helpfulVotes" integer DEFAULT 0,
	"verifiedBooking" boolean DEFAULT false,
	"photos" text,
	"artistResponse" text,
	"artistResponseDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"stripeCustomerId" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_artistId_artists_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;