// src/lib/api/hooks.ts
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
const calculateTotalPages = (
	totalItems: number,
	pageSize: number = 20
): number => {
	return totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
};

// Base data fetching hooks
export const useAssuranceGoals = () => {
	return useQuery({
		queryKey: ["assurance-goals"],
		queryFn: async () => {
			try {
				const url = `http://localhost:8000/api/assurance-goals/`;
				console.log(`[useAssuranceGoals] Direct fetching from: ${url}`);

				const response = await fetch(url, {
					method: "GET",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					redirect: "error",
				});

				if (!response.ok) {
					throw new Error(
						`API returned ${response.status}: ${response.statusText}`
					);
				}

				const data = await response.json();
				return data as APIResponse<AssuranceGoal>;
			} catch (error) {
				console.error(`[useAssuranceGoals] Error:`, error);
				throw error;
			}
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
			try {
				const url = `http://localhost:8000/api/categories/?${queryString.toString()}`;
				console.log(`[useCategories] Direct fetching from: ${url}`);

				const response = await fetch(url, {
					method: "GET",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					redirect: "error",
				});

				if (!response.ok) {
					throw new Error(
						`API returned ${response.status}: ${response.statusText}`
					);
				}

				const data = await response.json();
				return data as APIResponse<Category>;
			} catch (error) {
				console.error(`[useCategories] Error:`, error);
				throw error;
			}
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
			try {
				const url = `http://localhost:8000/api/subcategories/?${queryString.toString()}`;
				console.log(`[useSubCategories] Direct fetching from: ${url}`);

				const response = await fetch(url, {
					method: "GET",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					redirect: "error",
				});

				if (!response.ok) {
					throw new Error(
						`API returned ${response.status}: ${response.statusText}`
					);
				}

				const data = await response.json();
				return data as APIResponse<SubCategory>;
			} catch (error) {
				console.error(`[useSubCategories] Error:`, error);
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
				const url = `http://localhost:8000/api/tags/`;
				console.log(`[useTags] Direct fetching from: ${url}`);

				const response = await fetch(url, {
					method: "GET",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					redirect: "error",
				});

				if (!response.ok) {
					throw new Error(
						`API returned ${response.status}: ${response.statusText}`
					);
				}

				const data = await response.json();
				return data as APIResponse<Tag>;
			} catch (error) {
				console.error(`[useTags] Error:`, error);
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
				const url = `http://localhost:8000/api/attribute-types/`;
				console.log(`[useAttributeTypes] Direct fetching from: ${url}`);

				const response = await fetch(url, {
					method: "GET",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					redirect: "error",
				});

				if (!response.ok) {
					throw new Error(
						`API returned ${response.status}: ${response.statusText}`
					);
				}

				const data = await response.json();
				return data as APIResponse<AttributeType>;
			} catch (error) {
				console.error(`[useAttributeTypes] Error:`, error);
				throw error;
			}
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
			try {
				const url = `http://localhost:8000/api/attribute-values/?${queryString.toString()}`;
				console.log(
					`[useAttributeValues] Direct fetching from: ${url}`
				);

				const response = await fetch(url, {
					method: "GET",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					redirect: "error",
				});

				if (!response.ok) {
					throw new Error(
						`API returned ${response.status}: ${response.statusText}`
					);
				}

				const data = await response.json();
				return data as APIResponse<AttributeValue>;
			} catch (error) {
				console.error(`[useAttributeValues] Error:`, error);
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
				const url = `http://localhost:8000/api/resource-types/`;
				console.log(`[useResourceTypes] Direct fetching from: ${url}`);

				const response = await fetch(url, {
					method: "GET",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					redirect: "error",
				});

				if (!response.ok) {
					throw new Error(
						`API returned ${response.status}: ${response.statusText}`
					);
				}

				const data = await response.json();
				return data as APIResponse<ResourceType>;
			} catch (error) {
				console.error(`[useResourceTypes] Error:`, error);
				throw error;
			}
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
			try {
				// Use the direct fetch approach with absolute URL
				const url = `http://localhost:8000/api/techniques/?${queryString.toString()}`;
				console.log(`[useTechniques] Direct fetching from: ${url}`);

				const response = await fetch(url, {
					method: "GET",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					// Important: Prevent redirect following
					redirect: "error",
				});

				if (!response.ok) {
					throw new Error(
						`API returned ${response.status}: ${response.statusText}`
					);
				}

				const data = await response.json();
				return data;
			} catch (error) {
				console.error(`[useTechniques] Error:`, error);
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
				const url = `http://localhost:8000/api/techniques/${id}/`;
				console.log(
					`[useTechniqueDetail] Direct fetching from: ${url}`
				);

				const response = await fetch(url, {
					method: "GET",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					redirect: "error",
				});

				if (!response.ok) {
					const errorText = await response.text();
					console.error(
						`[useTechniqueDetail] Response error: ${response.status}`,
						errorText
					);
					throw new Error(
						`API returned ${response.status}: ${response.statusText}`
					);
				}

				// Try to parse as JSON
				let data;
				try {
					const text = await response.text();
					console.log(
						`[useTechniqueDetail] Raw response:`,
						text.substring(0, 500) + "..."
					);
					data = JSON.parse(text);
				} catch (parseError) {
					console.error(
						`[useTechniqueDetail] JSON parse error:`,
						parseError
					);
					throw new Error(`Failed to parse API response as JSON`);
				}

				// Validate and log the response
				console.log(`[useTechniqueDetail] Parsed response:`, data);

				// Check if the data has the expected structure
				if (!data.id || !data.name) {
					console.error(`[useTechniqueDetail] Malformed data:`, data);
					throw new Error(`API returned malformed data`);
				}

				return data as Technique;
			} catch (error) {
				console.error(`[useTechniqueDetail] Error:`, error);
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
				const url = `http://localhost:8000/api/techniques/`;
				console.log(`[useCreateTechnique] Direct posting to: ${url}`);

				const response = await fetch(url, {
					method: "POST",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
					redirect: "error",
				});

				if (!response.ok) {
					throw new Error(
						`API returned ${response.status}: ${response.statusText}`
					);
				}

				const responseData = await response.json();
				return responseData as Technique;
			} catch (error) {
				console.error(`[useCreateTechnique] Error:`, error);
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
				const url = `http://localhost:8000/api/techniques/${id}/`;
				console.log(`[useUpdateTechnique] Direct putting to: ${url}`);

				const response = await fetch(url, {
					method: "PUT",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
					redirect: "error",
				});

				if (!response.ok) {
					throw new Error(
						`API returned ${response.status}: ${response.statusText}`
					);
				}

				const responseData = await response.json();
				return responseData as Technique;
			} catch (error) {
				console.error(`[useUpdateTechnique] Error:`, error);
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
				const url = `http://localhost:8000/api/techniques/${id}/`;
				console.log(
					`[useDeleteTechnique] Direct deleting from: ${url}`
				);

				const response = await fetch(url, {
					method: "DELETE",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					redirect: "error",
				});

				if (!response.ok) {
					throw new Error(
						`API returned ${response.status}: ${response.statusText}`
					);
				}

				return id;
			} catch (error) {
				console.error(`[useDeleteTechnique] Error:`, error);
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
	// Create query string
	const queryString = new URLSearchParams();
	if (techniqueId) {
		queryString.append("technique_from", String(techniqueId));
	}

	return useQuery({
		queryKey: ["technique-relationships", techniqueId],
		queryFn: async () => {
			try {
				const url = `http://localhost:8000/api/technique-relationships/?${queryString.toString()}`;
				console.log(
					`[useTechniqueRelationships] Direct fetching from: ${url}`
				);

				const response = await fetch(url, {
					method: "GET",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					redirect: "error",
				});

				if (!response.ok) {
					throw new Error(
						`API returned ${response.status}: ${response.statusText}`
					);
				}

				const data = await response.json();
				return data;
			} catch (error) {
				console.error(`[useTechniqueRelationships] Error:`, error);
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
