// debug-fetch.js
// Run this with Node.js to test direct API connectivity

const fetch = require("node-fetch");

const apiUrl = "http://localhost:8000/api/techniques/";
console.log(`Attempting to fetch from: ${apiUrl}`);

fetch(apiUrl, {
	method: "GET",
	headers: {
		Accept: "application/json",
	},
})
	.then((response) => {
		console.log("Status:", response.status);
		console.log(
			"Headers:",
			JSON.stringify(Object.fromEntries([...response.headers]), null, 2)
		);
		return response.text(); // Use text() instead of json() for debugging
	})
	.then((text) => {
		console.log(
			"Response body:",
			text.substring(0, 500) + (text.length > 500 ? "..." : "")
		);
		try {
			const json = JSON.parse(text);
			console.log(
				"Parsed JSON:",
				JSON.stringify(json).substring(0, 500) + "..."
			);
		} catch (e) {
			console.log("Failed to parse as JSON:", e.message);
		}
	})
	.catch((error) => {
		console.error("Fetch error:", error);
	});
