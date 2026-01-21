# Performance Testing

## Overview

This project has two types of performance tests:

### 1. Performance Requirements (`tests/performance/performance-requirements.spec.ts`)
- **Purpose**: Document performance targets and optimization goals
- **Type**: Mock/requirement specifications (not real browser tests)
- **Run with**: `pnpm test` (Vitest)
- **Use case**: Quick validation of performance requirements and benchmarks

### 2. Real Performance Tests (`tests/e2e/performance.spec.ts`)
- **Purpose**: Measure actual page load performance with real browsers
- **Type**: End-to-end tests using Playwright
- **Run with**: `npx playwright test` (after setup)
- **Use case**: Production-ready performance validation

## Setup Real Performance Tests

### 1. Install Playwright

```bash
pnpm add -D @playwright/test
npx playwright install
```

### 2. Run Performance Tests

```bash
# Run all tests
npx playwright test

# Run only performance tests
npx playwright test tests/e2e/performance.spec.ts

# Run with UI mode (interactive)
npx playwright test --ui

# Run on specific browser
npx playwright test --project=chromium

# Run on mobile
npx playwright test --project="Mobile Chrome"
```

### 3. View Results

```bash
# Open HTML report
npx playwright show-report

# View traces for failed tests
npx playwright show-trace trace.zip
```

## What's Measured

### Page Load Times
- Homepage load time (target: < 3s)
- Artist browse page (target: < 3s)
- Artist profile page (target: < 2s)

### Core Web Vitals
- **FCP** (First Contentful Paint): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTI** (Time to Interactive): < 3.8s

### Bundle Size
- Main bundle (gzipped): < 300KB
- Code splitting verification
- Lazy loading validation

### API Performance
- API response times: < 500ms
- Database query times: < 100ms
- Caching effectiveness

### Network Metrics
- DNS lookup time
- TCP connection time
- Request/response time
- Total page load time

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
name: Performance Tests

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Build application
        run: pnpm build
      
      - name: Start server in background
        run: |
          pnpm start &
          npx wait-on http://localhost:3001 --timeout 60000
        env:
          NODE_ENV: production
      
      - name: Run performance tests
        run: npx playwright test tests/e2e/performance.spec.ts
        env:
          BASE_URL: http://localhost:3001
      
      - name: Upload report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Performance Monitoring

### Real User Monitoring (RUM)

For production monitoring, integrate services like:
- **Vercel Analytics**: Built-in Core Web Vitals tracking
- **Sentry Performance**: Transaction and span monitoring
- **Google Analytics 4**: User timing and events
- **Umami**: Privacy-focused analytics

### Lighthouse CI

Add Lighthouse CI for automated performance audits:

```bash
# Using pnpm (matches project convention)
pnpm dlx @lhci/cli autorun

# Or install globally
pnpm add -g @lhci/cli
lhci autorun
```

## Performance Budget

Enforced limits:
- **Time to Interactive**: 3.8s
- **First Contentful Paint**: 1.8s
- **Largest Contentful Paint**: 2.5s
- **Total Bundle Size**: 300KB (gzipped)
- **API Response Time**: 500ms
- **Database Query Time**: 100ms

## Optimization Checklist

- [ ] Image optimization (WebP, lazy loading)
- [ ] Code splitting (React.lazy, dynamic imports)
- [ ] Bundle analysis (webpack-bundle-analyzer)
- [ ] Caching strategy (Cache-Control, ETags)
- [ ] CDN for static assets
- [ ] Database indexes
- [ ] API response caching
- [ ] Compression (Gzip/Brotli)
- [ ] HTTP/2 support
- [ ] Minimize render-blocking resources

## Debugging Performance Issues

### 1. Chrome DevTools

```javascript
// In browser console
performance.getEntriesByType('navigation')
performance.getEntriesByType('paint')
performance.getEntriesByType('resource')
```

### 2. Lighthouse

```bash
# Run Lighthouse
lighthouse http://localhost:3001 --view
```

### 3. Playwright Trace Viewer

```bash
# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### 4. Network Analysis

```bash
# Run with network throttling
npx playwright test --project="Mobile Chrome"
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)
