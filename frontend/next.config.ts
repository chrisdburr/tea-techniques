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

  // Disable ESLint during build when NEXT_DISABLE_LINT is set
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_DISABLE_LINT === "true",
  },

  // Disable TypeScript checking during build when NEXT_DISABLE_TYPE_CHECK is set
  typescript: {
    ignoreBuildErrors: process.env.NEXT_DISABLE_TYPE_CHECK === "true",
  },

  // Configure base path for GitHub Pages deployment
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",

  // Configure asset prefix for GitHub Pages
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || "",

  // Configure image optimization for static export
  images: {
    unoptimized: (() => {
      const config = getDataConfig();
      // Disable image optimization in static mode
      return config.dataSource === "static" || config.dataSource === "mock";
    })(),
  },

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

  // Trailing slash configuration for GitHub Pages
  trailingSlash: (() => {
    const config = getDataConfig();
    // Enable trailing slash in static mode for better GitHub Pages compatibility
    return config.dataSource === "static" || config.dataSource === "mock";
  })(),

  // Experimental configuration for static export
  experimental: {
    // Disable worker threads to fix chunk loading in static export
    workerThreads: false,
  },

  // Webpack configuration to disable code splitting in static mode
  webpack: (config, { isServer }) => {
    const dataConfig = getDataConfig();

    // In static mode, disable code splitting for client-side bundles
    if (
      (dataConfig.dataSource === "static" ||
        dataConfig.dataSource === "mock") &&
      !isServer
    ) {
      // Disable splitChunks for static builds
      config.optimization.splitChunks = false;
      // Ensure runtime chunk is inline
      config.optimization.runtimeChunk = false;
    }

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
