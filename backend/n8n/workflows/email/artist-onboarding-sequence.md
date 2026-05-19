---
name: "Artist Onboarding 6-Email Sequence"
description: "Drip email sequence sent to new artists over 14 days. Triggered by webhook when a new artist profile is created."
tags: ["email", "artist", "onboarding", "lifecycle"]
---

# Artist Onboarding Sequence Workflow

## Overview

Sends 6 emails over 14 days to move a new artist from signup to their first bid placed.

| # | Delay | Subject |
|---|-------|---------|
| 1 | Immediately | You're in. Here's what to do first. |
| 2 | Day 2 | Clients are looking at your profile right now |
| 3 | Day 4 | 8 open requests match your style |
| 4 | Day 7 | What happens after you send a bid |
| 5 | Day 10 | Your Founding Artist perks expire in 4 days |
| 6 | Day 14 | One step away from going live |

## Trigger

**Type**: Webhook (HTTP POST)  
**URL Pattern**: `https://n8n.example.com/webhook/artist-onboarding`  
**Authentication**: Bearer token (`N8N_WEBHOOK_SECRET` env var)

**Payload** (sent from `artists.create` tRPC procedure after insert):
```json
{
  "artistId": 123,
  "userId": 456,
  "email": "artist@example.com",
  "firstName": "Jordan",
  "shopName": "Dark Matter Tattoo",
  "isFoundingArtist": false
}
```

**Backend hook location**: `backend/server/routers.ts` → `artists.create` mutation — add a fire-and-forget `fetch` to the n8n webhook URL after the DB insert succeeds.

```typescript
// Add after the artists.create DB insert (non-blocking):
if (ENV.n8nOnboardingWebhookUrl) {
  fetch(ENV.n8nOnboardingWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.n8nWebhookSecret}`,
    },
    body: JSON.stringify({
      artistId: newArtist.id,
      userId: ctx.user.id,
      email: ctx.user.email,
      firstName: ctx.user.name?.split(" ")[0] ?? "there",
      shopName: input.shopName,
      isFoundingArtist: false,
    }),
  }).catch(() => {}); // Never block the response
}
```

## Required Environment Variables

```
N8N_WEBHOOK_SECRET       — shared secret for webhook auth
SUPABASE_URL             — Supabase project URL
SUPABASE_SERVICE_KEY     — Supabase service role key
RESEND_API_KEY           — Resend API key
```

## Workflow Steps

### 1. Webhook Trigger
```
node_name: trigger_webhook_onboarding
type: Webhook
method: POST
path: /artist-onboarding
authentication: headerAuth (Authorization: Bearer {{ $env.N8N_WEBHOOK_SECRET }})
```

**Validate payload**:
```javascript
// Code node: validate_payload
const required = ["artistId", "userId", "email", "firstName", "shopName"];
for (const field of required) {
  if (!$json[field]) throw new Error(`Missing required field: ${field}`);
}
return $json;
```

### 2. Check Unsubscribe Status
```
node_name: api_supabase_fetch_user
type: HTTP Request (Supabase REST)
method: GET
url: {{ $env.SUPABASE_URL }}/rest/v1/users?id=eq.{{ $json.userId }}&select=email,emailOptOut
headers:
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_KEY }}
  apikey: {{ $env.SUPABASE_SERVICE_KEY }}
```

**IF** `emailOptOut === true` → stop workflow.

### 3. Email 1 — Immediate (Welcome)
```
node_name: send_email_artist_welcome
type: HTTP Request (Resend)
method: POST
url: https://api.resend.com/emails
headers:
  Authorization: Bearer {{ $env.RESEND_API_KEY }}
body:
  from: "The Ink Connect Team <hello@inkconnect.app>"
  to: {{ $json.email }}
  subject: "You're in. Here's what to do first."
  html: |
    <p>Hey {{ $json.firstName }},</p>
    <p>Welcome to Ink Connect. Your artist profile for <strong>{{ $json.shopName }}</strong> is live.</p>
    <p>Takes about 2 minutes to complete your profile — that's what clients see first before they reach out.</p>
    <p><a href="https://inkconnect.app/artist-dashboard">Complete Your Profile →</a></p>
    <p>— The Ink Connect Team</p>
    <p style="font-size:12px;color:#666;">If you no longer wish to receive these emails, unsubscribe here: <a href="{{ $env.PUBLIC_BASE_URL || 'https://inkconnect.app' }}/unsubscribe?email={{ $json.email }}">Unsubscribe</a></p>
