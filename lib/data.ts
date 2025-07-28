// Static data loading utilities
import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  AssuranceGoal,
  CategoryData,
  FilterData,
  SearchIndexEntry,
  Tag,
  Technique,
} from './types';

const dataPath = path.join(process.cwd(), 'public', 'data');

// Cache for loaded data to avoid reading files multiple times
const dataCache = new Map<string, unknown>();

async function loadJsonFile<T>(filePath: string): Promise<T> {
  if (dataCache.has(filePath)) {
    return dataCache.get(filePath) as T;
  }

  try {
    const fileContent = await fs.readFile(
      path.join(dataPath, filePath),
      'utf-8'
    );
    const data = JSON.parse(fileContent) as T;
    dataCache.set(filePath, data);
    return data;
  } catch (_error) {
    throw new Error(`Failed to load ${filePath}`);
  }
}

// Load all techniques (full data)
export async function getAllTechniques(): Promise<Technique[]> {
  return await loadJsonFile<Technique[]>('techniques.json');
}

// Load lightweight techniques metadata (name, slug, description, goals, tags only - 72% smaller)
export async function getAllTechniquesMetadata(): Promise<Technique[]> {
  return await loadJsonFile<Technique[]>('techniques-metadata.json');
}

// Load a single technique by slug
export async function getTechnique(slug: string): Promise<Technique | null> {
  try {
    return await loadJsonFile<Technique>(`techniques/${slug}.json`);
  } catch {
    return null;
  }
}

// Load all assurance goals
export async function getAssuranceGoals(): Promise<AssuranceGoal[]> {
  return await loadJsonFile<AssuranceGoal[]>('assurance-goals.json');
}

// Load all tags
export async function getTags(): Promise<Tag[]> {
  return await loadJsonFile<Tag[]>('tags.json');
}

// Load search index
export async function getSearchIndex(): Promise<SearchIndexEntry[]> {
  return await loadJsonFile<SearchIndexEntry[]>('search-index.json');
}

// Load category data
export async function getCategoryData(
  goalSlug: string
): Promise<CategoryData | null> {
  try {
    return await loadJsonFile<CategoryData>(`categories/${goalSlug}.json`);
  } catch {
    return null;
  }
}

// Load filter data
export async function getFilterData(
  category: string,
  tagSlug: string
): Promise<FilterData | null> {
  try {
    return await loadJsonFile<FilterData>(
      `filters/${category}/${tagSlug}.json`
    );
  } catch {
    return null;
  }
}

// Get techniques by assurance goal
export async function getTechniquesByGoal(
  goalName: string
): Promise<Technique[]> {
  const techniques = await getAllTechniques();
  return techniques.filter((technique) =>
    technique.assurance_goals?.includes(goalName)
  );
}

// Get techniques by tag
export async function getTechniquesByTag(
  tagName: string
): Promise<Technique[]> {
  const techniques = await getAllTechniques();
  return techniques.filter((technique) => technique.tags?.includes(tagName));
}

// Get related techniques (for now, just random selection from same goals)
export async function getRelatedTechniques(
  technique: Technique,
  limit = 3
): Promise<Technique[]> {
  const allTechniques = await getAllTechniques();

  // Find techniques that share assurance goals
  const related = allTechniques.filter(
    (t) =>
      t.slug !== technique.slug &&
      t.assurance_goals?.some((goal) =>
        technique.assurance_goals?.includes(goal)
      )
  );

  // Return a random selection
  return related.sort(() => Math.random() - 0.5).slice(0, limit);
}

// Search techniques
export async function searchTechniques(query: string): Promise<Technique[]> {
  const searchIndex = await getSearchIndex();
  const searchLower = query.toLowerCase();

  const matchingSlugs = searchIndex
    .filter((entry) => entry.searchText.includes(searchLower))
    .map((entry) => entry.slug);

  const allTechniques = await getAllTechniques();
  return allTechniques.filter((technique) =>
    matchingSlugs.includes(technique.slug)
  );
}

// Generate static params for dynamic routes
export async function generateTechniqueParams() {
  const techniques = await getAllTechniques();
  return techniques.map((technique) => ({
    slug: technique.slug,
  }));
}

export async function generateCategoryParams() {
  const goals = await getAssuranceGoals();
  return goals.map((goal) => ({
    goal: goal.slug,
  }));
}

export async function generateFilterParams() {
  const tags = await getTags();
  const paramsByCategory: Record<string, { category: string; tag: string }[]> =
    {};

  for (const tag of tags) {
    if (!paramsByCategory[tag.category]) {
      paramsByCategory[tag.category] = [];
    }
    paramsByCategory[tag.category].push({
      category: tag.category,
      tag: tag.slug,
    });
  }

  return paramsByCategory;
}
