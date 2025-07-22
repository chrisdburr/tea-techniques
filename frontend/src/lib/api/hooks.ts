// src/lib/api/hooks.ts
import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { logApiError } from "@/lib/api/errorUtils";
import { getDataService } from "@/lib/services/dataServiceFactory";
import { getDataConfig } from "@/lib/config/dataConfig";
import { getSearchService } from "@/lib/services/searchService";
import type { Technique, TechniqueFormData } from "@/lib/types";

interface QueryParams {
  search?: string;
  assurance_goal?: string;
  assurance_goals?: string | string[];
  tags?: string | string[];
  complexity_min?: string;
  complexity_max?: string;
  computational_cost_min?: string;
  computational_cost_max?: string;
  [key: string]: string | string[] | undefined;
}

/**
 * Calculate the total number of pages based on item count and page size
 *
 * @param totalItems - The total number of items across all pages
 * @param pageSize - The number of items per page (defaults to 20)
 * @returns The total number of pages (minimum 1)
 */
const calculateTotalPages = (
  totalItems: number,
  pageSize: number = 20,
): number => {
  return totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
};

/**
 * Helper function to fetch data from API endpoints with consistent URL handling
 *
 * This function provides a standardized way to access API endpoints,
 * ensuring URLs align with backend configuration (no trailing slashes).
 *
 * @param path - The API path to fetch from (starting with /api)
 * @param params - Optional query parameters
 * @returns Promise resolving to the requested data
 * @throws Error if the API call fails
 */
const fetchAPI = async <T>(
  path: string,
  params?: Record<string, string | number | string[]>,
): Promise<T> => {
  try {
    // For Next.js rewrites to work correctly, we need to ensure paths start with /api
    // and keep any trailing slashes intact to match Django DRF configuration
    let normalizedPath = path;

    // If path doesn't start with /api, add it
    if (!normalizedPath.startsWith("/api")) {
      normalizedPath = `/api${
        normalizedPath.startsWith("/") ? "" : "/"
      }${normalizedPath}`;
    }

    console.log(`API Request to: ${normalizedPath}`);

    // Make the request with the properly formatted path
    const response = await apiClient.get(normalizedPath, { params });
    return response.data as T;
  } catch (error) {
    console.error(`API request failed for path: ${path}`, error);
    // Error will be logged by logApiError in the calling function
    throw error;
  }
};

// Base data fetching hooks

/**
 * Hook for fetching assurance goals
 * Uses the data service layer for hybrid static/dynamic support
 *
 * @returns Query object with assurance goals data
 */
export const useAssuranceGoals = () => {
  const config = getDataConfig();

  return useQuery({
    queryKey: ["assurance-goals", config.dataSource],
    queryFn: async () => {
      try {
        const dataService = getDataService();
        return await dataService.getAssuranceGoals();
      } catch (error: unknown) {
        logApiError("useAssuranceGoals", error);
        throw error;
      }
    },
  });
};

/**
 * Hook for fetching all tags
 * Uses the data service layer for hybrid static/dynamic support
 *
 * @returns Query object with tags data
 */
export const useTags = () => {
  const config = getDataConfig();

  return useQuery({
    queryKey: ["tags", config.dataSource],
    queryFn: async () => {
      try {
        const dataService = getDataService();
        return await dataService.getTags();
      } catch (error: unknown) {
        logApiError("useTags", error);
        throw error;
      }
    },
  });
};

// New hooks for the resource system
export const useResourceTypes = () => {
  const config = getDataConfig();

  return useQuery({
    queryKey: ["resource-types", config.dataSource],
    queryFn: async () => {
      try {
        const dataService = getDataService();
        return await dataService.getResourceTypes();
      } catch (error: unknown) {
        logApiError("useResourceTypes", error);
        throw error;
      }
    },
  });
};

/**
 * Hook for fetching techniques with filtering, searching, and pagination
 * Uses the data service layer for hybrid static/dynamic support
 *
 * @param params - Query parameters for filtering and searching techniques
 * @param page - Page number for pagination (defaults to 1)
 * @returns Query object with techniques data
 */
