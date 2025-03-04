// src/app/api/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: { path: string[] } }
) {
	const path = params.path.join("/");
	const url = new URL(request.url);
	const backendUrl = `http://localhost:8000/api/${path}${url.search}`;

	console.log(`[API Route] Proxying GET request to: ${backendUrl}`);
	console.log(
		`[API Route] Request headers:`,
		Object.fromEntries(request.headers.entries())
	);

	try {
		console.log(`[API Route] Attempting fetch to backend...`);
		const response = await fetch(backendUrl, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			// Increase the timeout
			signal: AbortSignal.timeout(10000), // 10 second timeout
		});

		console.log(
			`[API Route] Backend responded with status:`,
			response.status
		);

		if (!response.ok) {
			console.error(
				`[API Route] Backend error - Status: ${response.status}`
			);
			return NextResponse.json(
				{ error: `Backend API returned: ${response.status}` },
				{ status: response.status }
			);
		}

		const responseText = await response.text();
		console.log(
			`[API Route] Response text (first 100 chars):`,
			responseText.substring(0, 100)
		);

		let data;
		try {
			data = JSON.parse(responseText);
			console.log(
				`[API Route] Successfully parsed JSON, found ${
					data.results ? data.results.length : 0
				} results`
			);
		} catch (jsonError) {
			console.error(`[API Route] Failed to parse JSON:`, jsonError);
			return NextResponse.json(
				{ error: "Failed to parse backend response as JSON" },
				{ status: 500 }
			);
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error(`[API Route] Error fetching ${backendUrl}:`, error);
		return NextResponse.json(
			{
				error: `Failed to fetch from backend API: ${
					error instanceof Error ? error.message : String(error)
				}`,
			},
			{ status: 500 }
		);
	}
}
