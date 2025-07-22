import { BaseDataService } from "./dataService";
import type {
  Technique,
  APIResponse,
  AssuranceGoal,
  Tag,
  ResourceType,
} from "@/lib/types";
import type { SearchIndex } from "@/lib/types/staticData";

/**
 * Static data service implementation that fetches from pre-generated JSON files
 */
export class StaticDataService extends BaseDataService {
  private cache: Map<string, unknown> = new Map();

  /**
   * Fetch JSON data from static files with caching
   */
  private async fetchStatic<T>(path: string): Promise<T> {
    const cacheKey = path;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as T;
    }

    try {
      // During build time, read directly from file system
      if (typeof window === "undefined") {
        const fs = await import("fs/promises");
        const nodePath = await import("path");
        const filePath = nodePath.join(
          process.cwd(),
          "public/api",
          path.startsWith("/") ? path.slice(1) : path,
        );
        const fileContent = await fs.readFile(filePath, "utf-8");
        const data = JSON.parse(fileContent) as T;
        this.cache.set(cacheKey, data);
        return data;
      }

      // In browser, use fetch with the configured path
      // Ensure proper path construction - avoid double slashes
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      const fullUrl = `${this.config.staticDataPath}${cleanPath}`;

      console.log(`Fetching static data from: ${fullUrl}`);

      const response = await fetch(fullUrl);
      if (!response.ok) {
        console.error(
          `Failed to fetch from ${fullUrl}: ${response.status} ${response.statusText}`,
        );
        throw new Error(
          `Failed to fetch static data from ${fullUrl}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching static data from ${path}:`, error);
      throw error;
    }
  }

  async getTechniques(
    params?: Record<string, string | string[]>,
    page: number = 1,
  ): Promise<APIResponse<Technique>> {
    console.log("🔍 staticDataService.getTechniques called with:", {
      params,
      page,
      pageType: typeof page,
    });

    // Extra debug for assurance_goals parameter
    if (params?.assurance_goals) {
      console.log("🔍 staticDataService: assurance_goals parameter details:", {
        type: typeof params.assurance_goals,
        value: params.assurance_goals,
        isArray: Array.isArray(params.assurance_goals),
        stringified: JSON.stringify(params.assurance_goals),
      });
    }

    // Fetch the main techniques list
    const allData = await this.fetchStatic<APIResponse<Technique>>(
      "/techniques.json",
    );

    // Apply client-side filtering if params are provided
    let filteredResults = allData.results;

    if (params) {
      // Search filtering
      if (params.search) {
        const searchTerm = Array.isArray(params.search)
          ? params.search[0]?.toLowerCase() || ""
          : params.search.toLowerCase();
        filteredResults = filteredResults.filter(
          (technique) =>
            technique.name.toLowerCase().includes(searchTerm) ||
            technique.description.toLowerCase().includes(searchTerm) ||
            (technique.acronym &&
              technique.acronym.toLowerCase().includes(searchTerm)),
        );
      }

      // Assurance goals filtering
      if (params.assurance_goals) {
        const goalIds = Array.isArray(params.assurance_goals)
          ? params.assurance_goals
          : [params.assurance_goals];

        console.log("🔍 staticDataService: Filtering by goal IDs:", goalIds);
        console.log(
          "🔍 staticDataService: Before filtering, total techniques:",
          filteredResults.length,
        );

        filteredResults = filteredResults.filter((technique) => {
          const hasMatchingGoal = technique.assurance_goals.some((goal) =>
            goalIds.includes(goal.id?.toString()),
          );
          if (hasMatchingGoal) {
            console.log(
              `🔍 staticDataService: ${technique.name} matches goals:`,
              technique.assurance_goals.map((g) => `${g.id}:${g.name}`),
            );
          }
          return hasMatchingGoal;
        });

        console.log(
          "🔍 staticDataService: After filtering, Privacy techniques found:",
          filteredResults.length,
        );
      }

      // Tags filtering
      if (params.tags) {
        const tagIds = Array.isArray(params.tags) ? params.tags : [params.tags];

        filteredResults = filteredResults.filter((technique) =>
          technique.tags.some((tag) =>
            tagIds.includes(tag.id?.toString() || ""),
          ),
        );
      }

      // Complexity filtering
      if (params.complexity_min || params.complexity_max) {
        const minParam = Array.isArray(params.complexity_min)
          ? params.complexity_min[0]
          : params.complexity_min;
        const maxParam = Array.isArray(params.complexity_max)
          ? params.complexity_max[0]
          : params.complexity_max;
        const min = minParam ? parseInt(minParam) : 1;
        const max = maxParam ? parseInt(maxParam) : 5;

        filteredResults = filteredResults.filter(
          (technique) =>
            technique.complexity_rating !== null &&
            technique.complexity_rating !== undefined &&
            technique.complexity_rating >= min &&
            technique.complexity_rating <= max,
        );
      }

      // Computational cost filtering
      if (params.computational_cost_min || params.computational_cost_max) {
        const minParam = Array.isArray(params.computational_cost_min)
          ? params.computational_cost_min[0]
          : params.computational_cost_min;
        const maxParam = Array.isArray(params.computational_cost_max)
          ? params.computational_cost_max[0]
          : params.computational_cost_max;
        const min = minParam ? parseInt(minParam) : 1;
        const max = maxParam ? parseInt(maxParam) : 5;

        filteredResults = filteredResults.filter(
          (technique) =>
            technique.computational_cost_rating !== null &&
            technique.computational_cost_rating !== undefined &&
            technique.computational_cost_rating >= min &&
            technique.computational_cost_rating <= max,
        );
      }
    }

    // Apply pagination
    const pageSize = 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    console.log("🔍 staticDataService pagination:", {
      page,
      pageSize,
      startIndex,
      endIndex,
      filteredResultsLength: filteredResults.length,
      firstItemBeforeSlice: filteredResults[0]?.name,
      lastItemBeforeSlice: filteredResults[filteredResults.length - 1]?.name,
    });

    const paginatedResults = filteredResults.slice(startIndex, endIndex);

    console.log("🔍 staticDataService paginated results:", {
      paginatedResultsLength: paginatedResults.length,
      firstItem: paginatedResults[0]?.name,
      lastItem: paginatedResults[paginatedResults.length - 1]?.name,
      expectedFirstForPage2: page === 2 ? "Should be t-SNE" : null,
    });

    return {
      count: filteredResults.length,
      next: endIndex < filteredResults.length ? `page=${page + 1}` : null,
      previous: page > 1 ? `page=${page - 1}` : null,
      results: paginatedResults,
    };
  }

