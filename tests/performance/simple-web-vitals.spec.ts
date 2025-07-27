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
  domContentLoaded: 3000, // 3 seconds
  load: 5000, // 5 seconds
  firstPaint: 2000, // 2 seconds
  firstContentfulPaint: 2500, // 2.5 seconds
};

test.describe('Performance Metrics', () => {
  for (const { path, name } of HIGH_TRAFFIC_PAGES) {
    test(`${name} - page load performance`, async ({ page }) => {
      // Start collecting performance metrics
      const _performanceData: Record<string, unknown> = {};

      // Listen for performance entries
      await page.addInitScript(() => {
        window.addEventListener('load', () => {
          const perfData = performance.getEntriesByType(
            'navigation'
          )[0] as PerformanceNavigationTiming;
          const paintEntries = performance.getEntriesByType('paint');

          // @ts-expect-error
          window.__performanceData = {
            domContentLoaded:
              perfData.domContentLoadedEventEnd -
              perfData.domContentLoadedEventStart,
            load: perfData.loadEventEnd - perfData.loadEventStart,
            responseTime: perfData.responseEnd - perfData.requestStart,
            domInteractive: perfData.domInteractive - perfData.fetchStart,
            firstPaint:
              paintEntries.find((e) => e.name === 'first-paint')?.startTime ||
              0,
            firstContentfulPaint:
              paintEntries.find((e) => e.name === 'first-contentful-paint')
                ?.startTime || 0,
          };
        });
      });

      // Navigate to the page
      const startTime = Date.now();
      await page.goto(path, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      // Get performance metrics
      const metrics = await page.evaluate(() => {
        // @ts-expect-error
        return window.__performanceData || {};
      });

      // Get resource timing
      const _resourceMetrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType(
          'resource'
        ) as PerformanceResourceTiming[];
        return {
          totalResources: resources.length,
          totalSize: resources.reduce(
            (acc, r) => acc + (r.transferSize || 0),
            0
          ),
          jsResources: resources.filter((r) => r.name.includes('.js')).length,
          cssResources: resources.filter((r) => r.name.includes('.css')).length,
          imageResources: resources.filter((r) => r.initiatorType === 'img')
            .length,
        };
      });

      // Performance assertions
      expect(
        loadTime,
        `Page load time should be under ${PERFORMANCE_BUDGETS.load}ms`
      ).toBeLessThan(PERFORMANCE_BUDGETS.load);

      if (metrics.firstContentfulPaint) {
        expect(
          metrics.firstContentfulPaint,
          `First Contentful Paint should be under ${PERFORMANCE_BUDGETS.firstContentfulPaint}ms`
        ).toBeLessThan(PERFORMANCE_BUDGETS.firstContentfulPaint);
      }

      if (metrics.domInteractive) {
        expect(
          metrics.domInteractive,
          `DOM Interactive should be under ${PERFORMANCE_BUDGETS.domContentLoaded}ms`
        ).toBeLessThan(PERFORMANCE_BUDGETS.domContentLoaded);
      }
    });
  }
});
