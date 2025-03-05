// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	// No rewrites at all

	// Add this output configuration for standalone mode
	output: "standalone",
};

export default nextConfig;
