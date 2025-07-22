"use client";

import React from "react";
import { getUiConfig } from "@/lib/config/dataConfig";
import { DataSourceIndicator } from "./DataSourceIndicator";
import { DeveloperToolbar } from "./DeveloperToolbar";

/**
 * Wrapper component that shows the appropriate developer UI based on environment
 */
export function DeveloperToolbarWrapper() {
  const uiConfig = getUiConfig();

  // Don't show anything if disabled
  if (!uiConfig.showDataSourceIndicator) {
    return null;
  }

  // In development, show the full toolbar
  if (process.env.NODE_ENV === "development") {
    return <DeveloperToolbar />;
  }

  // In production with indicator enabled, show simple indicator
  return <DataSourceIndicator />;
}
