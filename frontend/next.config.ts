// frontend/next.config.ts
import type { NextConfig } from "next";

// Import bundle analyzer conditionally
let withBundleAnalyzer = (config: NextConfig) => config;
if (process.env.ANALYZE === 'true') {
  const bundleAnalyzer = require('@next/bundle-analyzer');
  withBundleAnalyzer = bundleAnalyzer({
    enabled: true,
  });
}

// Get the backend URL from environment or use a sensible default
const getBackendUrl = () => {
  // First priority: NEXT_PUBLIC_API_URL (without the /api part)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '');
  }

  // Second priority: BACKEND_URL
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  
  // For Docker environments, use the service name
  if (process.env.DOCKER_ENV === 'true') {
    return 'http://backend:8000';
  }
  
  // Default fallback for local development
  return 'http://127.0.0.1:8000';
};

const BACKEND_URL = getBackendUrl();

const nextConfig: NextConfig = {
	reactStrictMode: true,
	
	// Add rewrites to proxy API requests to the backend
	async rewrites() {
		return [
			{
				source: '/api',
				destination: `${BACKEND_URL}/api/` // Proxy to Django backend root with trailing slash
			},
			{
				source: '/api/:path*',
				destination: `${BACKEND_URL}/api/:path*` // Proxy to Django backend paths
			},
			{
				source: '/swagger',
				destination: `${BACKEND_URL}/swagger/` // Proxy Swagger docs with trailing slash
			},
			{
				source: '/swagger/:path*',
				destination: `${BACKEND_URL}/swagger/:path*` // Proxy Swagger docs paths
			}
		];
	},
	
	// Add this output configuration for standalone mode
	output: "standalone",
	
	// Force trailing slashes to match Django's URL pattern
	trailingSlash: true
};

export default withBundleAnalyzer(nextConfig);