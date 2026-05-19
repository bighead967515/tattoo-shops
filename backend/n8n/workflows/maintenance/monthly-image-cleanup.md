---
name: "Monthly Portfolio Image Cleanup"
description: "Runs on the 1st of each month. Finds orphaned images in Supabase Storage (portfolio-images bucket) that have no matching row in portfolioImages table, then deletes them."
tags: ["maintenance", "storage", "cleanup", "cron"]
---

# Monthly Portfolio Image Cleanup Workflow

## Overview

Over time, failed uploads, deleted artists, and in-flight cancellations leave orphaned files in the `portfolio-images` Supabase Storage bucket. This job runs monthly to reclaim storage and keep costs low.

**Estimated impact**: ~5–20% storage reduction per month, prevents unbounded storage cost growth.

## Trigger

**Type**: Schedule (Cron)  
**Schedule**: `0 2 1 * *` — 2:00 AM UTC on the 1st of every month  
**Manual trigger**: Also expose a webhook for on-demand runs

## Required Environment Variables

```
SUPABASE_URL             — Supabase project URL
SUPABASE_SERVICE_KEY     — Supabase service role key
ADMIN_ALERT_EMAIL        — Where to send the cleanup report
RESEND_API_KEY           — Resend API key (for report email)
```

## Workflow Steps

### 1. Cron Trigger
```
node_name: trigger_schedule_monthly
type: Cron
expression: 0 2 1 * *
```

### 2. Fetch All Storage Keys (paginated)
```
node_name: api_supabase_list_storage
type: HTTP Request (Supabase Storage)
method: POST
url: {{ $env.SUPABASE_URL }}/storage/v1/object/list/portfolio-images
headers:
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_KEY }}
  apikey: {{ $env.SUPABASE_SERVICE_KEY }}
body:
  prefix: ""
  limit: 1000
  offset: 0
  sortBy: { column: "created_at", order: "asc" }
```

**Output**: Array of `{ name, id, created_at, metadata }` objects.

> If you have >1000 files, add a pagination loop node that increments `offset` until the response array length < limit.

### 3. Fetch All Known Keys from DB
```
node_name: api_supabase_fetch_keys
type: HTTP Request (Supabase REST)
method: GET
url: {{ $env.SUPABASE_URL }}/rest/v1/portfolioImages?select=imageKey&limit=10000
headers:
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_KEY }}
  apikey: {{ $env.SUPABASE_SERVICE_KEY }}
```

**Output**: Array of `{ imageKey }` objects.

### 4. Find Orphaned Files
```
node_name: compute_orphaned_files
type: Code
```

```javascript
const rawStorage = $node["api_supabase_list_storage"].json;
const rawDbRows = $node["api_supabase_fetch_keys"].json;

if (!Array.isArray(rawStorage) || !Array.isArray(rawDbRows)) {
  throw new Error("Invalid cleanup inputs: storage or DB key response is not an array");
}

const storageFiles = rawStorage;
const dbKeys = new Set(rawDbRows.map((r) => r.imageKey).filter(Boolean));

// Only consider files older than 24h to avoid deleting in-flight uploads
const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

const orphans = storageFiles.filter((file) => {
  const isOrphan = !dbKeys.has(file.name);
  const isOldEnough = new Date(file.created_at).getTime() < oneDayAgo;
  return isOrphan && isOldEnough;
});

return { orphans, count: orphans.length };
```

**Safe-fail variant** (if you prefer not to throw):
```javascript
if (!Array.isArray(rawStorage) || !Array.isArray(rawDbRows)) {
  return { orphans: [], count: 0, warning: "Invalid input arrays; skipped deletion" };
}
```

### 5. Guard: Skip if Nothing to Delete
```
node_name: check_has_orphans
type: IF
condition: {{ $json.count > 0 }}
```

- **True** → continue to delete
- **False** → jump to "Send Summary Report" with 0 deletions

### 6. Delete Orphaned Files (Batch)
```
node_name: check_dry_run_mode
type: IF
condition: {{ $env.DRY_RUN === 'true' }}
```

- **True** → skip deletion and continue to report (include text: `DRY RUN - would have deleted {{ $json.count }} files`)
- **False** → continue to delete node below

```
node_name: api_supabase_delete_storage
type: HTTP Request (Supabase Storage)
method: DELETE
url: {{ $env.SUPABASE_URL }}/storage/v1/object/portfolio-images
headers:
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_KEY }}
  apikey: {{ $env.SUPABASE_SERVICE_KEY }}
body:
  prefixes: {{ $json.orphans.map(f => f.name) }}
```

> Supabase Storage supports batch delete with an array of `prefixes`.

