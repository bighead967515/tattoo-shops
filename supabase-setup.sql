-- ============================================
-- Supabase Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE "portfolioImages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. DROP EXISTING POLICIES (if any)
-- ============================================

DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Artists can update own profile" ON artists;
DROP POLICY IF EXISTS "Anyone can view approved artists" ON artists;
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Artists can view their bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
DROP POLICY IF EXISTS "Anyone can view portfolio images" ON "portfolioImages";
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;

-- ============================================
-- 3. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Users table policies
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (
    "openId" = auth.uid()::text
  );

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (
    "openId" = auth.uid()::text
  );

-- Artists table policies
CREATE POLICY "Artists can update own profile"
  ON artists FOR UPDATE
  USING (
    "userId" IN (
      SELECT id FROM users WHERE "openId" = auth.uid()::text
    )
  );

CREATE POLICY "Artists can insert own profile"
  ON artists FOR INSERT
  WITH CHECK (
    "userId" IN (
      SELECT id FROM users WHERE "openId" = auth.uid()::text
    )
  );

CREATE POLICY "Anyone can view approved artists"
  ON artists FOR SELECT
  USING ("isApproved" = true);

-- Bookings table policies
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (
    "userId" IN (
      SELECT id FROM users WHERE "openId" = auth.uid()::text
    )
  );

CREATE POLICY "Artists can view their bookings"
  ON bookings FOR SELECT
  USING (
    "artistId" IN (
      SELECT a.id FROM artists a
      JOIN users u ON a."userId" = u.id
      WHERE u."openId" = auth.uid()::text
    )
  );

CREATE POLICY "Authenticated users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (
    "userId" IN (
      SELECT id FROM users WHERE "openId" = auth.uid()::text
    )
  );

-- Favorites table policies
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (
    "userId" IN (
      SELECT id FROM users WHERE "openId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  USING (
    "userId" IN (
      SELECT id FROM users WHERE "openId" = auth.uid()::text
    )
  );

-- Portfolio images policies
CREATE POLICY "Anyone can view portfolio images"
  ON "portfolioImages" FOR SELECT
  USING (true);

CREATE POLICY "Artists can manage own portfolio"
  ON "portfolioImages" FOR ALL
  USING (
    "artistId" IN (
      SELECT a.id FROM artists a
      JOIN users u ON a."userId" = u.id
      WHERE u."openId" = auth.uid()::text
    )
  );

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    "userId" IN (
      SELECT id FROM users WHERE "openId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (
    "userId" IN (
      SELECT id FROM users WHERE "openId" = auth.uid()::text
    )
  );

CREATE POLICY "Artists can respond to their reviews"
  ON reviews FOR UPDATE
  USING (
    "artistId" IN (
      SELECT a.id FROM artists a
      JOIN users u ON a."userId" = u.id
      WHERE u."openId" = auth.uid()::text
    )
  );

-- ============================================
-- 4. STORAGE POLICIES
-- ============================================

-- Public can view images
CREATE POLICY "Public can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-images');

-- Authenticated users can upload images
CREATE POLICY "Artists can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolio-images' AND
    auth.role() = 'authenticated'
  );

-- Artists can delete own images
CREATE POLICY "Artists can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'portfolio-images' AND
    auth.role() = 'authenticated'
  );

-- Artists can update own images (metadata)
CREATE POLICY "Artists can update own images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'portfolio-images' AND
    auth.role() = 'authenticated'
  );

-- ============================================
-- 5. DATABASE FUNCTIONS
-- ============================================

-- Function to create user after Supabase auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    "openId",
    email,
    name,
    "loginMethod",
    role,
    "createdAt",
    "updatedAt",
    "lastSignedIn"
  )
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.app_metadata->>'provider' = 'email' THEN 'email'
      WHEN NEW.app_metadata->>'provider' = 'google' THEN 'google'
      WHEN NEW.app_metadata->>'provider' = 'github' THEN 'github'
      ELSE NEW.app_metadata->>'provider'
    END,
    'user',
    NOW(),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user's last signed in timestamp
CREATE OR REPLACE FUNCTION public.handle_user_signin()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET "lastSignedIn" = NOW()
  WHERE "openId" = NEW.id::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update artist average rating when reviews change
CREATE OR REPLACE FUNCTION public.update_artist_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.artists
  SET 
    "averageRating" = (
      SELECT AVG(rating)::text
      FROM public.reviews
      WHERE "artistId" = COALESCE(NEW."artistId", OLD."artistId")
    ),
    "totalReviews" = (
      SELECT COUNT(*)::integer
      FROM public.reviews
      WHERE "artistId" = COALESCE(NEW."artistId", OLD."artistId")
    ),
    "updatedAt" = NOW()
  WHERE id = COALESCE(NEW."artistId", OLD."artistId");
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Trigger to create user record after auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update last signed in
DROP TRIGGER IF EXISTS on_auth_user_signin ON auth.users;
CREATE TRIGGER on_auth_user_signin
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.handle_user_signin();

-- Trigger to update artist rating on review insert/update/delete
DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_artist_rating();

-- Triggers to auto-update updatedAt on all tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_artists_updated_at ON artists;
CREATE TRIGGER update_artists_updated_at
  BEFORE UPDATE ON artists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================

-- Index on openId for faster user lookups
CREATE INDEX IF NOT EXISTS idx_users_open_id ON users("openId");

-- Index on userId for artist lookups
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists("userId");

-- Index on artistId for bookings and reviews
CREATE INDEX IF NOT EXISTS idx_bookings_artist_id ON bookings("artistId");
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings("userId");
CREATE INDEX IF NOT EXISTS idx_reviews_artist_id ON reviews("artistId");
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews("userId");
CREATE INDEX IF NOT EXISTS idx_portfolio_artist_id ON "portfolioImages"("artistId");
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites("userId");
CREATE INDEX IF NOT EXISTS idx_favorites_artist_id ON favorites("artistId");

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_artists_approved_city ON artists("isApproved", city) WHERE "isApproved" = true;
CREATE INDEX IF NOT EXISTS idx_bookings_status_date ON bookings(status, "createdAt");

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- Verify setup
SELECT 
  'Users table RLS enabled' as check, 
  COUNT(*) as policies
FROM pg_policies 
WHERE tablename = 'users';

SELECT 
  'Triggers created' as check,
  COUNT(*) as count
FROM pg_trigger
WHERE tgname LIKE 'on_%' OR tgname LIKE 'update_%';
