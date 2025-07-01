// src/lib/data/static-data.ts
import techniquesData from '@/data/techniques.json';
import type { Technique } from '@/lib/types';

/**
 * Load techniques data from the static JSON file
 */
export async function getTechniques(): Promise<Technique[]> {
  return techniquesData as Technique[];
}

/**
 * Get a single technique by its slug
 */
export async function getTechniqueBySlug(slug: string): Promise<Technique | undefined> {
  const techniques = await getTechniques();
  return techniques.find(technique => technique.slug === slug);
}

/**
 * Get multiple techniques by their slugs
 * Useful for resolving related techniques
 */
export async function getTechniquesBySlug(slugs: string[]): Promise<Technique[]> {
  const techniques = await getTechniques();
  const slugSet = new Set(slugs);
  return techniques.filter(technique => slugSet.has(technique.slug));
}

/**
 * Get all unique assurance goals from the techniques data
 */
export async function getAssuranceGoals(): Promise<string[]> {
  const techniques = await getTechniques();
  const goalsSet = new Set<string>();
  
  techniques.forEach(technique => {
    technique.assurance_goals.forEach(goal => goalsSet.add(goal));
  });
  
  return Array.from(goalsSet).sort();
}

/**
 * Get all unique tags from the techniques data
 */
export async function getTags(): Promise<string[]> {
  const techniques = await getTechniques();
  const tagsSet = new Set<string>();
  
  techniques.forEach(technique => {
    technique.tags.forEach(tag => tagsSet.add(tag));
  });
  
  return Array.from(tagsSet).sort();
}

/**
 * Filter techniques based on search and filter criteria
 */
export async function filterTechniques(params: {
  search?: string;
  assurance_goals?: string[];
  tags?: string[];
  complexity_min?: number;
  complexity_max?: number;
  computational_cost_min?: number;
  computational_cost_max?: number;
}): Promise<Technique[]> {
  const techniques = await getTechniques();
  
  return techniques.filter(technique => {
    // Search filter
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      const matchesSearch = 
        technique.name.toLowerCase().includes(searchLower) ||
        technique.description.toLowerCase().includes(searchLower) ||
        (technique.acronym && technique.acronym.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    // Assurance goals filter
    if (params.assurance_goals && params.assurance_goals.length > 0) {
      const hasMatchingGoal = params.assurance_goals.some(goal => 
        technique.assurance_goals.includes(goal)
      );
      if (!hasMatchingGoal) return false;
    }
    
    // Tags filter
    if (params.tags && params.tags.length > 0) {
      const hasMatchingTag = params.tags.some(tag => 
        technique.tags.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }
    
    // Complexity rating filter
    if (params.complexity_min !== undefined && technique.complexity_rating !== undefined) {
      if (technique.complexity_rating < params.complexity_min) return false;
    }
    if (params.complexity_max !== undefined && technique.complexity_rating !== undefined) {
      if (technique.complexity_rating > params.complexity_max) return false;
    }
    
    // Computational cost rating filter
    if (params.computational_cost_min !== undefined && technique.computational_cost_rating !== undefined) {
      if (technique.computational_cost_rating < params.computational_cost_min) return false;
    }
    if (params.computational_cost_max !== undefined && technique.computational_cost_rating !== undefined) {
      if (technique.computational_cost_rating > params.computational_cost_max) return false;
    }
    
    return true;
  });
}

/**
 * Get paginated results from filtered techniques
 */
export async function getPaginatedTechniques(
  filterParams: Parameters<typeof filterTechniques>[0],
  page: number = 1,
  pageSize: number = 20
): Promise<{
  techniques: Technique[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> {
  const filteredTechniques = await filterTechniques(filterParams);
  const totalCount = filteredTechniques.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTechniques = filteredTechniques.slice(startIndex, endIndex);
  
  return {
    techniques: paginatedTechniques,
    totalCount,
    totalPages,
    currentPage: page,
  };
}