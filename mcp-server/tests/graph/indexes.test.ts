import { describe, expect, it } from 'vitest';
import { buildGraphIndex } from '../../src/graph/indexes.js';
import type { JsonLdGraph } from '../../src/graph/types.js';
import fixture from '../fixtures/test-graph.json' with { type: 'json' };

const graph = fixture as unknown as JsonLdGraph;
const index = buildGraphIndex(graph['@graph']);

describe('buildGraphIndex', () => {
  it('parses all technique nodes', () => {
    expect(index.techniques.size).toBe(3);
    expect(
      index.techniques.has('tea:technique/shapley-additive-explanations')
    ).toBe(true);
    expect(index.techniques.has('tea:technique/permutation-importance')).toBe(
      true
    );
    expect(index.techniques.has('tea:technique/mean-decrease-impurity')).toBe(
      true
    );
  });

  it('parses goal nodes', () => {
    expect(index.goals.size).toBeGreaterThanOrEqual(1);
    for (const goal of index.goals.values()) {
      expect(goal.slug).toBeTruthy();
      expect(goal.name).toBeTruthy();
    }
  });

  it('parses tag nodes', () => {
    expect(index.tags.size).toBeGreaterThanOrEqual(1);
    for (const tag of index.tags.values()) {
      expect(tag.prefLabel).toBeTruthy();
      expect(tag.path).toBeTruthy();
      expect(tag.category).toBeTruthy();
    }
  });

  it('parses resource nodes', () => {
    expect(index.resources.size).toBeGreaterThanOrEqual(1);
    for (const res of index.resources.values()) {
      expect(res.name).toBeTruthy();
      expect(res.citationKey).toBeTruthy();
    }
  });

  it('builds technique-to-goal adjacency lists', () => {
    const shap = index.techniques.get(
      'tea:technique/shapley-additive-explanations'
    );
    expect(shap).toBeDefined();
    const goalIds = index.techniqueToGoals.get(shap?.id ?? '');
    expect(goalIds).toBeDefined();
    expect(goalIds?.size).toBeGreaterThanOrEqual(1);
  });

  it('builds goal-to-technique reverse index', () => {
    for (const [goalId, techIds] of index.goalToTechniques) {
      expect(index.goals.has(goalId)).toBe(true);
      for (const tid of techIds) {
        expect(index.techniques.has(tid)).toBe(true);
      }
    }
  });

  it('builds technique-to-tag adjacency lists', () => {
    for (const [techId, tagIds] of index.techniqueToTags) {
      expect(index.techniques.has(techId)).toBe(true);
      expect(tagIds.size).toBeGreaterThanOrEqual(1);
    }
  });

  it('builds tag-to-technique reverse index', () => {
    for (const [tagId, techIds] of index.tagToTechniques) {
      expect(index.tags.has(tagId)).toBe(true);
      for (const tid of techIds) {
        expect(index.techniques.has(tid)).toBe(true);
      }
    }
  });

  it('builds technique-to-resource adjacency lists', () => {
    let hasResources = false;
    for (const [techId, resIds] of index.techniqueToResources) {
      expect(index.techniques.has(techId)).toBe(true);
      hasResources = true;
      for (const rid of resIds) {
        expect(typeof rid).toBe('string');
      }
    }
    expect(hasResources).toBe(true);
  });

  it('builds resource-to-technique reverse index', () => {
    for (const [resId, techIds] of index.resourceToTechniques) {
      expect(typeof resId).toBe('string');
      for (const tid of techIds) {
        expect(index.techniques.has(tid)).toBe(true);
      }
    }
  });

  it('builds tag category index', () => {
    expect(index.tagsByCategory.size).toBeGreaterThanOrEqual(1);
    for (const [category, tagIds] of index.tagsByCategory) {
      expect(typeof category).toBe('string');
      for (const tagId of tagIds) {
        const tag = index.tags.get(tagId);
        expect(tag).toBeDefined();
        expect(tag?.category).toBe(category);
      }
    }
  });
});
