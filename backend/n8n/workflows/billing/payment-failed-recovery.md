---
name: "Payment Failed Recovery"
description: "Handles Stripe invoice.payment_failed events. Sends escalating recovery emails based on attempt count. On the third failure, downgrades the artist to the free tier."
tags: ["billing", "stripe", "dunning", "recovery"]
---

# Payment Failed Recovery Workflow

## Overview

When a Stripe invoice payment fails, this workflow escalates the recovery process based on how many times payment has been attempted:

- **Attempt 1**: Soft "please update your card" email
- **Attempt 2**: Urgent second-chance email with prominent CTA
- **Attempt 3**: Downgrade user to `artist_free` in Supabase + send "subscription paused" email + admin alert

## Trigger

**Type**: Webhook (HTTP POST)  
**URL Pattern**: `https://n8n.example.com/webhook/stripe-payment-failed`  
**Authentication**: Stripe-Signature header

**Event**: `invoice.payment_failed`

**Relevant payload fields**:
```json
{
  "type": "invoice.payment_failed",
  "data": {
    "object": {
      "id": "in_xxx",
      "customer": "cus_xxx",
      "attempt_count": 1,
      "next_payment_attempt": 1716000000,
      "subscription": "sub_xxx",
      "amount_due": 2900,
      "currency": "usd"
    }
  }
}
```

## Required Environment Variables

```
STRIPE_WEBHOOK_SECRET    — Stripe webhook signing secret
SUPABASE_URL             — Supabase project URL
SUPABASE_SERVICE_KEY     — Supabase service role key
RESEND_API_KEY           — Resend API key
ADMIN_ALERT_EMAIL        — Admin alert destination
APP_BASE_URL             — e.g. https://inkconnect.app
```

## Workflow Steps

### 1. Webhook Trigger
```
node_name: trigger_webhook_payment_failed
type: Webhook
method: POST
path: /stripe-payment-failed
responseMode: onReceived
```

### 2. Validate Stripe Signature
```
node_name: check_stripe_signature
type: IF
condition: $json.headers['stripe-signature'] is not empty
error path → log_error_invalid_signature
```

### 3. Extract Payment Event Data
```
node_name: transform_payment_event
type: Set
fields:
  invoiceId: $json.body.data.object.id
  customerId: $json.body.data.object.customer
  attemptCount: $json.body.data.object.attempt_count
  nextPaymentAttempt: $json.body.data.object.next_payment_attempt
  subscriptionId: $json.body.data.object.subscription
  amountDue: $json.body.data.object.amount_due
  currency: $json.body.data.object.currency
```

### 4. Fetch User from Supabase
```
node_name: api_supabase_fetch_user
type: HTTP Request
method: GET
url: SUPABASE_URL/rest/v1/users?stripeCustomerId=eq.{customerId}&select=id,email,name,subscriptionTier
error path → send_alert_admin + log_error_supabase
```

### 5. Check User Found
```
node_name: check_user_found
type: IF
condition: result array length > 0
error path → log_error_user_not_found
```

### 6. Check Attempt Count — Attempt 1
```
node_name: check_attempt_1
type: IF
condition: attemptCount == 1
true → send_email_soft_retry
false → check_attempt_2
```

### 7. Send Attempt 1 Email (soft)
```
node_name: send_email_soft_retry
type: HTTP Request (Resend)
subject: "Payment issue with your Ink Connect subscription"
tone: helpful, non-alarming
CTA: "Update Payment Method" → APP_BASE_URL/dashboard?tab=billing
includes: unsubscribe link
```

### 8. Check Attempt Count — Attempt 2
```
node_name: check_attempt_2
type: IF
condition: attemptCount == 2
true → send_email_urgent_retry
false → check_attempt_3
```

### 9. Send Attempt 2 Email (urgent)
```
node_name: send_email_urgent_retry
type: HTTP Request (Resend)
subject: "Second payment failure — action required"
tone: urgent, clear consequence warning
CTA: "Fix Payment Now" → APP_BASE_URL/dashboard?tab=billing
includes: unsubscribe link
```

### 10. Check Attempt Count — Attempt 3+
```
node_name: check_attempt_3
type: IF
condition: attemptCount >= 3
true → api_supabase_downgrade_tier → send_email_subscription_paused → send_alert_admin_downgrade
false → log_supabase_unknown_attempt
```

### 11. Downgrade User to Free Tier
```
node_name: api_supabase_downgrade_tier
type: HTTP Request
method: PATCH
url: SUPABASE_URL/rest/v1/users?id=eq.{userId}
body: { subscriptionTier: 'artist_free', updatedAt: now() }
error path → send_alert_admin + log_error_supabase
```

### 12. Send Subscription Paused Email
```
node_name: send_email_subscription_paused
type: HTTP Request (Resend)
subject: "Your Ink Connect subscription has been paused"
tone: factual, path to reactivate
CTA: "Reactivate Subscription" → APP_BASE_URL/pricing
includes: what features are lost, unsubscribe link
```

### 13. Admin Downgrade Alert
```
node_name: send_alert_admin_downgrade
type: HTTP Request (Resend)
to: ADMIN_ALERT_EMAIL
subject: "Artist downgraded to free tier after payment failure"
body: userId, email, subscription ID, invoice ID
```

### 14. Log All Events
```
node_name: log_supabase_payment_event
type: HTTP Request
method: POST
url: SUPABASE_URL/rest/v1/workflow_logs
body: { workflow, event, customerId, userId, attemptCount, action, createdAt }
```

## Error Handling

All HTTP nodes have `continueOnFail: true`. IF error branches route to:
- `send_alert_admin`: Resend email to ADMIN_ALERT_EMAIL
- `log_error_supabase`: POST to `workflow_logs` with error context

## Notes

- Downgrade only updates `users.subscriptionTier` (canonical). `artists.subscriptionTier` is deprecated.
- Stripe's default dunning is 4 attempts over ~2 weeks. This workflow handles retries 1–3+.
- For subscription.deleted events (final cancellation), use a separate workflow.
- `nextPaymentAttempt` is a Unix timestamp — format with `new Date(nextPaymentAttempt * 1000).toLocaleDateString()` in email.
