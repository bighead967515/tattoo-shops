# AI Coding Agent Instructions — Universal Inc. Tattoo Artist Directory

## Project Overview

Full-stack web application for finding and booking tattoo artists with a client marketplace for tattoo requests and artist bidding. Built with:

- **Frontend**: React 19 + Vite, Wouter routing, Tailwind CSS, shadcn/ui
- **Backend**: Node.js / Express + tRPC (type-safe APIs)
- **Database**: PostgreSQL via Supabase, Drizzle ORM
- **Auth**: Supabase Auth (email/password + OAuth providers)
- **Storage**: Supabase Storage (3 buckets: portfolio-images, request-images, id-documents)
- **Payments**: Stripe (subscriptions, deposits, webhooks)
- **AI**: Groq + Hugging Face (vision analysis, discovery, generation, safety moderation, bid optimization, OCR verification)
- **Email**: Resend

---

## Architecture & Folder Structure

```
frontend/client/          React app (Vite)
  src/
    App.tsx               Routes (Wouter)
    components/           Custom components
    components/ui/        shadcn/ui primitives
    pages/                Route-based pages
    hooks/                Custom hooks (useSupabaseAuth, useMobile, etc.)
    _core/hooks/          Core hooks (useAuth)
    lib/trpc.ts           tRPC client (httpBatchLink, superjson)
    lib/supabase.ts       Supabase browser client
    contexts/             React contexts (ThemeContext)

backend/server/           Express + tRPC server
  _core/index.ts          Server entrypoint
  routers.ts              Main tRPC routers (auth, artists, portfolio, reviews, bookings, favorites, moderation)
  clientRouters.ts        Client marketplace routers (clients, requests, bids)
  aiRouter.ts             AI generation router
  verificationRouter.ts   License verification router
  healthRouter.ts         Health check router
  stripe.ts               Stripe checkout/subscription logic
  webhookHandler.ts       Stripe webhook handler
  webhookQueue.ts         Webhook retry queue
  email.ts                Resend email integration
  gemini*.ts              AI modules (legacy filenames, now powered by Groq + Hugging Face)
  _core/
    trpc.ts               Procedure definitions (public, protected, artist, artistOwner, admin)
    context.ts            tRPC context creation (token → Supabase verify → DB user)
    supabase.ts           Supabase admin client (service role)
    supabaseAuth.ts       Auth routes (/api/auth/session, /api/auth/signout, /api/auth/me)
    supabaseStorage.ts    Storage bucket helpers (upload, delete, signed URLs)
    env.ts                Environment variables
    logger.ts             Logging
    sanitize.ts           Input sanitization
    cookies.ts            Cookie management
    ipUtils.ts            IP utilities
    sentry.ts             Error tracking
    vite.ts               Vite dev server middleware

backend/shared/           Shared between frontend and backend
  types.ts                Re-exports Drizzle schema types (User, Artist, Client, etc.)
  const.ts                Constants, subscription tier Zod enum, TIER_LIMITS
  tierLimits.ts           Tier feature limits and pricing tables
  tierCompat.ts           Tier compatibility helpers (isFreeArtistTier, canUseAiBidAssistant, etc.)
  _core/errors.ts         Error types

backend/drizzle/          Database
  schema.ts               Drizzle schema (14 tables, source of truth)
  relations.ts            Relationship definitions
  meta/                   Migration metadata
```

---

## Frontend–Backend Sync Rules

These rules prevent the frontend and backend from drifting out of sync. Follow them for every change.

### 1. Types flow from the schema

All types originate in `backend/drizzle/schema.ts` and are re-exported via `backend/shared/types.ts`. The frontend receives them through tRPC inference — **never duplicate or hand-write types that already exist in the schema**.

**When adding or changing a DB column:**

1. Update `backend/drizzle/schema.ts`
2. Run `pnpm db:push` to generate and apply migration
3. Update the relevant tRPC procedure input/output in the router
4. Frontend automatically infers the new types via tRPC — no manual type updates needed

**When adding a new table:**

