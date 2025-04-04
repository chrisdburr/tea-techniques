// src/lib/api/hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { logApiError } from "@/lib/api/errorUtils";
import type {
	Technique,
	TechniqueFormData,
	Category,
	SubCategory,
	AssuranceGoal,
	APIResponse,
	Tag,
	AttributeType,
	AttributeValue,
	ResourceType,
} from "@/lib/types";

interface QueryParams {
	search?: string;
	assurance_goal?: string;
	assurance_goals?: string | string[];
	category?: string;
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
	pageSize: number = 20
): number => {
	return totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
};

/**
 * Helper function to fetch data from API endpoints with consistent URL handling
 * 
 * This function provides a standardized way to access API endpoints,
 * following Next.js config trailing slash setting.
 * 
 * @param path - The API path to fetch from (starting with /api)
 * @param params - Optional query parameters
 * @returns Promise resolving to the requested data
 * @throws Error if the API call fails
 */
const fetchAPI = async <T>(
    path: string,
    params?: Record<string, string | number | string[]>
): Promise<T> => {
    try {
        // Ensure the path has a trailing slash to match Next.js trailingSlash config
        const normalizedPath = path.endsWith("/") ? path : `${path}/`;
        
        // Make the request with normalized path
        const response = await apiClient.get(normalizedPath, { params });
        return response.data as T;
    } catch (error) {
        console.error("API request failed:", error);
        throw error;
    }
};

// Base data fetching hooks

/**
 * Hook for fetching assurance goals
 * 
 * @returns Query object with assurance goals data
 */
export const useAssuranceGoals = () => {
	return useQuery({
		queryKey: ["assurance-goals"],
		queryFn: async () => {
			try {
				return await fetchAPI<APIResponse<AssuranceGoal>>('/api/assurance-goals/');
			} catch (error: unknown) {
				logApiError('useAssuranceGoals', error);
				throw error;
			}
		},
		refetchOnWindowFocus: false,
		staleTime: 5 * 60 * 1000, // 5 minutes - this data rarely changes
		retry: 1,
	});
};

/**
 * Hook for fetching categories, optionally filtered by assurance goal
 * 
 * @param assuranceGoalId - Optional ID to filter categories by assurance goal
 * @returns Query object with categories data
 */
