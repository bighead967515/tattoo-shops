---
name: "Artist Approval Notification"
description: "Sends email notification when admin approves or rejects an artist profile. Triggered via webhook from backend adminSetApproval mutation."
tags: ["email", "artist", "approval", "moderation"]
---

# Artist Approval Notification Workflow (P1-3)

## Overview

This n8n workflow:
1. **Listens** for artist approval/rejection webhook from backend
2. **Fetches** artist profile and user email from Supabase
3. **Composes** approval or rejection email
4. **Sends** via Resend email service
5. **Logs** notification status back to Supabase

## Trigger

**Type**: Webhook (HTTP POST)  
**URL Pattern**: `https://n8n.example.com/webhook/artist-approval`  
**Authentication**: Bearer token (n8n webhook secret)

**Payload**:
```json
{
  "artistId": 123,
  "approved": true,
  "rejectionReason": "Missing business license" // optional
}
```

## Workflow Steps

### 1. Webhook Trigger
```
node_name: trigger_webhook_artist_approval
type: Webhook
method: POST
path: /artist-approval
```

### 2. Fetch Artist Profile
```
node_name: api_supabase_fetch_artist
type: Supabase REST API
method: GET
url: https://{{ $env.SUPABASE_URL }}/rest/v1/artists?id=eq.{{ $json.payload.artistId }}&select=*
headers:
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_KEY }}
```

**Output expected**:
```json
{
  "id": 123,
  "userId": 456,
  "shopName": "Ink Collective",
  "isApproved": true,
  "createdAt": "2026-05-13T10:00:00Z"
}
```

### 3. Fetch User Email
```
node_name: api_supabase_fetch_user
type: Supabase REST API
method: GET
url: https://{{ $env.SUPABASE_URL }}/rest/v1/users?id=eq.{{ $json[0].userId }}&select=email,name
headers:
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_KEY }}
```

**Output expected**:
```json
{
  "email": "artist@example.com",
  "name": "John Smith"
}
```

### 4. Compose Email (IF Approved)
```
node_name: compose_email_approved
type: Code
condition: {{ $json[0].approved === true }}

code:
  subject = "Your Artist Profile is Now Live 🎨"
  htmlBody = `
    <h2>Welcome to Ink Connect, {{ $json[0].name }}!</h2>
    <p>Great news! Your artist profile for <strong>{{ $json[1].shopName }}</strong> has been approved and is now visible to clients.</p>
    
    <h3>Next Steps:</h3>
    <ul>
      <li>Browse and respond to tattoo requests on your dashboard</li>
      <li>Manage your subscription and portfolio images</li>
      <li>Track your bookings and earnings</li>
    </ul>
    
    <p>
      <a href="{{ $env.PUBLIC_BASE_URL }}/artist-dashboard" style="background-color: #000; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Go to Dashboard</a>
    </p>
    
    <p>Questions? <a href="https://support.inkconnect.co">Contact support</a></p>
    <hr>
    <p style="font-size:12px;color:#666;">
      If you no longer wish to receive these emails, <a href="{{ $env.PUBLIC_BASE_URL }}/unsubscribe?email={{ $json[0].email }}">Unsubscribe</a>.
    </p>
  `
  return { subject, htmlBody }
```

### 5. Compose Email (IF Rejected)
```
node_name: compose_email_rejected
type: Code
condition: {{ $json[0].approved === false }}

code:
  subject = "Artist Profile Review Status"
  htmlBody = `
    <h2>Hello {{ $json[0].name }},</h2>
    <p>Thank you for applying to Ink Connect. After reviewing your profile, we're unable to approve it at this time.</p>
    
    <p><strong>Reason:</strong> {{ $json.payload.rejectionReason || "Profile does not meet our guidelines" }}</p>
    
    <p>You may reapply once you've addressed these concerns. For assistance, <a href="https://support.inkconnect.co">contact our support team</a>.</p>
    <hr>
    <p style="font-size:12px;color:#666;">
      If you no longer wish to receive these emails, <a href="{{ $env.PUBLIC_BASE_URL }}/unsubscribe?email={{ $json[0].email }}">Unsubscribe</a>.
    </p>
  `
  return { subject, htmlBody }
```

