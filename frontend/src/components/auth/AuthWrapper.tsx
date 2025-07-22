// src/components/auth/AuthWrapper.tsx
"use client";

import React from "react";
import { getFeatureFlags } from "@/lib/config/dataConfig";
import { AuthProvider } from "@/lib/context/auth-context";

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

  return <AuthProvider>{children}</AuthProvider>;
}
