'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

// Define types for the API details
interface ApiClientDetails {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export default function ApiTestPage() {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiDetails, setApiDetails] = useState<ApiClientDetails>({});

  useEffect(() => {
    const testApi = async () => {
      try {
        setLoading(true);
        // Log API client details
        setApiDetails({
          baseURL: apiClient.defaults.baseURL,
          timeout: apiClient.defaults.timeout,
          headers: apiClient.defaults.headers as Record<string, string>
        });
        
        // Use our configured API client
        const response = await apiClient.get('/api/techniques/');
        console.log('API Response:', response.data);
        setCount(response.data.count);
        setError(null);
      } catch (err: unknown) {
        console.error('API Error:', err);
        
        // Simplified error handling for TypeScript compatibility
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Unknown error occurred';
        
        setError(`API Error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    testApi();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h2 className="font-bold">Error:</h2>
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}
      
      {count !== null && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">API Connected Successfully!</p>
          <p>Found {count} techniques</p>
        </div>
      )}
      
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-2">Debugging Information:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify({
            environment: {
              NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
              NODE_ENV: process.env.NODE_ENV,
              BACKEND_URL: process.env.BACKEND_URL,
            },
            apiClient: apiDetails
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}