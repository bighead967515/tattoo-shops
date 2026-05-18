---
applyTo: "**/n8n/*.md"
description: "Use when: creating, reviewing, or maintaining n8n workflows for Ink Connect. Covers folder structure, node naming, error handling, environment variables, Supabase/Stripe integrations, and TypeScript patterns."
---

# n8n Workflow Patterns & Conventions — Ink Connect

This guide ensures all n8n workflows follow team conventions for consistency, maintainability, and alignment with the Ink Connect backend architecture.

## Folder Structure

```
backend/n8n/
├── workflows/
│   ├── email/                    # Email automation (Resend, customer lifecycle)
│   │   ├── artist-onboarding-sequence.md
│   │   └── review-flagged-notification.md
│   ├── billing/                  # Stripe webhooks & subscription automation
│   │   ├── subscription-created.md
│   │   └── payment-failed-recovery.md
│   ├── ai/                       # AI batch processing, async results
│   │   ├── portfolio-analysis-batch.md
│   │   └── bid-draft-generation.md
│   ├── data-sync/                # Cross-system data sync (Supabase ↔ Stripe)
│   │   ├── artist-tier-sync.md
│   │   └── customer-metadata-sync.md
│   └── moderation/               # Content moderation & verification
│       ├── review-safety-check.md
│       └── license-verification-worker.md
├── shared/
│   ├── environments.md           # ENV variable reference & templates
│   └── node-library.md           # Common node patterns (Supabase, Stripe, error handling)
└── docs/
    ├── debugging.md
    └── deployment-checklist.md
```

## Workflow Naming

- **File**: Snake case, descriptive action verb: `artist-onboarding-sequence`, `review-flagged-notification`
- **Workflow name** (in code): Same as file, Title Case: "Artist Onboarding Sequence"
- **Node naming**: `action_target_detail` (e.g., `email_send_artist`, `stripe_fetch_subscription`, `db_upsert_user`)

## Environment Variables

All workflows must use environment variables (never hardcode keys, IDs, or URLs).

**Standard variables** (defined in `.env`):

```
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...  # For authenticated queries

# Stripe
STRIPE_API_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Resend (Email)
RESEND_API_KEY=re_xxx

# n8n Environment
N8N_WEBHOOK_URL=https://n8n.example.com/webhook
N8N_LOG_LEVEL=info
```

**Access pattern**: Use n8n's "Environment" or "Secrets" nodes to fetch at runtime. Never reference `process.env` directly — use credential nodes instead.

## Integration Patterns

### Supabase

All workflows that read/write to Supabase must:

1. **Use service role credentials** — ensures privileged access for backend automation
   ```
   Header: Authorization: Bearer SUPABASE_SERVICE_KEY
   ```

2. **Query via REST API** — not JavaScript SDK
   ```
   POST https://SUPABASE_URL/rest/v1/artists?select=*&id=eq.123
   ```

3. **Handle errors consistently**:
   - `409` (conflict) → merge or retry with backoff
   - `401` (auth) → log and alert (credential misconfiguration)
   - `5xx` → exponential backoff, max 3 retries

4. **Use Drizzle types as schema reference** — workflow output types must match `backend/drizzle/schema.ts`

### Stripe

All Stripe workflows must:

1. **Use API key from credentials** — never expose in logs
2. **Validate webhook signatures** before processing
3. **Handle idempotency** — Stripe calls include `Idempotency-Key` header (use webhook ID or event ID)
4. **Update `users.subscriptionTier` only** — the canonical source of truth (not `artists.subscriptionTier` or `clients.subscriptionTier`)

**Example Stripe → Supabase flow**:
```
Stripe webhook → Extract event type & metadata
  → Fetch user from Supabase by stripe_customer_id
  → Update users.subscriptionTier (if tier change)
  → Update users.stripeSubscriptionId
  → Update users.updatedAt
  → Return 200 OK to Stripe
```

### Email (Resend)

All email workflows must:

1. **Use email templates** — never hardcode HTML/text in workflow
2. **Include unsubscribe links** — GDPR/CAN-SPAM compliance
3. **Validate recipient email** before sending
4. **Log all sends** to Supabase for audit/compliance
5. **Handle soft bounces** with retry + logging

## Error Handling

### Standard Error Nodes

Every workflow should include:

