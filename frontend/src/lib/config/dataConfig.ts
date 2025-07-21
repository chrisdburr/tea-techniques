/**
 * Data configuration for the hybrid architecture
 * Provides centralized access to environment-based configuration
 */

export type DataSourceType = "api" | "static" | "mock";

export interface DataConfig {
  dataSource: DataSourceType;
  apiUrl: string;
  staticDataPath: string;
  features: {
    enableAuth: boolean;
    enableEditing: boolean;
    enableSubmission: boolean;
  };
  ui: {
    showDataSourceIndicator: boolean;
  };
}

/**
 * Get the current data configuration from environment variables
 */
export function getDataConfig(): DataConfig {
  const dataSource = (process.env.NEXT_PUBLIC_DATA_SOURCE ||
    "api") as DataSourceType;

  // Validate data source
  if (!["api", "static", "mock"].includes(dataSource)) {
    console.warn(`Invalid data source '${dataSource}', defaulting to 'api'`);
  }

  return {
    dataSource,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    staticDataPath: process.env.NEXT_PUBLIC_STATIC_DATA_PATH || "/api",
    features: {
      // In static mode, disable auth/editing features
      enableAuth:
        dataSource === "api" && process.env.NEXT_PUBLIC_ENABLE_AUTH !== "false",
      enableEditing:
        dataSource === "api" &&
        process.env.NEXT_PUBLIC_ENABLE_EDITING !== "false",
      enableSubmission:
        dataSource === "api" &&
        process.env.NEXT_PUBLIC_ENABLE_SUBMISSION !== "false",
    },
    ui: {
      showDataSourceIndicator:
        process.env.NEXT_PUBLIC_SHOW_DATA_SOURCE_INDICATOR === "true",
    },
  };
}

/**
 * Check if we're in static mode
 */
export function isStaticMode(): boolean {
  const config = getDataConfig();
  return config.dataSource === "static" || config.dataSource === "mock";
}

/**
 * Check if we're in API mode
 */
export function isApiMode(): boolean {
  const config = getDataConfig();
  return config.dataSource === "api";
}

/**
 * Get feature flags
 */
export function getFeatureFlags() {
  const config = getDataConfig();
  return config.features;
}

/**
 * Get UI configuration
 */
export function getUiConfig() {
  const config = getDataConfig();
  return config.ui;
}
