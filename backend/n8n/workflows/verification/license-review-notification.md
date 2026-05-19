---
name: "License Verification Admin Notification"
description: "Notifies admins immediately when an artist uploads a license document for review. Includes OCR pre-analysis summary so reviewers can triage before opening the dashboard."
tags: ["verification", "admin", "email", "moderation"]
---

# License Verification Notification Workflow

## Overview

When an artist uploads a verification document (`verificationDocuments` table insert), admins need to know immediately so review doesn't sit for days. This workflow:

1. Receives a webhook when a document is submitted
2. Waits for the async OCR analysis to complete (polls up to 5 minutes)
3. Emails the admin team with OCR pre-analysis results and a direct link to review
4. Escalates to Slack if the review is still pending after 48 hours

## Trigger

**Type**: Webhook (HTTP POST)  
**URL Pattern**: `https://n8n.example.com/webhook/license-verification`  
**Authentication**: Bearer token (`N8N_WEBHOOK_SECRET`)

**Payload** (sent from `verification.addDocument` tRPC procedure):
```json
{
  "documentId": 42,
  "userId": 456,
  "artistId": 123,
  "artistName": "Jordan Lee",
  "shopName": "Dark Matter Tattoo",
  "documentType": "state_license",
  "originalFileName": "license-2026.pdf",
  "submittedAt": "2026-05-13T10:00:00Z"
}
```

**Backend hook location**: `backend/server/verificationRouter.ts` → `verification.addDocument` — add a fire-and-forget `fetch` to the webhook URL after the DB insert.

## Required Environment Variables

```
N8N_WEBHOOK_SECRET       — shared webhook auth token
SUPABASE_URL             — Supabase project URL
SUPABASE_SERVICE_KEY     — Supabase service role key
RESEND_API_KEY           — Resend API key
ADMIN_REVIEW_EMAIL       — Admin review team email
APP_BASE_URL             — e.g. https://inkconnect.app
```

## Workflow Steps

### 1. Webhook Trigger
```
node_name: webhook_license_submission
type: Webhook
method: POST
path: /license-verification
authentication: headerAuth (Authorization: Bearer {{ $env.N8N_WEBHOOK_SECRET }})
```

### 2. Wait for OCR to Complete (Poll)
```
node_name: wait_for_ocr
type: Wait
amount: 90
unit: seconds
```

The backend OCR analysis (`geminiSafety.ts`) is async and typically completes in 30–90 seconds.

### 3. Fetch OCR Results
```
node_name: db_fetch_ocr_results
type: HTTP Request (Supabase REST)
method: GET
url: {{ $env.SUPABASE_URL }}/rest/v1/verificationDocuments?id=eq.{{ $json.documentId }}&select=*
headers:
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_KEY }}
  apikey: {{ $env.SUPABASE_SERVICE_KEY }}
```

**Expected output**:
```json
{
  "id": 42,
  "ocrVerdict": "verified",
  "ocrDocumentType": "state_license",
  "ocrExtractedName": "Jordan Lee",
  "ocrExtractedBusinessName": "Dark Matter Tattoo",
  "ocrLicenseNumber": "TX-2026-12345",
  "ocrExpirationDate": "2028-06-01",
  "ocrConfidence": 91,
  "ocrNameMatch": "exact",
  "ocrVerdictReason": "Name matches artist profile; license valid through 2028",
  "ocrProcessedAt": "2026-05-13T10:01:30Z"
}
```

### 4. Check if OCR Has Completed
```
node_name: check_ocr_done
type: IF
condition: {{ $json[0].ocrProcessedAt !== null }}
```

- **True** → continue to send notification
- **False** → retry once more after 2 minutes, then send notification with "OCR pending" status

### 5. Classify Verdict Color
```
node_name: format_verdict
type: Code
```
```javascript
const doc = $node["db_fetch_ocr_results"].json[0];
const verdictColors = {
  verified: "#16a34a",
  needs_review: "#d97706",
  rejected: "#dc2626",
};
const verdictLabels = {
  verified: "✅ Auto-verified",
  needs_review: "⚠️ Needs Manual Review",
  rejected: "❌ Rejected by OCR",
};
return {
  ...doc,
  verdictColor: verdictColors[doc.ocrVerdict] ?? "#6b7280",
  verdictLabel: verdictLabels[doc.ocrVerdict] ?? "Unknown",
  reviewUrl: `${process.env.APP_BASE_URL}/admin/moderation?tab=verification&doc=${doc.id}`,
};
```

