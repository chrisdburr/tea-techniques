// src/lib/api/client.ts
import axios from "axios";

// Use direct absolute URL instead of relative
const apiClient = axios.create({
	baseURL: "http://localhost:8000/api",
	timeout: 15000,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
	// Prevent redirect following to avoid loops
	maxRedirects: 0,
});

export { apiClient };
export default apiClient;
