// src/lib/api/fetch.ts

// Define the possible API environments
type ApiEnvironment = 'client' | 'server';

/**
 * Determine the current environment (client or server)
 */
function getEnvironment(): ApiEnvironment {
  return typeof window === 'undefined' ? 'server' : 'client';
}

/**
 * Get the appropriate base URL for API requests based on environment
 */
function getBaseUrl(): string {
  const environment = getEnvironment();
  
  if (environment === 'server') {
    // Use direct backend URL when running on the server
    const backendUrl = process.env.BACKEND_URL || 'http://backend:8000';
    console.log(`[fetchApi] Server-side request using backend URL: ${backendUrl}`);
    return backendUrl;
  }
  
  // In the browser, use relative URLs that will be handled by Next.js rewrites
  console.log('[fetchApi] Client-side request using relative URL');
  return '';
}

/**
 * Fetch API function with enhanced error handling and environment awareness
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const baseUrl = getBaseUrl();
  // Ensure no double slashes and include the base URL if we're on the server
  const url = `${baseUrl}/api/${endpoint.replace(/^\/+/, '')}`;
  
  console.log(`[fetchApi] Environment: ${getEnvironment()}, Requesting: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    });
    
    // Log status for debugging
    console.log(`[fetchApi] Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      // Try to get more detailed error information
      let errorText = '';
      try {
        errorText = await response.text();
        console.error(`[fetchApi] Error details: ${errorText.substring(0, 500)}${errorText.length > 500 ? '...' : ''}`);
      } catch (e) {
        console.error(`[fetchApi] Could not read error details: ${e}`);
      }
      
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`[fetchApi] Request failed:`, error);
    throw error;
  }
}