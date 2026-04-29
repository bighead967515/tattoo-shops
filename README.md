# Ink Connect. — Tattoo Artist Directory & Booking Platform

A full-stack web application for finding, connecting with, and booking tattoo artists. Clients can browse artist portfolios, post tattoo requests for artists to bid on, generate AI tattoo designs, and book appointments — all with integrated payments and real-time communication.

## Tech Stack

| Layer          | Technology                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Frontend**   | React 19, Vite 7, TypeScript 5.9, Wouter (routing), TanStack React Query                                                 |
| **UI**         | Tailwind CSS 4, shadcn/ui (Radix), Framer Motion, Recharts, dark/light theme                                             |
| **Backend**    | Node.js, Express 4, tRPC 11 (type-safe API)                                                                              |
| **Database**   | PostgreSQL (Supabase), Drizzle ORM                                                                                       |
| **Auth**       | Supabase Auth — Google, GitHub, and email/password                                                                       |
| **Storage**    | Supabase Storage (portfolio images, reference images, ID documents)                                                      |
| **Payments**   | Stripe (checkout sessions, subscriptions, webhooks)                                                                      |
| **AI**         | Groq + Hugging Face (design generation, vision tagging, NLP discovery, review moderation, license OCR, bid drafting) |
| **Email**      | Resend (booking confirmations, artist invitations)                                                                       |
| **Monitoring** | Sentry, Winston logging, health check endpoint                                                                           |
| **Deployment** | Hostinger (active), with legacy provider configs still present in-repo                                                   |
| **Testing**    | Vitest (unit), Playwright (e2e), Artillery (load)                                                                        |

## Project Structure

```
├── backend/
│   ├── drizzle/          # Database schema, migrations, relations
│   ├── server/           # Express + tRPC server
│   │   ├── routers.ts          # Artist, portfolio, review, booking, favorite, moderation routes
│   │   ├── clientRouters.ts    # Client profile, tattoo request, bid routes
│   │   ├── aiRouter.ts         # AI tattoo design generation + credit tracking
│   │   ├── verificationRouter.ts # License upload + admin review with AI OCR
│   │   ├── healthRouter.ts     # Health check endpoint
│   │   ├── geminiVision.ts     # Smart Portfolio Tagging (Hugging Face + Groq)
│   │   ├── geminiDiscovery.ts  # Tattoo Discovery query parser (Groq)
│   │   ├── geminiGeneration.ts # AI tattoo design generation (Hugging Face)
│   │   ├── geminiBidOptimizer.ts # Prompt Refiner + Bid Assistant (Groq)
│   │   ├── geminiSafety.ts     # License OCR + Review Sentiment Analysis (Hugging Face + Groq)
│   │   ├── stripe.ts           # Stripe checkout + subscriptions with circuit breaker
│   │   ├── email.ts            # Resend email with retry logic
│   │   ├── webhookHandler.ts   # Stripe webhook processing + retry queue
│   │   ├── webhookQueue.ts     # Webhook retry queue with exponential backoff
│   │   └── _core/              # Context, auth, env, logging, Supabase clients
│   └── shared/           # Shared types, constants, tier limits
├── frontend/
│   └── client/
│       └── src/
│           ├── pages/          # Route-based pages for browse, booking, onboarding, billing, and admin flows
│           ├── components/     # App shell, reusable UI components, and shadcn/ui primitives
│           ├── hooks/          # Custom React hooks
│           ├── contexts/       # Theme context
│           └── lib/            # Utilities, tRPC client
├── tests/
│   ├── backend/          # API unit tests
│   ├── frontend/         # Accessibility, error handling tests
│   ├── e2e/              # Playwright performance tests
│   ├── integration/      # User flow tests
│   └── load/             # Artillery load test configs
├── railway.json          # Legacy Railway config
├── render.yaml           # Legacy Render config
└── vercel.json           # Legacy Vercel config
```

## Features

### For Artists

- **Profile management** — shop name, bio, specialties, styles, location, social links
- **Portfolio uploads** — image gallery with captions and style tags (via Supabase Storage)
- **Smart Portfolio Tagging (AI)** — Hugging Face vision + Groq classification automatically detect tattoo styles, tags content subjects, generate SEO descriptions, and score image quality on every upload
- **Booking management** — accept, confirm, or cancel appointments
- **Request board** — browse client tattoo requests and submit bids
- **AI Bid Assistant** — Professional/Icon tier artists get AI-drafted bid responses with suggested pricing, estimated hours, and personalized pitch messages
- **License verification** — upload documents for verified artist status with AI-powered OCR that extracts names, license numbers, and expiration dates
- **Subscription tiers** — Free, Pro ($29/mo), Pay-as-you-go (0$/mo + 10% fee), Founding Artist ($19/mo locked, first 100 only)
- **Bid dashboard** — My Bids tab with status, analytics strip (total/pending/accepted/win-rate), and withdraw actions
- **Analytics & reviews** — ratings, review responses, helpful votes

### For Clients

