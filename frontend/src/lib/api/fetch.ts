// src/lib/api/fetch.ts
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
	// Always use the absolute path to the backend in development
	const baseUrl = "http://localhost:8000/api";
	const url = `${baseUrl}/${endpoint.replace(/^\//, "")}`;

	console.log(`[fetchApi] Requesting: ${url}`);

	const response = await fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			...options.headers,
		},
	});

	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	return response.json();
}
