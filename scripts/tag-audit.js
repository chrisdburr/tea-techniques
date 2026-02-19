#!/usr/bin/env node

/**
 * TEA Techniques Tag Taxonomy Audit
 *
 * Analyses the tag taxonomy in techniques.json to detect:
 * A) Sparse tags (low usage count)
 * B) Near-duplicate tags (Levenshtein + structural)
 * C) High-overlap tag pairs (Jaccard similarity)
 * D) Orphan deep tags (depth-3+ with no siblings)
 * E) Category imbalance (high percentage of sparse tags)
 *
 * Usage:
 *   node scripts/tag-audit.js
 *   node scripts/tag-audit.js --min-count 5
 *   node scripts/tag-audit.js --output reports/tag-audit.json
 *   node scripts/tag-audit.js --help
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'public', 'data');
const techniquesPath = path.join(dataDir, 'techniques.json');

// Custom logger to handle console usage
const logger = {
  info: (message) => {
    // biome-ignore lint/suspicious/noConsole: CLI tool needs console output
    console.error(message);
  },
  error: (message) => {
    // biome-ignore lint/suspicious/noConsole: CLI tool needs console output
    console.error(message);
  },
};

// ---------------------------------------------------------------------------
// Config defaults
// ---------------------------------------------------------------------------

const TAG_AUDIT_DEFAULTS = {
  minCount: 3,
  similarityThreshold: 0.3,
  jaccardThreshold: 0.7,
  minPairSize: 3,
  imbalanceThreshold: 0.3,
  orphanMinDepth: 3,
};

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    logger.info(`
${chalk.bold('TEA Techniques Tag Taxonomy Audit')}

${chalk.dim('Usage:')}
  node scripts/tag-audit.js [options]

${chalk.dim('Options:')}
  --min-count <n>              Minimum tag usage count (default: ${TAG_AUDIT_DEFAULTS.minCount})
  --similarity-threshold <n>   Levenshtein similarity threshold 0-1 (default: ${TAG_AUDIT_DEFAULTS.similarityThreshold})
  --jaccard-threshold <n>      Jaccard overlap threshold 0-1 (default: ${TAG_AUDIT_DEFAULTS.jaccardThreshold})
  --imbalance-threshold <n>    Category sparse-tag ratio threshold (default: ${TAG_AUDIT_DEFAULTS.imbalanceThreshold})
  --output <path>              Write JSON report to file
  --help, -h                   Show this help message
`);
    process.exit(0);
  }

  function getArgValue(flag, defaultValue) {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) {
      return Number.parseFloat(args[idx + 1]);
    }
    return defaultValue;
  }

  const outputIdx = args.indexOf('--output');
  const outputPath =
    outputIdx !== -1 && args[outputIdx + 1]
      ? path.resolve(args[outputIdx + 1])
      : null;

  return {
    minCount: getArgValue('--min-count', TAG_AUDIT_DEFAULTS.minCount),
    similarityThreshold: getArgValue(
      '--similarity-threshold',
      TAG_AUDIT_DEFAULTS.similarityThreshold
    ),
    jaccardThreshold: getArgValue(
      '--jaccard-threshold',
      TAG_AUDIT_DEFAULTS.jaccardThreshold
    ),
    minPairSize: TAG_AUDIT_DEFAULTS.minPairSize,
    imbalanceThreshold: getArgValue(
      '--imbalance-threshold',
      TAG_AUDIT_DEFAULTS.imbalanceThreshold
    ),
    orphanMinDepth: TAG_AUDIT_DEFAULTS.orphanMinDepth,
    outputPath,
  };
}

// ---------------------------------------------------------------------------
// Data indexing
// ---------------------------------------------------------------------------

/** Build a map of tag -> Set<technique slug> */
function buildTagIndex(techniques) {
  const index = new Map();
  for (const technique of techniques) {
    for (const tag of technique.tags || []) {
      if (!index.has(tag)) {
        index.set(tag, new Set());
      }
      index.get(tag).add(technique.slug);
    }
  }
  return index;
}

