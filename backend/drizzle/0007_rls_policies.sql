-- Migration: Enable row-level security and define policies for all public tables.
--
-- Access model summary:
-- - Public marketplace content remains readable where appropriate.
-- - Authenticated users can access their own records via users.openId = auth.uid().
-- - Artist/client ownership is derived from the internal users.id bridge.
-- - Admin users retain full access through policy overrides.
-- - Backend service-role operations continue to bypass RLS as expected.

CREATE SCHEMA IF NOT EXISTS app_private;

REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO anon, authenticated;

CREATE OR REPLACE FUNCTION app_private.current_user_id()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.id
  FROM "users" u
  WHERE u."openId" = auth.uid()::text
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app_private.current_artist_id()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT a.id
  FROM artists a
  WHERE a."userId" = app_private.current_user_id()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app_private.current_client_id()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT c.id
  FROM clients c
  WHERE c."userId" = app_private.current_user_id()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app_private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "users" u
    WHERE u."openId" = auth.uid()::text
      AND u.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION app_private.owns_artist(target_artist_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM artists a
    WHERE a.id = target_artist_id
      AND a."userId" = app_private.current_user_id()
  );
$$;

CREATE OR REPLACE FUNCTION app_private.owns_request(target_request_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "tattooRequests" tr
    WHERE tr.id = target_request_id
      AND tr."clientId" = app_private.current_client_id()
  );
$$;

CREATE OR REPLACE FUNCTION app_private.has_bid_on_request(target_request_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM bids b
    JOIN artists a ON a.id = b."artistId"
    WHERE b."requestId" = target_request_id
      AND a."userId" = app_private.current_user_id()
  );
$$;

CREATE OR REPLACE FUNCTION app_private.can_view_request(target_request_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "tattooRequests" tr
    WHERE tr.id = target_request_id
      AND (
        tr.status = 'open'
        OR tr."clientId" = app_private.current_client_id()
        OR app_private.has_bid_on_request(tr.id)
        OR app_private.is_admin()
      )
  );
$$;