- **AI Design Lab** — generate AI tattoo stencil concepts from text prompts across 14 styles (Traditional, Realism, Watercolor, Japanese, Geometric, Minimalist, etc.), tier-gated with credit system
- **Tattoo Discovery (AI)** — describe your dream tattoo in natural language and AI matches you to artists by style, subject, and vibe
- **Artist discovery** — search and filter by style, rating, experience, and location
- **Tattoo requests** — post requests with description, style, placement, size, budget, and reference images
- **AI Prompt Refiner** — AI analyzes request descriptions for completeness and suggests improvements
- **Bid system** — receive and compare bids from multiple artists
- **Booking & payments** — book appointments with Stripe-powered deposits
- **Favorites** — save and track preferred artists
- **Dashboard** — manage requests, track bids, view booking history, cancel open requests
- **Client onboarding** — guided setup with preferred styles and location

### Platform

- **Type-safe API** — end-to-end TypeScript with tRPC
- **OAuth authentication** — Google, GitHub, and email via Supabase Auth
- **Stripe payments** — checkout sessions, subscriptions, webhook processing with retry queue and exponential backoff
- **Email notifications** — booking confirmations and artist invitations via Resend
- **Circuit breaker pattern** — resilient external service calls (Stripe, email)
- **7 AI features** powered by Groq + Hugging Face:
  - **Design Generation** — text-to-tattoo stencil concept art with style selection
  - **Smart Portfolio Tagging** — computer vision auto-tags styles, subjects, SEO descriptions, quality scores
  - **Tattoo Discovery** — NLP search parses intent and matches against AI-tagged portfolios
  - **Prompt Refiner** — helps clients write detailed, complete tattoo requests
  - **Bid Assistant** — drafts personalized artist proposals with suggested pricing
  - **License OCR** — extracts and verifies document data from uploaded licenses
  - **Review Moderation** — toxicity/spam/fraud scoring with auto-flagging
- **Admin Dashboard (`/admin`)** — approve/revoke artists, pending license verifications (OCR results, confidence scores), flagged reviews (toxicity/spam/fraud scores), summary stats
- **SEO** — meta tags, structured data, sitemap
- **Dark/light mode** — theme toggle with system preference detection

## Pages

| Route                  | Page                     | Access        |
| ---------------------- | ------------------------ | ------------- |
| `/`                    | Home                     | Public        |
| `/artists`             | Artist Browse            | Public        |
| `/artist/:id`          | Artist Profile           | Public        |
| `/artist-finder`       | AI-powered Artist Finder | Public        |
| `/for-artists`         | Artist Landing Page      | Public        |
| `/pricing`             | Subscription Pricing     | Public        |
| `/requests`            | Request Board            | Public        |
| `/requests/:id`        | Request Detail           | Public        |
| `/login`               | Login                    | Public        |
| `/auth/callback`       | Auth Callback            | Public        |
| `/help`                | Help & FAQ               | Public        |
| `/cancellation-policy` | Cancellation Policy      | Public        |
| `/dashboard`           | User Dashboard           | Authenticated |
| `/artist-dashboard`    | Artist Dashboard         | Artist        |
| `/license-upload`      | License Verification     | Artist        |
| `/client/onboarding`   | Client Onboarding        | Client        |
| `/client/dashboard`    | Client Dashboard         | Client        |
| `/client/new-request`  | New Tattoo Request       | Client        |
| `/client/design-lab`   | AI Design Lab            | Client        |
| `/admin`               | Admin Dashboard          | Admin         |
| `/admin/moderation`    | Admin Review Moderation  | Admin         |
| `/artist/billing`      | Artist Billing & Plans   | Artist        |
| `*` (fallback)         | 404 Not Found            | Public        |

## Database Schema

14 tables managed by Drizzle ORM:

| Table                   | Purpose                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `users`                 | Supabase Auth users — role, verification status, Stripe customer ID                        |
| `artists`               | Artist profiles — specialties, location, ratings, subscription tier                        |
| `shops`                 | Shop catalog records — name, address, city/state, verification/claim status                |
| `portfolioImages`       | Portfolio gallery — image URL, caption, style tag, AI-detected styles/tags/quality         |
| `verificationDocuments` | Uploaded licenses/permits — document metadata, OCR extracted data, AI verification verdict |
| `reviews`               | 1–5 star ratings, comments, helpful votes, artist responses, AI moderation scores          |
| `bookings`              | Appointments — date, description, placement, budget, payment status                        |
| `favorites`             | User → artist favorites                                                                    |
| `clients`               | Client profiles — preferred styles, location                                               |
| `tattooRequests`        | Posted requests — style, placement, size, budget range, expiration                         |
| `requestImages`         | Reference images attached to requests                                                      |
| `bids`                  | Artist bids on requests — price, hours, message, available date                            |
| `requestMessages`       | Client ↔ artist messaging on requests                                                     |
| `webhookQueue`          | Stripe webhook retry queue with exponential backoff                                        |

## Artist Subscription Tiers

