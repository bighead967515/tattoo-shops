-- Migration: Add monthly bid tracking columns to artists table
-- bidsThisMonth: counter that resets each calendar month
-- bidsMonthYear: YYYY-MM string used to detect when a new month starts

ALTER TABLE "artists"
  ADD COLUMN IF NOT EXISTS "bidsThisMonth" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bidsMonthYear" varchar(7) NOT NULL DEFAULT '2000-01';