REVOKE ALL ON FUNCTION app_private.current_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.current_artist_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.current_client_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.owns_artist(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.owns_request(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.has_bid_on_request(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.can_view_request(integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION app_private.current_user_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.current_artist_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.current_client_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.owns_artist(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.owns_request(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_bid_on_request(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.can_view_request(integer) TO anon, authenticated;

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE "portfolioImages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhookQueue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verificationDocuments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tattooRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "requestImages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE "requestMessages" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_self_or_admin ON "users";
DROP POLICY IF EXISTS users_admin_all ON "users";
CREATE POLICY users_select_self_or_admin ON "users"
  FOR SELECT
  TO authenticated
  USING ("openId" = auth.uid()::text OR app_private.is_admin());
CREATE POLICY users_admin_all ON "users"
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS artists_public_or_owner_read ON artists;
DROP POLICY IF EXISTS artists_owner_insert ON artists;
DROP POLICY IF EXISTS artists_owner_update ON artists;
DROP POLICY IF EXISTS artists_admin_all ON artists;
CREATE POLICY artists_public_or_owner_read ON artists
  FOR SELECT
  TO anon, authenticated
  USING ("isApproved" = true OR app_private.owns_artist(id) OR app_private.is_admin());
CREATE POLICY artists_owner_insert ON artists
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = app_private.current_user_id() OR app_private.is_admin());
CREATE POLICY artists_owner_update ON artists
  FOR UPDATE
  TO authenticated
  USING (app_private.owns_artist(id) OR app_private.is_admin())
  WITH CHECK (app_private.owns_artist(id) OR app_private.is_admin());
CREATE POLICY artists_admin_all ON artists
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS shops_public_read ON shops;
DROP POLICY IF EXISTS shops_admin_all ON shops;
CREATE POLICY shops_public_read ON shops
  FOR SELECT
  TO anon, authenticated
  USING (true);
CREATE POLICY shops_admin_all ON shops
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS portfolio_images_public_or_owner_read ON "portfolioImages";
DROP POLICY IF EXISTS portfolio_images_owner_insert ON "portfolioImages";
DROP POLICY IF EXISTS portfolio_images_owner_update ON "portfolioImages";
DROP POLICY IF EXISTS portfolio_images_owner_delete ON "portfolioImages";
DROP POLICY IF EXISTS portfolio_images_admin_all ON "portfolioImages";
CREATE POLICY portfolio_images_public_or_owner_read ON "portfolioImages"
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM artists a
      WHERE a.id = "artistId"
        AND (a."isApproved" = true OR app_private.owns_artist(a.id) OR app_private.is_admin())
    )
  );
CREATE POLICY portfolio_images_owner_insert ON "portfolioImages"
  FOR INSERT
  TO authenticated
  WITH CHECK (app_private.owns_artist("artistId") OR app_private.is_admin());
CREATE POLICY portfolio_images_owner_update ON "portfolioImages"
  FOR UPDATE
  TO authenticated
  USING (app_private.owns_artist("artistId") OR app_private.is_admin())
  WITH CHECK (app_private.owns_artist("artistId") OR app_private.is_admin());
CREATE POLICY portfolio_images_owner_delete ON "portfolioImages"
  FOR DELETE
  TO authenticated
  USING (app_private.owns_artist("artistId") OR app_private.is_admin());
CREATE POLICY portfolio_images_admin_all ON "portfolioImages"
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS reviews_visible_to_public_or_parties ON reviews;
DROP POLICY IF EXISTS reviews_owner_insert ON reviews;
DROP POLICY IF EXISTS reviews_owner_delete ON reviews;
DROP POLICY IF EXISTS reviews_admin_all ON reviews;
CREATE POLICY reviews_visible_to_public_or_parties ON reviews
  FOR SELECT
  TO anon, authenticated
  USING (
    "moderationStatus" <> 'hidden'
    OR "userId" = app_private.current_user_id()
    OR app_private.owns_artist("artistId")
    OR app_private.is_admin()
  );
CREATE POLICY reviews_owner_insert ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = app_private.current_user_id() OR app_private.is_admin());
CREATE POLICY reviews_owner_delete ON reviews
  FOR DELETE
  TO authenticated
  USING ("userId" = app_private.current_user_id() OR app_private.is_admin());
CREATE POLICY reviews_admin_all ON reviews
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS bookings_participant_read ON bookings;
DROP POLICY IF EXISTS bookings_customer_insert ON bookings;
DROP POLICY IF EXISTS bookings_admin_all ON bookings;
CREATE POLICY bookings_participant_read ON bookings
  FOR SELECT
  TO authenticated
  USING (
    "userId" = app_private.current_user_id()
    OR app_private.owns_artist("artistId")
    OR app_private.is_admin()
  );
CREATE POLICY bookings_customer_insert ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = app_private.current_user_id() OR app_private.is_admin());
CREATE POLICY bookings_admin_all ON bookings
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS favorites_owner_read ON favorites;
DROP POLICY IF EXISTS favorites_owner_insert ON favorites;
DROP POLICY IF EXISTS favorites_owner_delete ON favorites;
DROP POLICY IF EXISTS favorites_admin_all ON favorites;
CREATE POLICY favorites_owner_read ON favorites
  FOR SELECT
  TO authenticated
  USING ("userId" = app_private.current_user_id() OR app_private.is_admin());
CREATE POLICY favorites_owner_insert ON favorites
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = app_private.current_user_id() OR app_private.is_admin());
CREATE POLICY favorites_owner_delete ON favorites
  FOR DELETE
  TO authenticated
  USING ("userId" = app_private.current_user_id() OR app_private.is_admin());
CREATE POLICY favorites_admin_all ON favorites
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS webhook_queue_admin_all ON "webhookQueue";
CREATE POLICY webhook_queue_admin_all ON "webhookQueue"
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS verification_documents_owner_read ON "verificationDocuments";
DROP POLICY IF EXISTS verification_documents_owner_insert ON "verificationDocuments";
DROP POLICY IF EXISTS verification_documents_admin_all ON "verificationDocuments";
CREATE POLICY verification_documents_owner_read ON "verificationDocuments"
  FOR SELECT
  TO authenticated
  USING ("userId" = app_private.current_user_id() OR app_private.is_admin());
CREATE POLICY verification_documents_owner_insert ON "verificationDocuments"
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = app_private.current_user_id() OR app_private.is_admin());
CREATE POLICY verification_documents_admin_all ON "verificationDocuments"
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS clients_owner_read ON clients;
DROP POLICY IF EXISTS clients_owner_insert ON clients;
DROP POLICY IF EXISTS clients_owner_update ON clients;
DROP POLICY IF EXISTS clients_admin_all ON clients;
CREATE POLICY clients_owner_read ON clients
  FOR SELECT
  TO authenticated
  USING ("userId" = app_private.current_user_id() OR app_private.is_admin());
CREATE POLICY clients_owner_insert ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = app_private.current_user_id() OR app_private.is_admin());
CREATE POLICY clients_owner_update ON clients
  FOR UPDATE
  TO authenticated
  USING ("userId" = app_private.current_user_id() OR app_private.is_admin())
  WITH CHECK ("userId" = app_private.current_user_id() OR app_private.is_admin());
