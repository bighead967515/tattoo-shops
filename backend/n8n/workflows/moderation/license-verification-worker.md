---
name: "License Verification Worker"
description: "Async OCR processing worker. Fetches a signed URL for a license document, sends it to Groq for field extraction, evaluates name match and confidence verdict, then updates the verificationDocuments table."
tags: ["moderation", "verification", "ocr", "groq", "webhook"]
---

# License Verification Worker Workflow

## Overview

This is the async OCR processing worker triggered after an artist uploads a verification document. It runs separately from the license-review-notification workflow, which waits for this worker to complete before emailing admins.

Steps:
1. Receive webhook with document details
2. Validate authentication
3. Generate a signed URL for the private document from Supabase Storage
4. POST the document URL to Groq Vision/Hugging Face OCR for field extraction
5. Evaluate name match and set confidence-based verdict
6. PATCH `verificationDocuments` with all OCR fields + `ocrProcessedAt`
7. Return result

## Trigger

**Type**: Webhook (HTTP POST)  
**URL Pattern**: `https://n8n.example.com/webhook/license-verification-worker`  
**Authentication**: Bearer token (`N8N_WEBHOOK_SECRET`)

**Payload**:
```json
{
  "documentId": 42,
  "documentKey": "id-documents/user-456/license-2026.pdf",
  "documentType": "state_license",
  "artistName": "Jordan Lee"
}
```

**Backend integration**: Fire from `verification.addDocument` tRPC procedure immediately after DB insert (fire-and-forget).

## Required Environment Variables

```
N8N_WEBHOOK_SECRET       — Shared webhook auth token
SUPABASE_URL             — Supabase project URL
SUPABASE_SERVICE_KEY     — Supabase service role key
GROQ_API_KEY             — Groq API key
```

## Workflow Steps

### 1. Webhook Trigger
```
node_name: trigger_webhook_verification_worker
type: Webhook
method: POST
path: /license-verification-worker
responseMode: responseNode
```

### 2. Validate Auth
```
node_name: check_auth_header
type: IF
condition: headers.authorization == 'Bearer ' + N8N_WEBHOOK_SECRET
false → send_response_401
```

### 3. Send Acknowledgment (Async Processing Continues)
```
node_name: send_response_ok
type: Respond to Webhook
responseCode: 202
body: { accepted: true, documentId }
```

### 4. Generate Signed URL for Document
```
node_name: api_supabase_signed_url
type: HTTP Request
method: POST
url: SUPABASE_URL/storage/v1/object/sign/id-documents/{documentKey}
headers:
  Authorization: Bearer SUPABASE_SERVICE_KEY
  apikey: SUPABASE_SERVICE_KEY
body: { expiresIn: 300 }
error path → api_supabase_mark_failed + log_error
```

### 5. Call Groq Vision for OCR Field Extraction
```
node_name: api_groq_ocr_document
type: HTTP Request
method: POST
url: https://api.groq.com/openai/v1/chat/completions
headers:
  Authorization: Bearer GROQ_API_KEY
  Content-Type: application/json
body:
  model: llama3-70b-8192
  messages:
    - system: "You are a document OCR extraction system. Extract fields from the license document image and return ONLY valid JSON."
    - user: "Extract the following fields from this {documentType} document at: {signedUrl}
              Return JSON with:
              - ocrDocumentType (string): type of document detected (e.g. 'cosmetology_license', 'business_permit')
              - ocrExtractedName (string): full name on the document, or null
              - ocrExtractedBusinessName (string): business name if present, or null
              - ocrLicenseNumber (string): license/permit number, or null
              - ocrExpirationDate (string ISO date): expiry date, or null
              - ocrIssuingAuthority (string): issuing state/authority, or null
              - ocrConfidence (number 0-100): your confidence in extraction accuracy
              - ocrIssues (array of strings): any problems found (expired, blurry, unreadable, etc.)"
  max_tokens: 400
  temperature: 0.1
error path → api_supabase_mark_failed + log_error
```

### 6. Parse OCR Response
```
node_name: transform_parse_ocr
type: Code
logic:
  content = choices[0].message.content
  parsed = JSON.parse(content) (with try/catch fallback)
  output: all OCR fields
```

### 7. Determine Name Match
```
node_name: transform_name_match
type: Code
logic:
  artistName = payload.artistName.toLowerCase().trim()
  extractedName = ocrExtractedName?.toLowerCase().trim() || ''
  if !extractedName: return 'unavailable'
  if extractedName == artistName: return 'exact'
  if extractedName includes artistName or artistName includes extractedName: return 'partial'
  return 'mismatch'
```

### 8. Determine OCR Verdict
```
node_name: transform_ocr_verdict
type: Code
logic:
  if ocrConfidence > 70 and nameMatch in ['exact', 'partial']: verdict = 'verified'
  elif ocrConfidence >= 40: verdict = 'needs_review'
  else: verdict = 'rejected'
  verdictReason = (confidence level description + name match result)
```

### 9. Update verificationDocuments in Supabase
```
node_name: api_supabase_update_document
type: HTTP Request
method: PATCH
url: SUPABASE_URL/rest/v1/verificationDocuments?id=eq.{documentId}
body:
  ocrDocumentType, ocrExtractedName, ocrExtractedBusinessName,
  ocrLicenseNumber, ocrExpirationDate, ocrIssuingAuthority,
  ocrConfidence, ocrNameMatch, ocrVerdict, ocrVerdictReason,
  ocrIssues (JSON string), ocrProcessedAt: now()
error path → log_error_supabase + send_alert_admin
```

### 10. Log Result
```
node_name: log_supabase_ocr_complete
type: HTTP Request
method: POST
url: SUPABASE_URL/rest/v1/workflow_logs
body: { workflow, documentId, ocrVerdict, ocrConfidence, ocrNameMatch, createdAt }
```

## Verdict Logic

| Confidence | Name Match | Verdict |
|-----------|------------|---------|
| > 70 | exact or partial | `verified` |
| 40–70 | any | `needs_review` |
| < 40 | any | `rejected` |
| any | mismatch | `needs_review` (override) |
| any | unavailable | `needs_review` (override) |

## Error Handling

- Auth failure: 401 response
- Signed URL failure: PATCH `verificationDocuments.status = 'error'` + log
- Groq failure: PATCH document with error state + admin alert
- Parse failure: fallback OCR fields with confidence=0, verdict='needs_review'
- All HTTP nodes have `continueOnFail: true`

## Notes

- Groq does not natively process PDF URLs — for PDF documents, the app should store a pre-rendered image version in storage, or this step should delegate to Hugging Face OCR (`nlpconnect/vit-gpt2-image-captioning` or similar)
- The 300-second signed URL expiry is sufficient for processing time
- `ocrIssues` is stored as a JSON array string in the DB column (text type)
- After this worker completes, the license-review-notification workflow (which polls `ocrProcessedAt`) will automatically continue
