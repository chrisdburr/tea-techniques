import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

const config: Config = {
	darkMode: "class",
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				primary: "#1E40AF",
				secondary: "#64748B",
			},
			fontFamily: {
				sans: ["var(--font-geist-sans)", "Inter", "sans-serif"],
				mono: ["var(--font-geist-mono)", "monospace"],
			},
		},
	},
	plugins: [forms, typography],
};

export default config;
