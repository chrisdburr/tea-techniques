// src/lib/api/client.ts
import axios from "axios";
import { config } from "@/lib/config";

// Select the appropriate base URL based on environment
const getBaseUrl = () => {
  // For server-side rendering in Docker environment
  if (typeof window === 'undefined' && process.env.DOCKER_ENV === 'true') {
    console.log('Server-side rendering in Docker environment detected');
    return process.env.BACKEND_URL || 'http://backend:8000';
  }
  
  // For browser in development environment
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('Browser in development environment detected');
    // We need to use the full backend URL for local development
    return 'http://localhost:8000';
  }

  // Default for browser in production or Docker (using Next.js rewrites)
  console.log('Using default base URL from config');
  return config.apiBaseUrl;
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
  
  // Test the backend connection and log the result
  console.log('Testing direct connection to backend...');
  apiClient.get('/api/techniques/')
    .then(response => console.log('Backend is accessible:', response.status, response.data.count))
    .catch(error => console.error('Backend connection test failed:', error));
}

export { apiClient };
export default apiClient;