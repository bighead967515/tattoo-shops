# Production Readiness Tracker

Last updated: 2026-05-27

## Completed Baseline (Verified In Code)

- [x] Canonical subscription tiers implemented end-to-end (users.subscriptionTier source of truth)
- [x] Stripe webhook tier sync with retry queue and integration tests
- [x] Health endpoint implemented at /api/health with DB and webhook queue status
- [x] Sentry initialized with server error capture middleware
- [x] Supabase storage buckets bootstrap automatically on server startup (initializeBuckets)
- [x] Bookings table has FK references for artistId and userId
- [x] Auth session sync route exists at /api/auth/session with integration tests
- [x] Client onboarding and role/tier transitions covered by integration tests
- [x] Artist search/filter, request board, bids, and client marketplace flow implemented
- [x] SEO essentials present (dynamic sitemap + page metadata support)
- [x] GA4-ready pageview tracking wired in frontend (`VITE_GA4_MEASUREMENT_ID` optional)
- [x] Public messaging updated to all-tattoo positioning; cover-up/rework retained as a specialty

## Recently Completed (May 2026)

- [x] Added production security headers with CSP via Helmet on server bootstrap
- [x] Added API response compression for server responses
- [x] Added strict AI route-specific rate limiting for generation endpoints
- [x] Reduced JSON/urlencoded body parser limits from 50mb to 5mb to match signed-upload architecture
- [x] Added graceful shutdown handlers for SIGTERM/SIGINT to drain in-flight requests
- [x] Removed deprecated writes to artists.subscriptionTier/clients.subscriptionTier; canonicalized on users.subscriptionTier
- [x] Added prompt-injection sanitization for AI bid drafting inputs
- [x] Added bid accept confirmation dialog with trust copy + cancellation policy link
- [x] Added artist profile primary "Send a Request" CTA and request prefill flow in /client/new-request
- [x] Added key accessibility improvements (radiogroup semantics, aria-busy skeletons, keyboard/touch-target improvements, destructive action confirmations)

## Critical Before Launch (Blocking)

### Environment And Secrets

- [ ] Configure all production environment variables in Render
  - DATABASE_URL, JWT_SECRET, OWNER_OPEN_ID
  - SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY
  - VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
  - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
  - STRIPE_ARTIST_AMATEUR_PRICE_ID_MONTH, STRIPE_ARTIST_AMATEUR_PRICE_ID_YEAR
  - STRIPE_ARTIST_PRO_PRICE_ID_MONTH, STRIPE_ARTIST_PRO_PRICE_ID_YEAR
  - STRIPE_ARTIST_ICON_PRICE_ID_MONTH, STRIPE_ARTIST_ICON_PRICE_ID_YEAR
  - STRIPE_FOUNDING_ARTIST_PRICE_ID
  - STRIPE_CLIENT_PLUS_PRICE_ID, STRIPE_CLIENT_ELITE_PRICE_ID (keep set for client billing rollout)
  - RESEND_API_KEY
  - GROQ_API_KEY, HUGGINGFACE_API_KEY
  - Recommended production values: CORS_ALLOWED_ORIGINS, PUBLIC_BASE_URL, SENTRY_DSN, VITE_GA4_MEASUREMENT_ID
  - Validation: open Render shell/logs and confirm startup does not print "Invalid environment configuration"
- [ ] Verify Render domain allowlist/cookies/CORS behavior
  - Confirm CORS_ALLOWED_ORIGINS includes only production origins (comma-separated, no trailing slash)
  - Confirm Supabase auth redirect allowlist contains production domain + callback path
  - Verify auth cookie behavior from browser devtools after POST /api/auth/session:
    - cookie name app_session_id present
    - HttpOnly = true
    - Secure = true (over HTTPS)
    - SameSite = strict
  - Verify CORS preflight and credentialed request behavior from terminal:
    - OPTIONS /api/auth/me from allowed origin returns Access-Control-Allow-Origin matching origin
    - OPTIONS /api/auth/me from disallowed origin is rejected
    - credentialed POST /api/auth/session succeeds from allowed origin
- [ ] Rotate any previously shared test keys
  - Rotate and replace: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
  - Rotate and replace: SUPABASE_SERVICE_KEY (and SUPABASE_ANON_KEY if exposed beyond intended scope)
  - Rotate and replace: RESEND_API_KEY, GROQ_API_KEY, HUGGINGFACE_API_KEY
  - Invalidate old keys at provider side after Render values are updated
  - Re-test /api/health, Stripe webhook delivery, auth/session sync, and one AI endpoint after rotation

### Deployment And Reliability

- [ ] Configure uptime monitor for /api/health with paging alerts
- [ ] Confirm Render build/start commands and runtime Node version match the repo
- [ ] Verify Render reverse proxy/SSL configuration for app traffic and Stripe webhooks
- [ ] Add alerting for Stripe webhook failures and queue backlog growth
- [ ] Validate Sentry alerts route to on-call channel
- [ ] Confirm backups and recovery process for PostgreSQL/Supabase

