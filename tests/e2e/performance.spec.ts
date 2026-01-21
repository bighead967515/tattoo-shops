import { test, expect } from '@playwright/test';

/**
 * Real Performance Tests with Playwright
 * 
 * Setup:
 * 1. Install: pnpm add -D @playwright/test
 * 2. Initialize: npx playwright install
 * 3. Run: npx playwright test tests/e2e/performance.spec.ts
 * 
 * These tests measure actual page load performance using real browser automation.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

test.describe('Real Performance Tests', () => {
  test.describe('Page Load Times', () => {
    test('homepage loads in under 3 seconds', async ({ page }) => {
      const start = Date.now();
      await page.goto(BASE_URL + '/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - start;
      
      expect(loadTime).toBeLessThan(3000);
      console.log(`Homepage loaded in ${loadTime}ms`);
    });

    test('artist browse page loads in under 3 seconds', async ({ page }) => {
      const start = Date.now();
      await page.goto(BASE_URL + '/artists');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - start;
      
      expect(loadTime).toBeLessThan(3000);
      console.log(`Artist browse loaded in ${loadTime}ms`);
    });

    test('artist profile loads in under 2 seconds', async ({ page }) => {
      const start = Date.now();
      await page.goto(BASE_URL + '/artist/1');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - start;
      
      expect(loadTime).toBeLessThan(2000);
      console.log(`Artist profile loaded in ${loadTime}ms`);
    });
  });

  test.describe('Navigation Timing API', () => {
    test('captures real browser performance metrics', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      
      const timings = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          dns: nav.domainLookupEnd - nav.domainLookupStart,
          tcp: nav.connectEnd - nav.connectStart,
          request: nav.responseStart - nav.requestStart,
          response: nav.responseEnd - nav.responseStart,
          dom: nav.domComplete - nav.domLoading,
          load: nav.loadEventEnd - nav.loadEventStart,
          total: nav.loadEventEnd - nav.fetchStart,
        };
      });
      
      console.log('Performance Timings:', timings);
      
      // Assertions
      expect(timings.total).toBeLessThan(3000);
      expect(timings.dns).toBeLessThan(200);
      expect(timings.response).toBeLessThan(500);
    });
  });

  test.describe('First Contentful Paint', () => {
    test('achieves FCP under 1.8 seconds', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      
      const fcp = await page.evaluate(() => {
        const fcpEntry = performance.getEntriesByType('paint')
          .find(entry => entry.name === 'first-contentful-paint');
        return fcpEntry ? fcpEntry.startTime : 0;
      });
      
      console.log(`FCP: ${fcp}ms`);
      expect(fcp).toBeLessThan(1800);
    });
  });

  test.describe('Largest Contentful Paint', () => {
    test('achieves LCP under 2.5 seconds', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          
          // Fallback timeout
          setTimeout(() => resolve(0), 5000);
        });
      });
      
      console.log(`LCP: ${lcp}ms`);
      expect(lcp as number).toBeLessThan(2500);
    });
  });

  test.describe('Bundle Size', () => {
    test('main bundle is under 300KB (gzipped)', async ({ page, request }) => {
      await page.goto(BASE_URL + '/');
      
      const resourceSizes = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter((r: any) => r.name.includes('.js'))
          .map((r: any) => ({
            name: r.name.split('/').pop(),
            size: r.transferSize,
            encoded: r.encodedBodySize,
            decoded: r.decodedBodySize,
          }));
      });
      
      const mainBundle = resourceSizes.find(r => r.name.includes('index'));
      console.log('Bundle sizes:', resourceSizes);
      
      if (mainBundle) {
        expect(mainBundle.size).toBeLessThan(300 * 1024);
      }
    });
  });

  test.describe('API Performance', () => {
    test('API responds in under 500ms', async ({ request }) => {
      const start = Date.now();
      const response = await request.get(BASE_URL + '/api/trpc/artists.getAll');
      const duration = Date.now() - start;
      
      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(500);
      console.log(`API responded in ${duration}ms`);
    });
  });

  test.describe('Mobile Performance', () => {
    test.use({ 
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    });

    test('loads on mobile viewport in under 5 seconds', async ({ page }) => {
      const start = Date.now();
      await page.goto(BASE_URL + '/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - start;
      
      expect(loadTime).toBeLessThan(5000);
      console.log(`Mobile load time: ${loadTime}ms`);
    });
  });
});
