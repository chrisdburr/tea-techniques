// src/lib/services/searchService.ts
import { getDataConfig } from "@/lib/config/dataConfig";

export interface SearchIndex {
  techniques: SearchableTechnique[];
}

export interface SearchableTechnique {
  slug: string;
  name: string;
  acronym?: string;
  searchableText: string;
  tokens: string[];
}

export interface SearchResult {
  slug: string;
  name: string;
  acronym?: string;
  score: number;
  matchedTokens: string[];
}

export interface ISearchService {
  search(query: string): Promise<SearchResult[]>;
  initialize(): Promise<void>;
}

/**
 * Static search service that performs client-side full-text search
 * using a pre-built search index
 */
export class StaticSearchService implements ISearchService {
  private searchIndex: SearchIndex | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const response = await fetch("/api/search-index.json");
      if (!response.ok) {
        throw new Error(`Failed to load search index: ${response.status}`);
      }
      this.searchIndex = await response.json();
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize search index:", error);
      throw error;
    }
  }

  async search(query: string): Promise<SearchResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.searchIndex || !query.trim()) {
      return [];
    }

    const searchTerms = this.tokenizeQuery(query);
    const results: SearchResult[] = [];

    for (const technique of this.searchIndex.techniques) {
      const score = this.calculateRelevanceScore(technique, searchTerms);
      if (score > 0) {
        const matchedTokens = this.getMatchedTokens(technique, searchTerms);
        results.push({
          slug: technique.slug,
          name: technique.name,
          acronym: technique.acronym,
          score,
          matchedTokens,
        });
      }
    }

    // Sort by relevance score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  private tokenizeQuery(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length > 0);
  }

  private calculateRelevanceScore(
    technique: SearchableTechnique,
    searchTerms: string[],
  ): number {
    let score = 0;

    for (const term of searchTerms) {
      // Exact matches in name get highest score
      if (technique.name.toLowerCase().includes(term)) {
        score += 10;
      }

      // Exact matches in acronym get high score
      if (technique.acronym?.toLowerCase().includes(term)) {
        score += 8;
      }

      // Token matches get medium score
      for (const token of technique.tokens) {
        if (token.includes(term)) {
          score += token === term ? 5 : 3; // Exact token match vs partial
        }
      }

      // Full text matches get lower score
      if (technique.searchableText.includes(term)) {
        score += 1;
      }
    }

    return score;
  }

  private getMatchedTokens(
    technique: SearchableTechnique,
    searchTerms: string[],
  ): string[] {
    const matched = new Set<string>();

    for (const term of searchTerms) {
      // Check name
      if (technique.name.toLowerCase().includes(term)) {
        matched.add(technique.name);
      }

      // Check acronym
      if (technique.acronym?.toLowerCase().includes(term)) {
        matched.add(technique.acronym);
      }

      // Check tokens
      for (const token of technique.tokens) {
        if (token.includes(term)) {
          matched.add(token);
        }
      }
    }

    return Array.from(matched);
  }
}

/**
 * API-based search service that delegates to the backend
 */
export class ApiSearchService implements ISearchService {
  async initialize(): Promise<void> {
    // No initialization needed for API-based search
  }

  async search(query: string): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      // Use the backend's search endpoint
      const response = await fetch(
        `/api/techniques/?search=${encodeURIComponent(
          query,
        )}&search_fields=name,description`,
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      // Convert API response to search results
      return data.results.map(
        (
          technique: { slug: string; name: string; acronym?: string },
          index: number,
        ) => ({
          slug: technique.slug,
          name: technique.name,
          acronym: technique.acronym,
          score: data.results.length - index, // Simple score based on API order
          matchedTokens: [], // API doesn't provide detailed match info
        }),
      );
    } catch (error) {
      console.error("API search failed:", error);
      return [];
    }
  }
}

// Factory function to get the appropriate search service
export function getSearchService(): ISearchService {
  const config = getDataConfig();

  if (config.dataSource === "static" || config.dataSource === "mock") {
    return new StaticSearchService();
  } else {
    return new ApiSearchService();
  }
}