  async getTechnique(slug: string): Promise<Technique> {
    return this.fetchStatic<Technique>(`/techniques/${slug}.json`);
  }

  async getAssuranceGoals(): Promise<APIResponse<AssuranceGoal>> {
    return this.fetchStatic<APIResponse<AssuranceGoal>>(
      "/assurance-goals.json",
    );
  }

  async getTags(): Promise<APIResponse<Tag>> {
    return this.fetchStatic<APIResponse<Tag>>("/tags.json");
  }

  async getResourceTypes(): Promise<APIResponse<ResourceType>> {
    return this.fetchStatic<APIResponse<ResourceType>>("/resource-types.json");
  }

  async searchTechniques(query: string): Promise<Technique[]> {
    // For static mode, we'll use the search index if available
    try {
      const searchIndex = await this.fetchStatic<SearchIndex>(
        "/search-index.json",
      );

      const queryLower = query.toLowerCase();
      const queryTokens = queryLower
        .split(/\s+/)
        .filter((token) => token.length > 2);

      // Find matching techniques using inverted index
      const matchingSlugs = new Set<string>();

      // First, find exact token matches using inverted index
      queryTokens.forEach((token) => {
        if (searchIndex.invertedIndex[token]) {
          searchIndex.invertedIndex[token].forEach((slug) =>
            matchingSlugs.add(slug),
          );
        }
      });

      // Also check for partial matches in the searchable text
      searchIndex.techniques.forEach((item) => {
        if (item.searchableText.includes(queryLower)) {
          matchingSlugs.add(item.slug);
        }
      });

      // Fetch full technique data for matches
      if (matchingSlugs.size > 0) {
        const allTechniques = await this.getTechniques();
        return allTechniques.results.filter((t) => matchingSlugs.has(t.slug));
      }

      return [];
    } catch {
      // Fallback to filtering the full list
      const allData = await this.getTechniques({ search: query });
      return allData.results;
    }
  }
}
