import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Note: Middleware runs on the edge runtime, so we can't import from lib/config
// We need to check environment variables directly
const isStaticMode = () => {
  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || "api";
  return dataSource === "static" || dataSource === "mock";
};

// Pages that require authentication
const authRequiredPages = [
  "/login",
  "/techniques/add",
  "/techniques/*/edit", // Using * for dynamic segments in middleware
];

// Pages that require API connectivity
const apiRequiredPages = ["/api-test", ...authRequiredPages];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // In static mode, redirect auth/API pages to home
  if (isStaticMode()) {
    const isExcludedPage = apiRequiredPages.some((pattern) => {
      // Convert route pattern to regex
      const regex = pattern.replace(/\*/g, "[^/]+");
      return new RegExp(`^${regex}$`).test(pathname);
    });

    if (isExcludedPage) {
      // Redirect to home page with a message
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set(
        "message",
        "This feature is not available in static mode",
      );
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
