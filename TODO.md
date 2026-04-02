# Production Readiness Tracker

Last updated: 2026-03-31

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

## Critical Before Launch (Blocking)

### Environment And Secrets

- [ ] Configure all production environment variables in hosting platform
  - DATABASE_URL, JWT_SECRET
  - SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY
  - VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
  - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
  - STRIPE_CLIENT_PLUS_PRICE_ID, STRIPE_CLIENT_ELITE_PRICE_ID
  - RESEND_API_KEY
  - GROQ_API_KEY, HUGGINGFACE_API_KEY
- [ ] Verify production domain allowlist/cookies/CORS behavior
- [ ] Rotate any previously shared test keys

### Deployment And Reliability

- [ ] Configure uptime monitor for /api/health with paging alerts
- [ ] Add alerting for Stripe webhook failures and queue backlog growth
- [ ] Validate Sentry alerts route to on-call channel
- [ ] Confirm backups and recovery process for PostgreSQL/Supabase

### End-To-End Verification (Staging)

- [ ] Run full auth regression
  - sign up/sign in
  - session sync
  - protected route enforcement
- [ ] Run booking payment path with Stripe test cards
- [ ] Run artist onboarding to approved discovery visibility flow
- [ ] Run client request to bid to accept flow
- [ ] Run license upload and admin verification flow

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

- [ ] Event analytics for funnel: discovery -> profile -> booking/request
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

### Before Go-Live

- [ ] All Critical Before Launch items completed
- [ ] Rollback plan tested and documented
- [ ] Terms, privacy, and compliance pages published

### Go-Live Day

- [ ] Monitor error rate, p95 latency, and queue depth hourly
- [ ] Monitor Stripe webhook success rate and replay failures immediately
- [ ] Monitor signup, onboarding completion, request creation, and booking conversion

### Week 1

- [ ] Review production incidents and patch highest-impact issues
- [ ] Prioritize UX pain points from support tickets and session recordings
- [ ] Rebaseline performance and DB query hotspots under real traffic