| Tier                      | Price             | Bid Fee | Portfolio | Bookings | Verified Badge | Featured |
| ------------------------- | ----------------- | ------- | --------- | -------- | -------------- | -------- |
| **Free**                  | $0/mo             | —       | 10 photos | —        | —              | —        |
| **Pro**                   | $29/mo (or $232/yr) | 5%    | Unlimited | ✓        | ✓              | —        |
| **Pay-as-you-go**         | $0/mo             | 10%     | 10 photos | —        | —              | —        |
| **Founding Artist**       | $19/mo locked     | 5%      | Unlimited | ✓        | ✓              | ✓        |

> **Founding Artist** is limited to the first 100 artists. Requires: complete portfolio + 3 bid responses within 60 days. Badge is revocable if activity drops.
>
> **Pro break-even**: At ~$580/month in accepted bids, the 5% Pro fee costs the same as the $29 subscription vs. 10% pay-as-you-go fee.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+
- PostgreSQL database (or [Supabase](https://supabase.com) project)
- Stripe account
- Resend account

### Installation

```bash
# Clone and install
pnpm install

# Create a local .env file from the variables listed below
# Then fill in your credentials before running the app
```

### Environment Variables

```env
DATABASE_URL=postgresql://...          # Supabase PostgreSQL connection string
JWT_SECRET=...                         # Min 32 characters
SUPABASE_URL=https://...               # Supabase project URL
SUPABASE_SERVICE_KEY=...               # Supabase service role key
SUPABASE_ANON_KEY=...                  # Supabase anon/public key (safe for frontend)
VITE_SUPABASE_URL=https://...          # Frontend Supabase URL (same as SUPABASE_URL)
VITE_SUPABASE_ANON_KEY=...             # Frontend anon/public key (same as SUPABASE_ANON_KEY)
STRIPE_SECRET_KEY=sk_...               # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...        # Stripe webhook signing secret
RESEND_API_KEY=re_...                  # Resend API key
GROQ_API_KEY=gsk_...                    # Groq API key for discovery, prompt refinement, bid drafting, moderation
HUGGINGFACE_API_KEY=hf_...              # Hugging Face API key for image generation, captioning, OCR
OWNER_OPEN_ID=...                      # Admin user identifier
```

### Database Setup

```bash
pnpm db:push    # Generate and run migrations
```

### Development

```bash
pnpm dev        # Start dev server (backend + Vite frontend)
```

The server starts on `http://localhost:3000` by default.

### Production Build

```bash
pnpm build      # Vite frontend build + esbuild server bundle
pnpm start      # Run production server
```

## Scripts

| Command             | Description                                 |
| ------------------- | ------------------------------------------- |
| `pnpm dev`          | Start development server with hot reload    |
| `pnpm build`        | Build frontend (Vite) and backend (esbuild) |
| `pnpm start`        | Run production server                       |
| `pnpm check`        | TypeScript type checking                    |
| `pnpm test`         | Run unit tests (Vitest)                     |
| `pnpm format`       | Format code with Prettier                   |
| `pnpm db:push`      | Generate and run database migrations        |
| `pnpm load:browse`  | Run browsing load test                      |
| `pnpm load:booking` | Run booking flow load test                  |
| `pnpm load:spike`   | Run spike load test                         |

## API Overview

The API uses [tRPC](https://trpc.io) for type-safe client-server communication.

**Core routes** (`/api/trpc/*`):

- `auth.me`, `auth.logout` — session management
- `artists.*` — CRUD, search with filters, AI-powered discovery
- `portfolio.*` — image upload URLs, add/delete with AI tagging
- `reviews.*` — create (with AI moderation), list by artist
- `bookings.*` — create, list, update status
- `favorites.*` — add, remove, check
- `moderation.*` — admin: flagged reviews, update status, re-analyze
- `artists.adminGetAll`, `artists.adminSetApproval` — admin: list all artists, approve/revoke
- `artists.enablePayAsYouGo` — activate no-subscription transaction path

**Client marketplace routes**:

- `clients.*` — profile management, subscription checkout
- `requests.*` — create, list, filter, AI prompt refinement, reference images
- `bids.*` — create, accept, AI bid drafting (Professional/Icon tier)

**AI routes**:

- `ai.generateDesign` — text-to-tattoo concept generation
- `ai.getCredits` — check remaining AI generation credits

**Other endpoints**:

- `GET /api/health` — health check with DB status and webhook queue stats
- `POST /api/stripe/webhook` — Stripe webhook handler (raw body for signature verification)
- `POST /api/verification/*` — license document upload
- `GET /sitemap.xml` — static SEO sitemap

## Deployment

The active deployment target is **Hostinger**.

Recommended Hostinger deployment flow:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Hostinger should run the bundled Node server from `dist/index.js`, with the frontend served from `dist/public` by the Express app.

Required deployment notes:

- Configure all environment variables in the Hostinger dashboard or server environment.
- Ensure the public app URL, CORS settings, and Stripe webhook endpoint match the Hostinger domain.
- Keep uploads and document storage in Supabase Storage; the app should not rely on local filesystem persistence.

Legacy deployment configs for Vercel, Railway, and Render still exist in the repo, but they are not the active deployment target.

## Additional Documentation

- See `GEMINI.md` for AI workflow notes and `backend/server/_core/aiProviders.ts` for provider integration details
- See `TODO.md` for development roadmap
