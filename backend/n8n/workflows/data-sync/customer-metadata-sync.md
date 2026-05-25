---
name: "Customer Metadata Sync"
description: "Webhook-triggered on user profile updates. Syncs user email/name to Stripe customer records. Creates a new Stripe customer if none exists and saves the ID back to Supabase."
tags: ["data-sync", "stripe", "supabase", "webhook"]
---

# Customer Metadata Sync Workflow

## Overview

When a user updates their profile (name or email), this workflow ensures Stripe's customer record stays in sync. It also handles users who don't yet have a Stripe customer ID — searching Stripe by email first, then creating if not found.

Steps:
1. Webhook trigger on user profile update
2. Validate auth
3. If `stripeCustomerId` present: PATCH Stripe customer with new email/name
4. If no `stripeCustomerId`: search Stripe for customer by email
   - Found: save the ID back to Supabase
   - Not found: create new Stripe customer, save ID to Supabase
5. Log result

## Trigger

**Type**: Webhook (HTTP POST)  
**URL Pattern**: `https://n8n.example.com/webhook/customer-metadata-sync`  
**Authentication**: Bearer token (`N8N_WEBHOOK_SECRET`)

**Payload**:
```json
{
  "userId": 15,
  "email": "artist@example.com",
  "name": "Jordan Lee",
  "stripeCustomerId": "cus_xxx"
}
```

**Backend integration**: Fire this webhook from `artists.update` and `clients.updateProfile` tRPC procedures after successful DB updates.

## Required Environment Variables

```
N8N_WEBHOOK_SECRET       — Shared webhook auth token
STRIPE_API_KEY           — Stripe secret key
SUPABASE_URL             — Supabase project URL
SUPABASE_SERVICE_KEY     — Supabase service role key
```

## Workflow Steps

### 1. Webhook Trigger
```
node_name: trigger_webhook_profile_update
type: Webhook
method: POST
path: /customer-metadata-sync
responseMode: responseNode
```

### 2. Validate Auth
```
node_name: check_auth_header
type: IF
condition: headers.authorization == 'Bearer ' + N8N_WEBHOOK_SECRET
false → send_response_401
```

### 3. Send Acknowledgment Response
```
node_name: send_response_ok
type: Respond to Webhook
responseCode: 200
body: { received: true }
```
_(Fires immediately so the calling service isn't blocked)_

### 4. Check if Stripe Customer ID Exists
```
node_name: check_has_stripe_customer
type: IF
condition: stripeCustomerId is not empty
true → api_stripe_update_customer
false → api_stripe_search_customer
```

### 5a. Update Existing Stripe Customer
```
node_name: api_stripe_update_customer
type: HTTP Request
method: POST
url: https://api.stripe.com/v1/customers/{stripeCustomerId}
headers:
  Authorization: Bearer STRIPE_API_KEY
  Content-Type: application/x-www-form-urlencoded
body: email={email}&name={name}
error path → send_alert_admin + log_error
```

### 5b. Search Stripe for Customer by Email
```
node_name: api_stripe_search_customer
type: HTTP Request
method: GET
url: https://api.stripe.com/v1/customers/search?query=email:'{email}'&limit=1
headers:
  Authorization: Bearer STRIPE_API_KEY
error path → send_alert_admin + log_error
```

### 6. Check if Customer Found in Search
```
node_name: check_customer_found
type: IF
condition: $json.data.length > 0
true → transform_extract_customer_id → api_supabase_save_stripe_id
false → api_stripe_create_customer
```

### 7. Create New Stripe Customer
```
node_name: api_stripe_create_customer
type: HTTP Request
method: POST
url: https://api.stripe.com/v1/customers
headers:
  Authorization: Bearer STRIPE_API_KEY
  Content-Type: application/x-www-form-urlencoded
body: email={email}&name={name}&metadata[userId]={userId}
error path → send_alert_admin + log_error
```

### 8. Save Stripe Customer ID to Supabase
```
node_name: api_supabase_save_stripe_id
type: HTTP Request
method: PATCH
url: SUPABASE_URL/rest/v1/users?id=eq.{userId}
body: { stripeCustomerId: newCustomerId, updatedAt: now() }
error path → send_alert_admin + log_error
```

### 9. Log Result
```
node_name: log_supabase_sync_result
type: HTTP Request
method: POST
url: SUPABASE_URL/rest/v1/workflow_logs
body: { workflow, event, userId, stripeCustomerId, action: 'updated|created|found', createdAt }
```

## Error Handling

- Invalid auth: immediate 401 response
- Stripe API failures: alert admin + log, but don't fail silently
- Supabase save failure: alert admin — critical, as this would cause future desync
- All HTTP nodes have `continueOnFail: true`

## Notes

- Stripe's customer search API (`/v1/customers/search`) may have slight latency — allow up to 10s
- Stripe customer update uses `application/x-www-form-urlencoded`, not JSON
- Email changes in Stripe don't affect existing invoices, only future ones
- The `metadata[userId]` on new customers helps with fallback user lookup in other workflows
- Fire-and-forget pattern: webhook responds 200 immediately, sync happens async
