---
name: "CI/CD Audit Report"
description: "Audit of existing GitHub Actions pipelines. Documents current coverage, gaps, and recommended improvements."
date: "2026-05-13"
---

# CI/CD Audit — Ink Connect

## Current Pipelines

| File | Trigger | What It Does |
|------|---------|--------------|
| `ci.yml` | PR + push to `main` | Type check → unit/integration tests → build |
| `customizations-check.yml` | PR + push to `main` | Validates `.github/` agent/prompt/instruction files |
| `e2e-smoke.yml` | Manual only (`workflow_dispatch`) | Full E2E Playwright suite against real secrets |

## Coverage Analysis

### ✅ What's Working Well

1. **Full quality gate on every PR** — type check + tests + build runs before merge
2. **Build verification included** — `pnpm build` catches broken Vite/esbuild output before it reaches production
3. **Secret isolation** — E2E smoke only runs manually to avoid exposing real credentials in automated runs
4. **Frozen lockfile install** — `pnpm install --frozen-lockfile` prevents dependency drift
5. **Timeout guard** — `timeout-minutes: 20` prevents runaway builds consuming CI minutes

### ⚠️ Gaps Identified

#### Gap 1: No Automated Deployment Step
**Risk**: Medium  
**Detail**: `ci.yml` builds the app but doesn't deploy it. Deployment presumably relies on Render's GitHub auto-deploy from `main`. If Render's deploy fails, there's no CI notification.  
**Fix**: Add a post-merge deploy health check (see recommendation below).

#### Gap 2: E2E Tests Never Run on PRs
**Risk**: Medium  
**Detail**: `e2e-smoke.yml` is `workflow_dispatch` only. E2E tests won't catch regressions before merge — they must be manually triggered.  
**Fix**: Add a scheduled E2E run (nightly on `main`) using environment secrets. Keep PRs on unit/integration only to avoid secret leakage.

#### Gap 3: No Build Artifact Upload on Failure
**Risk**: Low  
**Detail**: When `pnpm build` fails, there's no way to inspect the output or error logs after the run completes.  
**Fix**: Add `upload-artifact` step on failure.

#### Gap 4: Node version pinned to `20` (not LTS minor)
**Risk**: Low  
**Detail**: `node-version: 20` will silently pick up minor version bumps. Should pin to `20.x` or a specific minor.  
**Current**: acceptable, not urgent.

#### Gap 5: No Render Deploy Status Check
**Risk**: Medium  
**Detail**: If the Render deploy silently fails after a push to `main`, the team won't know until a user reports it.  
**Fix**: Add a post-deploy smoke check workflow (hits `/api/health` and verifies 200).

## Recommended Improvements

### 1. Nightly E2E on `main` (Highest Priority)

Add to `e2e-smoke.yml`:
```yaml
on:
  workflow_dispatch:
  schedule:
    - cron: '0 4 * * *'  # 4:00 AM UTC nightly
```

This runs E2E every night against production secrets without blocking PRs.

### 2. Post-Deploy Health Check

Create `.github/workflows/deploy-healthcheck.yml`:
```yaml
name: Post-Deploy Health Check

on:
  push:
    branches: [main]

jobs:
  healthcheck:
    runs-on: ubuntu-latest
    # Wait for Render to finish deploying (~3 minutes)
    steps:
      - name: Wait for deploy
        run: sleep 180

      - name: Health check
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://inkconnect.app/api/health)
          if [ "$STATUS" != "200" ]; then
            echo "::error::Health check failed — HTTP $STATUS"
            exit 1
          fi
          echo "Health check passed — HTTP $STATUS"
```

### 3. Upload Build Artifacts on Failure

Add to `ci.yml` after the build step:
```yaml
      - name: Upload build artifacts on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: |
            dist/
            build_output.txt
          retention-days: 3
```

### 4. Add `concurrency` Guard to CI

Prevents queued duplicate runs when you push multiple commits quickly:
```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

## Priority Order

| Priority | Action | Effort |
|----------|--------|--------|
| P1 | Add nightly E2E schedule | 5 min edit to `e2e-smoke.yml` |
| P1 | Post-deploy health check workflow | 20 min |
| P2 | Build artifact upload on failure | 5 min edit to `ci.yml` |
| P3 | CI concurrency guard | 3 min edit to `ci.yml` |
