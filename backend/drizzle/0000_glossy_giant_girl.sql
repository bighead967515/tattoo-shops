CREATE TYPE "public"."bid_status" AS ENUM('pending', 'accepted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('open', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'artist', 'client');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('unverified', 'pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"shop_name" varchar(255) NOT NULL,
	"bio" text,
	"specialties" text,
	"styles" text,
	"experience" integer,
	"address" text,
	"city" varchar(100),
	"state" varchar(50),
	"zip" varchar(20),
	"phone" varchar(50),
	"website" varchar(500),
	"instagram" varchar(255),
	"facebook" varchar(500),
	"lat" text,
	"lng" text,
	"averageRating" text,
	"totalReviews" integer DEFAULT 0,
	"isApproved" boolean DEFAULT false,
	"subscriptionTier" varchar(30) DEFAULT 'artist_free' NOT NULL,
	"bidsUsed" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artists_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "bids" (
	"id" serial PRIMARY KEY NOT NULL,
	"requestId" integer NOT NULL,
	"artistId" integer NOT NULL,
	"priceEstimate" integer NOT NULL,
	"estimatedHours" integer,
	"message" text NOT NULL,
	"availableDate" timestamp,
	"portfolioLinks" text,
	"status" "bid_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bids_artistId_requestId_unique" UNIQUE("artistId","requestId")
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
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"displayName" varchar(255) NOT NULL,
	"bio" text,
	"preferredStyles" text,
	"city" varchar(100),
	"state" varchar(50),
	"phone" varchar(50),
	"onboardingCompleted" boolean DEFAULT false,
	"subscriptionTier" varchar(30) DEFAULT 'client_free' NOT NULL,
	"aiCredits" integer DEFAULT 0 NOT NULL,
	"stripeSubscriptionId" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clients_userId_unique" UNIQUE("userId")
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
	"aiStyles" text,
	"aiTags" text,
	"aiDescription" text,
	"qualityScore" integer,
	"qualityIssues" text,
	"aiProcessedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requestImages" (
	"id" serial PRIMARY KEY NOT NULL,
	"requestId" integer NOT NULL,
	"imageUrl" varchar(1000) NOT NULL,
	"imageKey" varchar(500) NOT NULL,
	"caption" text,
	"isMainImage" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requestMessages" (
	"id" serial PRIMARY KEY NOT NULL,
	"requestId" integer NOT NULL,
	"bidId" integer,
	"senderId" integer,
	"message" text NOT NULL,
	"isRead" boolean DEFAULT false,
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
	"moderationStatus" varchar(20) DEFAULT 'pending',
	"moderationFlags" text,
	"toxicityScore" integer,
	"spamScore" integer,
	"fraudScore" integer,
	"moderationReason" text,
	"moderatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tattooRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"clientId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"style" varchar(100),
	"placement" varchar(100) NOT NULL,
	"size" varchar(50) NOT NULL,
	"colorPreference" varchar(50),
	"budgetMin" integer,
	"budgetMax" integer,
	"preferredCity" varchar(100),
	"preferredState" varchar(50),
	"willingToTravel" boolean DEFAULT false,
	"desiredTimeframe" varchar(100),
	"status" "request_status" DEFAULT 'open' NOT NULL,
	"selectedBidId" integer,
	"viewCount" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"verification_status" "verification_status" DEFAULT 'unverified' NOT NULL,
	"licenseDocumentKey" varchar(500),
	"licenseDocumentUrl" varchar(1000),
	"verificationSubmittedAt" timestamp,
	"verificationReviewedAt" timestamp,
	"verificationNotes" text,
	"subscriptionTier" varchar(30) DEFAULT null,
	"stripeCustomerId" varchar(255),
	"stripeSubscriptionId" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "verificationDocuments" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"documentType" varchar(100) NOT NULL,
	"documentKey" varchar(500) NOT NULL,
	"originalFileName" varchar(255) NOT NULL,
	"fileSize" integer,
	"mimeType" varchar(100),
	"status" "verification_status" DEFAULT 'pending' NOT NULL,
	"reviewedBy" integer,
	"reviewNotes" text,
	"ocrDocumentType" varchar(50),
	"ocrExtractedName" varchar(255),
	"ocrExtractedBusinessName" varchar(255),
	"ocrLicenseNumber" varchar(100),
	"ocrExpirationDate" varchar(20),
	"ocrIssuingAuthority" varchar(255),
	"ocrConfidence" integer,
	"ocrNameMatch" varchar(20),
	"ocrVerdict" varchar(20),
	"ocrVerdictReason" text,
	"ocrIssues" text,
	"ocrProcessedAt" timestamp,
	"submittedAt" timestamp DEFAULT now() NOT NULL,
	"reviewedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhookQueue" (
	"id" serial PRIMARY KEY NOT NULL,
	"eventId" varchar(255) NOT NULL,
	"eventType" varchar(100) NOT NULL,
	"payload" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"retryCount" integer DEFAULT 0 NOT NULL,
	"maxRetries" integer DEFAULT 5 NOT NULL,
	"nextRetryAt" timestamp NOT NULL,
	"lastError" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhookQueue_eventId_unique" UNIQUE("eventId")
);
--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_requestId_tattooRequests_id_fk" FOREIGN KEY ("requestId") REFERENCES "public"."tattooRequests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_artistId_artists_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_artistId_artists_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_artistId_artists_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolioImages" ADD CONSTRAINT "portfolioImages_artistId_artists_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requestImages" ADD CONSTRAINT "requestImages_requestId_tattooRequests_id_fk" FOREIGN KEY ("requestId") REFERENCES "public"."tattooRequests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requestMessages" ADD CONSTRAINT "requestMessages_requestId_tattooRequests_id_fk" FOREIGN KEY ("requestId") REFERENCES "public"."tattooRequests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requestMessages" ADD CONSTRAINT "requestMessages_bidId_bids_id_fk" FOREIGN KEY ("bidId") REFERENCES "public"."bids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requestMessages" ADD CONSTRAINT "requestMessages_senderId_users_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_artistId_artists_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tattooRequests" ADD CONSTRAINT "tattooRequests_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verificationDocuments" ADD CONSTRAINT "verificationDocuments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verificationDocuments" ADD CONSTRAINT "verificationDocuments_reviewedBy_users_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tattooRequests" ADD CONSTRAINT "tattooRequests_selectedBidId_bids_id_fk" FOREIGN KEY ("selectedBidId") REFERENCES "public"."bids"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5);