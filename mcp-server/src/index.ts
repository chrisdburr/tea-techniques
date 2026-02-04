#!/usr/bin/env node

/**
 * TEA Techniques MCP Server entry point.
 *
 * Usage:
 *   npx tsx src/index.ts              # Fetch from remote (with 24h cache)
 *   npx tsx src/index.ts --local      # Load from local project data files
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadGraphData } from './data/loader.js';
import { KnowledgeGraph } from './graph/index.js';
import { createServer } from './server.js';

const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const dataDir =
  args.find((a) => a.startsWith('--data-dir='))?.split('=')[1] ??
  new URL('../../public/data', import.meta.url).pathname;

async function main(): Promise<void> {
  const graphData = await loadGraphData({
    local: isLocal,
    dataDir,
  });

  const graph = new KnowledgeGraph(graphData);

  // biome-ignore lint/suspicious/noConsole: startup logging to stderr
  console.error(
    `TEA Techniques MCP Server ready (${graph.getSummary().techniques} techniques)`
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
