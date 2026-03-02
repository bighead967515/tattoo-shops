ALTER TABLE "tattooRequests" ADD CONSTRAINT "tattooRequests_selectedBidId_fkey" FOREIGN KEY ("selectedBidId") REFERENCES "bids"("id") ON DELETE SET NULL;
