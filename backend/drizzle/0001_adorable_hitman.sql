ALTER TABLE "tattooRequests" DROP CONSTRAINT "tattooRequests_selectedBidId_bids_id_fk";
--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_userId_unique" UNIQUE("userId");--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_unique" UNIQUE("userId");