export const useTechniques = (params: QueryParams = {}, page: number = 1) => {
  const config = getDataConfig();

  // Prepare filter parameters for the data service
  const serviceParams: Record<string, string | string[]> = {};

  if (params.search) {
    serviceParams.search = params.search;
  }

  // Handle assurance_goals as an array
  if (
    params.assurance_goals &&
    Array.isArray(params.assurance_goals) &&
    params.assurance_goals.length > 0
  ) {
    serviceParams.assurance_goals = params.assurance_goals;
  } else if (params.assurance_goals && params.assurance_goals !== "all") {
    serviceParams.assurance_goals = params.assurance_goals;
  }

  // Handle tags as an array
  if (params.tags && Array.isArray(params.tags) && params.tags.length > 0) {
    serviceParams.tags = params.tags;
  } else if (params.tags && params.tags !== "all") {
    serviceParams.tags = params.tags;
  }

  // Add rating parameters
  if (params.complexity_min) {
    serviceParams.complexity_min = params.complexity_min;
  }
  if (params.complexity_max) {
    serviceParams.complexity_max = params.complexity_max;
  }
  if (params.computational_cost_min) {
    serviceParams.computational_cost_min = params.computational_cost_min;
  }
  if (params.computational_cost_max) {
    serviceParams.computational_cost_max = params.computational_cost_max;
  }

  // Create a comprehensive query key that captures all filter parameters and data source
  const queryKey = [
    "techniques",
    config.dataSource,
    params.search || "",
    // Include all assurance_goals values
    Array.isArray(serviceParams.assurance_goals)
      ? serviceParams.assurance_goals.join(",")
      : serviceParams.assurance_goals || "all",
    // Include all tags values
    Array.isArray(serviceParams.tags)
      ? serviceParams.tags.join(",")
      : serviceParams.tags || "all",
    // Include rating filters
    params.complexity_min || "1",
    params.complexity_max || "5",
    params.computational_cost_min || "1",
    params.computational_cost_max || "5",
    page,
  ];

  console.log("🔍 DEBUG: useTechniques queryKey:", queryKey);

  return useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      try {
        const dataService = getDataService();
        console.log(
          "🔍 DEBUG: useTechniques queryFn called with page:",
          page,
          "serviceParams:",
          serviceParams,
        );
        return await dataService.getTechniques(serviceParams, page);
      } catch (error: unknown) {
        logApiError("useTechniques", error);
        throw error;
      }
    },
    // Ensure query refetches when dependencies change, especially in static mode
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always consider data stale in static mode to ensure refetch
    gcTime: 0, // Don't keep cached data in garbage collection
  });
};

export const useTechniqueDetail = (slug: string) => {
  const config = getDataConfig();

  return useQuery({
    queryKey: ["technique", slug, config.dataSource],
    queryFn: async () => {
      try {
        const dataService = getDataService();
        const data = await dataService.getTechnique(slug);

        // Validate the response
        if (!data.slug || !data.name) {
          throw new Error(`Data service returned malformed data`);
        }

        return data;
      } catch (error: unknown) {
        logApiError("useTechniqueDetail", error);
        throw error;
      }
    },
    enabled: !!slug, // Only run if slug is provided
  });
};

/**
 * Hook for fetching basic details (slug and name) of multiple techniques
 * Used for displaying related techniques with names instead of just slugs
 *
 * @param slugs - Array of technique slugs to fetch
 * @returns Array of query objects with technique basic details
 */
