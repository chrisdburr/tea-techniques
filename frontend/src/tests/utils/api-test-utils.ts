import { vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  mockTechniques,
  mockTechniquesList,
  mockAssuranceGoals,
} from "../fixtures/techniques";
import type { TechniqueFormData } from "../../lib/types";

// API endpoint constants
export const API_ENDPOINTS = {
  TECHNIQUES: "/api/techniques/",
  TECHNIQUE_DETAIL: (slug: string) => `/api/techniques/${slug}/`,
  ASSURANCE_GOALS: "/api/assurance-goals/",
  TAGS: "/api/tags/",
  SEARCH: "/api/search/",
} as const;

// Base API response builder
export const createApiResponse = <T>(
  data: T,
  status = 200,
  headers: Record<string, string> = {},
): Response => {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: new Headers({
      "content-type": "application/json",
      ...headers,
    }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    clone: () => createApiResponse(data, status, headers),
  } as Response;

  return response;
};

// Mock API handlers for common scenarios
export const mockApiHandlers = {
  // Technique endpoints
  getTechniques: () => {
    return createApiResponse(mockTechniquesList);
  },

  getTechniqueBySlug: (
    slug: string,
    technique = mockTechniques.find((t) => t.slug === slug),
  ) => {
    if (!technique) {
      return createApiResponse({ error: "Technique not found" }, 404);
    }
    return createApiResponse(technique);
  },

  createTechnique: (technique: TechniqueFormData) => {
    const newTechnique = { ...technique, slug: `technique-${Date.now()}` };
    return createApiResponse(newTechnique, 201);
  },

  updateTechnique: (slug: string, updates: Partial<TechniqueFormData>) => {
    const technique = mockTechniques.find((t) => t.slug === slug);
    if (!technique) {
      return createApiResponse({ error: "Technique not found" }, 404);
    }
    const updated = { ...technique, ...updates };
    return createApiResponse(updated);
  },

  deleteTechnique: () => {
    return createApiResponse({}, 204);
  },

  // Search endpoints
  searchTechniques: (query: string, results = mockTechniques.slice(0, 2)) => {
    const filtered = results.filter(
      (t) =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.description.toLowerCase().includes(query.toLowerCase()),
    );
    return createApiResponse({
      count: filtered.length,
      results: filtered,
    });
  },

  // Reference data endpoints
  getAssuranceGoals: () => {
    return createApiResponse(mockAssuranceGoals);
  },

  // Error scenarios
  serverError: () => {
    return createApiResponse({ error: "Internal server error" }, 500);
  },

  networkError: () => {
    return Promise.reject(new Error("Network error"));
  },

  timeoutError: () => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), 100);
    });
  },
};

// API mock setup utility
export class ApiMocker {
  private mockFetch: ReturnType<typeof vi.fn>;
  private handlers: Map<
    string,
    (url: string, options?: RequestInit) => Promise<Response>
  >;

  constructor() {
    this.mockFetch = vi.fn();
    this.handlers = new Map();
    global.fetch = this.mockFetch;
  }

  // Register handlers for specific endpoints
  onGet(pattern: string | RegExp, handler: () => Promise<Response> | Response) {
    this.handlers.set(`GET:${pattern.toString()}`, async (url, options) => {
      if (
        this.matchesPattern(url, pattern) &&
        (!options?.method || options.method === "GET")
      ) {
        return await handler();
      }
      throw new Error(`No handler found for GET ${url}`);
    });
    return this;
  }

  onPost<T = unknown>(
    pattern: string | RegExp,
    handler: (body?: T) => Promise<Response> | Response,
  ) {
    this.handlers.set(`POST:${pattern.toString()}`, async (url, options) => {
      if (this.matchesPattern(url, pattern) && options?.method === "POST") {
        const body = options.body
          ? (JSON.parse(options.body as string) as T)
          : undefined;
        return await handler(body);
      }
      throw new Error(`No handler found for POST ${url}`);
    });
    return this;
  }

