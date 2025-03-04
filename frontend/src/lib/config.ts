// frontend/src/lib/config.ts

interface Config {
  apiBaseUrl: string;
  swaggerUrl: string;
}

// Always prefer environment variables if available
const getApiBaseUrl = (): string => {
  // Server-side or client-side rendering, try environment variables first
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  }
  
  // Client-side - use window.ENV if it exists (runtime variables), 
  // otherwise fall back to build-time env
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
};

const getSwaggerUrl = (): string => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SWAGGER_URL || 'http://localhost:8000/swagger/';
  }
  
  return process.env.NEXT_PUBLIC_SWAGGER_URL || 'http://localhost:8000/swagger/';
};

export const config: Config = {
  apiBaseUrl: getApiBaseUrl(),
  swaggerUrl: getSwaggerUrl()
};