// src/lib/api/hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
	Technique,
	Category,
	AssuranceGoal,
	APIResponse,
} from "@/lib/types";

interface QueryParams {
	search?: string;
	assurance_goal?: string;
	category?: string;
	[key: string]: string | undefined;
}

// API error response type for reference
// Commented out to avoid unused variable warnings
/*
interface APIErrorResponse {
	status?: number;
	data?: {
		detail?: string;
		message?: string;
	};
}
*/

export interface PaginatedResponse<T> {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
}

// Simple conversion of page number to limit/offset - keeping for potential future use
// const pageToOffset = (page: number, pageSize: number = 20) => {
// 	return (page - 1) * pageSize;
// };

// Basic calculation of total pages based on item count
const calculateTotalPages = (totalItems: number, pageSize: number = 20): number => {
	return totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
};

// Get a list of techniques with pagination
export const useTechniques = (params: QueryParams = {}, page: number = 1) => {
	// Filter parameters - Keep the names exactly as backend expects
	const apiParams: Record<string, string | number> = { };
	
	// Add search parameter if provided
	if (params.search) {
		apiParams.search = params.search;
	}
	
	// Add assurance_goal filter if it's not "all"
	if (params.assurance_goal && params.assurance_goal !== "all") {
		apiParams.assurance_goal = params.assurance_goal;
	}
	
	// Add category filter if it's not "all"
	if (params.category && params.category !== "all") {
		apiParams.category = params.category;
	}
	
	// Add pagination parameters
	apiParams.page = page;
	
	// Debug logging
	if (process.env.NODE_ENV === "development") {
		console.log("API Request Params:", apiParams);
	}
	
	return useQuery({
		queryKey: ["techniques", params, page],
		queryFn: async () => {
			const response = await apiClient.get("/techniques/", {
				params: apiParams,
			});
			return response.data as PaginatedResponse<Technique>;
		},
		// Don't refetch on window focus for better UX
		refetchOnWindowFocus: false,
	});
};

// Get a single technique by ID
export const useTechniqueDetail = (id: number) => {
	return useQuery({
		queryKey: ["technique", id],
		queryFn: async () => {
			const response = await apiClient.get(`/techniques/${id}/`);
			return response.data as Technique;
		},
		enabled: !!id, // Only run when id is truthy
	});
};

// Get a list of categories
export const useCategories = (params: QueryParams = {}) => {
	// Simple API call without parameter transformation
	return useQuery({
		queryKey: ["categories", params],
		queryFn: async () => {
			const response = await apiClient.get("/categories/", {
				params,
			});
			return response.data as APIResponse<Category>;
		},
		// Don't refetch on window focus for better UX
		refetchOnWindowFocus: false,
	});
};

// Get categories filtered by assurance goal
export const useCategoriesByAssuranceGoal = (assuranceGoalId: string | null) => {
	// Don't filter if "all" is selected
	const params = assuranceGoalId && assuranceGoalId !== "all" 
		? { assurance_goal: assuranceGoalId } 
		: {};
	
	return useQuery({
		queryKey: ["categories-by-goal", assuranceGoalId],
		queryFn: async () => {
			const response = await apiClient.get("/categories/", { params });
			return response.data as APIResponse<Category>;
		},
		// Don't refetch on window focus for better UX
		refetchOnWindowFocus: false,
	});
};

// Get a list of assurance goals
export const useAssuranceGoals = () => {
	return useQuery({
		queryKey: ["assurance-goals"],
		queryFn: async () => {
			const response = await apiClient.get("/assurance-goals/");
			return response.data as APIResponse<AssuranceGoal>;
		},
		// Don't refetch on window focus for better UX
		refetchOnWindowFocus: false,
	});
};

/**
 * MUTATION HOOKS - Create, update, or delete data
 */

// Create a new technique
export const useCreateTechnique = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: Partial<Technique>) => {
			const response = await apiClient.post("/techniques/", data);
			return response.data as Technique;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["techniques"] });
		},
	});
};

// Update an existing technique
export const useUpdateTechnique = (id: number) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: Partial<Technique> & { id: number }) => {
			const response = await apiClient.put(`/techniques/${id}/`, data);
			return response.data as Technique;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["techniques"] });
			queryClient.invalidateQueries({ queryKey: ["technique", id] });
		},
	});
};

// Delete a technique
export const useDeleteTechnique = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: number) => {
			await apiClient.delete(`/techniques/${id}/`);
			return id;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["techniques"] });
		},
	});
};

// Export the utility functions for use in components
export { calculateTotalPages };