---
name: "Artist Tier Sync"
description: "Daily cron job that compares active Stripe subscriptions to Supabase user tiers. Corrects any mismatches and sends an admin drift report email."
tags: ["data-sync", "stripe", "supabase", "cron", "billing"]
---

# Artist Tier Sync Workflow

## Overview

This workflow runs daily at 3am UTC to detect and correct "tier drift" — situations where the user's `subscriptionTier` in Supabase doesn't match their active Stripe subscription. This can happen due to failed webhooks, manual Stripe edits, or race conditions.

Steps:
1. Cron trigger at `0 3 * * *`
2. Fetch all active Stripe subscriptions (paginated, limit 100)
3. For each subscription: extract customer ID + price ID → map to canonical tier
4. Query Supabase for each user by `stripeCustomerId`
5. Compare `users.subscriptionTier` to the expected tier
6. On mismatch: PATCH `users.subscriptionTier` in Supabase + log correction
7. Send admin drift report email with count and list of corrections

## Trigger

**Type**: Schedule (Cron)  
**Expression**: `0 3 * * *` (3:00 AM UTC daily)

## Required Environment Variables

```
STRIPE_API_KEY               — Stripe secret key (sk_live_xxx)
SUPABASE_URL                 — Supabase project URL
SUPABASE_SERVICE_KEY         — Supabase service role key
RESEND_API_KEY               — Resend API key
ADMIN_ALERT_EMAIL            — Admin drift report destination
STRIPE_PRICE_ID_ARTIST_AMATEUR  — Price ID for $29/mo plan
STRIPE_PRICE_ID_ARTIST_ICON     — Price ID for $19/mo founding plan
```

## Tier Mapping

| Stripe Price ID                | Canonical Tier   |
|-------------------------------|------------------|
| STRIPE_PRICE_ID_ARTIST_ICON   | `artist_icon`    |
| STRIPE_PRICE_ID_ARTIST_AMATEUR| `artist_amateur` |
| _(any other active price)_    | `artist_pro`     |
| _(no active subscription)_    | `artist_free`    |

## Workflow Steps

### 1. Cron Trigger
```
node_name: trigger_cron_daily_sync
type: Schedule Trigger
expression: 0 3 * * *
```

### 2. Fetch Active Stripe Subscriptions
```
node_name: api_stripe_list_subscriptions
type: HTTP Request
method: GET
url: https://api.stripe.com/v1/subscriptions?status=active&limit=100&expand[]=data.customer
headers:
  Authorization: Basic {base64(STRIPE_API_KEY + ':')}
error path → send_alert_admin + log_error
```

### 3. Check Subscriptions Returned
```
node_name: check_subscriptions_exist
type: IF
condition: $json.data.length > 0
false → send_email_drift_report (0 corrections) + log_no_work
```

### 4. Split Subscriptions
```
node_name: split_subscriptions
type: Split In Batches
batchSize: 1
input: $json.data (array of subscription objects)
```

### 5. Map Price to Tier (per subscription)
```
node_name: transform_map_subscription_tier
type: Set (Code expression)
fields:
  customerId: $json.customer (string)
  priceId: $json.items.data[0].price.id
  expectedTier: (priceId → tier mapping)
```

### 6. Fetch User from Supabase by Customer ID
```
node_name: api_supabase_fetch_user
type: HTTP Request
method: GET
url: SUPABASE_URL/rest/v1/users?stripeCustomerId=eq.{customerId}&select=id,email,subscriptionTier
error path → log_error_fetch + continue loop
```

### 7. Check for Tier Mismatch
```
node_name: check_tier_mismatch
type: IF
condition: user.subscriptionTier != expectedTier
true → api_supabase_correct_tier + log_correction
false → skip (continue loop)
```

### 8. Correct Tier in Supabase
```
node_name: api_supabase_correct_tier
type: HTTP Request
method: PATCH
url: SUPABASE_URL/rest/v1/users?id=eq.{userId}
body: { subscriptionTier: expectedTier, updatedAt: now() }
error path → log_error_patch
```

### 9. Aggregate Correction Count
```
node_name: transform_aggregate_results
type: Code
logic: count total processed, corrections made, errors
output: { total, corrections, errors, correctionDetails[] }
```

### 10. Send Drift Report Email
```
node_name: send_email_drift_report
type: HTTP Request (Resend)
to: ADMIN_ALERT_EMAIL
subject: "Daily Tier Sync — {corrections} corrections made"
body: table of corrected users (email, old tier → new tier), totals
```

### 11. Log Run
```
node_name: log_supabase_sync_run
type: HTTP Request
method: POST
url: SUPABASE_URL/rest/v1/workflow_logs
body: { workflow, event: 'tier_sync', total, corrections, errors, ran_at }
```

## Error Handling

- Stripe API failure: halt and alert admin immediately
- Per-user errors: log and continue (non-blocking per subscription)
- All external HTTP nodes have `continueOnFail: true`
- Results summary always sent even if some updates fail

## Notes

- Stripe API uses HTTP Basic Auth: `Authorization: Basic {base64(sk_live_xxx + ':')}`
- Pagination: first run fetches up to 100 subscriptions. For > 100, add a pagination loop using `starting_after` cursor
- Only updates `users.subscriptionTier` — never `artists.subscriptionTier` (deprecated)
- The `artist_pro` pay-as-you-go tier has no Stripe subscription — users with no active subscription who currently have `artist_pro` should NOT be downgraded (only flag for review)
