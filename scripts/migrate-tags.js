
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const oldTechniquesPath = path.resolve(__dirname, '../public/data/old-techniques.json');
const zoteroPath = path.resolve(__dirname, '../public/data/zotero-resources.json');

function normalizeUrl(url) {
    if (!url) return '';
    return url.toLowerCase().replace(/\/$/, '').trim();
}

function normalizeTitle(title) {
    if (!title) return '';
    return title.toLowerCase().replace(/\s+/g, ' ').trim();
}

async function migrateTags() {
    console.log('Loading data...');
    const oldTechniques = JSON.parse(await fs.readFile(oldTechniquesPath, 'utf-8'));
    const zoteroData = JSON.parse(await fs.readFile(zoteroPath, 'utf-8'));
    const zoteroItems = zoteroData.items;

    console.log(`Loaded ${oldTechniques.length} old techniques and ${zoteroItems.length} Zotero items.`);

    // Create lookups for Zotero items
    const urlLookup = new Map();
    const titleLookup = new Map();

    for (const item of zoteroItems) {
        if (item.url) {
            urlLookup.set(normalizeUrl(item.url), item);
        }
        if (item.title) {
            titleLookup.set(normalizeTitle(item.title), item);
        }
    }

    let updatedCount = 0;
    let skippedCount = 0;
    let notFoundCount = 0;

    for (const technique of oldTechniques) {
        if (!technique.resources) continue;

        for (const resource of technique.resources) {
            if (!resource.source_type) continue;

            let match = null;

            // Try URL match
            if (resource.url) {
                match = urlLookup.get(normalizeUrl(resource.url));
            }

            // Try Title match if no URL match
            if (!match && resource.title) {
                match = titleLookup.get(normalizeTitle(resource.title));
            }

            if (match) {
                const typeTag = `type:${resource.source_type.replace(/_/g, '-')}`; // e.g. type:technical-paper

                // Check if tag already exists
                const hasTag = match.tags.some(t => t.tag === typeTag);

                if (!hasTag) {
                    match.tags.push({ tag: typeTag });
                    updatedCount++;
                    // console.log(`Added tag "${typeTag}" to "${match.title}"`);
                } else {
                    skippedCount++;
                }
            } else {
                notFoundCount++;
                // console.warn(`Could not find Zotero item for resource: "${resource.title}"`);
            }
        }
    }

    console.log(`\nTag migration complete.`);
    console.log(`Updated items: ${updatedCount}`);
    console.log(`Skipped (already tagged): ${skippedCount}`);
    console.log(`Not found: ${notFoundCount}`);

    await fs.writeFile(zoteroPath, JSON.stringify(zoteroData, null, 2));
    console.log(`\nUpdated ${zoteroPath}`);
}

migrateTags().catch(console.error);
