import axios, {
	AxiosInstance,
	InternalAxiosRequestConfig,
	AxiosResponse,
	AxiosError,
} from "axios";

// Define a more specific error interface
interface APIErrorResponse {
	detail?: string;
	// Add other potential error fields
}

// Custom error class for API errors
export class APIError extends Error {
	status?: number;
	details?: APIErrorResponse;

	constructor(message: string, status?: number, details?: APIErrorResponse) {
		super(message);
		this.name = "APIError";
		this.status = status;
		this.details = details;
	}
}

// Create axios instance
const createAPIClient = (
	baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || ""
): AxiosInstance => {
	const instance = axios.create({
		baseURL,
		timeout: 10000, // 10 seconds
		headers: {
			"Content-Type": "application/json",
		},
	});

	// Request interceptor
	instance.interceptors.request.use(
		(config: InternalAxiosRequestConfig) => {
			// Add authentication token if available
			const token =
				typeof window !== "undefined"
					? localStorage.getItem("authToken")
					: null;

			if (token) {
				config.headers["Authorization"] = `Bearer ${token}`;
			}
			return config;
		},
		(error) => Promise.reject(error)
	);

	// Response interceptor
	instance.interceptors.response.use(
		(response: AxiosResponse) => response,
		(error: AxiosError<APIErrorResponse>) => {
			// Transform axios errors into a more manageable format
			if (error.response) {
				// The request was made and the server responded with a status code
				throw new APIError(
					error.response.data?.detail || "An error occurred",
					error.response.status,
					error.response.data
				);
			} else if (error.request) {
				// The request was made but no response was received
				throw new APIError("No response received from server", 0);
			} else {
				// Something happened in setting up the request
				throw new APIError("Error setting up the request", 0);
			}
		}
	);

	return instance;
};

// Export a default client and the creator function
export const apiClient = createAPIClient();
export default createAPIClient;