1. Add table to `backend/drizzle/schema.ts`
2. Export select/insert types from `backend/shared/types.ts`
3. Run `pnpm db:push`
4. Create tRPC procedures in the appropriate router
5. Frontend consumes via tRPC hooks

### 2. tRPC is the only API contract

All frontend → backend communication goes through tRPC (`/api/trpc`). The tRPC `AppRouter` type is the single source of truth for the API surface. Never create raw REST endpoints for features — use tRPC procedures. The only non-tRPC routes are:

- `/api/auth/session` — Supabase token → backend cookie exchange
- `/api/auth/signout` — clear session
- `/api/auth/me` — get user from session
- `/api/webhooks/stripe` — Stripe webhook receiver

### 3. Auth state must stay synchronized

Two auth systems work together:

- **Supabase Auth** (frontend `useSupabaseAuth()`) — manages tokens, sign-in/sign-up/OAuth
- **Backend session** (frontend `useAuth()`) — queries `trpc.auth.me` for the DB user record

After any Supabase auth action (sign-in, sign-up, OAuth callback), the frontend **must** call `/api/auth/session` to sync the token to a backend cookie. The backend verifies tokens via `supabaseAdmin.auth.getUser()` and upserts the user in the `users` table.

### 4. Subscription tiers use canonical values

Canonical tier values are defined in `backend/shared/const.ts`:

```
artist_free | artist_amateur | artist_pro | artist_icon
client_free | client_plus | client_elite
```

- **`users.subscriptionTier`** is the canonical source of truth for a user's tier
- `artists.subscriptionTier` and `clients.subscriptionTier` are **DEPRECATED** — do not read from or write to them
- Legacy aliases (`free`, `amateur`, `professional`, `frontPage`) still exist in some code — use helpers from `backend/shared/tierCompat.ts` (`isFreeArtistTier()`, `canUseAiBidAssistant()`, `toLegacyArtistTier()`) for any tier checks
- Feature limits are defined in `backend/shared/tierLimits.ts` and `backend/shared/const.ts` (`TIER_LIMITS`)

### 5. Storage uploads follow a two-step pattern

1. Backend tRPC procedure generates a signed upload URL (e.g., `portfolio.getUploadUrl`, `requests.getUploadUrl`, `verification.getUploadUrl`)
2. Frontend uploads directly to the Supabase Storage bucket using the signed URL
3. Frontend calls a second tRPC procedure to record the file in the DB (e.g., `portfolio.add`, `requests.addImage`, `verification.addDocument`)

**Buckets** (defined in `backend/server/_core/supabaseStorage.ts`):
| Bucket | Access | Max Size | Types |
|--------|--------|----------|-------|
| `portfolio-images` | public | 5 MB | JPEG, PNG, WebP |
| `request-images` | public | 5 MB | JPEG, PNG, WebP |
| `id-documents` | private | 10 MB | JPEG, PNG, PDF |

### 6. Shared constants must be used consistently

When referencing any of these across frontend and backend, import from `backend/shared/`:

- Tier values and limits → `const.ts`, `tierLimits.ts`, `tierCompat.ts`
- Cookie name (`app_session_id`) → `const.ts`
- Error messages → `const.ts` and `_core/errors.ts`
- Entity types → `types.ts`

---

## Supabase Database Tables

All tables are defined in `backend/drizzle/schema.ts`. This is the source of truth.

### Core Tables

**`users`** — Core user table backing auth
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| openId | varchar(64) unique | Supabase Auth UUID |
| name | text | Display name |
| email | varchar(320) | |
| loginMethod | varchar(64) | OAuth provider |
| role | enum | "user" / "admin" / "artist" / "client" |
| verificationStatus | enum | "unverified" / "pending" / "verified" / "rejected" |
| licenseDocumentKey | varchar(500) | Supabase Storage key (private bucket) |
| licenseDocumentUrl | varchar(1000) | Signed URL |
| verificationSubmittedAt | timestamp | |
| verificationReviewedAt | timestamp | |
| verificationNotes | text | Admin notes |
| subscriptionTier | varchar(30) | **CANONICAL** — artist_free / artist_amateur / artist_pro / artist_icon / client_free / client_plus / client_elite |
| stripeCustomerId | varchar(255) | |
| stripeSubscriptionId | varchar(255) | |
| createdAt, updatedAt, lastSignedIn | timestamp | |

