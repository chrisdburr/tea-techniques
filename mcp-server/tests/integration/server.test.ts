import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { KnowledgeGraph } from '../../src/graph/index.js';
import type { JsonLdGraph } from '../../src/graph/types.js';
import { createServer } from '../../src/server.js';
import fixture from '../fixtures/test-graph.json' with { type: 'json' };

describe('MCP Server Integration', () => {
  let client: Client;

  beforeAll(async () => {
    const graph = new KnowledgeGraph(fixture as unknown as JsonLdGraph);
    const server = createServer(graph);

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);

    client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(clientTransport);
  });

  it('lists all 10 tools', async () => {
    const result = await client.listTools();
    expect(result.tools).toHaveLength(10);
    const names = result.tools.map((t) => t.name).sort();
    expect(names).toEqual([
      'compare_techniques',
      'coverage_statistics',
      'explore_taxonomy',
      'find_evidence_types',
      'find_related',
      'find_techniques',
      'get_knowledge_graph_summary',
      'get_technique',
      'search_resources',
      'suggest_techniques_for_claim',
    ]);
  });

  it('find_techniques returns results', async () => {
    const result = await client.callTool({
      name: 'find_techniques',
      arguments: {},
    });
    expect(result.content).toHaveLength(1);
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain('SHAP');
  });

  it('find_techniques filters by query', async () => {
    const result = await client.callTool({
      name: 'find_techniques',
      arguments: { query: 'permutation' },
    });
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain('Permutation');
  });

  it('get_technique returns full details', async () => {
    const result = await client.callTool({
      name: 'get_technique',
      arguments: { slug: 'shapley-additive-explanations' },
    });
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain('SHAP');
    expect(text).toContain('Assurance Goals');
    expect(text).toContain('Tags');
  });

  it('get_technique handles unknown slug', async () => {
    const result = await client.callTool({
      name: 'get_technique',
      arguments: { slug: 'nonexistent-technique' },
    });
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain('not found');
  });

  it('compare_techniques returns comparison', async () => {
    const result = await client.callTool({
      name: 'compare_techniques',
      arguments: {
        slugs: ['shapley-additive-explanations', 'permutation-importance'],
      },
    });
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain('Goals');
    expect(text).toContain('Complexity');
  });

  it('find_related returns relationships', async () => {
    const result = await client.callTool({
      name: 'find_related',
      arguments: { slug: 'shapley-additive-explanations' },
    });
    const text = (result.content[0] as { type: string; text: string }).text;
    // Should find same-goal techniques at minimum
    expect(text.length).toBeGreaterThan(0);
  });

  it('suggest_techniques_for_claim suggests techniques', async () => {
    const result = await client.callTool({
      name: 'suggest_techniques_for_claim',
      arguments: { claim: 'explain how the model makes decisions' },
    });
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text.length).toBeGreaterThan(0);
  });

  it('find_evidence_types returns results', async () => {
    const result = await client.callTool({
      name: 'find_evidence_types',
      arguments: {},
    });
    expect(result.content).toHaveLength(1);
  });

  it('explore_taxonomy returns top-level categories', async () => {
    const result = await client.callTool({
      name: 'explore_taxonomy',
      arguments: {},
    });
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain('techniques');
  });

  it('coverage_statistics returns stats', async () => {
    const result = await client.callTool({
      name: 'coverage_statistics',
      arguments: { dimension: 'goals' },
    });
    const text = (result.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed.dimension).toBe('goals');
    expect(parsed.total).toBe(3);
  });

  it('search_resources returns results', async () => {
    const result = await client.callTool({
      name: 'search_resources',
      arguments: {},
    });
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text.length).toBeGreaterThan(0);
  });

  it('get_knowledge_graph_summary returns summary', async () => {
    const result = await client.callTool({
      name: 'get_knowledge_graph_summary',
      arguments: {},
    });
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain('TEA Techniques Knowledge Graph');
    expect(text).toContain('Techniques: 3');
    expect(text).toContain('Relationships');
  });
});
