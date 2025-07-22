// src/components/common/DataSourceIndicatorWrapper.tsx
"use client";

import React from "react";
import { getUiConfig } from "@/lib/config/dataConfig";
import { DataSourceIndicator } from "./DataSourceIndicator";
import { DeveloperToolbar } from "./DeveloperToolbar";

/**
 * Wrapper component that conditionally loads the appropriate developer UI
 * Shows enhanced toolbar in development, simple indicator in production
 */
export function DataSourceIndicatorWrapper() {
  const uiConfig = getUiConfig();

  // Don't even load the component if not needed
  if (!uiConfig.showDataSourceIndicator) {
    return null;
  }

  // In development, show the full toolbar
  const isDevelopment = process.env.NODE_ENV === "development";

  return isDevelopment ? <DeveloperToolbar /> : <DataSourceIndicator />;
}