**`artists`** — Artist profiles (extends users via userId FK)
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| userId | int FK→users | One-to-one, cascade delete |
| shopName | varchar(255) | Required |
| bio, specialties, styles | text | Comma-separated for specialties/styles |
| experience | int | Years |
| address, city, state, zipCode | text/varchar | Location |
| phone, website, instagram, facebook | varchar | Contact |
| lat, lng | text | Geolocation |
| averageRating | text | Calculated |
| totalReviews | int | |
| isApproved | boolean | Admin approval |
| subscriptionTier | varchar(30) | **DEPRECATED** — read from users.subscriptionTier |
| bidsUsed | int | Free tier bid counter (resets monthly) |
| createdAt, updatedAt | timestamp | |

**`clients`** — Client profiles (extends users via userId FK)
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| userId | int FK→users unique | One-to-one |
| displayName | varchar(255) | Required |
| bio, preferredStyles | text | |
| city, state, phone | varchar | |
| onboardingCompleted | boolean | |
| subscriptionTier | varchar(30) | **DEPRECATED** — read from users.subscriptionTier |
| aiCredits | int | Remaining AI generation credits |
| stripeSubscriptionId | varchar(255) | |
| createdAt, updatedAt | timestamp | |

**`portfolioImages`** — Artist portfolio images
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| artistId | int FK→artists | Cascade delete |
| imageUrl | varchar(1000) | Public Supabase URL |
| imageKey | varchar(500) | Storage bucket path |
| caption | text | |
| style | varchar(100) | e.g., "Realism", "Traditional" |
| aiStyles, aiTags, aiDescription | text | JSON from AI vision analysis |
| qualityScore | int | 1–100 |
| qualityIssues | text | JSON array |
| aiProcessedAt | timestamp | |
| createdAt | timestamp | |

**`reviews`** — Customer reviews for artists
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| artistId | int FK→artists | Cascade delete |
| userId | int FK→users | Cascade delete |
| rating | int | 1–5, required |
| comment | text | |
| helpfulVotes | int | |
| verifiedBooking | boolean | |
| photos | text | Comma-separated URLs |
| artistResponse | text | |
| artistResponseDate | timestamp | |
| moderationStatus | varchar(20) | "pending" / "approved" / "flagged" / "hidden" |
| moderationFlags | text | JSON from AI safety moderation |
| toxicityScore, spamScore, fraudScore | int | 0–100 |
| moderationReason | text | |
| moderatedAt | timestamp | |
| createdAt, updatedAt | timestamp | |

**`bookings`** — Booking appointments
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| artistId | int FK→artists | Cascade delete |
| userId | int FK→users nullable | Set null on delete (guest bookings) |
| customerName, customerEmail, customerPhone | varchar | Required |
| preferredDate | timestamp | |
| tattooDescription, placement, size, budget | text/varchar | |
| additionalNotes | text | |
| status | varchar(50) | "pending" / "confirmed" / "cancelled" / "completed" |
| stripePaymentIntentId | varchar(255) | Deposit |
| depositAmount | int | Cents |
| depositPaid | boolean | |
| createdAt, updatedAt | timestamp | |

**`favorites`** — Saved artists (unique constraint on userId + artistId)
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| userId | int FK→users | Cascade delete |
| artistId | int FK→artists | Cascade delete |
| createdAt | timestamp | |

### Client Marketplace Tables

