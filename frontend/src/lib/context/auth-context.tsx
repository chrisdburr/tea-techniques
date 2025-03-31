"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api/client';

// Define the user type
interface User {
  id: number;
  username: string;
  email: string;
  isStaff: boolean;
}

// Define the context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  checkAuthStatus: async () => {},
});

// Create a provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check auth status automatically on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Function to check if the user is already authenticated
  const checkAuthStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // We'll check by trying to fetch the current user info
      const response = await apiClient.get('/api/auth/user');
      setUser(response.data);
      setIsLoading(false);
    } catch (error) {
      console.log('Not authenticated or could not verify authentication status');
      setUser(null);
      setIsLoading(false);
    }
  };

  // Function to log in
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, get CSRF token if needed
      await apiClient.get('/api/auth/csrf');
      
      // Then login
      const response = await apiClient.post('/api/auth/login', {
        username,
        password,
      });
      
      setUser(response.data);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || 'Authentication failed');
      setIsLoading(false);
      throw error;
    }
  };

  // Function to log out
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await apiClient.post('/api/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a redirectToAdmin helper
  const redirectToAdmin = () => {
    // This function will redirect users to the Django admin login page
    // which is useful for simple authentication scenarios
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create a hook for using the auth context
export const useAuth = () => useContext(AuthContext);