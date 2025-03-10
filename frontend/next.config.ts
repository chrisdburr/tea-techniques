// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	// No rewrites at all

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
