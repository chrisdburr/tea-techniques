// frontend/next.config.ts
import type { NextConfig } from "next";

// Import bundle analyzer conditionally
let withBundleAnalyzer = (config: NextConfig) => config;
if (process.env.ANALYZE === "true") {
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

  // Add rewrites to proxy API requests to the backend
  async rewrites() {
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

  // Add this output configuration for standalone mode
  output: "standalone",
};

export default withBundleAnalyzer(nextConfig);
