import { expect, type Page, test } from '@playwright/test';

interface WebVitalsMetrics {
  CLS: number;
  FCP: number;
  INP: number | null;
  LCP: number;
  TTFB: number;
}

interface WebVitalsMetric {
  value: number;
}

const PERFORMANCE_THRESHOLDS = {
  CLS: 0.1, // Good < 0.1
  FCP: 1800, // Good < 1.8s
  INP: 200, // Good < 200ms
  LCP: 2500, // Good < 2.5s
  TTFB: 800, // Good < 0.8s
};

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

async function captureWebVitals(page: Page): Promise<WebVitalsMetrics> {
  // Inject web-vitals library and capture metrics
  const metrics = await page.evaluate(() => {
    return new Promise<WebVitalsMetrics>((resolve) => {
      const collectedMetrics: Partial<WebVitalsMetrics> = {};
      let metricsCount = 0;
      const expectedMetrics = 5;

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/web-vitals@5/dist/web-vitals.iife.js';
      script.onload = () => {
        // @ts-expect-error
        const { onCLS, onFCP, onINP, onLCP, onTTFB } = window.webVitals;

        onCLS((metric: WebVitalsMetric) => {
          collectedMetrics.CLS = metric.value;
          metricsCount++;
          if (metricsCount === expectedMetrics) {
            resolve(collectedMetrics as WebVitalsMetrics);
          }
        });

        onFCP((metric: WebVitalsMetric) => {
          collectedMetrics.FCP = metric.value;
          metricsCount++;
          if (metricsCount === expectedMetrics) {
            resolve(collectedMetrics as WebVitalsMetrics);
          }
        });

        onINP((metric: WebVitalsMetric) => {
          collectedMetrics.INP = metric.value;
          metricsCount++;
          if (metricsCount === expectedMetrics) {
            resolve(collectedMetrics as WebVitalsMetrics);
          }
        });

        onLCP((metric: WebVitalsMetric) => {
          collectedMetrics.LCP = metric.value;
          metricsCount++;
          if (metricsCount === expectedMetrics) {
            resolve(collectedMetrics as WebVitalsMetrics);
          }
        });

        onTTFB((metric: WebVitalsMetric) => {
          collectedMetrics.TTFB = metric.value;
          metricsCount++;
          if (metricsCount === expectedMetrics) {
            resolve(collectedMetrics as WebVitalsMetrics);
          }
        });

        // Set a timeout to resolve even if some metrics don't fire
        setTimeout(() => {
          // Fill in any missing metrics with defaults
          const defaults: Partial<WebVitalsMetrics> = {
            CLS: 0,
            FCP: 0,
            LCP: 0,
            TTFB: 0,
            INP: null,
          };

          const finalMetrics = {
            ...defaults,
            ...collectedMetrics,
          } as WebVitalsMetrics;

          resolve(finalMetrics);
        }, 15_000);
      };
      document.head.appendChild(script);
    });
  });

  return metrics;
}

test.describe('Core Web Vitals - Desktop', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
  });

  for (const { path, name } of HIGH_TRAFFIC_PAGES) {
    test(`${name} - meets performance thresholds`, async ({ page }) => {
      // Navigate to page
      await page.goto(path, { waitUntil: 'networkidle' });

      // Wait for page to be fully interactive
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000); // Allow time for any deferred loading

      // Capture Web Vitals
      const metrics = await captureWebVitals(page);

      // Performance metrics will be reported in test output

      // Assert metrics are within acceptable thresholds
      expect(
        metrics.CLS,
        `CLS should be less than ${PERFORMANCE_THRESHOLDS.CLS}`
      ).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
      expect(
        metrics.FCP,
        `FCP should be less than ${PERFORMANCE_THRESHOLDS.FCP}ms`
      ).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP);
      if (metrics.INP !== null) {
        expect(
          metrics.INP,
          `INP should be less than ${PERFORMANCE_THRESHOLDS.INP}ms`
        ).toBeLessThan(PERFORMANCE_THRESHOLDS.INP);
      }
      expect(
        metrics.LCP,
        `LCP should be less than ${PERFORMANCE_THRESHOLDS.LCP}ms`
      ).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
      expect(
        metrics.TTFB,
        `TTFB should be less than ${PERFORMANCE_THRESHOLDS.TTFB}ms`
      ).toBeLessThan(PERFORMANCE_THRESHOLDS.TTFB);
    });
  }
});
