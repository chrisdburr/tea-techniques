/**
 * Page configuration for conditional generation based on deployment mode
 */

import { getDataConfig, isStaticMode } from "./dataConfig";

/**
 * Pages that require authentication and should be excluded in static mode
 */
export const authRequiredPages = [
  "/login",
  "/techniques/add",
  "/techniques/[slug]/edit",
] as const;

/**
 * Pages that require API connectivity and should be excluded in static mode
 */
export const apiRequiredPages = ["/api-test", ...authRequiredPages] as const;

/**
 * Check if a page should be included in the current build mode
 */
export function shouldIncludePage(pathname: string): boolean {
  if (!isStaticMode()) {
    // In dynamic mode, include all pages
    return true;
  }

  // In static mode, exclude auth and API-required pages
  const excludedPages = [...apiRequiredPages];

  // Check if the pathname matches any excluded pattern
  return !excludedPages.some((pattern) => {
    // Handle dynamic routes like [slug]
    const regex = pattern.replace(/\[([^\]]+)\]/g, "[^/]+");
    return new RegExp(`^${regex}$`).test(pathname);
  });
}

/**
 * Get a list of all pages that should be generated in the current mode
 */
export function getGeneratablePages(): string[] {
  const allPages = [
    "/",
    "/about",
    "/categories",
    "/techniques",
    // Dynamic pages will be handled by generateStaticParams
  ];

  if (!isStaticMode()) {
    // Add auth and API pages in dynamic mode
    allPages.push("/login", "/api-test", "/techniques/add");
  }

  return allPages;
}

/**
 * Configuration for page generation
 */
export const pageConfig = {
  // Pages that should always be statically generated
  staticPages: ["/", "/about", "/categories", "/techniques"],

  // Pages that require authentication
  authPages: authRequiredPages,

  // Pages that require API connectivity
  apiPages: apiRequiredPages,

  // Check if page should be included
  shouldInclude: shouldIncludePage,

  // Get generatable pages
  getPages: getGeneratablePages,
};
