---
name: "Subscription Created"
description: "Handles Stripe customer.subscription.created events. Maps the price ID to a canonical tier, updates the user's subscriptionTier in Supabase, sets Founding Artist flags if applicable, and sends a welcome email."
tags: ["billing", "stripe", "subscription", "onboarding"]
---

# Subscription Created Workflow

## Overview

When a new Stripe subscription is created, this workflow:

1. Receives the Stripe webhook event
2. Validates the Stripe signature header
3. Extracts customer ID, price ID, status, and trial metadata
4. Maps the price ID to a canonical tier (`artist_amateur` or `artist_icon`)
5. Fetches the matching user from Supabase by `stripeCustomerId`
6. Updates `users.subscriptionTier` and `users.stripeSubscriptionId`
7. If the subscription has `trial_end` metadata: sets `artists.isFoundingArtist = true` and `artists.foundingTrialEndsAt`
8. Sends a welcome/congratulations email via Resend
9. Logs the event to Supabase

## Trigger

**Type**: Webhook (HTTP POST)  
**URL Pattern**: `https://n8n.example.com/webhook/stripe-subscription-created`  
**Authentication**: Stripe-Signature header (verified via STRIPE_WEBHOOK_SECRET)

**Event**: `customer.subscription.created`

**Relevant payload fields**:
```json
{
  "id": "evt_xxx",
  "type": "customer.subscription.created",
  "data": {
    "object": {
      "id": "sub_xxx",
      "customer": "cus_xxx",
      "status": "active",
      "trial_end": null,
      "items": {
        "data": [{ "price": { "id": "price_xxx" } }]
      },
      "metadata": {
        "userId": "123"
      }
    }
  }
}
```

## Required Environment Variables

```
STRIPE_WEBHOOK_SECRET        — Stripe webhook signing secret (whsec_xxx)
SUPABASE_URL                 — Supabase project URL
SUPABASE_SERVICE_KEY         — Supabase service role key
RESEND_API_KEY               — Resend API key
ADMIN_ALERT_EMAIL            — Admin alert email
APP_BASE_URL                 — e.g. https://inkconnect.app
STRIPE_PRICE_ID_ARTIST_AMATEUR  — Stripe price ID for $29/mo artist_amateur plan
STRIPE_PRICE_ID_ARTIST_ICON     — Stripe price ID for $19/mo founding artist_icon plan
```

## Workflow Steps

### 1. Webhook Trigger
```
node_name: trigger_webhook_stripe
type: Webhook
method: POST
path: /stripe-subscription-created
responseMode: onReceived
```

### 2. Validate Stripe Signature
```
node_name: check_stripe_signature
type: IF
condition: $json.headers['stripe-signature'] is not empty
error path → log_error_invalid_signature (HTTP POST to workflow_logs)
```

> **Note**: Full HMAC-SHA256 signature verification requires a Code node with `crypto`. For production, replace this IF check with a Code node that calls `stripe.webhooks.constructEvent()`.

### 3. Extract Stripe Payload
```
node_name: transform_stripe_payload
type: Set
fields:
  subscriptionId: $json.body.data.object.id
  customerId: $json.body.data.object.customer
  priceId: $json.body.data.object.items.data[0].price.id
  status: $json.body.data.object.status
  trialEnd: $json.body.data.object.trial_end
  metaUserId: $json.body.data.object.metadata.userId
```

### 4. Map Price ID to Canonical Tier
```
node_name: transform_map_tier
type: Set (Code expression)
logic:
  if priceId == STRIPE_PRICE_ID_ARTIST_ICON → 'artist_icon'
  elif priceId == STRIPE_PRICE_ID_ARTIST_AMATEUR → 'artist_amateur'
  else → 'artist_free'
```

### 5. Fetch User from Supabase
```
node_name: api_supabase_fetch_user
type: HTTP Request
method: GET
url: SUPABASE_URL/rest/v1/users?stripeCustomerId=eq.{customerId}&select=id,email,name,subscriptionTier
fallback: if no result, try id=eq.{metaUserId}
error path → send_alert_admin + log_error_supabase
```

### 6. Check User Found
```
node_name: check_user_found
type: IF
condition: $json is array and length > 0
error path → log_error_user_not_found
```

### 7. Update User Tier
```
node_name: api_supabase_update_user_tier
type: HTTP Request
method: PATCH
url: SUPABASE_URL/rest/v1/users?id=eq.{userId}
body: { subscriptionTier, stripeSubscriptionId, updatedAt }
error path → send_alert_admin + log_error_supabase
```

### 8. Check if Founding Artist
```
node_name: check_is_founding_artist
type: IF
condition: trialEnd is not null AND tier == 'artist_icon'
true path → api_supabase_update_founding_flags
false path → continue to email
```

### 9. Update Founding Artist Flags (conditional)
```
node_name: api_supabase_update_founding_flags
type: HTTP Request
method: PATCH
url: SUPABASE_URL/rest/v1/artists?userId=eq.{userId}
body: { isFoundingArtist: true, foundingTrialEndsAt: trialEnd }
error path → send_alert_admin + log_error_supabase
```

### 10. Send Welcome Email
```
node_name: send_email_welcome_subscription
type: HTTP Request (Resend)
method: POST
to: user.email
subject: "Your Ink Connect subscription is live"
includes: tier name, profile link, unsubscribe link
```

### 11. Log Result
```
node_name: log_supabase_subscription_created
type: HTTP Request
method: POST
url: SUPABASE_URL/rest/v1/workflow_logs
body: { workflow, event, userId, tier, subscriptionId, createdAt }
```

## Error Handling

All HTTP nodes have `continueOnFail: true`. Error branches from each IF check:
- `send_alert_admin`: POST to Resend → ADMIN_ALERT_EMAIL
- `log_error_supabase`: POST to `workflow_logs` with error details

## Notes

- This workflow only updates `users.subscriptionTier` — never `artists.subscriptionTier` (deprecated)
- Founding artist detection: presence of `trial_end` + price matches `STRIPE_PRICE_ID_ARTIST_ICON`
- Idempotency: Supabase PATCH with `?id=eq.{userId}` is idempotent
- For `subscription.updated` events, use a separate workflow or add an event type check at the top