### 6. Send Admin Notification Email
```
node_name: send_admin_notification
type: HTTP Request (Resend)
method: POST
url: https://api.resend.com/emails
headers:
  Authorization: Bearer {{ $env.RESEND_API_KEY }}
body:
  from: "Ink Connect Verification <verify@inkconnect.app>"
  to: {{ $env.ADMIN_REVIEW_EMAIL }}
  subject: "License Review: {{ $json.artistName }} ({{ $json.ocrVerdict ?? 'OCR pending' }})"
  html: |
    <h2>New License Submission</h2>
    <table>
      <tr><td><strong>Artist</strong></td><td>{{ $json.artistName }}</td></tr>
      <tr><td><strong>Shop</strong></td><td>{{ $json.shopName }}</td></tr>
      <tr><td><strong>Document Type</strong></td><td>{{ $json.ocrDocumentType ?? $json.documentType }}</td></tr>
      <tr><td><strong>File</strong></td><td>{{ $json.originalFileName }}</td></tr>
      <tr><td><strong>Submitted</strong></td><td>{{ $json.submittedAt }}</td></tr>
    </table>

    <h3>OCR Pre-Analysis</h3>
    <p style="color: {{ $json.verdictColor }}; font-weight: bold; font-size: 16px;">
      {{ $json.verdictLabel }}
    </p>
    <table>
      <tr><td><strong>Extracted Name</strong></td><td>{{ $json.ocrExtractedName ?? '—' }}</td></tr>
      <tr><td><strong>Business Name</strong></td><td>{{ $json.ocrExtractedBusinessName ?? '—' }}</td></tr>
      <tr><td><strong>License #</strong></td><td>{{ $json.ocrLicenseNumber ?? '—' }}</td></tr>
      <tr><td><strong>Expires</strong></td><td>{{ $json.ocrExpirationDate ?? '—' }}</td></tr>
      <tr><td><strong>Name Match</strong></td><td>{{ $json.ocrNameMatch ?? '—' }}</td></tr>
      <tr><td><strong>Confidence</strong></td><td>{{ $json.ocrConfidence ?? '—' }}%</td></tr>
    </table>
    <p><em>{{ $json.ocrVerdictReason }}</em></p>

    <p><a href="{{ $json.reviewUrl }}" style="background:#0f172a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
      Review Document →
    </a></p>
```

### 7. Schedule 48-Hour Escalation
```
node_name: wait_48h_escalation
type: Wait
amount: 48
unit: hours
```

### 8. Check if Still Pending
```
node_name: db_check_still_pending
type: HTTP Request (Supabase REST)
method: GET
url: {{ $env.SUPABASE_URL }}/rest/v1/verificationDocuments?id=eq.{{ $json.documentId }}&select=status
headers:
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_KEY }}
  apikey: {{ $env.SUPABASE_SERVICE_KEY }}
```

### 9. Escalate if Unreviewed
```
node_name: check_needs_escalation
type: IF
condition: {{ $json[0].status === 'pending' }}
```

**True** → send escalation email:
```
node_name: send_escalation_email
subject: "⚠️ OVERDUE: License review pending 48h — {{ $json.artistName }}"
```

## Error Handling

- Webhook auth failure → 401, log and discard
- OCR poll timeout (>5 min) → send notification with "OCR still processing" note, skip OCR fields
- Resend failure → retry 3× with exponential backoff
- All step failures → send fallback alert to admin email directly

## Idempotency

- If the same `documentId` triggers twice (duplicate webhook), check n8n's execution log — only process if no prior execution for this `documentId` is running or completed

## Testing

1. Upload a test document via the `/license-upload` page
2. Confirm webhook fires to n8n within 1 second of DB insert
3. Wait 90 seconds, confirm OCR results are fetched
4. Verify admin email arrives with populated OCR fields
5. Manually advance the wait node to test 48h escalation path
