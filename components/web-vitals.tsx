'use client';

import { useEffect } from 'react';

export function WebVitalsReporter() {
  useEffect(() => {
    const reportWebVitals = async () => {
      if (typeof window === 'undefined') {
        return;
      }

      try {
        const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import(
          'web-vitals'
        );

        // Core Web Vitals
        onCLS((metric) => {
          // Send to analytics
          if (window.gtag) {
            window.gtag('event', metric.name, {
              value: Math.round(
                metric.name === 'CLS' ? metric.value * 1000 : metric.value
              ),
              metric_id: metric.id,
              metric_value: metric.value,
              metric_delta: metric.delta,
            });
          }
        });

        onLCP((metric) => {
          if (window.gtag) {
            window.gtag('event', metric.name, {
              value: Math.round(metric.value),
              metric_id: metric.id,
              metric_value: metric.value,
              metric_delta: metric.delta,
            });
          }
        });

        onINP((metric) => {
          if (window.gtag) {
            window.gtag('event', metric.name, {
              value: Math.round(metric.value),
              metric_id: metric.id,
              metric_value: metric.value,
              metric_delta: metric.delta,
            });
          }
        });

        // Other metrics
        onFCP((metric) => {
          if (window.gtag) {
            window.gtag('event', metric.name, {
              value: Math.round(metric.value),
              metric_id: metric.id,
              metric_value: metric.value,
              metric_delta: metric.delta,
            });
          }
        });

        onTTFB((metric) => {
          if (window.gtag) {
            window.gtag('event', metric.name, {
              value: Math.round(metric.value),
              metric_id: metric.id,
              metric_value: metric.value,
              metric_delta: metric.delta,
            });
          }
        });
      } catch {
        // Failed to load web-vitals, fail silently in production
      }
    };

    reportWebVitals();
  }, []);

  return null;
}

// Type declarations for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      parameters: {
        value: number;
        metric_id: string;
        metric_value: number;
        metric_delta: number;
      }
    ) => void;
  }
}
