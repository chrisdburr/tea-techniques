// src/lib/api/client.ts
import axios from "axios";
// config is imported but not directly used after the refactoring
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { config } from "@/lib/config";

// Select the appropriate base URL based on environment
const getBaseUrl = () => {
  // For server-side rendering in Docker environment
  if (typeof window === 'undefined') {
    // When running on the server
    console.log('Server-side rendering detected');
    if (process.env.DOCKER_ENV === 'true') {
      console.log('Using Docker backend URL:', process.env.BACKEND_URL || 'http://backend:8000');
      return process.env.BACKEND_URL || 'http://backend:8000';
    } else {
      console.log('Using local backend URL for server-side rendering:', process.env.BACKEND_URL || 'http://localhost:8000');
      return process.env.BACKEND_URL || 'http://localhost:8000';
    }
  }
  
  // For browser (client-side) requests, always use relative URLs
  // that will be handled by Next.js rewrites
  console.log('Client-side rendering detected, using relative URL');
  return '';
};

// Create a client that uses the appropriate API base URL
const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // Prevent redirect following to avoid loops
  maxRedirects: 0,
});

// Log base URL during initialization
console.log(`Axios client initialized with baseURL: ${apiClient.defaults.baseURL}`);
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  DOCKER_ENV: process.env.DOCKER_ENV,
  BACKEND_URL: process.env.BACKEND_URL
});

// Add request logging in development
if (process.env.NODE_ENV === "development") {
  apiClient.interceptors.request.use(
    (config) => {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => Promise.reject(error)
  );
}

export { apiClient };
export default apiClient;