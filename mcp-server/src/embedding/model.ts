/**
 * ONNX model loading and query embedding.
 *
 * Uses @huggingface/transformers with onnxruntime-node backend.
 * Lazy-loads the model on first use (~1.5s), then caches it.
 */

import type { TechniqueNode } from '../graph/types.js';

const MODEL_ID = 'Xenova/all-MiniLM-L12-v2';

// biome-ignore lint/suspicious/noExplicitAny: HF pipeline type not fully exported
type Extractor = any;

let cachedExtractor: Extractor | null = null;
let loadAttempted = false;

/** Lazy-load the embedding model. Returns null on failure. */
export async function getEmbeddingModel(): Promise<Extractor | null> {
  if (cachedExtractor) {
    return cachedExtractor;
  }
  if (loadAttempted) {
    return null;
  }
  loadAttempted = true;

  try {
    const { pipeline } = await import('@huggingface/transformers');
    cachedExtractor = await pipeline('feature-extraction', MODEL_ID);
    return cachedExtractor;
  } catch {
    return null;
  }
}

/** Embed a single text query. Returns null on failure. */
export async function embedQuery(
  extractor: Extractor,
  text: string
): Promise<Float32Array | null> {
  try {
    const output = await extractor([text], {
      pooling: 'mean',
      normalize: true,
    });
    const dims = output.dims[1] as number;
    return (output.data as Float32Array).slice(0, dims);
  } catch {
    return null;
  }
}

/** Batch embed multiple texts (for build-time generation). */
export async function batchEmbed(
  extractor: Extractor,
  texts: string[],
  batchSize = 32
): Promise<Float32Array[]> {
  const vectors: Float32Array[] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, Math.min(i + batchSize, texts.length));
    // biome-ignore lint/nursery/noAwaitInLoop: sequential batching to avoid OOM
    const output = await extractor(batch, {
      pooling: 'mean',
      normalize: true,
    });
    const data = output.data as Float32Array;
    const dims = output.dims[1] as number;
    for (let j = 0; j < batch.length; j++) {
      vectors.push(data.slice(j * dims, (j + 1) * dims));
    }
  }
  return vectors;
}

/** Build corpus entries from techniques: "{name}: {description}" + each sample claim. */
export function buildCorpus(
  techniques: TechniqueNode[]
): Array<{ text: string; slug: string }> {
  const corpus: Array<{ text: string; slug: string }> = [];
  for (const t of techniques) {
    corpus.push({ text: `${t.name}: ${t.description}`, slug: t.slug });
    for (const claim of t.sampleClaims) {
      corpus.push({ text: claim.text, slug: t.slug });
    }
  }
  return corpus;
}
