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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_baseURL: string = config.apiBaseUrl
): AxiosInstance => {
	// Get the environment for debugging
	const isDocker = process.env.DOCKER_ENV === 'true';
	const isServer = typeof window === 'undefined';
	
	// IMPORTANT: Access the environment variable directly for logging
	console.log(`API Configuration:
		- NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL}
		- Docker Environment: ${isDocker ? 'Yes' : 'No'}
		- Running on: ${isServer ? 'Server' : 'Client'}
		- Config apiBaseUrl: ${config.apiBaseUrl}
	`);
	
	// Try using the absolute URL for the API endpoint when in development
	const fullBaseURL = isServer ? 
		(isDocker ? 'http://backend:8000/api' : 'http://localhost:8000/api') : 
		'/api';
		
	console.log(`Using baseURL: ${fullBaseURL} (server: ${isServer}, docker: ${isDocker})`);
	
	const instance = axios.create({
		baseURL: fullBaseURL,
		timeout: 30000, // 30 seconds - increased for troubleshooting
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		// Turn off withCredentials to avoid CORS issues
		withCredentials: false,
		// Allow a reasonable number of redirects (but log them)
		maxRedirects: 5,
		// Explicitly check status
		validateStatus: (status) => {
			console.log(`Received status code: ${status}`);
			return status >= 200 && status < 300;
		}
	});

	// Request interceptor
	instance.interceptors.request.use(
		(config: InternalAxiosRequestConfig) => {
			// Always log the request for debugging this issue
			console.log(
				`API Request: ${config.method?.toUpperCase()} ${
					config.url
				} (baseURL: ${config.baseURL})`,
				config.params || config.data || {}
			);

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
			// Log the successful response
			console.log(
				`API Response: ${response.status} ${response.config.url}`,
				response.data
			);
			return response;
		},
		(error: AxiosError<APIErrorResponse>) => {
			// Log all errors for debugging
			console.error(
				"API Error:",
				error.message,
				error.response?.status,
				error.response?.data
			);

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