// frontend/src/lib/config.ts

import { getDataConfig, isStaticMode } from "./config/dataConfig";

interface Config {
  apiBaseUrl: string;
  internalApiUrl: string;
  swaggerUrl: string;
  isProduction: boolean;
  dataConfig: ReturnType<typeof getDataConfig>;
}

/**
 * Get API base URL for browser-side requests
 * Always returns a relative path for browser usage
 */
const getApiBaseUrl = (): string => {
  // For browser usage, we always want to use the relative path
  // so Next.js can handle routing through rewrites
  return "/api";
};

/**
 * Get API URL for server-side requests (SSR)
 * Used for container-to-container communication
 */
const getInternalApiUrl = (): string => {
  // In static mode, there's no backend to connect to
  if (isStaticMode()) {
    return "";
  }

  // First priority: explicit environment variable
  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL;
  }

  // Second priority: standard URL format if in container environment
  if (typeof process !== "undefined" && process.env.DOCKER_ENV === "true") {
    return "http://backend:8000/api";
  }

  // Default for local development
  return "http://localhost:8000/api";
};

/**
 * Get Swagger documentation URL
 */
const getSwaggerUrl = (): string => {
  // No Swagger in static mode
  if (isStaticMode()) {
    return "";
  }

  if (process.env.NEXT_PUBLIC_SWAGGER_URL) {
    return process.env.NEXT_PUBLIC_SWAGGER_URL;
  }

  // Use relative URL without trailing slash to match backend config
  return "/swagger";
};

export const config: Config = {
  apiBaseUrl: getApiBaseUrl(),
  internalApiUrl: getInternalApiUrl(),
  swaggerUrl: getSwaggerUrl(),
  isProduction: process.env.NODE_ENV === "production",
  dataConfig: getDataConfig(),
};
