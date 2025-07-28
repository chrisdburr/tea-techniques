'use client';

import { useEffect } from 'react';
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// Web Vitals measurement component for development
export function WebVitals() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const logMetric = (metric: Metric) => {
        // biome-ignore lint/suspicious/noConsole: Development logging only
        console.log(`${metric.name}:`, metric);
      };

      onCLS(logMetric);
      onFCP(logMetric);
      onINP(logMetric);
      onLCP(logMetric);
      onTTFB(logMetric);
    }
  }, []);

  return null;
}

// Alternative version that could send metrics to an analytics service
export function WebVitalsAnalytics() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      function sendToAnalytics(metric: Metric) {
        // Replace with your analytics service
        // Example implementation would go here

        // Example: Send to Google Analytics
        // gtag('event', metric.name, {
        //   event_category: 'Web Vitals',
        //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        //   event_label: metric.id,
        //   non_interaction: true,
        // });

        // For now, we'll just store in sessionStorage for demonstration
        try {
          const vitals = JSON.parse(
            sessionStorage.getItem('webVitals') || '[]'
          );
          vitals.push({
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            id: metric.id,
            timestamp: Date.now(),
          });
          sessionStorage.setItem('webVitals', JSON.stringify(vitals));
        } catch {
          // Silently fail if sessionStorage is not available
        }
      }

      onCLS(sendToAnalytics);
      onFCP(sendToAnalytics);
      onINP(sendToAnalytics);
      onLCP(sendToAnalytics);
      onTTFB(sendToAnalytics);
    }
  }, []);

  return null;
}