export const useCategories = (assuranceGoalId?: number) => {
	// Create params object for axios
	const params: Record<string, string | number> = {};
	if (assuranceGoalId) {
		params.assurance_goal = assuranceGoalId;
	}

	return useQuery({
		queryKey: ["categories", assuranceGoalId],
		queryFn: async () => {
			try {
				return await fetchAPI<APIResponse<Category>>('/api/categories/', params);
			} catch (error: unknown) {
				logApiError('useCategories', error);
				throw error;
			}
		},
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

/**
 * Hook for fetching subcategories for a specific category
 * 
 * @param categoryId - Optional ID to filter subcategories by category
 * @returns Query object with subcategories data
 */
export const useSubCategories = (categoryId?: number) => {
	// Create params object for axios
	const params: Record<string, string | number> = {};
	if (categoryId) {
		params.category = categoryId;
	}

	return useQuery({
		queryKey: ["subcategories", categoryId],
		queryFn: async () => {
			try {
				return await fetchAPI<APIResponse<SubCategory>>('/api/subcategories/', params);
			} catch (error: unknown) {
				logApiError('useSubCategories', error);
				throw error;
			}
		},
		refetchOnWindowFocus: false,
		retry: 1,
		enabled: !!categoryId, // Only run if categoryId is provided
	});
};

/**
 * Hook for fetching all tags
 * 
 * @returns Query object with tags data
 */
export const useTags = () => {
	return useQuery({
		queryKey: ["tags"],
		queryFn: async () => {
			try {
				return await fetchAPI<APIResponse<Tag>>('/api/tags/');
			} catch (error: unknown) {
				logApiError('useTags', error);
				throw error;
			}
		},
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

// New hooks for the flexible attribute system
export const useAttributeTypes = () => {
	return useQuery({
		queryKey: ["attribute-types"],
		queryFn: async () => {
			try {
				return await fetchAPI<APIResponse<AttributeType>>('/api/attribute-types/');
			} catch (error: unknown) {
				logApiError('useAttributeTypes', error);
				throw error;
			}
		},
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

export const useAttributeValues = (attributeTypeId?: number) => {
	// Create params object for axios
	const params: Record<string, string | number> = {};
	if (attributeTypeId) {
		params.attribute_type = attributeTypeId;
	}

	return useQuery({
		queryKey: ["attribute-values", attributeTypeId],
		queryFn: async () => {
			try {
				return await fetchAPI<APIResponse<AttributeValue>>('/api/attribute-values/', params);
			} catch (error: unknown) {
				logApiError('useAttributeValues', error);
				throw error;
			}
		},
		refetchOnWindowFocus: false,
		retry: 1,
		enabled: !!attributeTypeId, // Only run if attributeTypeId is provided
	});
};

// New hooks for the resource system
export const useResourceTypes = () => {
	return useQuery({
		queryKey: ["resource-types"],
		queryFn: async () => {
			try {
				return await fetchAPI<APIResponse<ResourceType>>('/api/resource-types/');
			} catch (error: unknown) {
				logApiError('useResourceTypes', error);
				throw error;
			}
		},
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

/**
 * Hook for fetching techniques with filtering, searching, and pagination
 * 
 * @param params - Query parameters for filtering and searching techniques
 * @param page - Page number for pagination (defaults to 1)
 * @returns Query object with techniques data
 */
export const useTechniques = (params: QueryParams = {}, page: number = 1) => {
	// Filter parameters
	const apiParams: Record<string, string | number | string[]> = { page };

	if (params.search) {
		apiParams.search = params.search;
		// Django REST Framework format for specifying search fields
		apiParams.search_fields = "name"; // Only search in name field
	}

	// Handle assurance_goals as an array
	if (
		params.assurance_goals &&
		Array.isArray(params.assurance_goals) &&
		params.assurance_goals.length > 0
	) {
		// For axios, we need to format this correctly for the backend
		apiParams.assurance_goals = params.assurance_goals;
	} else if (params.assurance_goal && params.assurance_goal !== "all") {
		// Backward compatibility for single goal
		apiParams.assurance_goals = params.assurance_goal;
	}

	if (params.category && params.category !== "all") {
		apiParams.categories = params.category;
	}

	if (params.model_dependency && params.model_dependency !== "all") {
		apiParams.model_dependency = params.model_dependency;
	}

	// Add rating parameters
	if (params.complexity_min) {
		apiParams.complexity_min = params.complexity_min;
	}
	if (params.complexity_max) {
		apiParams.complexity_max = params.complexity_max;
	}
	if (params.computational_cost_min) {
		apiParams.computational_cost_min = params.computational_cost_min;
	}
	if (params.computational_cost_max) {
		apiParams.computational_cost_max = params.computational_cost_max;
	}

	// Create query string
	const queryParams = new URLSearchParams();
	Object.entries(apiParams).forEach(([key, value]) => {
		queryParams.append(key, String(value));
	});

	// Create a more comprehensive query key that captures all filter parameters
	const queryKey = [
		"techniques",
		params.search || "",
		params.search_fields || "",
		// Include all assurance_goals values
		Array.isArray(apiParams.assurance_goals) 
			? apiParams.assurance_goals.join(',') 
			: apiParams.assurance_goals || "all",
		// Include all categories values
		Array.isArray(apiParams.categories)
			? apiParams.categories.join(',')
			: apiParams.categories || "all",
		params.model_dependency || "all",
		// Include rating filters
		params.complexity_min || "1",
		params.complexity_max || "5",
		params.computational_cost_min || "1",
		params.computational_cost_max || "5",
		page,
	];

	return useQuery({
		queryKey: queryKey,
		queryFn: async () => {
			try {
				// Use the apiClient configured with proper baseUrl
				return await fetchAPI("/api/techniques/", apiParams);
			} catch (error: unknown) {
				logApiError("useTechniques", error);
				throw error;
			}
		},
		refetchOnWindowFocus: false,
		staleTime: 60000, // 1 minute stale time
		retry: 1, // Reduce retries to avoid spamming errors
	});
};

export const useTechniqueDetail = (id: number) => {
	return useQuery({
		queryKey: ["technique", id],
		queryFn: async () => {
			try {
				// Ensure the path has a trailing slash to match Next.js trailingSlash config
				const normalizedPath = `/api/techniques/${id}/`;
				
				// Make the request with normalized path
				const response = await apiClient.get(normalizedPath);
				const data = response.data;
				
				// Validate the response
				if (!data.id || !data.name) {
					throw new Error(`API returned malformed data`);
				}

				return data as Technique;
			} catch (error: unknown) {
				logApiError('useTechniqueDetail', error);
				throw error;
			}
		},
		enabled: !!id, // Only run if id is provided
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

export const useCreateTechnique = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: TechniqueFormData) => {
			try {
				// Ensure the path has a trailing slash to match Next.js trailingSlash config
				const normalizedPath = `/api/techniques/`;
				
				// Make the request with normalized path
				const response = await apiClient.post(normalizedPath, data);
				return response.data as Technique;
			} catch (error: unknown) {
				logApiError('useCreateTechnique', error);
				throw error;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["techniques"] });
		},
	});
};

export const useUpdateTechnique = (id: number) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: TechniqueFormData) => {
			try {
				// Ensure the path has a trailing slash to match Next.js trailingSlash config
				const normalizedPath = `/api/techniques/${id}/`;
				
				// Make the request with normalized path
				const response = await apiClient.put(normalizedPath, data);
				return response.data as Technique;
			} catch (error: unknown) {
				logApiError('useUpdateTechnique', error);
				throw error;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["techniques"] });
			queryClient.invalidateQueries({ queryKey: ["technique", id] });
		},
	});
};

export const useDeleteTechnique = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: number) => {
			try {
				// Ensure the path has a trailing slash to match Next.js trailingSlash config
				const normalizedPath = `/api/techniques/${id}/`;
				
				// Make the request with normalized path
				await apiClient.delete(normalizedPath);
				return id;
			} catch (error: unknown) {
				logApiError('useDeleteTechnique', error);
				throw error;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["techniques"] });
		},
	});
};

// Relationship hooks
export const useTechniqueRelationships = (techniqueId: number) => {
	// Create params object for axios
	const params: Record<string, string | number> = {};
	if (techniqueId) {
		params.technique_from = techniqueId;
	}

	return useQuery({
		queryKey: ["technique-relationships", techniqueId],
		queryFn: async () => {
			try {
				return await fetchAPI('/api/technique-relationships/', params);
			} catch (error: unknown) {
				logApiError('useTechniqueRelationships', error);
				throw error;
			}
		},
		refetchOnWindowFocus: false,
		retry: 1,
		enabled: !!techniqueId, // Only run if techniqueId is provided
	});
};

// Export the utility functions for use in components
export { calculateTotalPages };