### End-To-End Verification (Staging)

- [ ] Run full auth regression
  - Preconditions: fresh staging deploy, valid Supabase redirect URLs, test accounts (client, artist, admin)
  - Sign up/sign in: verify email/password sign-up and sign-in complete without console/server errors
  - Session sync: confirm POST /api/auth/session returns 200 and sets app_session_id cookie
  - Protected route enforcement: unauthenticated users are gated on /dashboard, /client/dashboard, /license-upload
  - Session lifecycle: hard refresh keeps authenticated state; sign out clears cookie and access
  - Evidence: screenshots of success + one failed unauthorized access attempt
- [ ] Run booking payment path with Stripe test cards
  - Execute one successful deposit checkout (Stripe test card 4242 4242 4242 4242)
  - Execute one declined path (Stripe test card 4000 0000 0000 9995)
  - Verify checkout.session.completed webhook is delivered and not queued for retry
  - Verify booking reflects expected state after success (depositPaid/status updates)
  - Verify declined payment keeps booking in non-paid state and surfaces user-safe error copy
  - Evidence: Stripe event log screenshot + booking record state before/after
- [ ] Run artist onboarding to approved discovery visibility flow
  - Create new artist account and complete onboarding/profile setup
  - Upload required verification/license document and portfolio sample
  - Approve artist via admin flow
  - Confirm artist appears on /artists and is discoverable through /artist-finder
  - Confirm artist role/tier/verification status consistency across UI and DB
  - Evidence: artist profile URL + approval timestamp + discovery result screenshot
- [ ] Run client request to bid to accept flow
  - Client creates request with budget, style, and at least one reference image
  - Artist submits bid with message, estimate, and availability
  - Client accepts one bid on request detail page
  - Confirm selectedBidId is set and non-winning bids are marked rejected/not selected
  - Confirm accepted artist receives expected follow-up state (dashboard visibility + booking next step)
  - Evidence: request URL + accepted bid ID + updated statuses screenshot
- [ ] Run license upload and admin verification flow
  - Upload one valid license document and one intentionally invalid/low-quality document
  - Confirm verificationDocuments status transitions pending -> verified/rejected through admin review
  - Confirm OCR metadata is populated and review notes are persisted
  - Confirm private document access remains admin-only (no public URL exposure)
  - Evidence: admin moderation screenshot + final status for both test documents
  - Optional automation smoke before manual run:
    - pnpm test:e2e -- tests/e2e/journeys.spec.ts
    - pnpm test:e2e -- tests/e2e/request-bid-acceptance.spec.ts

### Quality Gates

- [x] pnpm check passes
- [x] pnpm test passes
- [x] pnpm build passes
- [ ] Execute load tests and compare against performance targets

## High Priority (Week 1 Post Launch)

### UX And Resilience

- [ ] Improve upload UX (progress, retries, cancellation feedback)
- [ ] Improve network failure messaging across booking/request forms
- [ ] Add explicit empty states where data can be validly absent

### Product Gaps

- [ ] Deliver request/booking messaging UI backed by requestMessages
- [ ] Add calendar sync export (Google/ICS) for confirmed bookings
- [ ] Add admin dashboard tiles for core health and revenue KPIs

### Performance

- [ ] Add client-side image compression before uploads
- [ ] Add aggressive lazy loading for heavy portfolio/request image lists
- [ ] Audit largest bundles and split non-critical routes

## Medium Priority (Month 1)

- [ ] Event analytics for funnel: discovery -> profile -> booking/request (pageviews are live; conversion events pending)
- [ ] Conversion dashboard for client and artist subscription upgrades
- [ ] Advanced SEO: structured data QA, index coverage checks, rich result monitoring
- [ ] Security hardening pass (headers, dependency audit, key rotation runbook)

## Future Enhancements (Month 2+)

- [ ] PWA support (offline browse cache + install prompt)
- [ ] Push notifications for booking and bid status updates
- [ ] Instagram/social portfolio sync
- [ ] Multi-session project management and payment schedules
- [ ] Multi-location studio support

---

## Launch Day Runbook

Coordination note: Use this runbook together with ANNOUNCEMENT_AND_FEEDBACK_PLAN.md.
Rule: Do not begin Day 1 announcement rollout until all Critical Before Launch items are complete.

### Before Go-Live

- [ ] All Critical Before Launch items completed
- [ ] Rollback plan tested and documented
- [ ] Render deployment steps documented for repeatable redeploys
- [ ] Terms, privacy, and compliance pages published

### Go-Live Day

- [ ] Monitor error rate, p95 latency, and queue depth hourly
- [ ] Monitor Stripe webhook success rate and replay failures immediately
- [ ] Monitor signup, onboarding completion, request creation, and booking conversion

### Week 1

- [ ] Review production incidents and patch highest-impact issues
- [ ] Prioritize UX pain points from support tickets and session recordings
- [ ] Rebaseline performance and DB query hotspots under real traffic
