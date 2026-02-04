#!/usr/bin/env node

/**
 * Fetch resources for a technique from the Zotero export
 *
 * Usage:
 *   npx ts-node scripts/tutorials/fetch-technique-resources.ts shapley-additive-explanations
 *
 * This script extracts resources tagged with the given technique slug from
 * the zotero-resources.json file and outputs them in a format useful for
 * tutorial development.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// biome-ignore lint/suspicious/noConsole: This is a CLI script
const log = console.log;
// biome-ignore lint/suspicious/noConsole: This is a CLI script
const error = console.error;

interface ZoteroItem {
  key: string;
  itemType: string;
  title: string;
  abstractNote?: string;
  date?: string;
  url?: string;
  creators?: Array<{
    firstName?: string;
    lastName?: string;
    creatorType: string;
  }>;
  tags?: Array<{ tag: string }>;
  citationKey?: string;
  attachments?: Array<{
    itemType: string;
    title: string;
    path?: string;
    url?: string;
  }>;
}

interface ZoteroExport {
  items: ZoteroItem[];
}

function getResourcesForTechnique(techniqueSlug: string): {
  resources: ZoteroItem[];
  byType: Record<string, ZoteroItem[]>;
} {
  const dataPath = path.join(
    process.cwd(),
    'public/data/zotero-resources.json'
  );

  if (!fs.existsSync(dataPath)) {
    error('Error: zotero-resources.json not found');
    error('Expected path:', dataPath);
    process.exit(1);
  }

  const data: ZoteroExport = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const tagPattern = `technique:${techniqueSlug}`;

  const resources = data.items.filter((item) =>
    item.tags?.some((t) => t.tag === tagPattern)
  );

  // Group by resource type
  const byType: Record<string, ZoteroItem[]> = {};
  for (const resource of resources) {
    const typeTag = resource.tags?.find((t) => t.tag.startsWith('type:'));
    const type = typeTag?.tag.replace('type:', '') || 'unknown';
    if (!byType[type]) {
      byType[type] = [];
    }
    byType[type].push(resource);
  }

  return { resources, byType };
}

function formatAuthors(creators?: ZoteroItem['creators']): string {
  if (!creators || creators.length === 0) {
    return 'Unknown';
  }

  return creators
    .filter((c) => c.creatorType === 'author' || c.creatorType === 'programmer')
    .map((c) => [c.firstName, c.lastName].filter(Boolean).join(' '))
    .join(', ');
}

function formatResource(item: ZoteroItem): string {
  const lines: string[] = [];
  lines.push(`### ${item.title}`);
  lines.push('');
  lines.push(`- **Type:** ${item.itemType}`);
  lines.push(`- **Citation Key:** \`${item.citationKey || item.key}\``);
  if (item.date) {
    lines.push(`- **Date:** ${item.date}`);
  }
  lines.push(`- **Authors:** ${formatAuthors(item.creators)}`);
  if (item.url) {
    lines.push(`- **URL:** ${item.url}`);
  }

  if (item.abstractNote) {
    lines.push('');
    lines.push('**Abstract:**');
    lines.push(
      item.abstractNote.slice(0, 500) +
        (item.abstractNote.length > 500 ? '...' : '')
    );
  }

  const pdfAttachment = item.attachments?.find((a) => a.path?.endsWith('.pdf'));
  if (pdfAttachment) {
    lines.push('');
    lines.push(`**PDF Available:** ${pdfAttachment.title}`);
  }

  return lines.join('\n');
}

function printUsage(): void {
  log(
    'Usage: npx ts-node scripts/tutorials/fetch-technique-resources.ts <technique-slug>'
  );
  log('');
  log('Example technique slugs:');
  log('  shapley-additive-explanations');
  log('  local-interpretable-model-agnostic-explanations');
  log('  differential-privacy');
  log('  conformal-prediction');
  log('  hallucination-detection');
  log('  prompt-injection-testing');
  log('  bootstrapping');
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const techniqueSlug = args[0];
  const { resources, byType } = getResourcesForTechnique(techniqueSlug);

  log(`# Resources for: ${techniqueSlug}`);
  log('');
  log(`Found ${resources.length} resources`);
  log('');

  // Summary by type
  log('## Summary by Type');
  log('');
  for (const [type, items] of Object.entries(byType).sort()) {
    log(`- **${type}:** ${items.length}`);
  }
  log('');

  // Detailed listing
  for (const [type, items] of Object.entries(byType).sort()) {
    log(
      `## ${type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`
    );
    log('');
    for (const item of items) {
      log(formatResource(item));
      log('');
      log('---');
      log('');
    }
  }
}

main();
