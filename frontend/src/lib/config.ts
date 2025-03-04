// frontend/src/lib/config.ts

interface Config {
	apiBaseUrl: string;
	swaggerUrl: string;
  }
  
  const development: Config = {
	apiBaseUrl: "http://localhost:8000/api",
	swaggerUrl: "http://localhost:8000/swagger/",
  };
  
  const production: Config = {
	apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "https://api.yourdomain.com/api",
	swaggerUrl: process.env.NEXT_PUBLIC_SWAGGER_URL || "https://api.yourdomain.com/swagger/",
  };
  
  const azure: Config = {
	apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
	swaggerUrl: process.env.NEXT_PUBLIC_SWAGGER_URL || "/swagger/",
  };
  
  export const config: Config =
	process.env.NODE_ENV === "production"
	  ? process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === "azure"
		? azure
		: production
	  : development;