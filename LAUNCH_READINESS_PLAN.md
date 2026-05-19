# Launch Readiness Execution Plan
**Target Date**: May 15, 2026 (48 hours to P0 completion, full launch readiness in 1 week)

---

## Phase 1: P0 — Critical Trust & Safety (48 hours)

### P0-1: Fix Auto-Approved Artists (2-3 hours)
**Risk**: Trust/safety failure; unverified artists appear live immediately.

**Files to change**:
- `backend/server/db.ts` — Change `isApproved: true` default to `false` in `createArtist()`
- `backend/server/routers.ts` — Verify all artist queries filter by `isApproved === true`
- `tests/backend/artists.test.ts` — Add test for approval gate

**Acceptance criteria**:
- Artist creation sets `isApproved: false` by default
- All public/marketplace listings only show `isApproved === true` artists
- Admin dashboard shows pending (unapproved) artists in a separate queue
- New artist sees "pending approval" message on their profile

**Estimated effort**: 2-3 hours  
**Owner**: Senior Backend Engineer

---

### P0-2: Remove Hardcoded Stripe Price IDs (1-2 hours)
**Risk**: Wrong-environment billing; accidental live charges in staging/dev.

**Files to change**:
- `backend/server/_core/env.ts` — Remove `.default()` from all STRIPE_*_PRICE_ID vars; make them required
- `backend/server/_core/index.ts` — Add startup validation that fails if production + missing price IDs
- `README.md` — Update env vars section with all required Stripe price IDs + instructions to create them in Stripe Dashboard

**Acceptance criteria**:
- Server fails to start if any required Stripe price ID is missing
- Error message is clear: "Missing STRIPE_ARTIST_AMATEUR_PRICE_ID_MONTH. Create in Stripe Dashboard and set as env var."
- Prod/staging/dev validation: if `NODE_ENV=production` and a price ID is wrong, startup fails with environment mismatch warning

**Estimated effort**: 1-2 hours  
**Owner**: Backend/DevOps

---

### P0-3: Storage Bucket Init Must Fail in Production (1-2 hours)
**Risk**: App appears healthy while uploads fail at runtime; poor UX at scale.

**Files to change**:
- `backend/server/_core/index.ts` — Fail startup if bucket init throws in production
- `backend/server/_core/index.ts` — Extend health endpoint with storage readiness state
- `backend/server/_core/supabaseStorage.ts` — Ensure clear error messages if bucket creation fails

**Acceptance criteria**:
- In production (`NODE_ENV=production`), if bucket init fails, server exits with code 1 and clear log
- Health endpoint includes `storageReady: boolean` in response
- Monitoring can alert on `storageReady: false` health check

**Estimated effort**: 1-2 hours  
**Owner**: Backend

---

**P0 Total Estimated Effort**: ~5-7 hours  
**Target Completion**: May 14, 2026 (by end of business day)

---

## Phase 2: P1 — High Security & UX (1 week)

### P1-1: Add CSRF Protection for Mutations (4-5 hours)
**Risk**: Cross-site state-changing requests; account takeover via XSS → mutation hijacking.

**Files to change**:
- `backend/server/_core/index.ts` — Add middleware to enforce custom header (`X-Ink-Token`) for non-GET tRPC mutations
- `frontend/client/src/lib/trpc.ts` — Inject CSRF token in request headers
- `backend/server/_core/context.ts` — Validate CSRF token in context creation

**Acceptance criteria**:
- All POST/PUT/DELETE tRPC calls require custom header
- Token is generated per-session and validated server-side
- Integration test confirms CSRF attack is blocked

**Estimated effort**: 4-5 hours  
**Owner**: Backend + Frontend

---

### P1-2: Fix Request Board Filters (3-4 hours)
**Risk**: UX failure; users think filtering works, but results are unfiltered, leading to low discovery conversion.

**Files to change**:
- `backend/server/clientRouters.ts` — Apply `style`, `city`, `state` predicates to `getOpen` and `listForArtistDashboard` queries
- `backend/server/db.ts` — Add helper for building request filter predicates (reusable)
- `tests/backend/clientRouters.ts` — Add tests for each filter combination

**Acceptance criteria**:
- `style`, `city`, `state` filters are applied to SQL WHERE clause
- Test coverage: single filter, multiple filters, no filters, empty results
- Performance: filter queries complete in <100ms on 1000-row dataset

**Estimated effort**: 3-4 hours  
**Owner**: Backend

---

### P1-3: Lower and Segment Request Body Limits (2-3 hours)
**Risk**: DoS/resource exhaustion; large payloads consume memory under load.

**Files to change**:
- `backend/server/_core/index.ts` — Lower global JSON limit to 1-2MB; add route-specific limits for upload metadata
- `tests/backend/api.test.ts` — Add test for large payload rejection

**Acceptance criteria**:
- Global JSON limit is 1MB (or documented justification for larger size)
- Route-specific limits exist for portfolio upload metadata (e.g., 5MB for upload-url endpoint)
- Test confirms oversized payloads return 413 Payload Too Large

**Estimated effort**: 2-3 hours  
**Owner**: Backend

---

### P1-4: Fix Rate Limiting Bypass on GET Queries (3-4 hours)
**Risk**: Expensive read queries (search, discovery, portfolio) can be scraped or hammered, causing DoS.

**Files to change**:
- `backend/server/_core/index.ts` — Replace blanket skip with allowlist for cheap public reads (e.g., `artists.getAll`)
- `backend/server/routers.ts`, `backend/server/clientRouters.ts` — Annotate expensive queries (discovery, design generation, request board search)
- `backend/server/_core/index.ts` — Add per-procedure rate limit config

