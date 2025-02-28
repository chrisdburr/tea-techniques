import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { Technique, Category, AssuranceGoal, APIResponse } from "@/lib/types";

export const useTechniques = (params = {}) => {

	const filteredParams: Record<string, any> = { ...params };
	Object.keys(filteredParams).forEach((key) => {
		if (filteredParams[key] === "all") {
			delete filteredParams[key];
		}
	});

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

export const useCategories = (params = {}) => {
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
			return response.data;
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
			const response = await apiClient.put(
				`/techniques/${id}/`,
				data
			);
			return response.data;
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
