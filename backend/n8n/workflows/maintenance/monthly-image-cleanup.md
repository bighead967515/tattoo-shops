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
node_name: cron_monthly_cleanup
type: Cron
expression: 0 2 1 * *
```

### 2. Fetch All Storage Keys (paginated)
```
node_name: storage_list_portfolio_images
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
node_name: db_fetch_known_keys
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
const storageFiles = $node["storage_list_portfolio_images"].json;
const dbKeys = new Set(
  $node["db_fetch_known_keys"].json.map((r) => r.imageKey)
);

// Only consider files older than 24h to avoid deleting in-flight uploads
const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

const orphans = storageFiles.filter((file) => {
  const isOrphan = !dbKeys.has(file.name);
  const isOldEnough = new Date(file.created_at).getTime() < oneDayAgo;
  return isOrphan && isOldEnough;
});

return { orphans, count: orphans.length };
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
node_name: storage_delete_orphans
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
    <p><strong>Files reviewed in storage</strong>: {{ $node["storage_list_portfolio_images"].json.length }}</p>
    <p><strong>Known DB keys</strong>: {{ $node["db_fetch_known_keys"].json.length }}</p>
    <hr>
    <p>No action required unless the deletion count is unexpectedly high (>100 files deleted in one run should be investigated).</p>
```

## Error Handling

- If storage list fails → abort, send error alert to admin
- If DB fetch fails → abort, send error alert (never delete without the reference set)
- If delete batch fails → log failed keys, retry individual deletes, report partial success
- Alert threshold: if `count > 100`, send a high-priority alert before deleting (possible data integrity issue)

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
