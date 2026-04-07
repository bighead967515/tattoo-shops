# Railway Deployment Guide

This document describes how to deploy the **tattoo-shops** application to [Railway](https://railway.app). The project is a full-stack Node.js application: the Express backend serves the pre-built React frontend as static files from a single Railway service.

---

## Architecture on Railway

```
Railway Service (tattoo-shops)
├── Build:  pnpm install && pnpm run build
│           → vite build  (frontend → dist/public/)
│           → esbuild     (backend  → dist/index.js)
└── Start:  node dist/index.js
            ├── Express API  (/api/*)
            ├── tRPC         (/api/trpc/*)
            ├── Stripe hook  (/api/stripe/webhook)
            └── Static SPA   (/* → dist/public/index.html)
```

External services (Supabase, Stripe, Resend, Google AI) are **not** hosted on Railway — only the application server is.

---

## Prerequisites

- A [Railway](https://railway.app) account
- A GitHub repository containing this project
- All external service accounts configured (see `API_KEYS_CHECKLIST.md`)

---

## Step 1 — Create a New Railway Project

1. Log in to [railway.app](https://railway.app) and click **New Project**.
2. Select **Deploy from GitHub repo** and choose `bighead967515/tattoo-shops`.
3. Railway will detect the `railway.json` and `nixpacks.toml` files automatically.

---

## Step 2 — Add a PostgreSQL Database

1. Inside your Railway project, click **+ New** → **Database** → **Add PostgreSQL**.
2. Railway will automatically inject `DATABASE_URL` into your service's environment.
3. After the first deploy, run the migration to apply all schema changes:

```bash
# From your local machine with DATABASE_URL set:
pnpm run db:push
```

Or connect to the Railway shell and run:

```bash
railway run pnpm run db:push
```

> **Important:** The migration `0003_constraint_improvements.sql` must be applied to an existing database before the new application code is deployed. For a **fresh** database, `pnpm run db:push` will create all tables with the constraints already in place.

---

## Step 3 — Configure Environment Variables

In the Railway dashboard, go to your service → **Variables** and add the following:

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | Auto-injected by Railway Postgres plugin | Yes (auto) |
| `JWT_SECRET` | Min 32 chars — `openssl rand -hex 32` | Yes |
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...`) | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes |
| `RESEND_API_KEY` | Resend email API key | Yes |
| `GOOGLE_AI_API_KEY` | Google Gemini API key | Yes |
| `OWNER_OPEN_ID` | Supabase Auth UUID of the admin user | Yes |
| `NODE_ENV` | Set to `production` | Yes |
| `APP_URL` | Your custom domain, e.g. `https://yourdomain.com` | Optional |
| `SENTRY_DSN` | Sentry DSN for error tracking | Optional |

> `PORT` and `RAILWAY_PUBLIC_DOMAIN` are injected automatically by Railway — **do not set them manually**.

---

## Step 4 — Configure the Stripe Webhook

After your first successful deploy, update your Stripe webhook endpoint:

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks).
2. Add a new endpoint: `https://<your-railway-domain>/api/stripe/webhook`
3. Select the events your application listens for (see `backend/server/webhookHandler.ts`).
4. Copy the **Signing Secret** and set it as `STRIPE_WEBHOOK_SECRET` in Railway.

---

## Step 5 — Custom Domain (Optional)

1. In Railway, go to your service → **Settings** → **Domains**.
2. Click **Add Custom Domain** and enter your domain.
3. Add the CNAME record shown to your DNS provider.
4. Set `APP_URL=https://yourdomain.com` in Railway environment variables.

---

## Build & Start Commands

These are already configured in `railway.json` and `nixpacks.toml`:

```bash
# Build
pnpm install --frozen-lockfile && pnpm run build

# Start
pnpm run start
# → NODE_ENV=production node dist/index.js
```

---

## Health Check

Railway uses the health check endpoint to verify the service is running:

```
GET /api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-03-08T00:00:00.000Z",
  "environment": "production",
  "database": "connected",
  "webhookQueue": { "pending": 0, "processing": 0, "completed": 0, "failed": 0, "total": 0 }
}
```

---

## Database Migrations

All constraint improvements are in `backend/drizzle/0003_constraint_improvements.sql`. Apply them with:

```bash
# Locally (with DATABASE_URL pointing to Railway Postgres):
pnpm run db:push

# Or via Railway CLI:
railway run pnpm run db:push
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Build fails with `DATABASE_URL is required` | `drizzle.config.ts` reads `DATABASE_URL` at build time. Set it in Railway variables. |
| `CORS: origin not allowed` | Set `APP_URL` to your exact frontend origin (including `https://`). |
| Stripe webhooks return 400 | Ensure `STRIPE_WEBHOOK_SECRET` matches the signing secret in Stripe Dashboard. |
| `Could not find build directory` | The `pnpm run build` step must complete before `pnpm run start`. Check build logs. |
| Health check timeout | Increase `healthcheckTimeout` in `railway.json` or check database connectivity. |
