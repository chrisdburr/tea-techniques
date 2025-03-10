// src/lib/api/fetch.ts
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
	// Always use a relative URL path for API calls
	const url = `/api/${endpoint.replace(/^\//, "")}`;

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