**`tattooRequests`** — Client requests for tattoo designs
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| clientId | int FK→clients | Cascade delete |
| title | varchar(255) | |
| description | text | Detailed description |
| style, placement, size | varchar | |
| colorPreference | varchar(50) | "color" / "black_and_grey" / "either" |
| budgetMin, budgetMax | int | Cents |
| preferredCity, preferredState | varchar | |
| willingToTravel | boolean | |
| desiredTimeframe | varchar(100) | |
| status | enum | "open" / "in_progress" / "completed" / "cancelled" |
| selectedBidId | int FK→bids nullable | |
| viewCount | int | |
| createdAt, updatedAt, expiresAt | timestamp | |

**`requestImages`** — Reference images for requests
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| requestId | int FK→tattooRequests | Cascade delete |
| imageUrl | varchar(1000) | |
| imageKey | varchar(500) | |
| caption | text | |
| isMainImage | boolean | |
| createdAt | timestamp | |

**`bids`** — Artist bids on client requests (unique on artistId + requestId)
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| requestId | int FK→tattooRequests | Cascade delete |
| artistId | int FK→artists | Cascade delete |
| priceEstimate | int | Cents, required |
| estimatedHours | int | |
| message | text | Required |
| availableDate | timestamp | |
| portfolioLinks | text | |
| status | enum | "pending" / "accepted" / "rejected" / "withdrawn" |
| createdAt, updatedAt | timestamp | |

**`requestMessages`** — Messages about requests/bids
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| requestId | int FK→tattooRequests | Cascade delete |
| bidId | int FK→bids nullable | Cascade delete |
| senderId | int FK→users nullable | Set null on delete |
| message | text | |
| isRead | boolean | |
| createdAt | timestamp | |

### System Tables

**`verificationDocuments`** — License/permit verification with AI OCR
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| userId | int FK→users | Cascade delete |
| documentType | varchar(100) | "state_license", "business_permit", etc. |
| documentKey | varchar(500) | Private bucket path |
| originalFileName | varchar(255) | |
| fileSize | int | Bytes |
| mimeType | varchar(100) | |
| status | enum | "pending" / "verified" / "rejected" |
| reviewedBy | int FK→users nullable | Admin reviewer |
| reviewNotes | text | |
| ocrDocumentType, ocrExtractedName, ocrExtractedBusinessName | varchar | AI OCR |
| ocrLicenseNumber, ocrExpirationDate, ocrIssuingAuthority | varchar | |
| ocrConfidence | int | 0–100 |
| ocrNameMatch | varchar(20) | "exact" / "partial" / "mismatch" / "unavailable" |
| ocrVerdict | varchar(20) | "verified" / "needs_review" / "rejected" |
| ocrVerdictReason, ocrIssues | text | |
| ocrProcessedAt | timestamp | |
| submittedAt, reviewedAt, createdAt, updatedAt | timestamp | |

**`webhookQueue`** — Stripe webhook retry queue
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| eventId | varchar(255) unique | |
| eventType | varchar(100) | |
| payload | text | JSON |
| status | varchar(50) | "pending" / "processing" / "completed" / "failed" |
| retryCount, maxRetries | int | |
| nextRetryAt | timestamp | |
| lastError | text | |
| createdAt, updatedAt | timestamp | |

### Key Relationships

- `users` ↔ `artists` (one-to-one via userId)
- `users` ↔ `clients` (one-to-one via userId)
- `artists` ↔ `portfolioImages`, `reviews`, `bookings`, `bids` (one-to-many)
- `clients` ↔ `tattooRequests` (one-to-many)
- `tattooRequests` ↔ `requestImages`, `bids`, `requestMessages` (one-to-many)
- `users` ↔ `reviews`, `bookings`, `favorites`, `verificationDocuments` (one-to-many)

---

## tRPC API Reference

### Procedure Types (defined in `backend/server/_core/trpc.ts`)

- **publicProcedure** — no auth required
- **protectedProcedure** — requires `ctx.user`
- **artistProcedure** — requires user with artist role
- **artistOwnerProcedure** — requires user owns the specified artist profile
- **adminProcedure** — requires admin role

### Routers in `backend/server/routers.ts`

**auth** — Authentication

- `auth.me` (public query) — get current user
- `auth.logout` (public mutation) — clear session

