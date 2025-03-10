// src/lib/api/hooks.ts - Updated to use relative URLs
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
	category?: string;
	[key: string]: string | undefined;
}

// Basic calculation of total pages based on item count
export const calculateTotalPages = (
	totalItems: number,
	pageSize: number = 20
): number => {
	return totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
};

// Helper function to make fetch requests with consistent error handling
const fetchFromApi = async <T>(url: string): Promise<T> => {
	try {
		console.log(`[API Request] ${url}`);
		
		const response = await fetch(url, {
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`API returned ${response.status}: ${response.statusText}`);
		}

		return await response.json() as T;
	} catch (error) {
		console.error(`[API Error] ${url}:`, error);
		throw error;
	}
};

// Base data fetching hooks
export const useAssuranceGoals = () => {
	return useQuery({
		queryKey: ["assurance-goals"],
		queryFn: async () => {
			return fetchFromApi<APIResponse<AssuranceGoal>>(`/api/assurance-goals/`);
		},
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

export const useCategories = (assuranceGoalId?: number) => {
	// Create query string
	const queryString = new URLSearchParams();
	if (assuranceGoalId) {
		queryString.append("assurance_goal", String(assuranceGoalId));
	}

	return useQuery({
		queryKey: ["categories", assuranceGoalId],
		queryFn: async () => {
			return fetchFromApi<APIResponse<Category>>(`/api/categories/?${queryString.toString()}`);
		},
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

export const useSubCategories = (categoryId?: number) => {
	// Create query string
	const queryString = new URLSearchParams();
	if (categoryId) {
		queryString.append("category", String(categoryId));
	}

	return useQuery({
		queryKey: ["subcategories", categoryId],
		queryFn: async () => {
			return fetchFromApi<APIResponse<SubCategory>>(`/api/subcategories/?${queryString.toString()}`);
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
			return fetchFromApi<APIResponse<Tag>>(`/api/tags/`);
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
			return fetchFromApi<APIResponse<AttributeType>>(`/api/attribute-types/`);
		},
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

export const useAttributeValues = (attributeTypeId?: number) => {
	// Create query string
	const queryString = new URLSearchParams();
	if (attributeTypeId) {
		queryString.append("attribute_type", String(attributeTypeId));
	}

	return useQuery({
		queryKey: ["attribute-values", attributeTypeId],
		queryFn: async () => {
			return fetchFromApi<APIResponse<AttributeValue>>(`/api/attribute-values/?${queryString.toString()}`);
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
			return fetchFromApi<APIResponse<ResourceType>>(`/api/resource-types/`);
		},
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

export const useTechniques = (params: QueryParams = {}, page: number = 1) => {
	// Filter parameters
	const apiParams: Record<string, string | number> = { page };

	if (params.search) {
		apiParams.search = params.search;
		// Django REST Framework format for specifying search fields
		apiParams.search_fields = "name"; // Only search in name field
	}

	if (params.assurance_goal && params.assurance_goal !== "all") {
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
	const queryString = new URLSearchParams();
	Object.entries(apiParams).forEach(([key, value]) => {
		queryString.append(key, String(value));
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
			return fetchFromApi<APIResponse<Technique>>(`/api/techniques/?${queryString.toString()}`);
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
			return fetchFromApi<Technique>(`/api/techniques/${id}/`);
		},
		enabled: !!id, // Only run if id is provided
		refetchOnWindowFocus: false,
		retry: 1,
	});
};

// Helper function for mutation requests
const mutateApi = async <T>(
	url: string,
	method: "POST" | "PUT" | "DELETE",
	data?: unknown
): Promise<T | null> => {
	try {
		console.log(`[API ${method}] ${url}`);
		
		const response = await fetch(url, {
			method,
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: data ? JSON.stringify(data) : undefined,
		});

		if (!response.ok) {
			throw new Error(`API returned ${response.status}: ${response.statusText}`);
		}

		if (method === "DELETE") {
			return null;
		}

		return await response.json() as T;
	} catch (error) {
		console.error(`[API Error] ${method} ${url}:`, error);
		throw error;
	}
};

export const useCreateTechnique = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: TechniqueFormData) => {
			return mutateApi<Technique>(`/api/techniques/`, "POST", data);
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
			return mutateApi<Technique>(`/api/techniques/${id}/`, "PUT", data);
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
			await mutateApi<null>(`/api/techniques/${id}/`, "DELETE");
			return id;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["techniques"] });
		},
	});
};

// Relationship hooks
export const useTechniqueRelationships = (techniqueId: number) => {
	// Create query string
	const queryString = new URLSearchParams();
	if (techniqueId) {
		queryString.append("technique_from", String(techniqueId));
	}

	return useQuery({
		queryKey: ["technique-relationships", techniqueId],
		queryFn: async () => {
			return fetchFromApi<APIResponse<TechniqueRelationship>>(`/api/technique-relationships/?${queryString.toString()}`);
		},
		refetchOnWindowFocus: false,
		retry: 1,
		enabled: !!techniqueId, // Only run if techniqueId is provided
	});
};

// Need to add TechniqueRelationship type here to prevent linting errors
interface TechniqueRelationship {
	id: number;
	technique_from: number;
	technique_to: number;
	relationship_type: string;
}