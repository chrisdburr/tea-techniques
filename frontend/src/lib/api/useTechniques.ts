// frontend/src/lib/api/useTechniques.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Technique {
	id: number;
	name: string;
	description: string;
	model_dependency: string;
	example_use_case: string;
}

const fetchTechniques = async (): Promise<Technique[]> => {
	const res = await fetch("/api/techniques/");
	if (!res.ok) {
		throw new Error("Error fetching techniques");
	}
	return res.json();
};

export const useTechniques = () => {
	return useQuery<Technique[], Error>({
		queryKey: ["techniques"],
		queryFn: fetchTechniques,
	});
};

const addTechnique = async (
	newTechnique: Partial<Technique>
): Promise<Technique> => {
	const res = await fetch("/api/techniques/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(newTechnique),
	});
	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.message || "Error adding technique");
	}
	return res.json();
};

export const useAddTechnique = () => {
	const queryClient = useQueryClient();
	return useMutation<Technique, Error, Partial<Technique>, unknown>({
		mutationFn: addTechnique,
		onSuccess: () => {
			// Invalidate and refetch the techniques list by using a queryKey object
			queryClient.invalidateQueries({ queryKey: ["techniques"] });
		},
	});
};

const updateTechnique = async (
	updatedData: Partial<Technique> & { id: number }
): Promise<Technique> => {
	const res = await fetch(`/api/techniques/${updatedData.id}`, {
		method: "PUT", // or "PATCH" depending on your API
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(updatedData),
	});
	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.message || "Error updating technique");
	}
	return res.json();
};

export const useUpdateTechnique = () => {
	const queryClient = useQueryClient();
	return useMutation<
		Technique,
		Error,
		Partial<Technique> & { id: number },
		unknown
	>({
		mutationFn: updateTechnique,
		onSuccess: (data, variables) => {
			// Invalidate queries to refetch updated data
			queryClient.invalidateQueries({ queryKey: ["techniques"] });
			queryClient.invalidateQueries({
				queryKey: ["technique", variables.id],
			});
		},
	});
};