/** Build category -> tag metadata map */
function buildCategoryMap(tagIndex) {
  const categories = new Map();

  for (const [tag, slugs] of tagIndex) {
    const parts = tag.split('/');
    const category = parts[0];
    const leaf = parts.at(-1);
    const depth = parts.length;
    const parent = parts.length > 1 ? parts.slice(0, -1).join('/') : null;

    if (!categories.has(category)) {
      categories.set(category, []);
    }

    categories.get(category).push({
      tag,
      count: slugs.size,
      depth,
      parent,
      leaf,
    });
  }

  // Sort each category's tags alphabetically
  for (const [, tags] of categories) {
    tags.sort((a, b) => a.tag.localeCompare(b.tag));
  }

  return categories;
}

// ---------------------------------------------------------------------------
// Levenshtein distance
// ---------------------------------------------------------------------------

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;

  if (m === 0) {
    return n;
  }
  if (n === 0) {
    return m;
  }

  // Use single-row optimization
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

/** Normalized Levenshtein distance (0 = identical, 1 = completely different) */
function normalizedLevenshtein(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) {
    return 0;
  }
  return levenshtein(a, b) / maxLen;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Jaccard similarity of two sets */
function jaccardSimilarity(setA, setB) {
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersection++;
    }
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// ---------------------------------------------------------------------------
// Module A: Sparse Tags
// ---------------------------------------------------------------------------

function analyseSparseTag(categoryMap, config) {
  const sparseTags = [];
  const categoryStats = new Map();

  for (const [category, tags] of categoryMap) {
    const sparse = tags.filter((t) => t.count < config.minCount);
    if (sparse.length > 0) {
      const percentage = round((sparse.length / tags.length) * 100, 1);
      sparseTags.push({
        category,
        total_tags: tags.length,
        sparse_count: sparse.length,
        sparse_percentage: percentage,
        tags: sparse.map((t) => ({
          tag: t.tag,
          count: t.count,
        })),
      });
    }
    categoryStats.set(category, {
      total: tags.length,
      sparse: sparse.length,
    });
  }

  // Sort by sparse count descending
  sparseTags.sort((a, b) => b.sparse_count - a.sparse_count);

  return { sparseTags, categoryStats };
}

// ---------------------------------------------------------------------------
// Module B: Near-Duplicates
// ---------------------------------------------------------------------------

/** Group tags by parent path within a category */
function groupTagsByParent(tags) {
  const byParent = new Map();
  for (const entry of tags) {
    if (!entry.parent) {
      continue;
    }
    if (!byParent.has(entry.parent)) {
      byParent.set(entry.parent, []);
    }
    byParent.get(entry.parent).push(entry);
  }
  return byParent;
}

/** Find leaf-level near-duplicates among siblings sharing a parent */
function findLeafDuplicatesInCategory(category, tags, config) {
  const results = [];
  const byParent = groupTagsByParent(tags);

  for (const [parent, siblings] of byParent) {
    for (let i = 0; i < siblings.length; i++) {
      for (let j = i + 1; j < siblings.length; j++) {
        const dist = normalizedLevenshtein(siblings[i].leaf, siblings[j].leaf);
        if (dist > 0 && dist <= config.similarityThreshold) {
          results.push({
            category,
            parent,
            tag_a: siblings[i].tag,
            tag_b: siblings[j].tag,
            leaf_a: siblings[i].leaf,
            leaf_b: siblings[j].leaf,
            distance: round(dist, 3),
            count_a: siblings[i].count,
            count_b: siblings[j].count,
          });
        }
      }
    }
  }

  return results;
}

/** Find tags with same leaf name at different depths within a category */
function findStructuralDuplicatesInCategory(category, tags) {
  const results = [];
  const byLeaf = new Map();

  for (const entry of tags) {
    if (!byLeaf.has(entry.leaf)) {
      byLeaf.set(entry.leaf, []);
    }
    byLeaf.get(entry.leaf).push(entry);
  }

  for (const [leaf, entries] of byLeaf) {
    if (entries.length < 2) {
      continue;
    }
    const depths = new Set(entries.map((e) => e.depth));
    if (depths.size > 1) {
      results.push({
        category,
        leaf,
        occurrences: entries.map((e) => ({
          tag: e.tag,
          depth: e.depth,
          count: e.count,
        })),
      });
    }
  }

  return results;
}

