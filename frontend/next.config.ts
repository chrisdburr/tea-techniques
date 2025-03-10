// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	
	// Add rewrites to proxy API requests to the backend
	async rewrites() {
		return [
			{
				source: '/api/:path*',
				destination: 'http://localhost:8000/api/:path*' // Proxy to Django backend
			},
			{
				source: '/swagger/:path*',
				destination: 'http://localhost:8000/swagger/:path*' // Proxy Swagger docs
			}
		];
	},

	// Add this output configuration for standalone mode
	output: "standalone",
};

module.exports = {
	output: 'standalone',
	experimental: {
	  // This is important for proper proxying
	  skipTrailingSlashRedirect: true,
	}
  }

export default nextConfig;