**artists** — Artist profiles

- `artists.getAll` (public query)
- `artists.search` (public query) — filter by styles, rating, experience, city, state
- `artists.discover` (protected query) — AI semantic search
- `artists.getById` (public query)
- `artists.getByUserId` (protected query) — current user's profile
- `artists.create` (protected mutation)
- `artists.update` (artistOwner mutation)

**portfolio** — Portfolio images

- `portfolio.get` (public query)
- `portfolio.getUploadUrl` (artistOwner mutation) — signed URL, checks tier portfolio limit
- `portfolio.add` (artistOwner mutation) — triggers async AI vision analysis
- `portfolio.reanalyze` (artistOwner mutation) — re-run AI analysis
- `portfolio.delete` (protected mutation)

**reviews** — Reviews with AI moderation

- `reviews.getByArtistId` (public query)
- `reviews.create` (protected mutation) — triggers async AI safety moderation

**bookings** — Appointments

- `bookings.create` (protected mutation) — with input sanitization
- `bookings.getByUserId` (protected query)
- `bookings.getByArtistId` (artistOwner query)
- `bookings.updateStatus` (protected mutation)

**favorites** — Saved artists

- `favorites.add` / `favorites.remove` (protected mutation)
- `favorites.getByUserId` (protected query)
- `favorites.isFavorite` (protected query)

**moderation** — Admin review moderation

- `moderation.getFlaggedReviews` (admin query)
- `moderation.updateReviewStatus` (admin mutation)
- `moderation.reanalyzeReview` (admin mutation)

### Routers in `backend/server/clientRouters.ts`

**clients** — Client profiles

- `clients.getMyProfile` (protected query)
- `clients.createProfile` (protected mutation) — sets role to "client"
- `clients.updateProfile` (protected mutation)
- `clients.createSubscriptionCheckout` (protected mutation) — Stripe checkout

**requests** — Tattoo requests

- `requests.getOpen` (public query) — with filtering
- `requests.listForArtistDashboard` (protected query) — paid artists only
- `requests.listForHomepage` (public query) — latest 8
- `requests.getById` (public query) — includes bids, increments view count
- `requests.getMyRequests` (protected query)
- `requests.create` (protected mutation)
- `requests.refineDescription` (protected mutation) — AI prompt refinement
- `requests.getUploadUrl` / `requests.addImage` (protected mutation)
- `requests.updateStatus` (protected mutation)

**bids** — Artist bids

- `bids.getByRequestId` (public query)
- `bids.getMyBids` (protected query)
- `bids.draftBid` (protected mutation) — AI draft (Pro/Icon tier only)
- `bids.create` (protected mutation) — enforces 5 free bid limit for free tier
- `bids.accept` (protected mutation) — accepts one, rejects all others
- `bids.withdraw` (protected mutation)

### Routers in `backend/server/aiRouter.ts`

**ai** — AI generation

- `ai.generateDesign` (protected mutation) — checks credits, deducts atomically
- `ai.getCredits` (protected query) — current credits + tier info

### Routers in `backend/server/verificationRouter.ts`

**verification** — License verification

- `verification.getUploadUrl` (protected mutation) — signed URL for ID document
- `verification.addDocument` (protected mutation) — triggers async AI OCR
- `verification.getPending` (admin query) — pending docs with OCR results
- `verification.review` (admin mutation) — approve/reject
- `verification.getDocument` (admin query) — OCR details

---

## Frontend Routes

Defined in `frontend/client/src/App.tsx` using Wouter:

