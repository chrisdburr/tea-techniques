/**
 * Load pre-computed embeddings from local files or remote URL with caching.
 *
 * Mirrors the pattern in src/data/loader.ts.
 * Returns null on failure (graceful degradation to keyword-only pipeline).
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { EmbeddingsFile, EmbeddingsIndex } from './types.js';

const REMOTE_URL =
  'https://alan-turing-institute.github.io/tea-techniques/data/ld/embeddings.json';

const CACHE_DIR = path.join(os.homedir(), '.cache', 'tea-techniques-mcp');
const CACHE_FILE = path.join(CACHE_DIR, 'embeddings.json');
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function toIndex(file: EmbeddingsFile): EmbeddingsIndex {
  const slugs: string[] = [];
  const vectors: Float32Array[] = [];
  for (const entry of file.entries) {
    slugs.push(entry.slug);
    vectors.push(new Float32Array(entry.vector));
  }
  return {
    modelId: file.modelId,
    dimensions: file.dimensions,
    slugs,
    vectors,
  };
}

async function isCacheValid(): Promise<boolean> {
  try {
    const stat = await fs.stat(CACHE_FILE);
    return Date.now() - stat.mtimeMs < CACHE_MAX_AGE_MS;
  } catch {
    return false;
  }
}

async function readCache(): Promise<EmbeddingsFile | null> {
  try {
    const content = await fs.readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(content) as EmbeddingsFile;
  } catch {
    return null;
  }
}

async function writeCache(data: EmbeddingsFile): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(data));
}

async function fetchRemote(): Promise<EmbeddingsFile> {
  const response = await fetch(REMOTE_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch embeddings: ${response.status} ${response.statusText}`
    );
  }
  return (await response.json()) as EmbeddingsFile;
}

async function loadFromLocal(dataDir: string): Promise<EmbeddingsFile> {
  const filePath = path.join(dataDir, 'ld', 'embeddings.json');
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as EmbeddingsFile;
}

/** Load embeddings, returning null on failure (graceful degradation). */
export async function loadEmbeddings(options: {
  local?: boolean;
  dataDir?: string;
}): Promise<EmbeddingsIndex | null> {
  try {
    let file: EmbeddingsFile;

    if (options.local && options.dataDir) {
      file = await loadFromLocal(options.dataDir);
      // biome-ignore lint/suspicious/noConsole: startup logging to stderr
      console.error(
        `Loaded embeddings from local: ${options.dataDir}/ld/embeddings.json (${file.corpusSize} entries)`
      );
      return toIndex(file);
    }

    // Remote mode: check cache first
    if (await isCacheValid()) {
      const cached = await readCache();
      if (cached) {
        // biome-ignore lint/suspicious/noConsole: startup logging to stderr
        console.error(
          `Loaded embeddings from cache: ${CACHE_FILE} (${cached.corpusSize} entries)`
        );
        return toIndex(cached);
      }
    }

    // Fetch from remote
    // biome-ignore lint/suspicious/noConsole: startup logging to stderr
    console.error(`Fetching embeddings from: ${REMOTE_URL}`);
    file = await fetchRemote();
    await writeCache(file);
    // biome-ignore lint/suspicious/noConsole: startup logging to stderr
    console.error(
      `Cached embeddings to: ${CACHE_FILE} (${file.corpusSize} entries)`
    );
    return toIndex(file);
  } catch {
    // biome-ignore lint/suspicious/noConsole: startup logging to stderr
    console.error(
      'Embeddings unavailable — falling back to keyword-only pipeline'
    );
    return null;
  }
}
