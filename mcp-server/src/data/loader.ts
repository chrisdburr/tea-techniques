/**
 * Load graph data from local files or remote URL with caching.
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { JsonLdGraph } from '../graph/types.js';

const REMOTE_URL =
  'https://alan-turing-institute.github.io/tea-techniques/data/ld/graph.jsonld';

const CACHE_DIR = path.join(os.homedir(), '.cache', 'tea-techniques-mcp');
const CACHE_FILE = path.join(CACHE_DIR, 'graph.jsonld');
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

async function isCacheValid(): Promise<boolean> {
  try {
    const stat = await fs.stat(CACHE_FILE);
    return Date.now() - stat.mtimeMs < CACHE_MAX_AGE_MS;
  } catch {
    return false;
  }
}

async function readCache(): Promise<JsonLdGraph | null> {
  try {
    const content = await fs.readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(content) as JsonLdGraph;
  } catch {
    return null;
  }
}

async function writeCache(data: JsonLdGraph): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(data));
}

async function fetchRemote(): Promise<JsonLdGraph> {
  const response = await fetch(REMOTE_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch graph: ${response.status} ${response.statusText}`
    );
  }
  return (await response.json()) as JsonLdGraph;
}

async function loadFromLocal(dataDir: string): Promise<JsonLdGraph> {
  const graphPath = path.join(dataDir, 'ld', 'graph.jsonld');
  const content = await fs.readFile(graphPath, 'utf-8');
  return JSON.parse(content) as JsonLdGraph;
}

export async function loadGraphData(options: {
  local?: boolean;
  dataDir?: string;
}): Promise<JsonLdGraph> {
  // Local mode: read directly from project files
  if (options.local && options.dataDir) {
    const data = await loadFromLocal(options.dataDir);
    // biome-ignore lint/suspicious/noConsole: startup logging to stderr
    console.error(
      `Loaded graph from local: ${options.dataDir}/ld/graph.jsonld`
    );
    return data;
  }

  // Remote mode: check cache first
  if (await isCacheValid()) {
    const cached = await readCache();
    if (cached) {
      // biome-ignore lint/suspicious/noConsole: startup logging to stderr
      console.error(`Loaded graph from cache: ${CACHE_FILE}`);
      return cached;
    }
  }

  // Fetch from remote
  // biome-ignore lint/suspicious/noConsole: startup logging to stderr
  console.error(`Fetching graph from: ${REMOTE_URL}`);
  const data = await fetchRemote();
  await writeCache(data);
  // biome-ignore lint/suspicious/noConsole: startup logging to stderr
  console.error(`Cached graph to: ${CACHE_FILE}`);
  return data;
}
