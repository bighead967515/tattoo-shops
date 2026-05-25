---
name: "Review Flagged Notification"
description: "Webhook-triggered when a review is flagged by the moderation workflow. Notifies admin with review details. If toxicityScore > 70, also notifies the artist that the review was hidden."
tags: ["email", "moderation", "reviews", "notification", "webhook"]
---

# Review Flagged Notification Workflow

## Overview

After the review-safety-check workflow flags a review, this notification workflow handles downstream communication:

1. Receive webhook with flagged review details
2. Validate authentication
3. Fetch the artist's email from Supabase (via `artists.userId → users.email`)
4. Send detailed moderation alert to admin
5. If `toxicityScore > 70`: send a notification to the artist that a review was hidden
6. Log the event

## Trigger

**Type**: Webhook (HTTP POST)  
**URL Pattern**: `https://n8n.example.com/webhook/review-flagged`  
**Authentication**: Bearer token (`N8N_WEBHOOK_SECRET`)

**Payload**:
```json
{
  "reviewId": 88,
  "artistId": 7,
  "artistName": "Jordan Lee",
  "userId": 42,
  "rating": 1,
  "comment": "This artist is a complete fraud...",
  "toxicityScore": 85,
  "spamScore": 20,
  "moderationReason": "Highly toxic language detected"
}
```

**Backend integration**: Fire from review-safety-check n8n workflow after `moderationStatus = 'flagged'` is set, or from `moderation.updateReviewStatus` tRPC procedure.

## Required Environment Variables

```
N8N_WEBHOOK_SECRET       — Shared webhook auth token
SUPABASE_URL             — Supabase project URL
SUPABASE_SERVICE_KEY     — Supabase service role key
RESEND_API_KEY           — Resend API key
ADMIN_ALERT_EMAIL        — Admin moderation email
APP_BASE_URL             — e.g. https://inkconnect.app
```

## Workflow Steps

### 1. Webhook Trigger
```
node_name: trigger_webhook_review_flagged
type: Webhook
method: POST
path: /review-flagged
responseMode: responseNode
```

### 2. Validate Auth
```
node_name: check_auth_header
type: IF
condition: headers.authorization == 'Bearer ' + N8N_WEBHOOK_SECRET
false → send_response_401
```

### 3. Send Acknowledgment
```
node_name: send_response_ok
type: Respond to Webhook
responseCode: 200
body: { received: true }
```

### 4. Fetch Artist Email
```
node_name: api_supabase_fetch_artist
type: HTTP Request
method: GET
url: SUPABASE_URL/rest/v1/artists?id=eq.{artistId}&select=userId
headers: Authorization + apikey
error path → send_alert_admin_fallback + log_error
```
_(Follow up with users fetch using the userId from artist record)_

```
node_name: api_supabase_fetch_artist_email
type: HTTP Request
method: GET
url: SUPABASE_URL/rest/v1/users?id=eq.{artist.userId}&select=email,name
error path → log_error_no_email
```

### 5. Send Admin Alert Email
```
node_name: send_email_admin_flagged
type: HTTP Request (Resend)
to: ADMIN_ALERT_EMAIL
subject: "[Flagged Review] Artist: {artistName} — Toxicity: {toxicityScore}, Spam: {spamScore}"
body:
  - Review ID + Artist ID
  - Star rating
  - Full comment text
  - Toxicity score + Spam score
  - Moderation reason from Groq
  - Reviewer user ID
  - Link to admin/moderation dashboard
```

### 6. Check if High Toxicity (> 70)
```
node_name: check_high_toxicity
type: IF
condition: toxicityScore > 70
true → send_email_artist_review_hidden
false → log_supabase_notification
```

### 7. Send Artist Notification (High Toxicity Only)
```
node_name: send_email_artist_review_hidden
type: HTTP Request (Resend)
to: artist.email
subject: "A review on your profile was hidden"
body:
  - "We detected a review on your profile that violated our community guidelines."
  - "The review has been hidden pending admin review."
  - "No action is required from you."
  - "If you have questions, contact support."
  - Unsubscribe link
```

### 8. Log Event
```
node_name: log_supabase_notification
type: HTTP Request
method: POST
url: SUPABASE_URL/rest/v1/workflow_logs
body: { workflow, reviewId, artistId, toxicityScore, spamScore, artistNotified: boolean, createdAt }
```

## Email Templates

### Admin Alert (always sent)
- **From**: `Ink Connect Moderation <moderation@inkconnect.app>`
- **Subject**: `[Flagged Review] Artist: {artistName} — Toxicity: {toxicityScore}`
- **Body**: Full review context with action link

### Artist Hidden Notification (toxicityScore > 70 only)
- **From**: `Ink Connect Team <hello@inkconnect.app>`
- **Subject**: `A review on your profile was hidden`
- **Tone**: Neutral, reassuring, no alarm
- **Footer**: Unsubscribe link required

## Error Handling

- Auth failure: 401 response
- Artist email fetch failure: send admin alert with fallback (no artist email), log error
- Email send failure: log error, continue
- All HTTP nodes have `continueOnFail: true`

## Notes

- The artist is NOT told which review was hidden (protects reviewer anonymity)
- Do NOT reveal toxicityScore to the artist
- This workflow fires AFTER moderation state is already set in the DB
- Admin moderation dashboard: `APP_BASE_URL/admin/moderation`