CREATE POLICY clients_admin_all ON clients
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS tattoo_requests_visible_to_marketplace ON "tattooRequests";
DROP POLICY IF EXISTS tattoo_requests_guest_insert ON "tattooRequests";
DROP POLICY IF EXISTS tattoo_requests_client_insert ON "tattooRequests";
DROP POLICY IF EXISTS tattoo_requests_client_update ON "tattooRequests";
DROP POLICY IF EXISTS tattoo_requests_client_delete ON "tattooRequests";
DROP POLICY IF EXISTS tattoo_requests_admin_all ON "tattooRequests";
CREATE POLICY tattoo_requests_visible_to_marketplace ON "tattooRequests"
  FOR SELECT
  TO anon, authenticated
  USING (app_private.can_view_request(id));
CREATE POLICY tattoo_requests_guest_insert ON "tattooRequests"
  FOR INSERT
  TO anon
  WITH CHECK ("clientId" IS NULL);
CREATE POLICY tattoo_requests_client_insert ON "tattooRequests"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    "clientId" IS NULL
    OR "clientId" = app_private.current_client_id()
    OR app_private.is_admin()
  );
CREATE POLICY tattoo_requests_client_update ON "tattooRequests"
  FOR UPDATE
  TO authenticated
  USING (app_private.owns_request(id) OR app_private.is_admin())
  WITH CHECK (app_private.owns_request(id) OR app_private.is_admin());
CREATE POLICY tattoo_requests_client_delete ON "tattooRequests"
  FOR DELETE
  TO authenticated
  USING (app_private.owns_request(id) OR app_private.is_admin());
CREATE POLICY tattoo_requests_admin_all ON "tattooRequests"
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS request_images_follow_request_visibility ON "requestImages";
DROP POLICY IF EXISTS request_images_request_owner_insert ON "requestImages";
DROP POLICY IF EXISTS request_images_request_owner_update ON "requestImages";
DROP POLICY IF EXISTS request_images_request_owner_delete ON "requestImages";
DROP POLICY IF EXISTS request_images_admin_all ON "requestImages";
CREATE POLICY request_images_follow_request_visibility ON "requestImages"
  FOR SELECT
  TO anon, authenticated
  USING (app_private.can_view_request("requestId"));
CREATE POLICY request_images_request_owner_insert ON "requestImages"
  FOR INSERT
  TO authenticated
  WITH CHECK (app_private.owns_request("requestId") OR app_private.is_admin());
CREATE POLICY request_images_request_owner_update ON "requestImages"
  FOR UPDATE
  TO authenticated
  USING (app_private.owns_request("requestId") OR app_private.is_admin())
  WITH CHECK (app_private.owns_request("requestId") OR app_private.is_admin());
CREATE POLICY request_images_request_owner_delete ON "requestImages"
  FOR DELETE
  TO authenticated
  USING (app_private.owns_request("requestId") OR app_private.is_admin());
CREATE POLICY request_images_admin_all ON "requestImages"
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS bids_visible_to_owner_or_bidder ON bids;
DROP POLICY IF EXISTS bids_artist_insert ON bids;
DROP POLICY IF EXISTS bids_admin_all ON bids;
CREATE POLICY bids_visible_to_owner_or_bidder ON bids
  FOR SELECT
  TO authenticated
  USING (
    app_private.owns_request("requestId")
    OR "artistId" = app_private.current_artist_id()
    OR app_private.is_admin()
  );
CREATE POLICY bids_artist_insert ON bids
  FOR INSERT
  TO authenticated
  WITH CHECK (
    "artistId" = app_private.current_artist_id()
    AND EXISTS (
      SELECT 1
      FROM "tattooRequests" tr
      WHERE tr.id = "requestId"
        AND tr.status = 'open'
    )
    OR app_private.is_admin()
  );
CREATE POLICY bids_admin_all ON bids
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS request_messages_participant_read ON "requestMessages";
DROP POLICY IF EXISTS request_messages_participant_insert ON "requestMessages";
DROP POLICY IF EXISTS request_messages_admin_all ON "requestMessages";
CREATE POLICY request_messages_participant_read ON "requestMessages"
  FOR SELECT
  TO authenticated
  USING (
    app_private.owns_request("requestId")
    OR app_private.has_bid_on_request("requestId")
    OR app_private.is_admin()
  );
CREATE POLICY request_messages_participant_insert ON "requestMessages"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    "senderId" = app_private.current_user_id()
    AND (
      app_private.owns_request("requestId")
      OR app_private.has_bid_on_request("requestId")
      OR app_private.is_admin()
    )
  );
CREATE POLICY request_messages_admin_all ON "requestMessages"
  FOR ALL
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());