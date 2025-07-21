// frontend/next.config.ts
import type { NextConfig } from "next";
import { getDataConfig } from "./src/lib/config/dataConfig";

// Import bundle analyzer conditionally
let withBundleAnalyzer = (config: NextConfig) => config;
if (process.env.ANALYZE === "true") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bundleAnalyzer = require("@next/bundle-analyzer");
  withBundleAnalyzer = bundleAnalyzer({
    enabled: true,
  });
}

// Get the backend URL from environment or use a sensible default
const getBackendUrl = () => {
  // When running in Docker, always use the service name
  // IMPORTANT: In Docker Compose environments, this is the most reliable approach
  if (process.env.NODE_ENV === "development") {
    console.log("Using backend service DNS name for API proxy");
    return "http://backend:8000";
  }

  // For non-Docker environments, fallback to localhost
  return "http://127.0.0.1:8000";
};

const BACKEND_URL = getBackendUrl();
console.log(`Backend URL for API proxy: ${BACKEND_URL}`);

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Add rewrites to proxy API requests to the backend (only in API mode)
  async rewrites() {
    const config = getDataConfig();

    // In static mode, don't proxy API requests - they'll be served from public/api/
    if (config.dataSource === "static" || config.dataSource === "mock") {
      return [];
    }

    // In API mode, proxy to backend
    return [
      {
        source: "/api",
        destination: `${BACKEND_URL}/api`,
      },
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: "/swagger",
        destination: `${BACKEND_URL}/swagger`,
      },
      {
        source: "/swagger/:path*",
        destination: `${BACKEND_URL}/swagger/:path*`,
      },
    ];
  },

  // Conditional output configuration based on data source mode
  output: (() => {
    const config = getDataConfig();
    // In static mode, use export for GitHub Pages compatibility
    if (config.dataSource === "static" || config.dataSource === "mock") {
      return "export";
    }
    // In API mode, use standalone for Docker deployment
    return "standalone";
  })(),
};

export default withBundleAnalyzer(nextConfig);
