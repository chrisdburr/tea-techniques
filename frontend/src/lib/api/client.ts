// src/lib/api/client.ts
import axios from "axios";
import { config } from "@/lib/config";

// Create a client that uses the API base URL from config
const apiClient = axios.create({
	// Use the API base URL from config
	baseURL: config.apiBaseUrl,
	timeout: 15000,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
	// Prevent redirect following to avoid loops
	maxRedirects: 0,
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