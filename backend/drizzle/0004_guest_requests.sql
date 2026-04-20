-- Migration: Allow guest (unauthenticated) tattoo idea submissions
-- 1. Drop the NOT NULL constraint on clientId so guests can submit without an account
-- 2. Change the FK to SET NULL on delete (was CASCADE)
-- 3. Add optional guestEmail column for guests to leave contact info

-- Step 1: Drop the existing FK constraint
ALTER TABLE "tattooRequests"
  DROP CONSTRAINT IF EXISTS "tattooRequests_clientId_clients_id_fk";

-- Step 2: Make clientId nullable
ALTER TABLE "tattooRequests"
  ALTER COLUMN "clientId" DROP NOT NULL;

-- Step 3: Re-add FK with SET NULL on delete
ALTER TABLE "tattooRequests"
  ADD CONSTRAINT "tattooRequests_clientId_clients_id_fk"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

-- Step 4: Add guestEmail column
ALTER TABLE "tattooRequests"
  ADD COLUMN IF NOT EXISTS "guestEmail" varchar(255);
