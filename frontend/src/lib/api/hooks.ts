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

export const useTechniques = (params: QueryParams = {}) => {
	const filteredParams = Object.fromEntries(
		Object.entries(params).filter(([, value]) => value !== "all")
	);

	return useQuery({
		queryKey: ["techniques", params],
		queryFn: async () => {
			try {
				const response = await apiClient.get("/techniques/", {
					params: filteredParams,
				});
				return response.data as APIResponse<Technique>;
			} catch (error) {
				console.error("Error fetching techniques:", error);
				throw error;
			}
		},
	});
};

export const useTechniqueDetail = (id: number) => {
	return useQuery({
		queryKey: ["technique", id],
		queryFn: async () => {
			const response = await apiClient.get(`/techniques/${id}/`);
			return response.data as Technique;
		},
		enabled: !!id,
	});
};

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

export const useAssuranceGoals = () => {
	return useQuery({
		queryKey: ["assuranceGoals"],
		queryFn: async () => {
			const response = await apiClient.get("/assurance-goals/");
			return response.data as APIResponse<AssuranceGoal>;
		},
	});
};

// CRUD operations
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

export const useUpdateTechnique = (id: number) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: Partial<Technique>) => {
			const response = await apiClient.put(`/techniques/${id}/`, data);
			return response.data as Technique;
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
			await apiClient.delete(`/techniques/${id}/`);
			return id;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["techniques"] });
		},
	});
};