function analyseNearDuplicates(categoryMap, config) {
  const leafDuplicates = [];
  const structuralDuplicates = [];

  for (const [category, tags] of categoryMap) {
    leafDuplicates.push(
      ...findLeafDuplicatesInCategory(category, tags, config)
    );
    structuralDuplicates.push(
      ...findStructuralDuplicatesInCategory(category, tags)
    );
  }

  leafDuplicates.sort((a, b) => a.distance - b.distance);

  return { leafDuplicates, structuralDuplicates };
}

// ---------------------------------------------------------------------------
// Module C: High-Overlap Pairs
// ---------------------------------------------------------------------------

function analyseHighOverlap(tagIndex, categoryMap, config) {
  const overlaps = [];

  for (const [category, tags] of categoryMap) {
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const setA = tagIndex.get(tags[i].tag);
        const setB = tagIndex.get(tags[j].tag);

        // Skip pairs with small union
        const unionSize =
          setA.size + setB.size - [...setA].filter((x) => setB.has(x)).length;
        if (unionSize < config.minPairSize) {
          continue;
        }

        const similarity = jaccardSimilarity(setA, setB);
        if (similarity >= config.jaccardThreshold) {
          overlaps.push({
            category,
            tag_a: tags[i].tag,
            tag_b: tags[j].tag,
            jaccard: round(similarity, 3),
            count_a: tags[i].count,
            count_b: tags[j].count,
            union_size: unionSize,
          });
        }
      }
    }
  }

  overlaps.sort((a, b) => b.jaccard - a.jaccard);
  return overlaps;
}

// ---------------------------------------------------------------------------
// Module D: Orphan Deep Tags
// ---------------------------------------------------------------------------

/** Build a map of parent path -> child entries for a set of tags */
function buildChildrenByParent(tags) {
  const childrenByParent = new Map();
  for (const entry of tags) {
    if (!entry.parent) {
      continue;
    }
    if (!childrenByParent.has(entry.parent)) {
      childrenByParent.set(entry.parent, []);
    }
    childrenByParent.get(entry.parent).push(entry);
  }
  return childrenByParent;
}

/** Find orphan deep tags in a single category */
function findOrphansInCategory(category, tags, config) {
  const orphans = [];
  const childrenByParent = buildChildrenByParent(tags);

  for (const entry of tags) {
    if (entry.depth < config.orphanMinDepth || !entry.parent) {
      continue;
    }

    const siblings = childrenByParent.get(entry.parent);
    if (siblings && siblings.length === 1) {
      orphans.push({
        category,
        tag: entry.tag,
        parent: entry.parent,
        depth: entry.depth,
        count: entry.count,
      });
    }
  }

  return orphans;
}

function analyseOrphanDeepTags(categoryMap, config) {
  const orphans = [];

  for (const [category, tags] of categoryMap) {
    orphans.push(...findOrphansInCategory(category, tags, config));
  }

  orphans.sort((a, b) => b.depth - a.depth || a.tag.localeCompare(b.tag));
  return orphans;
}

// ---------------------------------------------------------------------------
// Module E: Category Imbalance
// ---------------------------------------------------------------------------

function analyseCategoryImbalance(categoryStats, config) {
  const imbalanced = [];

  for (const [category, stats] of categoryStats) {
    if (stats.total === 0) {
      continue;
    }
    const sparseRatio = stats.sparse / stats.total;
    if (sparseRatio > config.imbalanceThreshold) {
      imbalanced.push({
        category,
        total_tags: stats.total,
        sparse_tags: stats.sparse,
        sparse_ratio: round(sparseRatio, 3),
      });
    }
  }

  imbalanced.sort((a, b) => b.sparse_ratio - a.sparse_ratio);
  return imbalanced;
}

// ---------------------------------------------------------------------------
// Terminal rendering
// ---------------------------------------------------------------------------

function renderSparseSection(sparseTags, config) {
  logger.info(chalk.cyan.bold('\n=== A. Sparse Tags ==='));
  logger.info(
    chalk.dim(`  (tags used by fewer than ${config.minCount} techniques)\n`)
  );

  if (sparseTags.length === 0) {
    logger.info(chalk.green('  No sparse tags found.'));
    return;
  }

  let totalSparse = 0;
  for (const group of sparseTags) {
    totalSparse += group.sparse_count;
    logger.info(
      `  ${chalk.yellow(group.category)} ${chalk.dim(`(${group.sparse_count}/${group.total_tags} sparse, ${group.sparse_percentage}%)`)}`
    );
    for (const t of group.tags) {
      logger.info(`    ${chalk.red(t.tag)} ${chalk.dim(`(${t.count})`)}`);
    }
  }
  logger.info(chalk.dim(`\n  Total sparse tags: ${totalSparse}`));
}

