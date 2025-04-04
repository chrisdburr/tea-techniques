// src/lib/api/client.ts
import axios from "axios";
import { config } from "@/lib/config";

// Get the appropriate base URL based on client/server environment
const getBaseUrl = () => {
  // For server-side rendering, use the internal URL for container-to-container communication
  if (typeof window === 'undefined') {
    return config.internalApiUrl;
  }
  
  // For browser (client-side) requests, use an empty base URL 
  // to ensure all API paths are relative and handled by Next.js rewrites
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
	// Allow redirects to follow Django's trailing slash redirects
	maxRedirects: 5,
	paramsSerializer: {
		indexes: null,
	},
	// Important for session-based authentication
	withCredentials: true,
});

export { apiClient };
export default apiClient;