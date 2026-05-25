---
name: "Bid Draft Generation"
description: "Webhook-triggered workflow that generates an AI bid message draft for an artist responding to a client request. Uses Groq llama3-70b-8192 with artist portfolio context."
tags: ["ai", "bids", "groq", "webhook"]
---

# Bid Draft Generation Workflow

## Overview

When an artist clicks "Generate AI Draft" on a client request, this workflow:

1. Receives the webhook with request + artist context
2. Validates authentication
3. Fetches the artist's top 3 portfolio images (for style tags/context)
4. Calls Groq API to generate a personalized bid message draft
5. Returns the draft in the webhook response
6. Logs the generation event to Supabase

## Trigger

**Type**: Webhook (HTTP POST)  
**URL Pattern**: `https://n8n.example.com/webhook/bid-draft-request`  
**Authentication**: Bearer token (`N8N_WEBHOOK_SECRET`)

**Payload**:
```json
{
  "requestId": 42,
  "artistId": 7,
  "userId": 15,
  "requestTitle": "Traditional Japanese sleeve",
  "requestDescription": "Full sleeve in traditional Japanese style, koi fish and cherry blossoms",
  "requestBudgetMin": 200000,
  "requestBudgetMax": 350000,
  "requestStyle": "Traditional Japanese"
}
```

**Backend integration**: Call this webhook from `bids.draftBid` tRPC procedure (Pro/Icon tier only).

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
node_name: trigger_webhook_bid_draft
type: Webhook
method: POST
path: /bid-draft-request
responseMode: responseNode
```

### 2. Validate Auth Header
```
node_name: check_auth_header
type: IF
condition: headers.authorization == 'Bearer ' + N8N_WEBHOOK_SECRET
false → send_response_401
```

### 3. Fetch Artist Portfolio (Top 3 by Quality)
```
node_name: api_supabase_fetch_portfolio
type: HTTP Request
method: GET
url: SUPABASE_URL/rest/v1/portfolioImages
  ?artistId=eq.{artistId}
  &aiProcessedAt=not.is.null
  &select=style,aiStyles,aiTags,aiDescription,caption
  &order=qualityScore.desc
  &limit=3
error path → send_response_500
```

### 4. Build Groq Prompt
```
node_name: transform_groq_prompt
type: Set (Code expression)
logic: combine request details + portfolio styles into a structured prompt
output: messages array for Groq chat completions API
```

### 5. Call Groq API
```
node_name: api_groq_generate_draft
type: HTTP Request
method: POST
url: https://api.groq.com/openai/v1/chat/completions
headers:
  Authorization: Bearer GROQ_API_KEY
  Content-Type: application/json
body:
  model: llama3-70b-8192
  messages: [system prompt + user prompt with request context]
  max_tokens: 500
  temperature: 0.7
error path → send_response_500 + log_error
```

**System prompt**:
```
You are an expert tattoo artist writing a bid for a client's tattoo request.
Write a professional, personalized bid message that:
- Acknowledges the specific design request
- References your relevant style expertise
- Suggests a realistic approach or technique
- Feels warm and confident, not generic
Keep it under 250 words. Do not include pricing — that's submitted separately.
```

**User prompt**:
```
Client Request: {requestTitle}
Description: {requestDescription}
Style: {requestStyle}
Budget range: ${budgetMin/100}–${budgetMax/100}

My portfolio specializes in: {portfolioStyles joined}
My recent work tags: {aiTags from top images}

Write my bid message draft.
```

### 6. Parse Groq Response
```
node_name: transform_parse_draft
type: Set
fields:
  draftMessage: $json.choices[0].message.content
  tokensUsed: $json.usage.total_tokens
```

### 7. Return Draft in Response
```
node_name: send_response_draft
type: Respond to Webhook
responseCode: 200
body: { draft: draftMessage, tokensUsed }
```

### 8. Log Generation Event
```
node_name: log_supabase_draft_generated
type: HTTP Request
method: POST
url: SUPABASE_URL/rest/v1/workflow_logs
body: { workflow, event: 'bid_draft_generated', artistId, requestId, tokensUsed, createdAt }
```

## Error Handling

- Invalid auth: immediate 401 response
- Supabase fetch failure: 500 response with error details
- Groq API failure: 500 response + log + admin alert
- All nodes have `continueOnFail: true`

## Notes

- Budget values in Supabase are stored in cents; divide by 100 for dollar display in the prompt
- This workflow is only reachable by artists with Pro or Icon tier (enforced in `bids.draftBid` tRPC procedure)
- Groq `llama3-70b-8192` is fast (~1s) — suitable for synchronous webhook response
- Portfolio fetch falls back gracefully: if no processed images exist, omit portfolio context from prompt
- `responseMode: responseNode` means n8n waits for the respondToWebhook node before closing the connection
