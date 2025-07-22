import { BaseDataService } from "./dataService";
import { apiClient } from "@/lib/api/client";
import type {
  Technique,
  APIResponse,
  AssuranceGoal,
  Tag,
  ResourceType,
} from "@/lib/types";

/**
 * API data service implementation that fetches from the Django REST API
 */
export class ApiDataService extends BaseDataService {
  /**
   * Helper to normalize API paths
   */
  private normalizePath(path: string): string {
    if (!path.startsWith("/api")) {
      return `/api${path.startsWith("/") ? "" : "/"}${path}`;
    }
    return path;
  }

  async getTechniques(
    params?: Record<string, string | string[]>,
    page: number = 1,
  ): Promise<APIResponse<Technique>> {
    const apiParams = { page, ...params };
    const response = await apiClient.get(this.normalizePath("/techniques"), {
      params: apiParams,
    });
    return response.data;
  }

  async getTechnique(slug: string): Promise<Technique> {
    const response = await apiClient.get(
      this.normalizePath(`/techniques/${slug}`),
    );
    return response.data;
  }

  async getAssuranceGoals(): Promise<APIResponse<AssuranceGoal>> {
    const response = await apiClient.get(
      this.normalizePath("/assurance-goals"),
    );
    return response.data;
  }

  async getTags(): Promise<APIResponse<Tag>> {
    const response = await apiClient.get(this.normalizePath("/tags"));
    return response.data;
  }

  async getResourceTypes(): Promise<APIResponse<ResourceType>> {
    const response = await apiClient.get(this.normalizePath("/resource-types"));
    return response.data;
  }

  async searchTechniques(query: string): Promise<Technique[]> {
    const response = await this.getTechniques({ search: query });
    return response.results;
  }
}
