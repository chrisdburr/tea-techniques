// frontend/src/lib/config.ts

interface Config {
	apiBaseUrl: string;
	swaggerUrl: string;
	isProduction: boolean;
}

// Always prefer environment variables if available
const getApiBaseUrl = (): string => {
	// Check for environment variables
	if (process.env.NEXT_PUBLIC_API_URL) {
		return process.env.NEXT_PUBLIC_API_URL;
	}

	// Use relative URL for both dev and prod to work with any domain
	return "/api";
};

const getSwaggerUrl = (): string => {
	if (process.env.NEXT_PUBLIC_SWAGGER_URL) {
		return process.env.NEXT_PUBLIC_SWAGGER_URL;
	}

	// Use relative URL
	return "/swagger/";
};

export const config: Config = {
	apiBaseUrl: getApiBaseUrl(),
	swaggerUrl: getSwaggerUrl(),
	isProduction: process.env.NODE_ENV === "production",
};