function renderDuplicatesSection(nearDuplicates) {
  logger.info(chalk.cyan.bold('\n=== B. Near-Duplicate Tags ===\n'));

  const { leafDuplicates, structuralDuplicates } = nearDuplicates;

  if (leafDuplicates.length === 0 && structuralDuplicates.length === 0) {
    logger.info(chalk.green('  No near-duplicates found.'));
    return;
  }

  if (leafDuplicates.length > 0) {
    logger.info(chalk.dim('  Leaf similarity:'));
    for (const d of leafDuplicates) {
      logger.info(
        `    ${chalk.yellow(d.tag_a)} ${chalk.dim('~')} ${chalk.yellow(d.tag_b)} ${chalk.dim(`(distance: ${d.distance}, counts: ${d.count_a}/${d.count_b})`)}`
      );
    }
  }
  if (structuralDuplicates.length > 0) {
    logger.info(chalk.dim('\n  Structural (same leaf, different depth):'));
    for (const d of structuralDuplicates) {
      logger.info(
        `    ${chalk.yellow(d.leaf)} ${chalk.dim(`in ${d.category}:`)}`
      );
      for (const occ of d.occurrences) {
        logger.info(
          `      ${chalk.red(occ.tag)} ${chalk.dim(`(depth ${occ.depth}, count ${occ.count})`)}`
        );
      }
    }
  }
}

function renderOverlapSection(highOverlap, config) {
  logger.info(chalk.cyan.bold('\n=== C. High-Overlap Tag Pairs ==='));
  logger.info(
    chalk.dim(`  (Jaccard similarity >= ${config.jaccardThreshold})\n`)
  );

  if (highOverlap.length === 0) {
    logger.info(chalk.green('  No high-overlap pairs found.'));
    return;
  }

  for (const o of highOverlap) {
    logger.info(
      `  ${chalk.yellow(o.tag_a)} ${chalk.dim('<>')} ${chalk.yellow(o.tag_b)} ${chalk.dim(`(jaccard: ${o.jaccard}, counts: ${o.count_a}/${o.count_b}, union: ${o.union_size})`)}`
    );
  }
}

function renderOrphanSection(orphanDeepTags, config) {
  logger.info(chalk.cyan.bold('\n=== D. Orphan Deep Tags ==='));
  logger.info(
    chalk.dim(`  (depth >= ${config.orphanMinDepth} with no siblings)\n`)
  );

  if (orphanDeepTags.length === 0) {
    logger.info(chalk.green('  No orphan deep tags found.'));
    return;
  }

  for (const o of orphanDeepTags) {
    logger.info(
      `  ${chalk.yellow(o.tag)} ${chalk.dim(`(parent: ${o.parent}, depth ${o.depth}, count ${o.count})`)}`
    );
  }
}

function renderImbalanceSection(categoryImbalance, config) {
  logger.info(chalk.cyan.bold('\n=== E. Category Imbalance ==='));
  logger.info(
    chalk.dim(
      `  (categories with > ${config.imbalanceThreshold * 100}% sparse tags)\n`
    )
  );

  if (categoryImbalance.length === 0) {
    logger.info(chalk.green('  No imbalanced categories found.'));
    return;
  }

  for (const c of categoryImbalance) {
    logger.info(
      `  ${chalk.yellow(c.category)} ${chalk.dim(`(${c.sparse_tags}/${c.total_tags} sparse, ${round(c.sparse_ratio * 100, 1)}%)`)}`
    );
  }
}