  onPut<T = unknown>(
    pattern: string | RegExp,
    handler: (body?: T) => Promise<Response> | Response,
  ) {
    this.handlers.set(`PUT:${pattern.toString()}`, async (url, options) => {
      if (this.matchesPattern(url, pattern) && options?.method === "PUT") {
        const body = options.body
          ? (JSON.parse(options.body as string) as T)
          : undefined;
        return await handler(body);
      }
      throw new Error(`No handler found for PUT ${url}`);
    });
    return this;
  }

  onDelete(
    pattern: string | RegExp,
    handler: () => Promise<Response> | Response,
  ) {
    this.handlers.set(`DELETE:${pattern.toString()}`, async (url, options) => {
      if (this.matchesPattern(url, pattern) && options?.method === "DELETE") {
        return await handler();
      }
      throw new Error(`No handler found for DELETE ${url}`);
    });
    return this;
  }

  // Execute the mock based on registered handlers
  execute() {
    this.mockFetch.mockImplementation(
      async (url: string, options?: RequestInit) => {
        const method = options?.method || "GET";

        for (const [key, handler] of this.handlers) {
          if (key.startsWith(`${method}:`)) {
            try {
              return await handler(url, options);
            } catch {
              // Continue to next handler if this one doesn't match
              continue;
            }
          }
        }

        // If no handler matches, return a 404
        return createApiResponse(
          { error: `No handler found for ${method} ${url}` },
          404,
        );
      },
    );
  }

  private matchesPattern(url: string, pattern: string | RegExp): boolean {
    if (typeof pattern === "string") {
      return url.includes(pattern);
    }
    return pattern.test(url);
  }

  // Cleanup
  reset() {
    this.handlers.clear();
    this.mockFetch.mockReset();
  }

  restore() {
    vi.restoreAllMocks();
  }
}

// Convenience function for creating API mockers
export const createApiMocker = () => new ApiMocker();

// Pre-configured scenarios for common test cases
export const mockApiScenarios = {
  // Happy path - all APIs working
  allWorking: () => {
    const mocker = createApiMocker();
    mocker
      .onGet(API_ENDPOINTS.TECHNIQUES, () => mockApiHandlers.getTechniques())
      .onGet(/\/api\/techniques\/[a-z0-9-]+\//, () =>
        mockApiHandlers.getTechniqueBySlug("shapley-additive-explanations"),
      )
      .onGet(API_ENDPOINTS.ASSURANCE_GOALS, () =>
        mockApiHandlers.getAssuranceGoals(),
      )
      .execute();
    return mocker;
  },

  // Empty state - no data available
  emptyState: () => {
    const mocker = createApiMocker();
    mocker
      .onGet(API_ENDPOINTS.TECHNIQUES, () =>
        createApiResponse({ count: 0, results: [] }),
      )
      .onGet(API_ENDPOINTS.ASSURANCE_GOALS, () => createApiResponse([]))
      .execute();
    return mocker;
  },

  // Error state - server errors
  serverErrors: () => {
    const mocker = createApiMocker();
    mocker
      .onGet(API_ENDPOINTS.TECHNIQUES, () => mockApiHandlers.serverError())
      .onGet(/\/api\/techniques\/[a-z0-9-]+\//, () =>
        mockApiHandlers.serverError(),
      )
      .execute();
    return mocker;
  },

  // Loading state - delayed responses
  slowResponses: () => {
    const mocker = createApiMocker();
    mocker
      .onGet(
        API_ENDPOINTS.TECHNIQUES,
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockApiHandlers.getTechniques()), 2000),
          ),
      )
      .execute();
    return mocker;
  },
};

// QueryClient factory for tests
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
};

// Utility for waiting for queries to settle
export const waitForQueriesToSettle = async (queryClient: QueryClient) => {
  await queryClient
    .getQueryCache()
    .findAll()
    .forEach((query) => {
      if (query.state.fetchStatus === "fetching") {
        return new Promise((resolve) => {
          const unsubscribe = query.subscribe(() => {
            if (query.state.fetchStatus !== "fetching") {
              unsubscribe();
              resolve(undefined);
            }
          });
        });
      }
    });
};
