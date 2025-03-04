import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    NEXT_PUBLIC_SWAGGER_URL: process.env.NEXT_PUBLIC_SWAGGER_URL || 'http://localhost:8000/swagger/'
  },
  // Needed for container networking and to fix redirect issues
  async rewrites() {
    // Detect environment
    const isDocker = process.env.DOCKER_ENV === 'true';
    const backendHost = isDocker ? 'backend' : 'localhost';
    
    // Log the configuration we're using
    console.log(`
      Next.js Configuration:
      - Node Environment: ${process.env.NODE_ENV}
      - Docker Environment: ${isDocker ? 'Yes' : 'No'} (DOCKER_ENV=${process.env.DOCKER_ENV})
      - Backend Host: ${backendHost}
      - API URL: ${process.env.NEXT_PUBLIC_API_URL}
    `);
    
    return [
      {
        source: '/api/:path*', 
        destination: `http://${backendHost}:8000/api/:path*`,
        // Bypass Next.js path normalization to avoid redirect loops
        basePath: false
      },
      {
        source: '/swagger/:path*',
        destination: `http://${backendHost}:8000/swagger/:path*`,
        basePath: false
      },
      // Add a healthcheck endpoint that bypasses any proxying
      {
        source: '/api-health',
        destination: `http://${backendHost}:8000/api/health/`,
        basePath: false
      }
    ]
  },
  // Explicitly specify that we're using output: 'standalone'
  output: 'standalone'
};

export default nextConfig;