### 6. Send Email
```
node_name: send_email_artist
type: HTTP Request
method: POST
url: https://api.resend.com/emails

headers:
  Authorization: Bearer {{ $env.RESEND_API_KEY }}
  Content-Type: application/json

body:
  {
    "from": "Ink Connect <noreply@inkconnect.co>",
    "to": "{{ $json[0].email }}",
    "subject": "{{ $json[1].subject }}",
    "html": "{{ $json[1].htmlBody }}",
    "reply_to": "support@inkconnect.co"
  }
```

**Expected response**:
```json
{
  "id": "email_1234567890",
  "from": "noreply@inkconnect.co",
  "to": "artist@example.com",
  "created_at": "2026-05-13T14:30:00Z"
}
```

### 7. Log Notification (Success)
```
node_name: db_log_notification
type: Supabase REST API
method: PATCH
url: https://{{ $env.SUPABASE_URL }}/rest/v1/artists?id=eq.{{ $json.payload.artistId }}

headers:
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_KEY }}

body:
{
  "approvalNotificationSentAt": "now()",
  "approvalNotificationStatus": "sent"
}
```

### 8. Error Handler
```
node_name: error_handle_approval
type: Code + Conditional
catch: true

conditions:
  - wrap external calls in try/catch (Supabase REST + Resend + Slack)
  - apply exponential backoff for transient failures: 1s, 2s, 4s, 8s (max 3 retries)
  - normalize all failures to:
    {
      "success": false,
      "error": {
        "code": "EXTERNAL_API_ERROR",
        "message": "...",
        "statusCode": 500,
        "context": {
          "workflow": "Artist Approval Notification",
          "node": "error_handle_approval",
          "artistId": {{ $json.payload.artistId }},
          "attempt": 3,
          "timestamp": "{{ new Date().toISOString() }}"
        }
      }
    }
  - log success path for each external call for traceability
  - if critical (4xx/auth/validation) OR retries exhausted:
    → log_error node
    → send_alert_email (Slack alert to #n8n-errors)
    → return error response
```

**Error logging**:
```
node_name: log_error
type: Supabase REST API
method: POST
url: https://{{ $env.SUPABASE_URL }}/rest/v1/errorLogs

body:
{
  "workflowName": "Artist Approval Notification",
  "eventType": "artist_approval_email_failed",
  "artistId": {{ $json.payload.artistId }},
  "success": false,
  "error": {
    "code": "{{ $json.error.code }}",
    "message": "{{ $json.error.message }}",
    "statusCode": {{ $json.error.statusCode }},
    "context": {{ $json.error.context }}
  },
  "timestamp": "now()",
  "severity": "error"
}
```

## Environment Variables Required

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...
RESEND_API_KEY=re_xxx
PUBLIC_BASE_URL=https://inkconnect.co
N8N_WEBHOOK_SECRET=your-secret-key-here
```

## Testing

### Test Approval Flow
```bash
curl -X POST http://localhost:5678/webhook/artist-approval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -d '{
    "artistId": 123,
    "approved": true
  }'
```

Expected response:
```json
{
  "success": true,
  "emailId": "email_1234567890",
  "artistId": 123,
  "message": "Approval notification sent"
}
```

### Test Rejection Flow
```bash
curl -X POST http://localhost:5678/webhook/artist-approval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -d '{
    "artistId": 124,
    "approved": false,
    "rejectionReason": "Missing valid business license"
  }'
