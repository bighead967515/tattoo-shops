CREATE TABLE "chatUnlocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"requestId" integer NOT NULL,
	"artistId" integer NOT NULL,
	"clientId" integer NOT NULL,
	"tokensSpent" integer DEFAULT 1 NOT NULL,
	"unlockedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chatUnlocks_artistId_requestId_unique" UNIQUE("artistId","requestId")
);
--> statement-breakpoint
ALTER TABLE "bids" ADD COLUMN "chatUnlockedByArtist" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tattooRequests" ADD COLUMN "priorityExpiresAt" timestamp;--> statement-breakpoint
ALTER TABLE "tattooRequests" ADD COLUMN "blindBids" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chatUnlocks" ADD CONSTRAINT "chatUnlocks_requestId_tattooRequests_id_fk" FOREIGN KEY ("requestId") REFERENCES "public"."tattooRequests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatUnlocks" ADD CONSTRAINT "chatUnlocks_artistId_artists_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatUnlocks" ADD CONSTRAINT "chatUnlocks_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;