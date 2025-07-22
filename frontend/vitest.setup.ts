import "@testing-library/jest-dom/vitest";
import { expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import { cleanup, configure } from "@testing-library/react";
import "jsdom-global/register";
import { server } from "./src/tests/mocks/server";

// Configure React Testing Library for better test stability
configure({
  testIdAttribute: "data-testid",
  asyncUtilTimeout: 3000,
});

// Set up global act for React 18+ compatibility
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Extend Vitest's expect with jest-dom matchers
expect.extend({});

// Note: Global cleanup() is disabled due to test isolation issues
// Tests should handle their own cleanup when needed
// See: https://github.com/vitest-dev/vitest/issues/1430

// Setup MSW
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Canvas polyfill for JSdom
beforeAll(() => {
  // Mock canvas getContext
  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Array(4).fill(0),
    })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({
      data: new Array(4).fill(0),
    })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  }));

  // Mock navigation APIs
  Object.defineProperty(window, "navigator", {
    writable: true,
    value: {
      ...window.navigator,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      maxTouchPoints: 0,
      msMaxTouchPoints: 0,
    },
  });

  // Add support for PointerEvent if not available
  if (!global.PointerEvent) {
    global.PointerEvent = class PointerEvent extends MouseEvent {
      pointerId: number;
      width: number;
      height: number;
      pressure: number;
      tangentialPressure: number;
      tiltX: number;
      tiltY: number;
      twist: number;
      pointerType: string;
      isPrimary: boolean;

      constructor(type: string, params: any = {}) {
        super(type, params);
        this.pointerId = params.pointerId || 0;
        this.width = params.width || 0;
        this.height = params.height || 0;
        this.pressure = params.pressure || 0;
        this.tangentialPressure = params.tangentialPressure || 0;
        this.tiltX = params.tiltX || 0;
        this.tiltY = params.tiltY || 0;
        this.twist = params.twist || 0;
        this.pointerType = params.pointerType || "mouse";
        this.isPrimary = params.isPrimary || false;
      }
    } as any;
  }
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
    forEach: vi.fn(),
    toString: vi.fn(),
  }),
  usePathname: () => "/",
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

// Mock Next.js image component
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // Return a mock img element without JSX
    const img = {
      type: "img",
      props: { ...props, alt: props.alt },
    };
    return img;
  },
}));

// Mock environment variables for test
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    NODE_ENV: "test",
    NEXT_PUBLIC_API_URL: "http://localhost:8000",
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia for responsive components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo for components that use it
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: vi.fn(),
});

// Mock fetch for API integration tests
global.fetch = vi.fn();

// Mock the config to use test-friendly URLs
vi.mock("@/lib/config", () => ({
  config: {
    apiBaseUrl: "/api",
    internalApiUrl: "http://localhost:8000/api",
    swaggerUrl: "/swagger",
    isProduction: false,
  },
}));

// Mock the API client to work properly in tests
vi.mock("@/lib/api/client", async () => {
  const axios = (await vi.importActual("axios")) as any;
  const mockClient = axios.default.create({
    baseURL: "http://localhost:8000",
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    withCredentials: true,
  });

  return {
    apiClient: mockClient,
    default: mockClient,
  };
});

// Console helpers for testing
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render is no longer supported")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
