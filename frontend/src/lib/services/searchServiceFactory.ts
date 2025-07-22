// src/lib/services/searchServiceFactory.ts
import { getDataConfig } from "@/lib/config/dataConfig";
import type { ISearchService } from "./searchService";

let searchServiceInstance: ISearchService | null = null;

/**
 * Factory function that creates search service instances on demand
 * This allows for better bundle splitting by only loading the required service
 */
export async function getSearchService(): Promise<ISearchService> {
  if (searchServiceInstance) {
    return searchServiceInstance;
  }

  const config = getDataConfig();

  if (config.dataSource === "static" || config.dataSource === "mock") {
    // Dynamically import static search service
    const { StaticSearchService } = await import("./searchService");
    searchServiceInstance = new StaticSearchService();
  } else {
    // Dynamically import API search service
    const { ApiSearchService } = await import("./searchService");
    searchServiceInstance = new ApiSearchService();
  }

  await searchServiceInstance.initialize();
  return searchServiceInstance;
}

/**
 * Reset the search service instance (useful for testing or mode changes)
 */
export function resetSearchService() {
  searchServiceInstance = null;
}
