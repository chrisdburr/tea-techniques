// frontend/next.config.ts
import type { NextConfig } from "next";

// Get the backend URL from environment or use a sensible default
// In Docker environments, "localhost" often doesn't work because containers
// are isolated - we might need to use the service name or IP address
const getBackendUrl = () => {
  // First check for environment variable
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  
  // For Docker environments, try to use the service name
  if (process.env.DOCKER_ENV === 'true') {
    return 'http://backend:8000';
  }
  
  // Default fallback for local development
  return 'http://localhost:8000';
};

const BACKEND_URL = getBackendUrl();
console.log(`Next.js is configured to proxy requests to: ${BACKEND_URL}`);

const nextConfig: NextConfig = {
	reactStrictMode: true,
	
	// Add rewrites to proxy API requests to the backend
	async rewrites() {
		console.log(`Setting up rewrite rules to proxy to: ${BACKEND_URL}`);
		return [
			{
				source: '/api/:path*',
				destination: `${BACKEND_URL}/api/:path*` // Proxy to Django backend
			},
			{
				source: '/swagger/:path*',
				destination: `${BACKEND_URL}/swagger/:path*` // Proxy Swagger docs
			}
		];
	},
	
	// Add this output configuration for standalone mode
	output: "standalone",
	
	// Skip trailing slash redirects
	skipTrailingSlashRedirect: true
};

export default nextConfig;