-- Migration: Add platform transaction fee columns to bids table
-- These columns support the new 3-layer monetization model:
--   Pro subscribers: 5% fee (500 bps)
--   Pay-as-you-go:   10% fee (1000 bps)
--   Free tier:       0% (bidding blocked, should never appear)

ALTER TABLE "bids"
  ADD COLUMN IF NOT EXISTS "platformFeeRateBps" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "platformFeeAmountCents" integer;

COMMENT ON COLUMN "bids"."platformFeeRateBps" IS
  'Platform fee rate in basis points at bid creation time. 500=5% (Pro), 1000=10% (PAYG), 0=free.';

COMMENT ON COLUMN "bids"."platformFeeAmountCents" IS
  'Platform fee in cents, calculated and set when the bid is accepted. NULL until accepted.';
