// src/lib/api/client.ts
import axios from "axios";

// Select the appropriate base URL based on environment
const getBaseUrl = () => {
  // For server-side rendering in Docker environment
  if (typeof window === 'undefined') {
    // When running on the server
    if (process.env.DOCKER_ENV === 'true') {
      return process.env.BACKEND_URL || 'http://backend:8000';
    } else {
      return process.env.BACKEND_URL || 'http://localhost:8000';
    }
  }
  
  // For browser (client-side) requests, always use relative URLs
  // that will be handled by Next.js rewrites
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