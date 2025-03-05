// src/lib/api/client-azure.ts
import axios from "axios";
import { config } from "@/lib/config";

// Use environment variable for API URL in production
const apiClient = axios.create({
	baseURL: config.apiBaseUrl,
	timeout: 15000,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
});

// Add request interceptor for logging in development
if (process.env.NODE_ENV === "development") {
	apiClient.interceptors.request.use(
		(config) => {
			console.log(
				`API Request: ${config.method?.toUpperCase()} ${config.url}`
			);
			return config;
		},
		(error) => Promise.reject(error)
	);
}

export { apiClient };
export default apiClient;