**Acceptance criteria**:
- Public GET reads (artists.getAll) are rate-limited normally
- Expensive queries (discovery, search, AI generation) have stricter limits (e.g., 20 req/min per IP)
- Test confirms expensive queries are rate-limited; cheap queries are not

**Estimated effort**: 3-4 hours  
**Owner**: Backend

---

**P1 Total Estimated Effort**: ~12-16 hours (2-3 days)  
**Target Completion**: May 16-17, 2026

---

## Phase 3: P2 — Observability & Resilience (1 week)

### P2-1: Add Structured Request Logging (4-5 hours)
**Risk**: Difficult incident debugging; logs are unstructured and hard to correlate.

**Files to change**:
- `backend/server/_core/logger.ts` — Add request ID middleware and context injection
- `backend/server/_core/index.ts` — Generate unique request ID per request; include in all logs
- `backend/server/_core/context.ts` — Attach request ID to tRPC context

**Acceptance criteria**:
- Every log includes `requestId` field
- Every HTTP response includes `X-Request-ID` header
- Frontend can log request ID on errors for support correlation

**Estimated effort**: 4-5 hours  
**Owner**: Backend + DevOps

---

### P2-2: Extend Health Endpoint with Dependency Status (3-4 hours)
**Risk**: Blind launches; no visibility into webhook queue, Stripe connectivity, or storage readiness.

**Files to change**:
- `backend/server/_core/index.ts` — Add checks for Stripe API connectivity, webhook queue depth
- `backend/server/_core/supabaseStorage.ts` — Add storage connectivity check
- `backend/server/webhookQueue.ts` — Expose queue depth and retry stats

**Acceptance criteria**:
- Health endpoint includes: `database`, `storage`, `webhookQueue`, `stripeConnectivity`
- Each dependency is `ready: true/false`
- Monitoring alerts if any dependency is `false` for >5 minutes

**Estimated effort**: 3-4 hours  
**Owner**: Backend + DevOps

---

### P2-3: Add Launch Smoke Test Suite (6-8 hours)
**Risk**: Untested critical paths fail silently; regression goes live.

**Files to change**:
- `tests/e2e/launch-smoke.spec.ts` — New suite covering:
  - Auth (signup, login, logout)
  - Onboarding (artist & client)
  - Request lifecycle (create, bid, accept, payment)
  - Stripe webhook mock
  - Upload verification
- `tests/backend/critical-paths.test.ts` — Unit tests for approval gate, tier gating, payment flow

**Acceptance criteria**:
- Smoke suite passes in CI/CD
- Covers 80% of critical user journeys
- Can be run pre-deploy as go/no-go gate

**Estimated effort**: 6-8 hours  
**Owner**: QA + Backend

---

**P2 Total Estimated Effort**: ~13-17 hours (2-3 days)  
**Target Completion**: May 19-20, 2026

---

## Phase 4: P3 — Data Model & Performance (ongoing)

### P3-1: Normalize Tattoo Styles (3-5 days)
Replace comma-separated styles with join table for indexing and filtering.

**Files to change**:
- `backend/drizzle/schema.ts` — Add `artistStyles` junction table
- Migration — Migrate existing comma-separated data
- `backend/server/db.ts` — Update queries to use JOIN instead of ILIKE

---

### P3-2: Add Targeted Indexes for Hot Paths (2-3 hours)
Add indexes for request board filters, bid lookup, artist discovery.

**Files to change**:
- `backend/drizzle/schema.ts` — Add indexes on `tattooRequests(status, style, city, state)`, `bids(requestId, artistId)`, `artists(isApproved, isFoundingArtist)`

---

**P3 Total Estimated Effort**: ~2-3 weeks  
**Target Completion**: May 27, 2026 (post-launch)

---

## Timeline Summary

| Phase | Scope | Hours | Target Dates | Blocker? |
|---|---|---|---|---|
| **P0** | Auto-approved artists, Stripe price IDs, storage init | 5-7h | May 14 (48h) | **YES** |
| **P1** | CSRF, filters, rate limits, body size | 12-16h | May 16-17 | Recommended |
| **P2** | Observability, health endpoint, smoke tests | 13-17h | May 19-20 | Recommended |
| **P3** | Data normalization, indexes | 20-30h | May 27+ | Nice-to-have |

---

## Launch Gate Criteria

**Must-complete before launch:**
- [ ] P0-1: Artists require approval
- [ ] P0-2: Stripe price IDs are required env vars
- [ ] P0-3: Storage buckets fail startup in production
- [ ] Admin approval workflow is UI-complete and tested
- [ ] Stripe webhook test passes end-to-end
- [ ] Upload verification OCR workflow is tested
- [ ] No console errors in browser on critical paths (auth, onboarding, booking)

**Should-complete before launch:**
- [ ] P1-1: CSRF protection
- [ ] P1-2: Request filters work
- [ ] P1-3: Rate limits on expensive queries
- [ ] P2: Health endpoint covers dependencies
- [ ] Launch smoke test suite passes

**Nice-to-have (post-launch hotfix):**
- [ ] P2-1: Structured request logging
- [ ] P3: Data normalization

---

## Communication

**Stakeholders to notify:**
- **Product**: P0 delays launch gate completion; P1 impacts UX; P3 is performance optimization
- **QA**: Provide test matrix in Phase 1; launch smoke suite in Phase 2
- **DevOps**: Prepare env var checklists for staging/prod deployment (Phase 0, before Phase 1)

