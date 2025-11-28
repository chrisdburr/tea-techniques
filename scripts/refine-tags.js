
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const zoteroPath = path.resolve(__dirname, '../public/data/zotero-resources.json');

function normalizeUrl(url) {
    if (!url) return '';
    return url.toLowerCase().trim();
}

function getDomain(url) {
    try {
        const u = new URL(url);
        return u.hostname.replace(/^www\./, '');
    } catch (e) {
        return '';
    }
}

async function refineTags() {
    console.log('Loading data...');
    const zoteroData = JSON.parse(await fs.readFile(zoteroPath, 'utf-8'));
    const zoteroItems = zoteroData.items;

    console.log(`Loaded ${zoteroItems.length} Zotero items.`);

    let updatedCount = 0;

    for (const item of zoteroItems) {
        if (!item.url && !item.title) continue;

        const url = normalizeUrl(item.url);
        const domain = getDomain(url);
        const title = (item.title || '').toLowerCase();

        let newType = null;

        // 1. Domain-based Rules (Strongest)
        if (domain.includes('arxiv.org') ||
            domain.includes('neurips.cc') ||
            domain.includes('openreview.net') ||
            domain.includes('ieee.org') ||
            domain.includes('springer.com') ||
            domain.includes('acm.org') ||
            domain.includes('science.org') ||
            domain.includes('nature.com') ||
            domain.includes('semanticscholar.org')) {
            newType = 'technical-paper';
        } else if (domain.includes('github.com') ||
            domain.includes('pypi.org') ||
            domain.includes('npmjs.com')) {
            newType = 'software-package';
        } else if (domain.includes('readthedocs.io') ||
            domain.includes('gitbook.io') ||
            domain.includes('scikit-learn.org') ||
            domain.includes('tensorflow.org') ||
            domain.includes('pytorch.org') ||
            domain.includes('huggingface.co/docs')) {
            newType = 'documentation';
        } else if (domain.includes('medium.com') ||
            domain.includes('towardsdatascience.com') ||
            domain.includes('youtube.com') ||
            domain.includes('coursera.org') ||
            domain.includes('udemy.com')) {
            newType = 'tutorial';
        }

        // 2. Title-based Rules (If no domain match or to refine specific cases)
        if (!newType) {
            if (title.includes('documentation') || title.includes('api reference') || title.includes('user guide')) {
                newType = 'documentation';
            } else if (title.includes('tutorial') || title.includes('guide') || title.includes('introduction to') || title.includes('getting started')) {
                newType = 'tutorial';
            } else if (title.includes('survey') || title.includes('review') || title.includes('analysis of')) {
                newType = 'technical-paper';
            }
        }

        // Special case for "The Elements of Statistical Learning"
        if (title.includes('elements of statistical learning')) {
            // It's a book, often cited as a paper/reference. 
            // If we want it to be a "Technical Paper" (as it's an academic resource) or maybe we need a "Book" category?
            // The user complained it was "Documentation". 
            // Let's map it to "Technical Paper" for now as it's the closest academic equivalent in our current list, 
            // or "Other" if we want to be safe, but "Technical Paper" is better than "Documentation".
            newType = 'technical-paper';
        }

        if (newType) {
            const typeTag = `type:${newType}`;

            // Remove existing type tags
            const originalTags = item.tags || [];
            const nonTypeTags = originalTags.filter(t => !t.tag.startsWith('type:'));

            // Check if we are actually changing anything
            const existingTypeTag = originalTags.find(t => t.tag.startsWith('type:'));

            if (!existingTypeTag || existingTypeTag.tag !== typeTag) {
                item.tags = [...nonTypeTags, { tag: typeTag }];
                updatedCount++;
                // console.log(`Updated "${item.title}" to ${typeTag}`);
            }
        }
    }

    console.log(`\nRefinement complete.`);
    console.log(`Updated items: ${updatedCount}`);

    await fs.writeFile(zoteroPath, JSON.stringify(zoteroData, null, 2));
    console.log(`\nUpdated ${zoteroPath}`);
}

refineTags().catch(console.error);
