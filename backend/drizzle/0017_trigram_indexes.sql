-- Migration: Add trigram search indexes for shop and artist searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS artists_styles_trgm_idx ON "artists" USING gin ("styles" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS artists_specialties_trgm_idx ON "artists" USING gin ("specialties" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS artists_bio_trgm_idx ON "artists" USING gin ("bio" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS artists_shop_name_trgm_idx ON "artists" USING gin ("shop_name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS artists_city_trgm_idx ON "artists" USING gin ("city" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS artists_state_trgm_idx ON "artists" USING gin ("state" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS shops_name_trgm_idx ON "shops" USING gin ("shop_name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS shops_city_trgm_idx ON "shops" USING gin ("city" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS shops_state_trgm_idx ON "shops" USING gin ("state" gin_trgm_ops);
