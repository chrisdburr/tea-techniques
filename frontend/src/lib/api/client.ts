// src/lib/api/client.ts
import axios, {
	AxiosInstance,
	InternalAxiosRequestConfig,
	AxiosResponse,
	AxiosError,
} from "axios";
import { config } from "@/lib/config";

// Define a more specific error interface
interface APIErrorResponse {
	detail?: string;
	errors?: Record<string, string[]>;
	status_code?: number;
	error_type?: string;
}

// Custom error class for API errors
export class APIError extends Error {
	status?: number;
	details?: APIErrorResponse;
	fieldErrors?: Record<string, string>;

	constructor(message: string, status?: number, details?: APIErrorResponse) {
		super(message);
		this.name = "APIError";
		this.status = status;
		this.details = details;

		// Extract field errors for form validation
		if (details?.errors) {
			this.fieldErrors = Object.entries(details.errors).reduce(
				(acc, [key, errors]) => {
					acc[key] = Array.isArray(errors)
						? errors[0]
						: String(errors);
					return acc;
				},
				{} as Record<string, string>
			);
		}
	}
}

// Create axios instance
const createAPIClient = (
	baseURL: string = config.apiBaseUrl
): AxiosInstance => {
	const instance = axios.create({
		baseURL,
		timeout: 15000, // 15 seconds - increased for development
		headers: {
			"Content-Type": "application/json",
		},
		withCredentials: true, // Important for cookies/authentication
	});

	// Request interceptor
	instance.interceptors.request.use(
		(config: InternalAxiosRequestConfig) => {
			// For development, log the request (remove in production)
			if (process.env.NODE_ENV === "development") {
				console.log(
					`API Request: ${config.method?.toUpperCase()} ${
						config.url
					}`,
					config.params || config.data || {}
				);
			}

			// Add authentication token if available
			const token =
				typeof window !== "undefined"
					? localStorage.getItem("authToken")
					: null;

			if (token) {
				config.headers["Authorization"] = `Bearer ${token}`;
			}

			// Add CSRF token from cookie if available
			const csrfToken =
				typeof document !== "undefined"
					? document.cookie
							.split("; ")
							.find((row) => row.startsWith("csrftoken="))
							?.split("=")[1]
					: null;

			if (csrfToken) {
				config.headers["X-CSRFToken"] = csrfToken;
			}

			return config;
		},
		(error) => Promise.reject(error)
	);

	// Response interceptor
	instance.interceptors.response.use(
		(response: AxiosResponse) => {
			// For development, log the response (remove in production)
			if (process.env.NODE_ENV === "development") {
				console.log(
					`API Response: ${response.status} ${response.config.url}`,
					response.data
				);
			}
			return response;
		},
		(error: AxiosError<APIErrorResponse>) => {
			// For development, log the error (remove in production)
			if (process.env.NODE_ENV === "development") {
				console.error(
					"API Error:",
					error.response?.status,
					error.response?.data
				);
			}

			if (error.response) {
				// Server responded with error status
				const message =
					error.response.data?.detail || "Server error occurred";

				throw new APIError(
					message,
					error.response.status,
					error.response.data
				);
			} else if (error.request) {
				// Request made but no response received
				throw new APIError(
					"No response received from server. Please check your network connection."
				);
			} else {
				// Error in request setup
				throw new APIError(
					error.message || "Error setting up the request"
				);
			}
		}
	);

	return instance;
};

// Export a default client and the creator function
export const apiClient = createAPIClient();
export default createAPIClient;