export const useMultipleTechniqueNames = (slugs: string[]) => {
  const config = getDataConfig();

  const queries = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: ["technique-name", slug, config.dataSource],
      queryFn: async () => {
        try {
          // Use data service instead of direct API fetch for hybrid static/dynamic support
          const dataService = getDataService();
          const data = await dataService.getTechnique(slug);

          // Return only the data we need for related techniques display
          return {
            slug: data.slug,
            name: data.name,
            acronym: data.acronym,
          };
        } catch (error: unknown) {
          console.warn(
            `Failed to fetch technique name for slug "${slug}":`,
            error,
          );
          // Return null for failed fetches instead of throwing - this prevents the whole component from failing
          return null;
        }
      },
      enabled: !!slug, // Only run if slug is provided
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes since names don't change often
    })),
  });

  // Combine the results into a more usable format, filtering out null results
  return {
    techniques: queries
      .map((query) => query.data)
      .filter((data): data is NonNullable<typeof data> => data !== null),
    isLoading: queries.some((query) => query.isLoading),
    isError: queries.some((query) => query.isError),
    errors: queries.filter((query) => query.error).map((query) => query.error),
  };
};

// Helper function to normalize paths for all API requests
const normalizePath = (path: string): string => {
  // For Next.js rewrites to work correctly, we need to ensure paths start with /api
  let normalizedPath = path;

  // If path doesn't start with /api, add it
  if (!normalizedPath.startsWith("/api")) {
    normalizedPath = `/api${
      normalizedPath.startsWith("/") ? "" : "/"
    }${normalizedPath}`;
  }

  return normalizedPath;
};

export const useCreateTechnique = () => {
  const queryClient = useQueryClient();
  const config = getDataConfig();

  return useMutation({
    mutationFn: async (data: TechniqueFormData) => {
      // Only allow creation in API mode
      if (config.dataSource !== "api") {
        throw new Error("Technique creation is only available in API mode");
      }

      try {
        // Normalize the path to ensure proper routing
        const path = normalizePath("/api/techniques");
        console.log(`Creating technique at: ${path}`);

        // Make the request with proper path
        const response = await apiClient.post(path, data);
        return response.data as Technique;
      } catch (error: unknown) {
        console.error("Create technique error:", error);
        logApiError("useCreateTechnique", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["techniques"] });
    },
  });
};

export const useUpdateTechnique = (slug: string) => {
  const queryClient = useQueryClient();
  const config = getDataConfig();

  return useMutation({
    mutationFn: async (data: TechniqueFormData) => {
      // Only allow updates in API mode
      if (config.dataSource !== "api") {
        throw new Error("Technique updates are only available in API mode");
      }

      try {
        // Normalize the path to ensure proper routing
        const path = normalizePath(`/api/techniques/${slug}`);
        console.log(`Updating technique at: ${path}`);

        // Make the request with proper path
        const response = await apiClient.put(path, data);
        return response.data as Technique;
      } catch (error: unknown) {
        console.error("Update technique error:", error);
        logApiError("useUpdateTechnique", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["techniques"] });
      queryClient.invalidateQueries({ queryKey: ["technique", slug] });
    },
  });
};

export const useDeleteTechnique = () => {
  const queryClient = useQueryClient();
  const config = getDataConfig();

  return useMutation({
    mutationFn: async (slug: string) => {
      // Only allow deletion in API mode
      if (config.dataSource !== "api") {
        throw new Error("Technique deletion is only available in API mode");
      }

      try {
        // Normalize the path to ensure proper routing
        const path = normalizePath(`/api/techniques/${slug}`);
        console.log(`Deleting technique at: ${path}`);

        // Make the request with proper path
        await apiClient.delete(path);
        return slug;
      } catch (error: unknown) {
        console.error("Delete technique error:", error);
        logApiError("useDeleteTechnique", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["techniques"] });
    },
  });
};

// Removed the unused useTechniqueRelationships hook as it references a non-existent endpoint

/**
 * Hook for performing hybrid search across techniques using either static or API search
 */
export const useSearch = (query: string, enabled: boolean = true) => {
  const config = getDataConfig();

  return useQuery({
    queryKey: ["search", config.dataSource, query],
    queryFn: async () => {
      if (!query.trim()) {
        return [];
      }

      const searchService = getSearchService();
      return searchService.search(query);
    },
    enabled: enabled && !!query.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Export the utility functions for use in components
export { calculateTotalPages };
