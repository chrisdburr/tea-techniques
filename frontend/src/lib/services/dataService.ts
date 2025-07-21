import type {
  Technique,
  APIResponse,
  AssuranceGoal,
  Tag,
  ResourceType,
} from "@/lib/types";

/**
 * Data source type for the hybrid architecture
 */
export type DataSourceType = "static" | "mock" | "api";

/**
 * Interface for data service implementations
 */
export interface IDataService {
  // Techniques
  getTechniques(
    params?: Record<string, string | string[]>,
    page?: number,
  ): Promise<APIResponse<Technique>>;
  getTechnique(slug: string): Promise<Technique>;

  // Supporting data
  getAssuranceGoals(): Promise<APIResponse<AssuranceGoal>>;
  getTags(): Promise<APIResponse<Tag>>;
  getResourceTypes(): Promise<APIResponse<ResourceType>>;

  // Search capabilities
  searchTechniques(query: string): Promise<Technique[]>;
}

/**
 * Configuration for data service
 */
export interface DataServiceConfig {
  dataSource: DataSourceType;
  apiBaseUrl?: string;
  staticDataPath?: string;
}

/**
 * Get the configured data source from environment variables
 */
export function getDataSourceConfig(): DataServiceConfig {
  const dataSource = (process.env.NEXT_PUBLIC_DATA_SOURCE ||
    "api") as DataSourceType;

  return {
    dataSource,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "",
    staticDataPath: process.env.NEXT_PUBLIC_STATIC_DATA_PATH || "/api",
  };
}

/**
 * Abstract base class for data service implementations
 */
export abstract class BaseDataService implements IDataService {
  protected config: DataServiceConfig;

  constructor(config: DataServiceConfig) {
    this.config = config;
  }

  abstract getTechniques(
    params?: Record<string, string | string[]>,
    page?: number,
  ): Promise<APIResponse<Technique>>;
  abstract getTechnique(slug: string): Promise<Technique>;
  abstract getAssuranceGoals(): Promise<APIResponse<AssuranceGoal>>;
  abstract getTags(): Promise<APIResponse<Tag>>;
  abstract getResourceTypes(): Promise<APIResponse<ResourceType>>;
  abstract searchTechniques(query: string): Promise<Technique[]>;
}
