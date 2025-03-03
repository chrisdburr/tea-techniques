// src/lib/api/hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
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
  ResourceType
} from "@/lib/types";

interface QueryParams {
  search?: string;
  assurance_goal?: string;
  category?: string;
  [key: string]: string | undefined;
}

// Basic calculation of total pages based on item count
const calculateTotalPages = (totalItems: number, pageSize: number = 20): number => {
  return totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
};

// Base data fetching hooks
export const useAssuranceGoals = () => {
  return useQuery({
    queryKey: ["assurance-goals"],
    queryFn: async () => {
      const response = await apiClient.get("/assurance-goals/");
      return response.data as APIResponse<AssuranceGoal>;
    },
    refetchOnWindowFocus: false,
  });
};

export const useCategories = (assuranceGoalId?: number) => {
  const params = assuranceGoalId ? { assurance_goal: assuranceGoalId } : {};
  
  return useQuery({
    queryKey: ["categories", assuranceGoalId],
    queryFn: async () => {
      const response = await apiClient.get("/categories/", { params });
      return response.data as APIResponse<Category>;
    },
    refetchOnWindowFocus: false,
  });
};

export const useSubCategories = (categoryId?: number) => {
  const params = categoryId ? { category: categoryId } : {};
  
  return useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: async () => {
      const response = await apiClient.get("/subcategories/", { params });
      return response.data as APIResponse<SubCategory>;
    },
    refetchOnWindowFocus: false,
    enabled: !!categoryId, // Only run if categoryId is provided
  });
};

export const useTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await apiClient.get("/tags/");
      return response.data as APIResponse<Tag>;
    },
    refetchOnWindowFocus: false,
  });
};

// New hooks for the flexible attribute system
export const useAttributeTypes = () => {
  return useQuery({
    queryKey: ["attribute-types"],
    queryFn: async () => {
      const response = await apiClient.get("/attribute-types/");
      return response.data as APIResponse<AttributeType>;
    },
    refetchOnWindowFocus: false,
  });
};

export const useAttributeValues = (attributeTypeId?: number) => {
  const params = attributeTypeId ? { attribute_type: attributeTypeId } : {};
  
  return useQuery({
    queryKey: ["attribute-values", attributeTypeId],
    queryFn: async () => {
      const response = await apiClient.get("/attribute-values/", { params });
      return response.data as APIResponse<AttributeValue>;
    },
    refetchOnWindowFocus: false,
    enabled: !!attributeTypeId, // Only run if attributeTypeId is provided
  });
};

// New hooks for the resource system
export const useResourceTypes = () => {
  return useQuery({
    queryKey: ["resource-types"],
    queryFn: async () => {
      const response = await apiClient.get("/resource-types/");
      return response.data as APIResponse<ResourceType>;
    },
    refetchOnWindowFocus: false,
  });
};

// Technique hooks
export const useTechniques = (params: QueryParams = {}, page: number = 1) => {
  // Filter parameters - Keep the names exactly as backend expects
  const apiParams: Record<string, string | number> = { page };
  
  // Add search parameter if provided
  if (params.search) {
    apiParams.search = params.search;
  }
  
  // Add assurance_goals filter if it's not "all"
  if (params.assurance_goal && params.assurance_goal !== "all") {
    // Backend expects "assurance_goals" (plural) for filtering
    apiParams.assurance_goals = params.assurance_goal;
  }
  
  // Add categories filter if it's not "all"
  if (params.category && params.category !== "all") {
    // Backend expects "categories" (plural) for filtering
    apiParams.categories = params.category;
  }
  
  // Create a stable query key based on filter values, not the params object reference
  const queryKey = [
    "techniques", 
    params.search || "",
    params.assurance_goal || "all",
    params.category || "all",
    page
  ];
  
  return useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      const response = await apiClient.get("/techniques/", {
        params: apiParams,
      });
      return response.data as APIResponse<Technique>;
    },
    // Don't refetch on window focus for better UX
    refetchOnWindowFocus: false,
    // Prevent redundant requests with the same parameters
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};

export const useTechniqueDetail = (id: number) => {
  return useQuery({
    queryKey: ["technique", id],
    queryFn: async () => {
      const response = await apiClient.get(`/techniques/${id}/`);
      return response.data as Technique;
    },
    enabled: !!id, // Only run if id is provided
    refetchOnWindowFocus: false,
  });
};

export const useCreateTechnique = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TechniqueFormData) => {
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
    mutationFn: async (data: TechniqueFormData) => {
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

// Relationship hooks
export const useTechniqueRelationships = (techniqueId: number) => {
  return useQuery({
    queryKey: ["technique-relationships", techniqueId],
    queryFn: async () => {
      const response = await apiClient.get(`/technique-relationships/`, {
        params: { technique_from: techniqueId }
      });
      return response.data;
    },
    refetchOnWindowFocus: false,
    enabled: !!techniqueId, // Only run if techniqueId is provided
  });
};

// Export the utility functions for use in components
export { calculateTotalPages };