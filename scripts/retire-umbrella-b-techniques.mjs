/**
 * Retire UMBRELLA-B techniques from the dataset.
 *
 * For each retired technique:
 *   1. Remove it from the techniques array
 *   2. For every other technique that referenced it in related_techniques,
 *      replace the reference with the most relevant child (one of the
 *      retired technique's own related_techniques that isn't already listed)
 *   3. Ensure no related_techniques array exceeds its original size
 *
 * Usage: node scripts/retire-umbrella-b-techniques.mjs [--dry-run]
 */

/* eslint-disable no-console */

import { readFileSync, writeFileSync } from 'node:fs';

const DRY_RUN = process.argv.includes('--dry-run');
const TECHNIQUES_FILE = 'public/data/techniques.json';

// UMBRELLA-B techniques to retire, mapped to their preferred replacement children
// (ordered by relevance — first available non-duplicate is used)
const RETIREMENTS = {
  'automated-documentation-generation': [
    'model-cards',
    'datasheets-for-datasets',
    'model-development-audit-trails',
  ],
};

const retiredSlugs = new Set(Object.keys(RETIREMENTS));

// Load data
const raw = readFileSync(TECHNIQUES_FILE, 'utf8');
const data = JSON.parse(raw);
const techniques = data.techniques || data;

// biome-ignore lint/suspicious/noConsole: CLI script
console.log(`Loaded ${techniques.length} techniques`);
// biome-ignore lint/suspicious/noConsole: CLI script
console.log(`Retiring ${retiredSlugs.size} UMBRELLA-B techniques\n`);

const changeLog = [];

// Step 1: For each non-retired technique, fix related_techniques references
for (const t of techniques) {
  if (retiredSlugs.has(t.slug)) {
    continue;
  }

  const rels = t.related_techniques || [];
  const retiredRefs = rels.filter((r) => retiredSlugs.has(r));

  if (retiredRefs.length === 0) {
    continue;
  }

  const newRels = [...rels];

  for (const retiredSlug of retiredRefs) {
    const idx = newRels.indexOf(retiredSlug);
    const children = RETIREMENTS[retiredSlug];

    // Find best replacement: first child not already in the list, not being retired, and not self
    const replacement = children.find(
      (c) => !(newRels.includes(c) || retiredSlugs.has(c) || c === t.slug)
    );

    if (replacement) {
      newRels[idx] = replacement;
      changeLog.push(
        `${t.slug}: replaced '${retiredSlug}' with '${replacement}'`
      );
    } else {
      // All children already present or also retired — just remove
      newRels.splice(idx, 1);
      changeLog.push(
        `${t.slug}: removed '${retiredSlug}' (children already present)`
      );
    }
  }

  t.related_techniques = newRels;
}

// Step 2: Remove the umbrella techniques themselves
const before = techniques.length;
const remaining = techniques.filter((t) => !retiredSlugs.has(t.slug));
const removed = before - remaining.length;

// biome-ignore lint/suspicious/noConsole: CLI script
console.log(
  `Removed ${removed} UMBRELLA-B techniques (${before} → ${remaining.length})`
);

// Step 3: Verify no dangling references remain
const slugSet = new Set(remaining.map((t) => t.slug));
let danglingCount = 0;
for (const t of remaining) {
  for (const rel of t.related_techniques || []) {
    if (!slugSet.has(rel)) {
      // biome-ignore lint/suspicious/noConsole: CLI script
      console.log(`WARNING: ${t.slug} has dangling ref to '${rel}'`);
      danglingCount++;
    }
  }
}
if (danglingCount === 0) {
  // biome-ignore lint/suspicious/noConsole: CLI script
  console.log('No dangling references found.');
}

// Step 4: Output change log
// biome-ignore lint/suspicious/noConsole: CLI script
console.log('\n--- Change Log ---');
for (const entry of changeLog) {
  // biome-ignore lint/suspicious/noConsole: CLI script
  console.log(`  ${entry}`);
}
// biome-ignore lint/suspicious/noConsole: CLI script
console.log(`\nTotal reference changes: ${changeLog.length}`);

// Step 5: Write if not dry run
if (DRY_RUN) {
  // biome-ignore lint/suspicious/noConsole: CLI script
  console.log('\n[DRY RUN] No changes written.');
} else {
  // Write remaining techniques (handles both array and {techniques:[...]} formats)
  const output = data.techniques
    ? { ...data, techniques: remaining }
    : remaining;
  writeFileSync(TECHNIQUES_FILE, `${JSON.stringify(output, null, 2)}\n`);
  // biome-ignore lint/suspicious/noConsole: CLI script
  console.log(`\nWrote ${remaining.length} techniques to ${TECHNIQUES_FILE}`);
}
