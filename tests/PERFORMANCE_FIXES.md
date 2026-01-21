# Performance Test Fixes

## Issues Fixed (2025-01-21)

### 1. CI Workflow Missing Server Startup
**File:** `.github/workflows/ci.yml`  
**Issue:** CI tests would fail because no server is running  
**Fix:** Added build and server startup steps with health check:
```yaml
- name: Build application
  run: pnpm build

- name: Start server in background
  run: |
    pnpm start &
    pnpm dlx wait-on http://localhost:3001 --timeout 60000
```

### 2. Package Manager Inconsistency
**File:** `.github/workflows/lighthouse-ci.yml`  
**Issue:** Lighthouse CI documentation used `npm` instead of `pnpm`  
**Fix:** Changed to `pnpm dlx @lhci/cli autorun`

### 3. Deprecated Navigation Timing API
**File:** `tests/e2e/performance.spec.ts:60`  
**Issue:** Using deprecated `nav.domLoading`  
**Fix:** Changed to `nav.domInteractive`  
**Impact:** Uses supported API property for DOM timing

### 4. FCP Test Silent Pass
**File:** `tests/e2e/performance.spec.ts:79-86`  
**Issue:** Test returned `0` when FCP entry missing, causing false positive  
**Fix:** 
- Changed return to `null` when entry missing
- Added assertion `expect(fcp).not.toBeNull()`
**Impact:** Test now fails loudly when measurement unavailable

### 5. LCP Observer Double Resolution
**File:** `tests/e2e/performance.spec.ts:94-108`  
**Issue:** Observer could resolve promise twice; timeout resolved with `0` instead of failing  
**Fix:**
- Added `settled` boolean flag
- Called `observer.disconnect()`
- Called `clearTimeout(timeoutId)`
- Changed timeout to `reject(new Error(...))`
**Impact:** Proper cleanup and test fails on timeout

### 6. Bundle Size Test Issues
**File:** `tests/e2e/performance.spec.ts:113-132`  
**Issues:**
- Used `transferSize` (includes headers) instead of encoded size
- Silent pass when bundle not found
- Unused `request` parameter
**Fixes:**
- Changed to `encodedBodySize` for gzipped size
- Added error throw when bundle missing
- Removed unused parameter
**Impact:** Accurate size measurement and proper test failures

### 7. Incomplete Mobile UserAgent
**File:** `tests/e2e/performance.spec.ts:149-152`  
**Issue:** iPhone UA missing `Version/14.0 Mobile/15E148 Safari/604.1`  
**Fix:** Added complete UA string  
**Impact:** Accurate mobile Safari emulation

## Test Results
- **Performance Requirements:** ✅ 47/47 passing
- **E2E Tests:** Ready for Playwright execution
- **CI Workflow:** Ready for GitHub Actions

## Next Steps
1. Install Playwright: `pnpm add -D @playwright/test`
2. Run tests: `npx playwright test tests/e2e/performance.spec.ts`
3. View report: `npx playwright show-report`