function renderSummarySection(results) {
  const {
    sparseTags,
    nearDuplicates,
    highOverlap,
    orphanDeepTags,
    categoryImbalance,
  } = results;
  const { leafDuplicates, structuralDuplicates } = nearDuplicates;

  const totalIssues =
    sparseTags.reduce((sum, g) => sum + g.sparse_count, 0) +
    leafDuplicates.length +
    structuralDuplicates.length +
    highOverlap.length +
    orphanDeepTags.length +
    categoryImbalance.length;

  logger.info(chalk.cyan.bold('\n=== Summary ===\n'));
  logger.info(
    `  Sparse tags: ${sparseTags.reduce((sum, g) => sum + g.sparse_count, 0)}`
  );
  logger.info(`  Leaf near-duplicates: ${leafDuplicates.length}`);
  logger.info(`  Structural duplicates: ${structuralDuplicates.length}`);
  logger.info(`  High-overlap pairs: ${highOverlap.length}`);
  logger.info(`  Orphan deep tags: ${orphanDeepTags.length}`);
  logger.info(`  Imbalanced categories: ${categoryImbalance.length}`);
  logger.info(chalk.bold(`  Total issues: ${totalIssues}`));
  logger.info('');
}

function renderTerminalReport(results, config) {
  renderSparseSection(results.sparseTags, config);
  renderDuplicatesSection(results.nearDuplicates);
  renderOverlapSection(results.highOverlap, config);
  renderOrphanSection(results.orphanDeepTags, config);
  renderImbalanceSection(results.categoryImbalance, config);
  renderSummarySection(results);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const config = parseArgs();

  logger.info(chalk.blue('\nTEA Techniques Tag Taxonomy Audit\n'));

  // Load techniques
  let techniques;
  try {
    const raw = await fs.readFile(techniquesPath, 'utf-8');
    techniques = JSON.parse(raw);
  } catch (error) {
    logger.error(chalk.red(`Failed to load techniques.json: ${error.message}`));
    process.exit(1);
  }

  logger.info(`  Loaded ${techniques.length} techniques`);

  // Build indices
  const tagIndex = buildTagIndex(techniques);
  const categoryMap = buildCategoryMap(tagIndex);

  logger.info(
    `  Found ${tagIndex.size} unique tags across ${categoryMap.size} categories`
  );

  // Run analysis modules
  logger.info('  Running analysis modules...');

  const { sparseTags, categoryStats } = analyseSparseTag(categoryMap, config);
  const nearDuplicates = analyseNearDuplicates(categoryMap, config);
  const highOverlap = analyseHighOverlap(tagIndex, categoryMap, config);
  const orphanDeepTags = analyseOrphanDeepTags(categoryMap, config);
  const categoryImbalance = analyseCategoryImbalance(categoryStats, config);

  const results = {
    sparseTags,
    nearDuplicates,
    highOverlap,
    orphanDeepTags,
    categoryImbalance,
  };

  // Terminal output
  renderTerminalReport(results, config);

  // JSON output
  if (config.outputPath) {
    const report = {
      generated_at: new Date().toISOString(),
      config: {
        min_count: config.minCount,
        similarity_threshold: config.similarityThreshold,
        jaccard_threshold: config.jaccardThreshold,
        min_pair_size: config.minPairSize,
        imbalance_threshold: config.imbalanceThreshold,
        orphan_min_depth: config.orphanMinDepth,
      },
      summary: {
        total_tags: tagIndex.size,
        total_categories: categoryMap.size,
        sparse_tag_count: sparseTags.reduce(
          (sum, g) => sum + g.sparse_count,
          0
        ),
        leaf_duplicate_count: nearDuplicates.leafDuplicates.length,
        structural_duplicate_count: nearDuplicates.structuralDuplicates.length,
        high_overlap_count: highOverlap.length,
        orphan_deep_tag_count: orphanDeepTags.length,
        imbalanced_category_count: categoryImbalance.length,
      },
      sparse_tags: sparseTags,
      near_duplicates: {
        leaf_duplicates: nearDuplicates.leafDuplicates,
        structural_duplicates: nearDuplicates.structuralDuplicates,
      },
      high_overlap_pairs: highOverlap,
      orphan_deep_tags: orphanDeepTags,
      category_imbalance: categoryImbalance,
    };

    await fs.mkdir(path.dirname(config.outputPath), { recursive: true });
    await fs.writeFile(config.outputPath, JSON.stringify(report, null, 2));
    logger.info(chalk.green(`Report written to ${config.outputPath}`));
  }
}

main();
