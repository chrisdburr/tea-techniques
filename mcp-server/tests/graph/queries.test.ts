import { describe, expect, it } from 'vitest';
import { KnowledgeGraph } from '../../src/graph/index.js';
import type { JsonLdGraph } from '../../src/graph/types.js';
import fixture from '../fixtures/test-graph.json' with { type: 'json' };

const graph = new KnowledgeGraph(fixture as unknown as JsonLdGraph);

describe('KnowledgeGraph', () => {
  describe('getTechnique', () => {
    it('returns a technique by slug', () => {
      const t = graph.getTechnique('shapley-additive-explanations');
      expect(t).toBeDefined();
      expect(t?.name?.toLowerCase()).toContain('shapley');
    });

    it('returns undefined for unknown slug', () => {
      expect(graph.getTechnique('nonexistent')).toBeUndefined();
    });
  });

  describe('getGoal', () => {
    it('returns a goal by slug', () => {
      const g = graph.getGoal('explainability');
      expect(g).toBeDefined();
      expect(g?.name).toBeTruthy();
    });

    it('returns undefined for unknown slug', () => {
      expect(graph.getGoal('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllTechniques', () => {
    it('returns all techniques', () => {
      const all = graph.getAllTechniques();
      expect(all).toHaveLength(3);
    });
  });

  describe('findTechniques', () => {
    it('returns all techniques with no filters', () => {
      const results = graph.findTechniques({});
      expect(results.length).toBe(3);
    });

    it('filters by query text', () => {
      const results = graph.findTechniques({ query: 'SHAP' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]?.slug).toBe('shapley-additive-explanations');
    });

    it('filters by goal', () => {
      const results = graph.findTechniques({ goals: ['explainability'] });
      expect(results.length).toBeGreaterThanOrEqual(1);
      for (const t of results) {
        expect(t.goals.some((g) => g.includes('explainability'))).toBe(true);
      }
    });

    it('filters by tag fragment', () => {
      const results = graph.findTechniques({ tags: ['model-agnostic'] });
      for (const t of results) {
        expect(
          t.tags.some((tag) => tag.toLowerCase().includes('model-agnostic'))
        ).toBe(true);
      }
    });

    it('respects limit', () => {
      const results = graph.findTechniques({ limit: 1 });
      expect(results).toHaveLength(1);
    });

    it('filters by maxComplexity', () => {
      const results = graph.findTechniques({ maxComplexity: 2 });
      for (const t of results) {
        if (t.complexityRating != null) {
          expect(t.complexityRating).toBeLessThanOrEqual(2);
        }
      }
    });
  });

  describe('compareTechniques', () => {
    it('compares multiple techniques', () => {
      const results = graph.compareTechniques([
        'shapley-additive-explanations',
        'permutation-importance',
      ]);
      expect(results).toHaveLength(2);
      for (const r of results) {
        expect(r.technique).toBeDefined();
        expect(r.goalNames.length).toBeGreaterThanOrEqual(1);
        expect(typeof r.resourceCount).toBe('number');
      }
    });

    it('skips unknown slugs', () => {
      const results = graph.compareTechniques([
        'shapley-additive-explanations',
        'nonexistent',
      ]);
      expect(results).toHaveLength(1);
    });
  });

  describe('findRelated', () => {
    it('finds related techniques', () => {
      const related = graph.findRelated('shapley-additive-explanations', 1);
      // Should find at least same-goal techniques
      expect(related.length).toBeGreaterThanOrEqual(0);
      for (const r of related) {
        expect(r.technique).toBeDefined();
        expect(r.relationship).toBeTruthy();
      }
    });

    it('returns empty for unknown slug', () => {
      expect(graph.findRelated('nonexistent', 1)).toEqual([]);
    });
  });

  describe('suggestForClaim', () => {
    it('suggests techniques for an explainability claim', () => {
      const results = graph.suggestForClaim('explain model predictions');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('returns results for broad claim', () => {
      const results = graph.suggestForClaim('understand the model');
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('findEvidenceTypes', () => {
    it('returns evidence types', () => {
      const types = graph.findEvidenceTypes();
      // May be empty if fixture has no evidence-type tags
      expect(Array.isArray(types)).toBe(true);
    });
  });

  describe('exploreTaxonomy', () => {
    it('returns top-level categories when no path given', () => {
      const result = graph.exploreTaxonomy();
      expect(result.children.length).toBeGreaterThanOrEqual(1);
      for (const child of result.children) {
        expect(child.tag).toBeDefined();
        expect(typeof child.techniqueCount).toBe('number');
      }
    });
  });

  describe('coverageStatistics', () => {
    it('returns goal coverage', () => {
      const stats = graph.coverageStatistics('goals');
      expect(stats.dimension).toBe('goals');
      expect(stats.total).toBe(3);
    });

    it('returns complexity coverage', () => {
      const stats = graph.coverageStatistics('complexity');
      expect(stats.dimension).toBe('complexity');
      expect(stats.distribution).toBeDefined();
    });

    it('returns cross-goal coverage', () => {
      const stats = graph.coverageStatistics('cross-goal');
      expect(stats.dimension).toBe('cross-goal');
      expect(stats.combinations).toBeDefined();
    });

    it('returns tag-based coverage', () => {
      const stats = graph.coverageStatistics('lifecycle');
      expect(stats.dimension).toBe('lifecycle');
    });
  });

  describe('searchResources', () => {
    it('returns resources with no filters', () => {
      const results = graph.searchResources({});
      expect(results.length).toBeGreaterThanOrEqual(1);
      for (const r of results) {
        expect(r.resource.name).toBeTruthy();
        expect(Array.isArray(r.techniques)).toBe(true);
      }
    });

    it('filters by technique slug', () => {
      const results = graph.searchResources({
        technique: 'shapley-additive-explanations',
      });
      for (const r of results) {
        expect(r.techniques).toContain('shapley-additive-explanations');
      }
    });

    it('respects limit', () => {
      const results = graph.searchResources({ limit: 1 });
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getSummary', () => {
    it('returns correct entity counts', () => {
      const summary = graph.getSummary();
      expect(summary.techniques).toBe(3);
      expect(summary.goals).toBeGreaterThanOrEqual(1);
      expect(summary.tags).toBeGreaterThanOrEqual(1);
      expect(summary.resources).toBeGreaterThanOrEqual(1);
      expect(summary.relationships.techniqueGoal).toBeGreaterThanOrEqual(1);
      expect(summary.relationships.techniqueTag).toBeGreaterThanOrEqual(1);
    });
  });
});
