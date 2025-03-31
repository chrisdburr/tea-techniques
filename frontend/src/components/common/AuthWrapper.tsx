"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { Button } from '@/components/ui/button';

interface AuthWrapperProps {
  children: React.ReactNode;
  authRequired?: boolean;
  adminOnly?: boolean;
}

export default function AuthWrapper({ 
  children, 
  authRequired = false,
  adminOnly = false
}: AuthWrapperProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect after loading is complete
    if (!isLoading) {
      if (authRequired && !isAuthenticated) {
        // If auth is required but user is not authenticated
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (adminOnly && (!isAuthenticated || !user?.isStaff)) {
        // If admin is required but user is not admin
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, authRequired, adminOnly, router, pathname, user]);

  // Show loading state
  if (isLoading && (authRequired || adminOnly)) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-300 border-t-primary rounded-full mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (!isLoading && authRequired && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to access this page. Please log in with your credentials.
          </p>
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={() => router.push(`/login?redirect=${encodeURIComponent(pathname)}`)}
              className="w-full"
            >
              Log in
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/admin'}
              className="w-full"
            >
              Go to Admin Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If admin is required but user is not admin
  if (!isLoading && adminOnly && (!isAuthenticated || !user?.isStaff)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="text-muted-foreground mb-6">
            This page is only accessible to administrators.
          </p>
          <Button variant="outline" onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Otherwise, render the children
  return <>{children}</>;
}