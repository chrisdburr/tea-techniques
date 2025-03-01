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

/**
 * FETCH HOOKS - Get data from the API
 */

// Get a list of techniques
export const useTechniques = (params: QueryParams = {}) => {
	const filteredParams = Object.fromEntries(
		Object.entries(params).filter(
			([, value]) => value !== "all" && value !== ""
		)
	);

	return useQuery({
		queryKey: ["techniques", params],
		queryFn: async () => {
			const response = await apiClient.get("/techniques/", {
				params: filteredParams,
			});
			return response.data as APIResponse<Technique>;
		},
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
	return useQuery({
		queryKey: ["categories", params],
		queryFn: async () => {
			const response = await apiClient.get("/categories/", {
				params,
			});
			return response.data as APIResponse<Category>;
		},
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
