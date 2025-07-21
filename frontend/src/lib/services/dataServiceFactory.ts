import { IDataService, getDataSourceConfig } from "./dataService";
import { StaticDataService } from "./staticDataService";
import { ApiDataService } from "./apiDataService";

let dataServiceInstance: IDataService | null = null;

/**
 * Factory function to create the appropriate data service based on configuration
 */
export function createDataService(): IDataService {
  const config = getDataSourceConfig();

  switch (config.dataSource) {
    case "static":
      return new StaticDataService(config);

    case "mock":
      // For mock mode, we use static data service but potentially with different paths
      return new StaticDataService({
        ...config,
        staticDataPath: config.staticDataPath || "/api",
      });

    case "api":
    default:
      return new ApiDataService(config);
  }
}

/**
 * Get singleton instance of data service
 */
export function getDataService(): IDataService {
  if (!dataServiceInstance) {
    dataServiceInstance = createDataService();
  }
  return dataServiceInstance;
}

/**
 * Reset the data service instance (useful for testing)
 */
export function resetDataService(): void {
  dataServiceInstance = null;
}
