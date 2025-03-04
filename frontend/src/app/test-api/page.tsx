"use client";

import React, { useState, useEffect } from "react";

export default function TestApiPage() {
	const [data, setData] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		async function fetchData() {
			try {
				console.log("Making fetch request to /api/techniques");
				const response = await fetch("/api/techniques");
				console.log("Response status:", response.status);

				if (!response.ok) {
					throw new Error(
						`API returned ${response.status}: ${response.statusText}`
					);
				}

				const jsonData = await response.json();
				console.log("Data received:", jsonData);
				setData(jsonData);
				setError(null);
			} catch (err) {
				console.error("Fetch error:", err);
				setError(err instanceof Error ? err.message : String(err));
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, []);

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">API Connection Test</h1>

			{loading ? (
				<p>Loading...</p>
			) : error ? (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
					<p className="font-bold">Error:</p>
					<p>{error}</p>
				</div>
			) : (
				<div>
					<p className="text-green-700 font-bold mb-2">
						API Connected Successfully!
					</p>
					<div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
						<pre>{JSON.stringify(data, null, 2)}</pre>
					</div>
				</div>
			)}

			<div className="mt-8">
				<h2 className="text-xl font-bold mb-2">Debug Information</h2>
				<ul className="list-disc pl-6">
					<li>
						URL:{" "}
						{typeof window !== "undefined"
							? window.location.href
							: ""}
					</li>
					<li>Test endpoint: /api/techniques</li>
					<li>Time: {new Date().toLocaleTimeString()}</li>
				</ul>
			</div>
		</div>
	);
}
