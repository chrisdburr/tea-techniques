// src/lib/markdown.ts
import fs from "fs";
import path from "path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkHtml from "remark-html";
import matter from "gray-matter";

// Root directory of the project
const projectRoot = path.join(process.cwd(), "..");

/**
 * Read and parse a markdown file from the project
 */
export async function getMarkdownContent(filePath: string) {
	// Get the absolute path
	const fullPath = path.join(projectRoot, filePath);

	// Read the file
	const fileContents = fs.readFileSync(fullPath, "utf8");

	// Use gray-matter to parse the markdown frontmatter
	const { content } = matter(fileContents);

	return { content };
}

/**
 * Convert markdown to HTML
 */
export async function markdownToHtml(markdown: string) {
	const result = await unified()
		.use(remarkParse)
		.use(remarkHtml, { sanitize: false }) // Ensure HTML isn't sanitized out
		.process(markdown);
	return result.toString();
}

/**
 * Extract sections from markdown content
 * Assumes sections are denoted by ## headings
 */
export function extractSections(markdownContent: string) {
	const sections: Record<string, string> = {};

	// Split the content by ## headings
	const sectionRegex = /##\s+([^\n]+)\n([\s\S]*?)(?=##\s+[^\n]+\n|$)/g;
	let match;

	while ((match = sectionRegex.exec(markdownContent)) !== null) {
		const sectionTitle = match[1].trim();
		const sectionContent = match[2].trim();

		// Generate a key by converting the section title to lowercase and replacing spaces with dashes
		const key = sectionTitle.toLowerCase().replace(/\s+/g, "-");
		sections[key] = sectionContent;
	}

	// Extract the introduction section (content before the first ## heading)
	const introMatch = markdownContent.match(/^([\s\S]*?)(?=##\s+[^\n]+\n|$)/);
	if (introMatch && introMatch[1].trim()) {
		sections["introduction"] = introMatch[1].trim();
	}

	return sections;
}

/**
 * Map README sections to about page tabs with HTML conversion
 */
export async function mapSectionsToTabs(sections: Record<string, string>) {
	// Convert each section to HTML
	const convertedSections: Record<string, string> = {};

	for (const [key, content] of Object.entries(sections)) {
		convertedSections[key] = await markdownToHtml(content);
	}

	return {
		projectInfo: {
			overview: convertedSections["introduction"] || "",
			features: convertedSections["key-features"] || "",
		},
		developerInstructions: {
			development: convertedSections["development-setup"] || "",
			projectStructure: convertedSections["project-structure"] || "",
			testing: convertedSections["testing"] || "",
		},
	};
}
