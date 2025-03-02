// src/lib/hooks/useApiError.ts
import { useState } from 'react';
import axios, { AxiosError } from 'axios';

interface ApiErrorState {
  message: string;
  details?: Record<string, string[]>;
  statusCode?: number;
}

export function useApiError() {
  const [error, setError] = useState<ApiErrorState | null>(null);

  const handleError = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<Record<string, unknown>>;
      
      // Extract status code
      const statusCode = axiosError.response?.status;
      
      // Handle different types of API error responses
      if (axiosError.response?.data) {
        const responseData = axiosError.response.data;
        
        // Handle Django REST Framework validation errors
        if (typeof responseData === 'object' && responseData !== null) {
          // Case 1: DRF validation errors with field-specific messages
          if (Object.keys(responseData).some(key => 
            Array.isArray(responseData[key]) && 
            responseData[key].length > 0 && 
            typeof responseData[key][0] === 'string'
          )) {
            setError({
              message: "Validation error",
              details: responseData as Record<string, string[]>,
              statusCode
            });
            return;
          }
          
          // Case 2: DRF error with 'detail' field
          if (responseData.detail) {
            setError({
              message: responseData.detail,
              statusCode
            });
            return;
          }
          
          // Case 3: Other structured error
          if (responseData.message) {
            setError({
              message: responseData.message,
              statusCode
            });
            return;
          }
        }
        
        // Case 4: Plain string error
        if (typeof responseData === 'string') {
          setError({
            message: responseData,
            statusCode
          });
          return;
        }
      }
      
      // Fallback for network errors or other axios errors
      setError({
        message: axiosError.message || 'An unexpected error occurred',
        statusCode
      });
    } else if (err instanceof Error) {
      // Handle regular JS errors
      setError({
        message: err.message || 'An unexpected error occurred'
      });
    } else {
      // Handle unknown errors
      setError({
        message: 'An unknown error occurred'
      });
    }
  };

  const clearError = () => setError(null);

  return {
    error,
    handleError,
    clearError
  };
}