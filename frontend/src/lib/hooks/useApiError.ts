// src/lib/hooks/useApiError.ts

import { useState } from "react";
import axios, { AxiosError } from "axios";

interface ApiErrorState {
	message: string;
	details?: Record<string, string[]>;
	statusCode?: number;
	errorType?: string;
}

/**
 * Standardized backend error format:
 * {
 *   "detail": "Human-readable error message",
 *   "status_code": 400,
 *   "error_type": "ValidationError",
 *   "errors": {} | null (field-specific errors when applicable)
 * }
 */
interface StandardizedApiError {
	detail: string;
	status_code: number;
	error_type: string;
	errors: Record<string, string[]> | null;
}

export function useApiError() {
	const [error, setError] = useState<ApiErrorState | null>(null);

	const handleError = (err: unknown) => {
		if (axios.isAxiosError(err)) {
			const axiosError = err as AxiosError<unknown>;
			const statusCode = axiosError.response?.status;

			// Network or request cancellation errors
			if (!axiosError.response) {
				setError({
					message: axiosError.message || "Network error occurred",
					statusCode: 0, // No status code for network errors
					errorType: "NetworkError",
				});
				console.error("[API Error] Network error:", axiosError);
				return;
			}

			// Response exists, try to parse the data
			try {
				const responseData = axiosError.response.data;

				// Handle standardized backend error format
				if (
					typeof responseData === "object" &&
					responseData !== null &&
					"detail" in responseData &&
					"status_code" in responseData &&
					"error_type" in responseData
				) {
					// We have a standardized error format
					const standardError = responseData as StandardizedApiError;

					setError({
						message: standardError.detail,
						details: standardError.errors || undefined,
						statusCode: standardError.status_code,
						errorType: standardError.error_type,
					});

					// Log for debugging but with sensitive context
					console.error(
						`[API Error] ${standardError.error_type}: ${standardError.detail}`,
						standardError.errors
							? { fieldErrors: standardError.errors }
							: ""
					);
					return;
				}

				// Handle legacy/non-standardized error formats

				// Case 1: DRF validation errors with field-specific messages
				if (
					typeof responseData === "object" &&
					responseData !== null &&
					// Ensure responseData is treated as an indexable object for this check
					Object.keys(responseData).some((key) => {
						const value = (responseData as Record<string, unknown>)[
							key
						]; // Access safely
						return (
							Array.isArray(value) &&
							value.length > 0 &&
							typeof value[0] === "string"
						);
					})
				) {
					setError({
						message: "Validation error",
						// Assert type here as well for assignment
						details: responseData as Record<string, string[]>,
						statusCode,
						errorType: "ValidationError",
					});
					console.error(
						"[API Error] Validation error:",
						responseData
					);
					return;
				}

				// Case 2: Simple error with 'detail' or 'message' field
				if (typeof responseData === "object" && responseData !== null) {
					// Check for typical DRF error fields
					if (
						"detail" in responseData &&
						typeof responseData.detail === "string"
					) {
						setError({
							message: responseData.detail,
							statusCode,
							errorType: "APIError",
						});
						console.error(
							`[API Error] Detail error: ${responseData.detail}`
						);
						return;
					}

					// Check for message field
					if ("message" in responseData && responseData.message) {
						setError({
							message: String(responseData.message),
							statusCode,
							errorType: "APIError",
						});
						console.error(
							`[API Error] Message error: ${responseData.message}`
						);
						return;
					}
				}

				// Case 3: Plain string error
				if (typeof responseData === "string") {
					setError({
						message: responseData,
						statusCode,
						errorType: "APIError",
					});
					console.error(`[API Error] String error: ${responseData}`);
					return;
				}

				// Unhandled error format - log it for debugging
				console.error(
					"[API Error] Unparseable error format:",
					responseData
				);

				// Fallback for unknown response format
				setError({
					message: `Error ${statusCode}: Request failed`,
					statusCode,
					errorType: "UnknownError",
				});
			} catch (parseError) {
				// Error while trying to process the error response
				console.error(
					"[API Error] Error parsing error response:",
					parseError
				);
				setError({
					message:
						"An error occurred while processing the server response",
					statusCode,
					errorType: "ParseError",
				});
			}
		} else if (err instanceof Error) {
			// Handle regular JS errors
			setError({
				message: err.message || "An unexpected error occurred",
				errorType: err.name,
			});
			console.error(`[API Error] JS Error (${err.name}):`, err.message);
		} else {
			// Handle truly unknown errors
			console.error("[API Error] Unknown error type:", err);
			setError({
				message: "An unknown error occurred",
				errorType: "UnknownError",
			});
		}
	};

	const clearError = () => setError(null);

	return {
		error,
		handleError,
		clearError,
	};
}
