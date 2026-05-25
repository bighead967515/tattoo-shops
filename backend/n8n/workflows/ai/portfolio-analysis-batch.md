---
name: "Portfolio Analysis Batch"
description: "Hourly cron job that finds portfolio images without AI analysis and triggers reanalysis for each via the tRPC API. Sends an admin summary email after processing."
tags: ["ai", "portfolio", "batch", "cron"]
---

# Portfolio Analysis Batch Workflow

## Overview

Some portfolio images may miss AI processing due to race conditions, server restarts, or transient failures. This workflow runs every hour to catch and reprocess any images stuck without `aiProcessedAt` set.

Steps:
1. Cron trigger (every hour)
2. Query Supabase for unprocessed images (older than 15 minutes, no `aiProcessedAt`)
3. For each image: call the tRPC `portfolio.reanalyze` endpoint
4. Wait 2 seconds between each call to respect rate limits
5. Send admin summary email with processed/failed counts
6. Log results to Supabase

## Trigger

**Type**: Schedule (Cron)  
**Expression**: `0 * * * *` (every hour at :00)

## Required Environment Variables

```
SUPABASE_URL             — Supabase project URL
SUPABASE_SERVICE_KEY     — Supabase service role key
RESEND_API_KEY           — Resend API key
ADMIN_ALERT_EMAIL        — Admin summary email destination
APP_BASE_URL             — e.g. https://inkconnect.app (for tRPC endpoint)
```

## Workflow Steps

### 1. Cron Trigger
```
node_name: trigger_cron_hourly
type: Schedule Trigger
expression: 0 * * * *
```

### 2. Fetch Unprocessed Images
```
node_name: api_supabase_fetch_unprocessed
type: HTTP Request
method: GET
url: SUPABASE_URL/rest/v1/portfolioImages
  ?aiProcessedAt=is.null
  &createdAt=lt.{now - 15 minutes ISO}
  &select=id,artistId,imageUrl
  &limit=20
  &order=createdAt.asc
error path → send_alert_admin + log_error_supabase
```

### 3. Check If Any Images Need Processing
```
node_name: check_images_exist
type: IF
condition: result array length > 0
false path → log_supabase_no_work (skip run)
```

### 4. Split Into Individual Items
```
node_name: split_images_batch
type: Split In Batches
batchSize: 1
```

### 5. Call tRPC Reanalyze Endpoint
```
node_name: api_trpc_reanalyze_image
type: HTTP Request
method: POST
url: APP_BASE_URL/api/trpc/portfolio.reanalyze
headers:
  Authorization: Bearer SUPABASE_SERVICE_KEY
  Content-Type: application/json
body: { imageId: $json.id, artistId: $json.artistId }
continueOnFail: true
```

### 6. Check API Response
```
node_name: check_reanalyze_success
type: IF
condition: HTTP status is 200 (or $json.result exists)
true → log item as processed
false → log item as failed
```

### 7. Wait Between Calls (Rate Limiting)
```
node_name: wait_rate_limit
type: Wait
amount: 2
unit: seconds
```
_(Connected after the success/fail log, before returning to the loop)_

### 8. After Loop — Aggregate Results
```
node_name: transform_batch_summary
type: Code
logic: count processed vs failed from all loop iterations
output: { processed: N, failed: N, imageIds: [...] }
```

### 9. Send Summary Email
```
node_name: send_email_admin_summary
type: HTTP Request (Resend)
to: ADMIN_ALERT_EMAIL
subject: "Portfolio AI Batch — {processed} processed, {failed} failed"
body: table of processed/failed image IDs, timestamp
```

### 10. Log Batch Results
```
node_name: log_supabase_batch_results
type: HTTP Request
method: POST
url: SUPABASE_URL/rest/v1/workflow_logs
body: { workflow, event: 'batch_complete', processed, failed, ran_at }
```

## Error Handling

- `continueOnFail: true` on all HTTP nodes
- Failed reanalyze calls are counted and included in the summary email
- If Supabase fetch fails entirely, admin is alerted before the batch begins
- Rate limiting via 2-second Wait prevents overloading the tRPC server

## Notes

- Limit of 20 images per run prevents overly long executions
- Images processed by the app normally (via `portfolio.add`) set `aiProcessedAt` immediately — this workflow only catches stragglers
- The `portfolio.reanalyze` tRPC endpoint must accept service-role auth via Bearer token
- For very large backlogs, increase the cron frequency or batch limit temporarily