1. **Try-Catch wrapper** for external API calls
   - Success path: Log to Supabase, return structured data
   - Error path: Extract error code, message, context

2. **Exponential backoff** for transient failures (5xx, timeouts)
   ```
   Retry delays: 1s, 2s, 4s, 8s (max 3 retries)
   ```

3. **Critical alerts** for permanent failures (4xx, auth, validation)
   - Log to Supabase `errorLogs` table
   - Send Slack alert to #n8n-errors channel (if configured)
   - Include: workflow name, node, error code, timestamp, context

### Error Response Structure

All workflows should return consistent error objects:

```json
{
  "success": false,
  "error": {
    "code": "SUPABASE_QUERY_ERROR",
    "message": "User not found",
    "statusCode": 404,
    "context": {
      "userId": 123,
      "timestamp": "2026-05-13T10:00:00Z"
    }
  }
}
```

## Code Patterns

### Node Naming Convention

| Node Type | Naming Pattern | Example |
|-----------|---|---|
| Trigger | `trigger_source_event` | `trigger_webhook_stripe`, `trigger_schedule_daily` |
| API Call | `api_service_action` | `api_supabase_fetch`, `api_stripe_charge` |
| Transform | `transform_entity_detail` | `transform_artist_data`, `transform_email_content` |
| Conditional | `check_condition_detail` | `check_has_portfolio`, `check_payment_failed` |
| Output/Send | `send_destination_type` | `send_email_artist`, `send_slack_alert` |
| Log | `log_action_detail` | `log_workflow_start`, `log_error_captured` |

### JavaScript Nodes

If using JS code nodes:

1. **Use TypeScript when possible** — n8n supports JSDoc types
2. **Return structured data** — not raw API responses
3. **Include error context** — wrap in try-catch with logging
4. **Validate input** before processing

```javascript
// ✅ Good
try {
  const artist = items[0].json.artist;
  if (!artist?.id) throw new Error("Missing artist ID");
  
  return [{ json: { artistId: artist.id, processed: true } }];
} catch (error) {
  console.error("Transform failed", error);
  throw new Error(`Transform error: ${error.message}`);
}

// ❌ Bad
const data = items[0].json;
return [{ json: data }]; // No validation, no error handling
```

## Testing & Validation

### Pre-Deployment Checklist

- [ ] Workflow has a clear, descriptive name
- [ ] All nodes are named per `node_action_detail` convention
- [ ] Environment variables used (no hardcoded secrets)
- [ ] Error paths exist for all external API calls
- [ ] Idempotency implemented (safe to replay)
- [ ] Supabase queries use service role credentials
- [ ] Stripe updates target `users.subscriptionTier` only
- [ ] Output structure documented (JSDoc or inline comments)
- [ ] Workflow tested on staging before production
- [ ] Retry logic configured (exponential backoff for transient failures)
- [ ] Alert/logging configured for critical errors
- [ ] Webhook signature validation (if Stripe/external webhook)

### Debugging Steps

1. **Check n8n logs** — timestamp, node name, error message
2. **Verify credentials** — service role key, API key expiry, IP whitelist
3. **Test API calls manually** — use Postman/curl with same headers/body
4. **Replay in staging** — use n8n's manual execution with test data
5. **Check Supabase RLS policies** — if query returns empty, RLS might be blocking

## Documentation

Every workflow markdown file should include:

```markdown
# Workflow Name

## Purpose
Brief description of what this workflow does and when it triggers.

## Trigger
- Event type (webhook, schedule, manual)
- Frequency (if scheduled)
- Payload example (if webhook)

## Flow
1. Node 1: Description
2. Node 2: Description
3. Node 3: Description

## Data Output
Expected output structure (JSON schema).

## Error Handling
How errors are handled (retries, alerts, logging).

## Dependencies
- External APIs: Stripe, Supabase, Resend
- Environment variables: STRIPE_API_KEY, SUPABASE_URL
- Supabase tables: users, artists, subscriptions

## Testing
How to test this workflow locally/on staging.

## Links
- Related workflows: [...]
- Supabase tables: [...]
- Stripe events: [...]
```

## Deployment

- Workflows are code-reviewed before merging to `main`
- Staging workflows tested for 24 hours before production
- Production deployments include rollback plan (disable workflow + manual recovery)
- All deployments logged with timestamp, actor, changes
- Monitor error rates for 1 hour post-deployment