| Path                   | Page               | Notes                       |
| ---------------------- | ------------------ | --------------------------- |
| `/`                    | Home               | Landing page                |
| `/artist-finder`       | ArtistFinder       | AI discovery search         |
| `/artists`             | ArtistBrowse       | Browse/filter artists       |
| `/artist/:id`          | ArtistProfile      | Artist detail page          |
| `/for-artists`         | ForArtists         | Artist info/signup          |
| `/dashboard`           | Dashboard          | User dashboard              |
| `/artist-dashboard`    | ArtistDashboard    | Artist dashboard            |
| `/login`               | Login              | Login/signup                |
| `/auth/callback`       | AuthCallback       | OAuth callback handler      |
| `/help`                | Help               | Help page                   |
| `/cancellation-policy` | CancellationPolicy | Policy page                 |
| `/pricing`             | Pricing            | Subscription pricing        |
| `/license-upload`      | LicenseUpload      | License verification upload |
| `/client/onboarding`   | ClientOnboarding   | Client onboarding flow      |
| `/client/dashboard`    | ClientDashboard    | Client dashboard            |
| `/client/new-request`  | NewRequest         | Create tattoo request       |
| `/requests`            | RequestBoard       | Browse open requests        |
| `/requests/:id`        | RequestDetail      | Request detail + bids       |
| `/client/design-lab`   | DesignLab          | AI design generation        |
| `/admin/moderation`    | AdminModeration    | Admin review moderation     |
| `/404`                 | NotFound           | 404 page                    |

---

## Auth Flow

```
Frontend                          Backend                         Supabase
───────                          ───────                         ────────
1. User signs in
   useSupabaseAuth()
   → supabase.auth.signIn()  ──────────────────────────────────→  Creates session
                              ←──────────────────────────────────  Returns tokens

2. Sync with backend
   POST /api/auth/session
   { accessToken, refreshToken } ──→  supabaseAdmin.auth.getUser()
                                      Upserts user in DB (users table)
                                      Sets app_session_id cookie
                              ←──────  { user }

3. Subsequent requests
   trpc.*.useQuery/useMutation()
   Cookie: app_session_id     ──→  createContext() extracts token
                                   supabaseAdmin.auth.getUser() verifies
                                   Fetches user from DB by openId
                                   Attaches ctx.user
                              ←──  Response with typed data
```

**Frontend hooks:**

- `useSupabaseAuth()` — Supabase auth actions (signIn, signUp, signOut, OAuth, resetPassword, syncSessionWithBackend)
- `useAuth()` — backend user state via `trpc.auth.me` (user, loading, isAuthenticated, logout, refresh)

---

## Tier System

### Artist Tiers

| Canonical Value | Name         | Portfolio | Bookings | Contact | Reviews | Analytics | Featured |
| --------------- | ------------ | --------- | -------- | ------- | ------- | --------- | -------- |
| artist_free     | Apprentice   | 3         | No       | No      | No      | No        | No       |
| artist_amateur  | Artist       | 15        | Yes      | Yes     | No      | No        | No       |
| artist_pro      | Professional | Unlimited | Yes      | Yes     | Yes     | Yes       | No       |
| artist_icon     | Icon         | Unlimited | Yes      | Yes     | Yes     | Yes       | Yes      |

**Pricing**: Free / $9 mo ($90/yr) / $19 mo ($190/yr) / $39 mo ($390/yr)

### Client Tiers

| Canonical Value | Name       | Requests/mo | AI Gens/mo | Direct Chat | Priority | Deposit |
| --------------- | ---------- | ----------- | ---------- | ----------- | -------- | ------- |
| client_free     | Collector  | 1           | 0          | No          | No       | No      |
| client_plus     | Enthusiast | 10          | 10         | No          | Yes      | No      |
| client_elite    | Elite Ink  | Unlimited   | Unlimited  | Yes         | Yes      | Yes     |

**Pricing**: Free / $9 mo / $19 mo

### Legacy Compatibility

Legacy aliases (`free`, `amateur`, `professional`, `frontPage`) still appear in some code. Use helpers from `backend/shared/tierCompat.ts`:

- `isFreeArtistTier(tier)` — checks "artist_free" or "free"
- `canUseAiBidAssistant(tier)` — true for Pro/Icon (canonical or legacy)
- `isFreeClientTier(tier)` — checks "client_free" or "free"
- `toLegacyArtistTier(tier)` — converts canonical to legacy

---

## Key Workflows

