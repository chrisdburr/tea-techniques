/**
 * Type definitions for static data generation and indices
 */

// Search index types
export interface SearchIndexTechnique {
  slug: string;
  name: string;
  acronym: string | null;
  searchableText: string;
  tokens: string[];
}

export interface SearchIndex {
  techniques: SearchIndexTechnique[];
  invertedIndex: Record<string, string[]>;
  metadata: {
    totalTechniques: number;
    generatedAt: string;
  };
}

// Filter index types
export interface FilterIndexTag {
  id: number;
  name: string;
  category: string;
  description: string;
  techniqueCount: number;
}

export interface FilterIndexGoal {
  id: number;
  name: string;
  description: string;
  techniqueCount: number;
}

export interface TagCategory {
  name: string;
  tags: FilterIndexTag[];
  totalTechniques: number;
}

export interface RatingDistribution {
  rating: number;
  count: number;
}

export interface FilterIndex {
  tags: Record<number, FilterIndexTag>;
  assuranceGoals: Record<number, FilterIndexGoal>;
  tagCategories: Record<string, TagCategory>;
  complexityDistribution: RatingDistribution[];
  costDistribution: RatingDistribution[];
  metadata: {
    totalTechniques: number;
    totalTags: number;
    totalGoals: number;
    generatedAt: string;
  };
}

// Sync manifest types
export interface SyncManifest {
  version: string;
  lastSync: string | null;
  sourceHash: string | null;
  files: Record<
    string,
    {
      hash: string;
      size: number;
      generated: string;
    }
  >;
  techniqueCount?: number;
}

// Source data types (from backend/data/techniques.json)
export interface SourceTechniqueResource {
  title: string;
  url: string;
  description: string;
  authors?: string;
  publication_date?: string;
  source_type?: string;
  resource_type?: string;
}

export interface SourceTechniqueUseCase {
  description: string;
  goal: string;
}

export interface SourceTechniqueLimitation {
  description: string;
}

export interface SourceTechnique {
  slug: string;
  name: string;
  description: string;
  acronym?: string;
  assurance_goals: string[];
  tags: string[];
  example_use_cases: SourceTechniqueUseCase[];
  limitations: SourceTechniqueLimitation[];
  complexity_rating?: number;
  computational_cost_rating?: number;
  related_technique_slugs?: string[];
  resources?: SourceTechniqueResource[];
}
