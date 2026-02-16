/**
 * Generate pre-computed embeddings for all techniques.
 *
 * Builds a corpus of "{name}: {description}" + sample claims, embeds with
 * Xenova/all-MiniLM-L12-v2, and writes public/data/ld/embeddings.json.
 *
 * Usage: cd mcp-server && pnpm generate-embeddings
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from '@huggingface/transformers';
import { loadGraphData } from '../src/data/loader.js';
import { batchEmbed, buildCorpus } from '../src/embedding/model.js';
import type { EmbeddingsFile } from '../src/embedding/types.js';
import { KnowledgeGraph } from '../src/graph/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'public', 'data');
const OUTPUT_PATH = path.join(DATA_DIR, 'ld', 'embeddings.json');

const MODEL_ID = 'Xenova/all-MiniLM-L12-v2';

// biome-ignore lint/suspicious/noConsole: CLI script output
const log = console.log.bind(console);

async function main(): Promise<void> {
  log('Generate Embeddings for TEA Techniques');
  log('=======================================');
  log('');

  log('Loading knowledge graph...');
  const graphData = await loadGraphData({ local: true, dataDir: DATA_DIR });
  const graph = new KnowledgeGraph(graphData);

  log('Building corpus...');
  const corpus = buildCorpus(graph.getAllTechniques());
  const techniqueCount = graph.getAllTechniques().length;
  const claimCount = corpus.length - techniqueCount;
  log(
    `  ${corpus.length} entries (${techniqueCount} descriptions + ${claimCount} claims)`
  );

  log(`Loading model: ${MODEL_ID}...`);
  const loadStart = performance.now();
  const extractor = await pipeline('feature-extraction', MODEL_ID);
  log(
    `  Model loaded in ${((performance.now() - loadStart) / 1000).toFixed(1)}s`
  );

  log(`Embedding ${corpus.length} entries...`);
  const embedStart = performance.now();
  const vectors = await batchEmbed(
    extractor,
    corpus.map((e) => e.text)
  );
  log(`  Embedded in ${((performance.now() - embedStart) / 1000).toFixed(1)}s`);

  const dimensions = vectors[0]?.length ?? 0;

  const embeddingsFile: EmbeddingsFile = {
    modelId: MODEL_ID,
    dimensions,
    corpusSize: corpus.length,
    entries: corpus.map((entry, i) => ({
      slug: entry.slug,
      vector: Array.from(vectors[i]),
    })),
  };

  const json = JSON.stringify(embeddingsFile);
  await fs.writeFile(OUTPUT_PATH, json);

  const sizeMB = (Buffer.byteLength(json) / 1024 / 1024).toFixed(1);
  log('');
  log(`Written: ${OUTPUT_PATH}`);
  log(`  Corpus: ${corpus.length} entries, ${dimensions} dimensions`);
  log(`  File size: ${sizeMB} MB`);

  try {
    await extractor.dispose?.();
  } catch {
    // ignore
  }
}

main().catch((err) => {
  // biome-ignore lint/suspicious/noConsole: CLI script error output
  console.error('Generation failed:', err);
  process.exit(1);
});
