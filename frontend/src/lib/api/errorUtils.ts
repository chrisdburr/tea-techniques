// A type-safe error logger for Axios errors
export function logApiError(hookName: string, error: unknown): void {
  console.error(`[${hookName}] Error:`, error);
  
  // Log more detailed error information in a type-safe way
  if (error && typeof error === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any; // Type assertion for error processing
    
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Response status: ${err.response.status}`);
      console.error(`Response data:`, err.response.data);
      console.error(`Response headers:`, err.response.headers);
    } else if (err.request) {
      // The request was made but no response was received
      console.error(`No response received:`, err.request);
    } else if (err.message) {
      // Something happened in setting up the request
      console.error(`Error setting up request:`, err.message);
    }
  }
}