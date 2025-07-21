// src/components/auth/AuthWrapper.tsx
"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { getFeatureFlags } from "@/lib/config/dataConfig";

// Dynamically import the AuthProvider to reduce bundle size in static mode
const AuthProvider = dynamic(
  () =>
    import("@/lib/context/auth-context").then((mod) => ({
      default: mod.AuthProvider,
    })),
  {
    ssr: false,
    loading: () => <div>Loading auth...</div>,
  },
);

interface AuthWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper that conditionally loads authentication components
 * In static mode, skips auth entirely to reduce bundle size
 */
export function AuthWrapper({ children }: AuthWrapperProps) {
  const featureFlags = getFeatureFlags();

  // In static mode, don't load auth components at all
  if (!featureFlags.enableAuth) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<div>Loading auth...</div>}>
      <AuthProvider>{children}</AuthProvider>
    </Suspense>
  );
}