- **Development**: `pnpm dev` — runs Express server with Vite dev middleware
- **Build**: `pnpm build` — builds frontend with Vite, bundles server with esbuild
- **DB migrations**: `pnpm db:push` — generates and applies Drizzle migrations
- **Tests**: `pnpm test` — runs Vitest on `tests/` directory
- **Type check**: `pnpm check` — runs TypeScript compiler

---

## External Integrations

### Supabase

- **Auth**: `backend/server/_core/supabaseAuth.ts` — token exchange, session management, `requireAuth` middleware
- **Storage**: `backend/server/_core/supabaseStorage.ts` — bucket management, signed URLs, upload/delete
- **Admin client**: `backend/server/_core/supabase.ts` — service role client (bypasses RLS)
- **Frontend client**: `frontend/client/src/lib/supabase.ts` — browser client with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Stripe

- **Checkout**: `backend/server/stripe.ts` — subscription checkout sessions
- **Webhooks**: `backend/server/webhookHandler.ts` — processes subscription events, updates `users.subscriptionTier`
- **Retry queue**: `backend/server/webhookQueue.ts` — failed webhook retry with backoff

### Groq + Hugging Face AI

- **Provider helpers**: `backend/server/_core/aiProviders.ts` — shared Groq/Hugging Face calls and JSON parsing
- **Vision**: `backend/server/geminiVision.ts` — Hugging Face captioning + Groq structuring for portfolio analysis
- **Discovery**: `backend/server/geminiDiscovery.ts` — Groq natural language artist search parsing
- **Generation**: `backend/server/geminiGeneration.ts` — Hugging Face image generation
- **Safety**: `backend/server/geminiSafety.ts` — Hugging Face OCR + Groq moderation/verification logic
- **Bid Optimizer**: `backend/server/geminiBidOptimizer.ts` — Groq-powered prompt refinement and bid drafting

### Email

- **Resend**: `backend/server/email.ts` — transactional emails

---

## Patterns & Conventions

- **Types**: Always import from `backend/shared/types.ts` (re-exports Drizzle schema types). Never hand-write types that exist in schema.
- **API calls**: Use tRPC hooks — `trpc.artists.getAll.useQuery()`, `trpc.bookings.create.useMutation()`
- **Error handling**: tRPC errors with `UNAUTHORIZED` code trigger redirect to login in the frontend
- **Styling**: Tailwind CSS with shadcn/ui components, dark/light theme via ThemeContext
- **Input sanitization**: Applied in booking/review mutations via `backend/server/_core/sanitize.ts`
- **AI processing**: Always async/non-blocking — procedures return immediately, AI results stored in DB when complete
- **Protected routes**: Use procedure types (protected, artist, artistOwner, admin) — never manually check auth in procedure body

## Common Tasks

### Add a new feature to an existing entity

1. If schema change needed: update `backend/drizzle/schema.ts`, run `pnpm db:push`
2. Add/update tRPC procedure in the appropriate router file
3. Use the new procedure in frontend with tRPC hook — types are inferred automatically

### Add a new page

1. Create component in `frontend/client/src/pages/`
2. Add route in `frontend/client/src/App.tsx`

### Add a new entity (table + API + UI)

1. Add table to `backend/drizzle/schema.ts`
2. Export types from `backend/shared/types.ts`
3. Run `pnpm db:push`
4. Create tRPC router (or add to existing one)
5. Register router in `backend/server/_core/index.ts` if new
6. Create frontend page/component using tRPC hooks
7. Add route in `frontend/client/src/App.tsx`

### Change subscription tier logic

1. Update tier values in `backend/shared/const.ts` (Zod enum + TIER_LIMITS)
2. Update feature limits in `backend/shared/tierLimits.ts`
3. Update compatibility helpers in `backend/shared/tierCompat.ts` if needed
4. Verify all tier checks in routers use the shared helpers
5. Update Stripe product/price mapping in `backend/server/stripe.ts` if needed
6. Frontend pricing pages will reflect changes via tRPC queries
