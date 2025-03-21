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

// Basic calculation of total pages based on item count
const calculateTotalPages = (
	totalItems: number,
	pageSize: number = 20
): number => {
	return totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
};

// Helper function to try API calls with and without trailing slash
const fetchAPI = async <T>(
    url: string,
    params?: Record<string, string | number | string[]>
): Promise<T> => {
    // Remove any trailing slash first 
    const urlWithoutSlash = url.endsWith("/") ? url.slice(0, -1) : url;
    const urlWithSlash = urlWithoutSlash + "/";
    
    // Try both URL variants in sequence
    try {
        // Try without trailing slash first
        try {
            const response = await apiClient.get(urlWithoutSlash, { params });
            return response.data as T;
        } catch {
            // If first attempt fails, try with trailing slash
            const response = await apiClient.get(urlWithSlash, { params });
            return response.data as T;
        }
    } catch (error) {
        // This catch will handle any errors from both attempts
        console.error("API request failed with both URL variations:", error);
        throw error;
    }
};

// Base data fetching hooks
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
		retry: 1,
	});
};

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

	const queryKey = [
		"techniques",
		params.search || "",
		params.search_fields || "",
		params.assurance_goal || "all",
		params.category || "all",
		params.model_dependency || "all",
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
		staleTime: 30000,
		retry: 1, // Reduce retries to avoid spamming errors
	});
};

export const useTechniqueDetail = (id: number) => {
	return useQuery({
		queryKey: ["technique", id],
		queryFn: async () => {
			try {
				
				try {
					// Try without trailing slash first
					const response = await apiClient.get(`/api/techniques/${id}`);
					const data = response.data;
					
					// Validate and log the response

					// Check if the data has the expected structure
					if (!data.id || !data.name) {
						throw new Error(`API returned malformed data`);
					}

					return data as Technique;
				} catch {
					// Try with trailing slash as fallback
					const response = await apiClient.get(`/api/techniques/${id}/`);
					const data = response.data;
					
					// Validate and log the response

					// Check if the data has the expected structure
					if (!data.id || !data.name) {
						throw new Error(`API returned malformed data`);
					}

					return data as Technique;
				}
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
				
				try {
					// Try without trailing slash first
					const response = await apiClient.post(`/api/techniques`, data);
					return response.data as Technique;
				} catch {
					// Try with trailing slash as fallback
					const response = await apiClient.post(`/api/techniques/`, data);
					return response.data as Technique;
				}
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
				
				try {
					// Try without trailing slash first
					const response = await apiClient.put(`/api/techniques/${id}`, data);
					return response.data as Technique;
				} catch {
					// Try with trailing slash as fallback
					const response = await apiClient.put(`/api/techniques/${id}/`, data);
					return response.data as Technique;
				}
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
				
				try {
					// Try without trailing slash first
					await apiClient.delete(`/api/techniques/${id}`);
					return id;
				} catch {
					// Try with trailing slash as fallback
					await apiClient.delete(`/api/techniques/${id}/`);
					return id;
				}
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