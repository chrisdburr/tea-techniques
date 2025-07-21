// src/components/common/DataSourceIndicatorWrapper.tsx
"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { getUiConfig } from "@/lib/config/dataConfig";

// Dynamically import the DataSourceIndicator to reduce bundle size in production
const DataSourceIndicator = dynamic(
  () =>
    import("./DataSourceIndicator").then((mod) => ({
      default: mod.DataSourceIndicator,
    })),
  {
    ssr: false,
    loading: () => null,
  },
);

/**
 * Wrapper component that conditionally loads the DataSourceIndicator
 * Only includes it in the bundle when needed
 */
export function DataSourceIndicatorWrapper() {
  const uiConfig = getUiConfig();

  // Don't even load the component if not needed
  if (!uiConfig.showDataSourceIndicator) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <DataSourceIndicator />
    </Suspense>
  );
}
