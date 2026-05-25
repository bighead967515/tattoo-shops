---
name: "Review Safety Check"
description: "Webhook-triggered after a review is submitted. Sends the review comment to Groq for toxicity and spam scoring. Updates the reviews table with scores and moderation status. Alerts admin if flagged."
tags: ["moderation", "ai", "groq", "reviews", "webhook"]
---

# Review Safety Check Workflow

## Overview

When a client submits a review for an artist, this workflow runs automatic AI-powered moderation to catch toxic, spammy, or fraudulent reviews before they go live.

Steps:
1. Receive webhook from `reviews.create` tRPC procedure
2. Validate authentication
3. POST comment to Groq for analysis (toxicity + spam scores, approval verdict)
4. Parse JSON response from Groq
5. Update `reviews` table with scores, moderation status, and flags
6. If flagged: send email alert to admin
7. Return result in webhook response

## Trigger

**Type**: Webhook (HTTP POST)  
**URL Pattern**: `https://n8n.example.com/webhook/review-safety-check`  
**Authentication**: Bearer token (`N8N_WEBHOOK_SECRET`)

**Payload**:
```json
{
  "reviewId": 88,
  "artistId": 7,
  "userId": 42,
  "rating": 2,
  "comment": "This artist was terrible and a total scam..."
}
```

**Backend integration**: Fire from `reviews.create` tRPC mutation after DB insert.

## Required Environment Variables

```
N8N_WEBHOOK_SECRET       — Shared webhook auth token
GROQ_API_KEY             — Groq API key
SUPABASE_URL             — Supabase project URL
SUPABASE_SERVICE_KEY     — Supabase service role key
RESEND_API_KEY           — Resend API key
ADMIN_ALERT_EMAIL        — Admin moderation email
APP_BASE_URL             — e.g. https://inkconnect.app
```

## Workflow Steps

### 1. Webhook Trigger
```
node_name: trigger_webhook_review
type: Webhook
method: POST
path: /review-safety-check
responseMode: responseNode
```

### 2. Validate Auth
```
node_name: check_auth_header
type: IF
condition: headers.authorization == 'Bearer ' + N8N_WEBHOOK_SECRET
false → send_response_401
```

### 3. Call Groq for Moderation Analysis
```
node_name: api_groq_analyze_review
type: HTTP Request
method: POST
url: https://api.groq.com/openai/v1/chat/completions
headers:
  Authorization: Bearer GROQ_API_KEY
  Content-Type: application/json
body:
  model: llama3-70b-8192
  messages:
    - system: "You are a content moderation system. Analyze the review and respond ONLY with valid JSON."
    - user: "Analyze this review comment for a tattoo artist marketplace. Return a JSON object with:
              - toxicityScore (0-100): how harmful/toxic/threatening the language is
              - spamScore (0-100): how likely it is to be spam, fake, or promotional
              - isApproved (boolean): true if both scores are under 30
              - reason (string): brief explanation (max 1 sentence)
              
              Review comment: \"{comment}\"
              Star rating: {rating}/5"
  max_tokens: 200
  temperature: 0.1
error path → send_response_500 + send_alert_admin + log_error
```

### 4. Parse Groq JSON Response
```
node_name: transform_parse_scores
type: Code
logic:
  extract choices[0].message.content
  JSON.parse() the content
  output: { toxicityScore, spamScore, isApproved, reason }
  fallback if parse fails: { toxicityScore: 50, spamScore: 50, isApproved: false, reason: 'parse_error' }
```

### 5. Determine Moderation Status
```
node_name: transform_moderation_status
type: Set
fields:
  moderationStatus: isApproved ? 'approved' : 'flagged'
  moderationFlags: JSON.stringify({ toxicityScore, spamScore, reason })
  moderatedAt: now()
```

### 6. Update Review in Supabase
```
node_name: api_supabase_update_review
type: HTTP Request
method: PATCH
url: SUPABASE_URL/rest/v1/reviews?id=eq.{reviewId}
body: { toxicityScore, spamScore, moderationStatus, moderationFlags, moderatedAt }
error path → send_alert_admin + log_error
```

### 7. Check if Flagged
```
node_name: check_review_flagged
type: IF
condition: moderationStatus == 'flagged'
true → send_email_admin_flagged_review
false → log + respond_ok
```

### 8. Send Admin Alert for Flagged Reviews
```
node_name: send_email_admin_flagged_review
type: HTTP Request (Resend)
to: ADMIN_ALERT_EMAIL
subject: "[Flagged Review] Artist #{artistId} — Toxicity: {toxicityScore}, Spam: {spamScore}"
body: full review details, scores, Groq reason, link to admin/moderation
```

### 9. Return Result
```
node_name: send_response_result
type: Respond to Webhook
responseCode: 200
body: { reviewId, moderationStatus, toxicityScore, spamScore, isApproved }
```

### 10. Log Result
```
node_name: log_supabase_moderation
type: HTTP Request
method: POST
url: SUPABASE_URL/rest/v1/workflow_logs
body: { workflow, reviewId, artistId, moderationStatus, toxicityScore, spamScore, createdAt }
```

## Scoring Thresholds

| Score Range | Meaning |
|-------------|---------|
| 0–29 | Clean — auto-approved |
| 30–69 | Borderline — flagged for human review |
| 70–100 | High risk — flagged + admin alerted immediately |

Both toxicity AND spam must be < 30 for `isApproved: true`.

## Error Handling

- Auth failure: 401 response
- Groq failure: 500 response + admin alert + review remains in `pending` state
- Supabase update failure: alert admin (review stays unmoderated)
- All HTTP nodes have `continueOnFail: true`

## Notes

- Reviews remain in DB regardless of moderation outcome — only `moderationStatus` changes
- `moderationStatus: 'pending'` is the initial state set by the tRPC procedure
- This workflow runs async relative to the user's review submission
- For high-volume cases, consider upgrading to a dedicated moderation service