### 7. Send Monthly Cleanup Report
```
node_name: send_cleanup_report
type: HTTP Request (Resend)
method: POST
url: https://api.resend.com/emails
headers:
  Authorization: Bearer {{ $env.RESEND_API_KEY }}
body:
  from: "Ink Connect System <system@inkconnect.app>"
  to: {{ $env.ADMIN_ALERT_EMAIL }}
  subject: "Monthly Storage Cleanup — {{ new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }}"
  html: |
    <h2>Portfolio Image Cleanup Report</h2>
    <p><strong>Run date</strong>: {{ new Date().toISOString() }}</p>
    <p><strong>Orphaned files deleted</strong>: {{ $json.count }}</p>
    <p><strong>Files reviewed in storage</strong>: {{ $node["api_supabase_list_storage"].json.length }}</p>
    <p><strong>Known DB keys</strong>: {{ $node["api_supabase_fetch_keys"].json.length }}</p>
    <p><strong>Mode</strong>: {{ $env.DRY_RUN === 'true' ? 'DRY RUN - would have deleted files only' : 'LIVE DELETE' }}</p>
    <hr>
    <p>No action required unless the deletion count is unexpectedly high (>100 files deleted in one run should be investigated).</p>
```

## Error Handling

- Wrap each external call in try/catch: `storage.list`, `db.fetchReferences`, `deleteBatch`, `individualDelete`.
- Normalize failures to:
  ```json
  {
    "success": false,
    "error": {
      "code": "STORAGE_DELETE_FAILED",
      "message": "...",
      "statusCode": 500,
      "context": { "workflow": "Monthly Portfolio Image Cleanup", "step": "deleteBatch" }
    }
  }
  ```
- Log errors to Supabase `errorLogs` via helper node/function like `logErrorToSupabase`.
- Send critical alerts to `#n8n-errors` via `sendSlackAlert` for auth/validation failures and retry exhaustion.
- Retry transient operations with exponential backoff: 1s, 2s, 4s, 8s (max 3 retries).
- On repeated delete failures, record failed keys and report partial success through existing `sendErrorAlert` / `sendAdminAlert` flow.

## Safety Guarantees

1. **24-hour buffer**: Files younger than 24 hours are never deleted — protects uploads in progress
2. **DB-first**: The DB key list is always fetched fresh immediately before computing orphans
3. **Dry-run mode**: Set `DRY_RUN=true` env var to log orphans without deleting (for auditing)
4. **Report always sent**: Even on 0 deletions, the monthly report email confirms the job ran

## Testing

1. Manually upload a file to `portfolio-images` bucket without creating a DB row
2. Trigger the workflow manually (webhook or n8n manual run)
3. Verify the orphaned file is identified and deleted
4. Verify the report email arrives with correct counts
5. Verify a real portfolio image (with DB row) is NOT deleted

## Import-ready n8n JSON (skeleton)

Use this import-safe skeleton to keep renamed nodes and DRY_RUN routing consistent.

```json
{
  "name": "Monthly Portfolio Image Cleanup",
  "nodes": [
    { "name": "trigger_schedule_monthly", "type": "n8n-nodes-base.cron", "typeVersion": 1, "position": [220, 260] },
    { "name": "api_supabase_list_storage", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [460, 260] },
    { "name": "api_supabase_fetch_keys", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [700, 260] },
    { "name": "compute_orphaned_files", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [940, 260] },
    { "name": "check_has_orphans", "type": "n8n-nodes-base.if", "typeVersion": 2, "position": [1180, 260] },
    { "name": "check_dry_run_mode", "type": "n8n-nodes-base.if", "typeVersion": 2, "position": [1420, 260] },
    { "name": "api_supabase_delete_storage", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [1660, 340] },
    { "name": "send_cleanup_report", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4, "position": [1900, 260] }
  ],
  "connections": {
    "trigger_schedule_monthly": { "main": [[{ "node": "api_supabase_list_storage", "type": "main", "index": 0 }]] },
    "api_supabase_list_storage": { "main": [[{ "node": "api_supabase_fetch_keys", "type": "main", "index": 0 }]] },
    "api_supabase_fetch_keys": { "main": [[{ "node": "compute_orphaned_files", "type": "main", "index": 0 }]] },
    "compute_orphaned_files": { "main": [[{ "node": "check_has_orphans", "type": "main", "index": 0 }]] },
    "check_has_orphans": { "main": [[{ "node": "check_dry_run_mode", "type": "main", "index": 0 }], [{ "node": "send_cleanup_report", "type": "main", "index": 0 }]] },
    "check_dry_run_mode": { "main": [[{ "node": "send_cleanup_report", "type": "main", "index": 0 }], [{ "node": "api_supabase_delete_storage", "type": "main", "index": 0 }]] },
    "api_supabase_delete_storage": { "main": [[{ "node": "send_cleanup_report", "type": "main", "index": 0 }]] }
  }
}
```
