"use client";

import React from "react";
import { getDataConfig, getUiConfig } from "@/lib/config/dataConfig";
import { Badge } from "@/components/ui/badge";

/**
 * Component to display the current data source mode
 * Only shown in development or when explicitly enabled
 */
export function DataSourceIndicator() {
  const uiConfig = getUiConfig();

  // Only show if enabled in configuration
  if (!uiConfig.showDataSourceIndicator) {
    return null;
  }

  const config = getDataConfig();

  const getVariant = () => {
    switch (config.dataSource) {
      case "static":
        return "secondary";
      case "mock":
        return "outline";
      case "api":
      default:
        return "default";
    }
  };

  const getLabel = () => {
    switch (config.dataSource) {
      case "static":
        return "Static Mode";
      case "mock":
        return "Mock Mode";
      case "api":
      default:
        return "API Mode";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge variant={getVariant()} className="text-xs">
        {getLabel()}
      </Badge>
    </div>
  );
}
