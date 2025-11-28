
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const techniquesPath = path.resolve(__dirname, '../public/data/techniques.json');
const zoteroPath = path.resolve(__dirname, '../public/data/zotero-resources.json');

function normalizeUrl(url) {
    if (!url) return '';
    return url.toLowerCase().replace(/\/$/, '').trim();
}

function normalizeTitle(title) {
    if (!title) return '';
    return title.toLowerCase().replace(/\s+/g, ' ').trim();
}

async function migrate() {
    console.log('Loading data...');
    const techniques = JSON.parse(await fs.readFile(techniquesPath, 'utf-8'));
    const zoteroData = JSON.parse(await fs.readFile(zoteroPath, 'utf-8'));
    const zoteroItems = zoteroData.items;

    console.log(`Loaded ${techniques.length} techniques and ${zoteroItems.length} Zotero items.`);

    // Create lookups
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

    let matchedCount = 0;
    let unmatchedCount = 0;
    let totalResources = 0;

    for (const technique of techniques) {
        if (!technique.resources || technique.resources.length === 0) continue;

        const newResources = [];
        const oldResources = technique.resources;

        for (const resource of oldResources) {
            totalResources++;
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
                newResources.push(match.citationKey);
                matchedCount++;
            } else {
                console.warn(`Unmatched resource in ${technique.slug}: "${resource.title}" (${resource.url})`);
                unmatchedCount++;
                // Keep the original object if we can't find a match? 
                // Or maybe we should just log it and NOT add it, effectively removing it?
                // The user said "replace existing resource objects with their corresponding citekeys".
                // If we can't find a match, we can't replace it with a citekey.
                // For now, I will NOT add it to the new list, but I'm logging it.
                // Ideally we would want to manually fix these.
            }
        }

        technique.resources = newResources;
    }

    console.log(`\nMigration complete.`);
    console.log(`Total resources processed: ${totalResources}`);
    console.log(`Matched: ${matchedCount}`);
    console.log(`Unmatched: ${unmatchedCount}`);

    if (unmatchedCount > 0) {
        console.log('\nWARNING: Some resources could not be matched. Please check the logs above.');
    }

    await fs.writeFile(techniquesPath, JSON.stringify(techniques, null, 2));
    console.log(`\nUpdated ${techniquesPath}`);
}

migrate().catch(console.error);
