import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";

// Techniques
export const useTechniques = (params = {}) => {
	return useQuery({
		queryKey: ["techniques", params],
		queryFn: async () => {
			const response = await apiClient.get("/api/techniques/", {
				params,
			});
			return response.data;
		},
	});
};

export const useTechniqueDetail = (id: number) => {
	return useQuery({
		queryKey: ["technique", id],
		queryFn: async () => {
			const response = await apiClient.get(`/api/techniques/${id}/`);
			return response.data;
		},
		enabled: !!id,
	});
};

// Categories
export const useCategories = (params = {}) => {
	return useQuery({
		queryKey: ["categories", params],
		queryFn: async () => {
			const response = await apiClient.get("/api/categories/", {
				params,
			});
			return response.data;
		},
	});
};

// Assurance Goals
export const useAssuranceGoals = () => {
	return useQuery({
		queryKey: ["assuranceGoals"],
		queryFn: async () => {
			const response = await apiClient.get("/api/assurance-goals/");
			return response.data;
		},
	});
};

// CRUD operations
export const useCreateTechnique = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: any) => {
			const response = await apiClient.post("/api/techniques/", data);
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
		mutationFn: async (data: any) => {
			const response = await apiClient.put(
				`/api/techniques/${id}/`,
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
			await apiClient.delete(`/api/techniques/${id}/`);
			return id;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["techniques"] });
		},
	});
};
