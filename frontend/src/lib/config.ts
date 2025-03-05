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

	// For local development without env vars
	if (process.env.NODE_ENV === "development") {
		return "http://localhost:8000/api";
	}

	// Production fallback (should be overridden by env var)
	return "/api";
};

const getSwaggerUrl = (): string => {
	if (process.env.NEXT_PUBLIC_SWAGGER_URL) {
		return process.env.NEXT_PUBLIC_SWAGGER_URL;
	}

	if (process.env.NODE_ENV === "development") {
		return "http://localhost:8000/swagger/";
	}

	return "/swagger/";
};

export const config: Config = {
	apiBaseUrl: getApiBaseUrl(),
	swaggerUrl: getSwaggerUrl(),
	isProduction: process.env.NODE_ENV === "production",
};