```

### 4. Wait 2 Days
```
node_name: wait_day_2
type: Wait
amount: 2
unit: days
```

### 5. Check Unsubscribe (pre-email 2)
```
node_name: api_supabase_fetch_user_2
(same as step 2 — re-fetch to catch opt-outs between emails)
```

### 6. Email 2 — Day 2 (Profile is Your Storefront)
```
node_name: send_email_artist_profile
type: HTTP Request (Resend)
body:
  subject: "Clients are looking at your profile right now"
  html: |
    <p>Hey {{ $json.firstName }},</p>
    <p>Clients on Ink Connect browse profiles before they post requests. A complete profile — bio, portfolio images, your style — gets 3× more contact attempts than an empty one.</p>
    <p>A few things worth adding today:</p>
    <ul>
      <li>At least 3 portfolio photos</li>
      <li>Your specialties and styles</li>
      <li>Your city so local clients can find you</li>
    </ul>
    <p><a href="https://inkconnect.app/requests">Browse Open Requests →</a></p>
    <p>— The Ink Connect Team</p>
    <p style="font-size:12px;color:#666;">If you no longer wish to receive these emails, unsubscribe here: <a href="{{ $env.PUBLIC_BASE_URL || 'https://inkconnect.app' }}/unsubscribe?email={{ $json.email }}">Unsubscribe</a></p>
```

### 7. Wait 2 Days
```
node_name: wait_day_4
type: Wait
amount: 2
unit: days
```

### 8. Email 3 — Day 4 (Open Requests)
```
node_name: send_email_artist_requests
type: HTTP Request (Resend)
body:
  subject: "8 open requests match your style"
  html: |
    <p>Hey {{ $json.firstName }},</p>
    <p>There are clients on Ink Connect right now posting requests for exactly the kind of work you do. They describe what they want, you send a bid — no cold outreach, no guessing.</p>
    <p><a href="https://inkconnect.app/requests">Update My Profile →</a></p>
    <p>— The Ink Connect Team</p>
    <p style="font-size:12px;color:#666;">If you no longer wish to receive these emails, unsubscribe here: <a href="{{ $env.PUBLIC_BASE_URL || 'https://inkconnect.app' }}/unsubscribe?email={{ $json.email }}">Unsubscribe</a></p>
```

### 9. Wait 3 Days
```
node_name: wait_day_7
type: Wait
amount: 3
unit: days
```

### 10. Email 4 — Day 7 (How Bidding Works)
```
node_name: send_email_artist_bidding
type: HTTP Request (Resend)
body:
  subject: "What happens after you send a bid"
  html: |
    <p>Hey {{ $json.firstName }},</p>
    <p>Here's how it works when you bid on a request:</p>
    <ol>
      <li>You send a price estimate and a note about your approach</li>
      <li>The client reviews all bids and picks one</li>
      <li>If they pick yours, you get their contact info and set up the appointment</li>
      <li>Deposit handled through the platform — no awkward conversations about money</li>
    </ol>
    <p><a href="https://inkconnect.app/artist/settings/notifications">Set Up Notifications →</a></p>
    <p>— The Ink Connect Team</p>
    <p style="font-size:12px;color:#666;">If you no longer wish to receive these emails, unsubscribe here: <a href="{{ $env.PUBLIC_BASE_URL || 'https://inkconnect.app' }}/unsubscribe?email={{ $json.email }}">Unsubscribe</a></p>
```

### 11. Wait 3 Days
```
node_name: wait_day_10
type: Wait
amount: 3
unit: days
```

### 12. Email 5 — Day 10 (Founding Artist Urgency)
```
node_name: send_email_artist_founding
type: HTTP Request (Resend)
body:
  subject: "Your Founding Artist perks expire in 4 days"
  html: |
    <p>Hey {{ $json.firstName }},</p>
    <p>The Founding Artist offer closes soon. 14 spots left.</p>
    <p>What you get: 6 months free, then $19/mo locked in for life — that's 35% less than the standard rate, forever, because you joined early.</p>
    <p>After this offer closes, it's gone. No exceptions.</p>
    <p><a href="https://inkconnect.app/for-artists">Claim My Founding Spot →</a></p>
    <p>— The Ink Connect Team</p>
    <p style="font-size:12px;color:#666;">If you no longer wish to receive these emails, unsubscribe here: <a href="{{ $env.PUBLIC_BASE_URL || 'https://inkconnect.app' }}/unsubscribe?email={{ $json.email }}">Unsubscribe</a></p>
