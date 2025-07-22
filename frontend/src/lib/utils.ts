import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Tag } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse tags by a specific prefix
 * @param tags - Array of tags (can be Tag objects or strings)
 * @param prefix - The prefix to filter by (e.g., "applicable-models")
 * @returns Array of tags matching the prefix
 */
export function parseTagsByPrefix(
  tags: Tag[] | string[],
  prefix: string,
): Tag[] {
  if (!tags || !Array.isArray(tags)) {
    return [];
  }

  // Handle both string arrays and Tag objects
  return tags
    .map((tag, index) => {
      if (typeof tag === "string") {
        return { id: index, name: tag };
      }
      return tag;
    })
    .filter((tag) => tag && tag.name && tag.name.startsWith(`${prefix}/`));
}

/**
 * Get the value part of a tag (after the last slash)
 * @param tagName - The full tag name (e.g., "data-type/tabular")
 * @returns The value part (e.g., "tabular")
 */
export function getTagValue(tagName: string): string {
  const parts = tagName.split("/");
  return parts[parts.length - 1];
}

/**
 * Get all unique tag prefixes from a list of tags
 * @param tags - Array of tags (can be Tag objects or strings)
 * @returns Array of unique prefixes
 */
export function getTagPrefixes(tags: Tag[] | string[]): string[] {
  const prefixes = new Set<string>();
  if (!tags || !Array.isArray(tags)) {
    return [];
  }
  tags.forEach((tag) => {
    const tagName = typeof tag === "string" ? tag : tag?.name;
    if (!tagName) {
      return;
    }
    const prefix = tagName.split("/")[0];
    if (prefix) {
      prefixes.add(prefix);
    }
  });
  return Array.from(prefixes);
}

/**
 * Parse hierarchical tags into a structured format
 * @param tagName - The tag name (e.g., "assurance-goal-category/explainability/feature-analysis")
 * @returns Object with parsed components
 */
export function parseHierarchicalTag(tagName: string): {
  prefix: string;
  categories: string[];
  fullPath: string;
} {
  const parts = tagName.split("/");
  return {
    prefix: parts[0] || "",
    categories: parts.slice(1),
    fullPath: tagName,
  };
}

/**
 * Get applicable models from tags
 * @param tags - Array of tags (can be Tag objects or strings)
 * @returns Array of applicable model types
 */
export function getApplicableModels(tags: Tag[] | string[]): string[] {
  return parseTagsByPrefix(tags, "applicable-models").map((tag) =>
    getTagValue(tag.name),
  );
}

/**
 * Get lifecycle stages from tags
 * @param tags - Array of tags (can be Tag objects or strings)
 * @returns Array of lifecycle stages
 */
export function getLifecycleStages(tags: Tag[] | string[]): string[] {
  return parseTagsByPrefix(tags, "lifecycle-stage").map((tag) =>
    getTagValue(tag.name),
  );
}

/**
 * Get data types from tags
 * @param tags - Array of tags (can be Tag objects or strings)
 * @returns Array of data types
 */
export function getDataTypes(tags: Tag[] | string[]): string[] {
  return parseTagsByPrefix(tags, "data-type").map((tag) =>
    getTagValue(tag.name),
  );
}

/**
 * Get assurance goal categories from tags
 * @param tags - Array of tags (can be Tag objects or strings)
 * @returns Array of structured category information
 */
export function getAssuranceGoalCategories(tags: Tag[] | string[]): Array<{
  goal: string;
  category?: string;
  subcategory?: string;
}> {
  return parseTagsByPrefix(tags, "assurance-goal-category").map((tag) => {
    const parsed = parseHierarchicalTag(tag.name);
    return {
      goal: parsed.categories[0] || "",
      category: parsed.categories[1],
      subcategory: parsed.categories[2],
    };
  });
}

/**
 * Group tags by their prefix
 * @param tags - Array of tags (can be Tag objects or strings)
 * @returns Object with tags grouped by prefix
 */
export function groupTagsByPrefix(
  tags: Tag[] | string[],
): Record<string, Tag[]> {
  const grouped: Record<string, Tag[]> = {};

  if (!tags || !Array.isArray(tags)) {
    return grouped;
  }

  tags.forEach((tag, index) => {
    // Convert string to Tag object if needed
    const tagObj = typeof tag === "string" ? { id: index, name: tag } : tag;

    if (!tagObj || !tagObj.name) {
      return;
    }
    const prefix = tagObj.name.split("/")[0];
    if (!grouped[prefix]) {
      grouped[prefix] = [];
    }
    grouped[prefix].push(tagObj);
  });

  return grouped;
}

/**
 * Format tag name for display
 * @param tagName - The tag name to format
 * @param includePrefix - Whether to include the prefix in the display
 * @returns Formatted tag name
 */
export function formatTagDisplay(
  tagName: string,
  includePrefix: boolean = false,
): string {
  if (!tagName) {
    return "";
  }

  if (includePrefix) {
    return tagName
      .split("/")
      .map((part) =>
        part
          .split("-")
          .map((word) =>
            word ? word.charAt(0).toUpperCase() + word.slice(1) : "",
          )
          .join(" "),
      )
      .join(" / ");
  }

  const value = getTagValue(tagName);
  return value
    .split("-")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
}
