import { expect, test } from '@playwright/test';

const HIGH_TRAFFIC_PAGES = [
  { path: '/', name: 'Homepage' },
  { path: '/techniques/', name: 'Techniques List' },
  { path: '/categories/', name: 'Categories' },
  { path: '/categories/explainability/', name: 'Explainability Category' },
  {
    path: '/techniques/shapley-additive-explanations/',
    name: 'SHAP Technique Detail',
  },
];

const PERFORMANCE_BUDGETS = {
  load: 5000, // 5 seconds
  firstContentfulPaint: 2500, // 2.5 seconds
};

test.describe('Performance Results', () => {
  for (const { path, name } of HIGH_TRAFFIC_PAGES) {
    test(`${name} - performance metrics`, async ({ page }) => {
      // Navigate and measure
      const startTime = Date.now();
      await page.goto(path, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      // Wait for page to fully load then get metrics
      const metrics = await page.evaluate(() => {
        const perfData = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        const paintEntries = performance.getEntriesByType('paint');

        return {
          domContentLoaded:
            perfData.domContentLoadedEventEnd -
            perfData.domContentLoadedEventStart,
          loadEvent: perfData.loadEventEnd - perfData.loadEventStart,
          responseTime: perfData.responseEnd - perfData.requestStart,
          domInteractive: perfData.domInteractive - perfData.fetchStart,
          firstPaint:
            paintEntries.find((e) => e.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint:
            paintEntries.find((e) => e.name === 'first-contentful-paint')
              ?.startTime || 0,
          transferSize: perfData.transferSize || 0,
          encodedBodySize: perfData.encodedBodySize || 0,
        };
      });

      // Get resource metrics
      const _resources = await page.evaluate(() => {
        const res = performance.getEntriesByType(
          'resource'
        ) as PerformanceResourceTiming[];
        return {
          total: res.length,
          js: res.filter((r) => r.name.includes('.js')).length,
          css: res.filter((r) => r.name.includes('.css')).length,
          totalSize: res.reduce((acc, r) => acc + (r.transferSize || 0), 0),
        };
      });

      // Basic assertions
      expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.load);
      expect(metrics.firstContentfulPaint).toBeLessThan(
        PERFORMANCE_BUDGETS.firstContentfulPaint
      );
    });
  }
});
