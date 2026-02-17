#!/usr/bin/env node

/**
 * TEA Techniques MCP Server entry point.
 *
 * Usage:
 *   npx tsx src/index.ts              # Fetch from remote (with 24h cache)
 *   npx tsx src/index.ts --local      # Load from local project data files
 */

import path from 'node:path';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadGraphData } from './data/loader.js';
import { loadEmbeddings } from './embedding/loader.js';
import { KnowledgeGraph } from './graph/index.js';
import { createServer } from './server.js';

const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const rawDataDir =
  args.find((a) => a.startsWith('--data-dir='))?.split('=')[1] ??
  new URL('../../public/data', import.meta.url).pathname;
const dataDir = path.resolve(rawDataDir);

async function main(): Promise<void> {
  const [graphData, embeddings] = await Promise.all([
    loadGraphData({ local: isLocal, dataDir }),
    loadEmbeddings({ local: isLocal, dataDir }),
  ]);

  const graph = new KnowledgeGraph(graphData, embeddings);

  // biome-ignore lint/suspicious/noConsole: startup logging to stderr
  console.error(
    `TEA Techniques MCP Server ready (${graph.getSummary().techniques} techniques, embeddings: ${embeddings ? 'loaded' : 'unavailable'})`
  );

  const server = createServer(graph);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  // biome-ignore lint/suspicious/noConsole: error logging to stderr
  console.error('Fatal error:', error);
  process.exit(1);
});