```

### 13. Wait 4 Days
```
node_name: wait_day_14
type: Wait
amount: 4
unit: days
```

### 14. Email 6 — Day 14 (Final Activation Push)
```
node_name: send_email_artist_final
type: HTTP Request (Resend)
from: "Maya, Ink Connect <maya@inkconnect.app>"
body:
  subject: "One step away from going live"
  html: |
    <p>Hey {{ $json.firstName }},</p>
    <p>Your profile is set up. Open requests are waiting. The only thing left is placing your first bid.</p>
    <p>It takes 2 minutes. There's no commitment — just tell a client what you'd charge and why you're the right fit.</p>
    <p><a href="https://inkconnect.app/requests">Browse Open Requests Now →</a></p>
    <p>Maya<br>Ink Connect</p>
    <p style="font-size:12px;color:#666;">If you no longer wish to receive these emails, unsubscribe here: <a href="{{ $env.PUBLIC_BASE_URL || 'https://inkconnect.app' }}/unsubscribe?email={{ $json.email }}">Unsubscribe</a></p>
```

### 15. Log Completion
```
node_name: db_log_onboarding_complete
type: HTTP Request (Supabase REST)
method: POST
url: {{ $env.SUPABASE_URL }}/rest/v1/onboarding_events
body:
  userId: {{ $json.userId }}
  event: "onboarding_sequence_complete"
  completedAt: {{ new Date().toISOString() }}
```

> **Note**: This assumes an `onboarding_events` table or similar audit log. If not present, skip this step or replace with a console log node.

## Error Handling

- Wrap each external call (Supabase fetch + Resend send) in try/catch blocks.
- Use exponential backoff for transient failures: 1s, 2s, 4s, 8s (max 3 retries).
- Log structured failures to Supabase `errorLogs` with `artistId`, `step`, `error.code`, `error.message`, `timestamp`.
- On critical 4xx/auth/validation errors OR retries exhausted, post alert to `#n8n-errors` Slack channel.
- Keep unsubscribe checks before each email send step to preserve compliance.
- Ensure idempotency remains intact by checking `started_sequences` before beginning the sequence.

## Idempotency

- De-duplicate by `artistId`: if a webhook fires twice for the same artist, check a `started_sequences` set in n8n static data before starting the sequence
- Use n8n workflow's built-in deduplication on `artistId` key

## Testing

1. POST test payload to webhook URL with a test artist
2. Verify email 1 arrives immediately
3. Use n8n's "wait node test mode" to skip delays and fire all 6 emails in sequence
4. Check Resend dashboard for delivery status on each

## Import-ready n8n JSON (skeleton)

Use this as an import-safe baseline with the renamed nodes wired in sequence.

```json
{
  "name": "Artist Onboarding 6-Email Sequence",
  "nodes": [
    { "name": "trigger_webhook_onboarding", "type": "n8n-nodes-base.webhook", "typeVersion": 2, "parameters": { "path": "artist-onboarding", "httpMethod": "POST" }, "position": [220, 260] },
    { "name": "api_supabase_fetch_user", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [460, 260] },
    { "name": "send_email_artist_welcome", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [700, 260] },
    { "name": "wait_day_2", "type": "n8n-nodes-base.wait", "typeVersion": 1, "position": [940, 260] },
    { "name": "api_supabase_fetch_user_2", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [1180, 260] },
    { "name": "send_email_artist_profile", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [1420, 260] },
    { "name": "send_email_artist_requests", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [1660, 260] },
    { "name": "send_email_artist_bidding", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [1900, 260] },
    { "name": "send_email_artist_founding", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [2140, 260] },
    { "name": "send_email_artist_final", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [2380, 260] }
  ],
  "connections": {
    "trigger_webhook_onboarding": { "main": [[{ "node": "api_supabase_fetch_user", "type": "main", "index": 0 }]] },
    "api_supabase_fetch_user": { "main": [[{ "node": "send_email_artist_welcome", "type": "main", "index": 0 }]] },
    "send_email_artist_welcome": { "main": [[{ "node": "wait_day_2", "type": "main", "index": 0 }]] },
    "wait_day_2": { "main": [[{ "node": "api_supabase_fetch_user_2", "type": "main", "index": 0 }]] },
    "api_supabase_fetch_user_2": { "main": [[{ "node": "send_email_artist_profile", "type": "main", "index": 0 }]] }
  }
}
```

## A/B Test Ideas

| Email | Control Subject | Variant Subject |
|-------|-----------------|-----------------|
| 1 | You're in. Here's what to do first. | Your Ink Connect profile is ready. |
| 2 | Clients are looking at your profile right now | What clients see before they contact an artist |
| 5 | Your Founding Artist perks expire in 4 days | 14 spots left — Founding Artist pricing closes soon |