```

## Import-ready n8n JSON (skeleton)

Use this as a copy-paste-safe base in n8n. It reflects the renamed node ids and connections.

```json
{
  "name": "Artist Approval Notification",
  "nodes": [
    { "name": "trigger_webhook_artist_approval", "type": "n8n-nodes-base.webhook", "typeVersion": 2, "parameters": { "path": "artist-approval", "httpMethod": "POST" }, "position": [240, 300] },
    { "name": "api_supabase_fetch_artist", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "parameters": { "method": "GET", "url": "={{ $env.SUPABASE_URL + '/rest/v1/artists?id=eq.' + $json.body.artistId + '&select=*' }}" }, "position": [500, 300] },
    { "name": "api_supabase_fetch_user", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "parameters": { "method": "GET", "url": "={{ $env.SUPABASE_URL + '/rest/v1/users?id=eq.' + $json[0].userId + '&select=email,name' }}" }, "position": [760, 300] },
    { "name": "send_email_artist", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "parameters": { "method": "POST", "url": "https://api.resend.com/emails" }, "position": [1020, 300] },
    { "name": "db_log_notification", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "parameters": { "method": "PATCH", "url": "={{ $env.SUPABASE_URL + '/rest/v1/artists?id=eq.' + $json.body.artistId }}" }, "position": [1280, 300] },
    { "name": "error_handle_approval", "type": "n8n-nodes-base.code", "typeVersion": 2, "parameters": { "jsCode": "return items;" }, "position": [1020, 520] },
    { "name": "log_error", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "parameters": { "method": "POST", "url": "={{ $env.SUPABASE_URL + '/rest/v1/errorLogs' }}" }, "position": [1280, 520] },
    { "name": "send_alert_email", "type": "n8n-nodes-base.slack", "typeVersion": 2, "parameters": { "channel": "#n8n-errors" }, "position": [1540, 520] }
  ],
  "connections": {
    "trigger_webhook_artist_approval": { "main": [[{ "node": "api_supabase_fetch_artist", "type": "main", "index": 0 }]] },
    "api_supabase_fetch_artist": { "main": [[{ "node": "api_supabase_fetch_user", "type": "main", "index": 0 }]] },
    "api_supabase_fetch_user": { "main": [[{ "node": "send_email_artist", "type": "main", "index": 0 }]] },
    "send_email_artist": { "main": [[{ "node": "db_log_notification", "type": "main", "index": 0 }], [{ "node": "error_handle_approval", "type": "main", "index": 0 }]] },
    "error_handle_approval": { "main": [[{ "node": "log_error", "type": "main", "index": 0 }]] },
    "log_error": { "main": [[{ "node": "send_alert_email", "type": "main", "index": 0 }]] }
  }
}
```

## Integration with Backend

The backend `adminSetApproval` mutation should trigger this workflow:

**File**: `backend/server/routers.ts`

```typescript
adminSetApproval: adminProcedure
  .input(z.object({ artistId: z.number(), approved: z.boolean() }))
  .mutation(async ({ input }) => {
    // 1. Update artist approval status
    await db.updateArtist(input.artistId, { isApproved: input.approved });
    
    // 2. Trigger n8n workflow webhook
    const webhookUrl = `${ENV.n8nWebhookUrl}/webhook/artist-approval`;
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ENV.n8nWebhookSecret}`,
      },
      body: JSON.stringify({
        artistId: input.artistId,
        approved: input.approved,
      }),
    }).catch((err) => {
      // Log but don't fail user request if webhook fails
      logger.error("Failed to trigger approval notification workflow", { error: err });
    });
    
    return { success: true };
  }),
```

**Add to `.env`**:
```
N8N_WEBHOOK_URL=https://n8n.inkconnect.co
N8N_WEBHOOK_SECRET=your-secure-random-token
```

## Monitoring & Alerts

Monitor these metrics:
- **Email delivery rate**: emails_sent / approval_events
- **Resend API errors**: 4xx, 5xx responses
- **Supabase query failures**: REST API auth/connection errors
- **Workflow execution time**: target < 2 seconds

**Alert triggers**:
- Delivery rate < 95% → investigate Resend API
- 3+ consecutive failures → page on-call engineer
- Response time > 5 seconds → check Supabase/Resend latency

## Related Workflows

- `review-flagged-notification.md` — Content moderation notifications
- `artist-onboarding-sequence.md` — Multi-email onboarding flow
- `license-verification-worker.md` — Admin verification workflows

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-13 | Initial creation for P1-3 |
