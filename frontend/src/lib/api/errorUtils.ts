import axios, { AxiosError } from "axios";

// Types for standardized error logging
interface ErrorLogDetails {
  hookName: string;
  type: string;
  message: string;
  statusCode?: number;
  responseData?: unknown;
  requestInfo?: {
    method?: string;
    url?: string;
    params?: unknown;
    data?: unknown;
  };
}

/**
 * Enhanced error logger for API errors that provides structured logging
 * and detailed information about the error context.
 */
export function logApiError(hookName: string, error: unknown): void {
  // Base error log object
  const errorLog: ErrorLogDetails = {
    hookName,
    type: "UnknownError",
    message: "Unknown error occurred",
  };

  // Process Axios errors
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    // Update error type and message
    errorLog.type = "AxiosError";
    errorLog.message = axiosError.message;

    // Add request details if available
    if (axiosError.config) {
      errorLog.requestInfo = {
        method: axiosError.config.method?.toUpperCase(),
        url: axiosError.config.url,
        params: axiosError.config.params,
        data: axiosError.config.data,
      };
    }

    // Add response details if available
    if (axiosError.response) {
      errorLog.statusCode = axiosError.response.status;
      errorLog.responseData = axiosError.response.data;

      // Improve error type based on status code
      if (
        axiosError.response.status >= 400 &&
        axiosError.response.status < 500
      ) {
        errorLog.type = "ClientError";
      } else if (axiosError.response.status >= 500) {
        errorLog.type = "ServerError";
      }

      // Try to extract standardized error type if available
      if (
        axiosError.response.data &&
        typeof axiosError.response.data === "object" &&
        axiosError.response.data !== null &&
        "error_type" in axiosError.response.data &&
        typeof axiosError.response.data.error_type === "string"
      ) {
        errorLog.type = axiosError.response.data.error_type;
      }
    } else if (axiosError.request) {
      // Request was made but no response received (likely network issue)
      errorLog.type = "NetworkError";
    }
  } else if (error instanceof Error) {
    // Handle standard JS errors
    errorLog.type = error.name;
    errorLog.message = error.message;
  } else if (error !== null && error !== undefined) {
    // Handle non-standard error objects
    errorLog.message = String(error);
  }

  // Log the structured error details
  console.error(
    `[API Error][${errorLog.hookName}] ${errorLog.type}: ${errorLog.message}`,
    {
      details: errorLog,
      originalError: error,
    },
  );

  // Add extra logging for unexpected error formats to help with debugging
  if (
    errorLog.responseData &&
    typeof errorLog.responseData === "object" &&
    errorLog.responseData !== null &&
    !("detail" in errorLog.responseData) &&
    !("error_type" in errorLog.responseData) &&
    !("errors" in errorLog.responseData)
  ) {
    console.warn(
      `[API Error][${errorLog.hookName}] Unexpected error format detected:`,
      errorLog.responseData,
    );
  }
}
