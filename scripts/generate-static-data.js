#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'public', 'data');
const techniquesPath = path.join(dataDir, 'techniques.json');

async function generateStaticData() {
  try {
    // Read the source techniques data
    const techniquesData = JSON.parse(
      await fs.readFile(techniquesPath, 'utf-8')
    );

    // Generate lightweight techniques metadata
    const techniquesMetadata = techniquesData.map((technique) => ({
      slug: technique.slug,
      name: technique.name,
      description: technique.description,
      assurance_goals: technique.assurance_goals,
      tags: technique.tags,
    }));
    await fs.writeFile(
      path.join(dataDir, 'techniques-metadata.json'),
      JSON.stringify(techniquesMetadata, null, 2)
    );

    // Generate assurance goals data
    const assuranceGoals = extractAssuranceGoals(techniquesData);
    await fs.writeFile(
      path.join(dataDir, 'assurance-goals.json'),
      JSON.stringify(assuranceGoals, null, 2)
    );

    // Generate tags data
    const tags = extractTags(techniquesData);
    await fs.writeFile(
      path.join(dataDir, 'tags.json'),
      JSON.stringify(tags, null, 2)
    );

    // Generate individual technique files
    const techniquesDir = path.join(dataDir, 'techniques');
    await fs.mkdir(techniquesDir, { recursive: true });

    await Promise.all(
      techniquesData.map((technique) =>
        fs.writeFile(
          path.join(techniquesDir, `${technique.slug}.json`),
          JSON.stringify(technique, null, 2)
        )
      )
    );

    // Generate search index
    const searchIndex = generateSearchIndex(techniquesData);
    await fs.writeFile(
      path.join(dataDir, 'search-index.json'),
      JSON.stringify(searchIndex, null, 2)
    );

    // Generate category-specific search indices
    await generateCategorySearchIndices(techniquesData, assuranceGoals);

    // Generate category pages data
    await generateCategoryData(techniquesData, assuranceGoals);

    // Generate filter combinations
    await generateFilterData(techniquesData, tags);
  } catch (_error) {
    process.exit(1);
  }
}

function extractAssuranceGoals(techniques) {
  const goalCounts = {};

  for (const technique of techniques) {
    if (technique.assurance_goals) {
      for (const goal of technique.assurance_goals) {
        if (!goalCounts[goal]) {
          goalCounts[goal] = {
            name: goal,
            slug: goal.toLowerCase().replace(/\s+/g, '-'),
            count: 0,
            description: getGoalDescription(goal),
          };
        }
        goalCounts[goal].count++;
      }
    }
  }

  return Object.values(goalCounts).sort((a, b) => a.name.localeCompare(b.name));
}

function extractTags(techniques) {
  const tagCounts = {};

  for (const technique of techniques) {
    if (technique.tags) {
      for (const tag of technique.tags) {
        if (!tagCounts[tag]) {
          tagCounts[tag] = {
            name: tag,
            slug: tag.replace(/\//g, '-').replace(/\s+/g, '-').toLowerCase(),
            count: 0,
            category: tag.split('/')[0] || 'other',
          };
        }
        tagCounts[tag].count++;
      }
    }
  }

  return Object.values(tagCounts).sort((a, b) => a.name.localeCompare(b.name));
}

function generateSearchIndex(techniques) {
  return techniques.map((technique) => ({
    slug: technique.slug,
    name: technique.name,
    description: technique.description,
    assurance_goals: technique.assurance_goals || [],
    tags: technique.tags || [],
    // Create searchable text for full-text search
    searchText: [
      technique.name,
      technique.description,
      ...(technique.assurance_goals || []),
      ...(technique.tags || []),
    ]
      .join(' ')
      .toLowerCase(),
  }));
}

async function generateCategoryData(techniques, assuranceGoals) {
  const categoriesDir = path.join(dataDir, 'categories');
  await fs.mkdir(categoriesDir, { recursive: true });

  // Generate main category files
  await Promise.all(
    assuranceGoals.map((goal) => {
      const categoryTechniques = techniques.filter((technique) =>
        technique.assurance_goals?.includes(goal.name)
      );

      return fs.writeFile(
        path.join(categoriesDir, `${goal.slug}.json`),
        JSON.stringify(
          {
            goal,
            techniques: categoryTechniques,
            count: categoryTechniques.length,
          },
          null,
          2
        )
      );
    })
  );

  // Generate hierarchical subcategory files for explainability
  await generateHierarchicalCategoryData(techniques);
}

/**
 * Generates JSON files for hierarchical category subcategories
 * This enables routes like /categories/explainability/property/
 */
async function generateHierarchicalCategoryData(techniques) {
  const hierarchicalTags = collectHierarchicalTags(techniques);
  const hierarchyMap = buildHierarchyMap(hierarchicalTags, techniques);
  await writeHierarchicalFiles(hierarchyMap);
}

/**
 * Collects all hierarchical assurance-goal-category tags
 */
function collectHierarchicalTags(techniques) {
  const hierarchicalTags = new Set();

  for (const technique of techniques) {
    if (!technique.tags) {
      continue;
    }

    for (const tag of technique.tags) {
      if (
        tag.startsWith('assurance-goal-category/') &&
        tag.split('/').length >= 3
      ) {
        hierarchicalTags.add(tag);
      }
    }
  }

  return hierarchicalTags;
}

/**
 * Builds a hierarchy map from tags and techniques
 */
function buildHierarchyMap(hierarchicalTags, techniques) {
  const hierarchyMap = {};

  for (const tag of hierarchicalTags) {
    const parts = tag.split('/');
    const goal = parts[1]; // e.g., 'explainability'
    const dimension = parts[2]; // e.g., 'property'
    const subcategory = parts.slice(3).join('/'); // e.g., 'completeness'

    // Initialize goal and dimension if needed
    if (!hierarchyMap[goal]) {
      hierarchyMap[goal] = {};
    }
    if (!hierarchyMap[goal][dimension]) {
      hierarchyMap[goal][dimension] = {
        techniques: new Set(),
        subcategories: new Set(),
      };
    }

    // Add subcategory if it exists
    if (subcategory) {
      hierarchyMap[goal][dimension].subcategories.add(subcategory);
    }

    // Find techniques with this tag
    for (const technique of techniques) {
      if (technique.tags?.includes(tag)) {
        hierarchyMap[goal][dimension].techniques.add(technique);
      }
    }
  }

  return hierarchyMap;
}

/**
 * Writes hierarchy JSON files to disk
 */
async function writeHierarchicalFiles(hierarchyMap) {
  // Prepare all file write operations
  const writeOperations = [];

  for (const [goal, dimensions] of Object.entries(hierarchyMap)) {
    const goalDir = path.join(dataDir, 'categories', goal);

    for (const [dimension, data] of Object.entries(dimensions)) {
      const dimensionDir = path.join(goalDir, dimension);
      const dimensionTechniques = Array.from(data.techniques);
      const subcategories = Array.from(data.subcategories).sort();

      // Create directory and file write promises
      writeOperations.push(
        fs.mkdir(dimensionDir, { recursive: true }).then(() =>
          fs.writeFile(
            path.join(dimensionDir, 'index.json'),
            JSON.stringify(
              {
                goal,
                dimension,
                subcategories,
                techniques: dimensionTechniques,
                count: dimensionTechniques.length,
              },
              null,
              2
            )
          )
        )
      );
    }
  }

  // Execute all operations in parallel
  await Promise.all(writeOperations);
}

async function generateFilterData(techniques, tags) {
  const filtersDir = path.join(dataDir, 'filters');
  await fs.mkdir(filtersDir, { recursive: true });

  // Group tags by category
  const tagsByCategory = {};
  for (const tag of tags) {
    if (!tagsByCategory[tag.category]) {
      tagsByCategory[tag.category] = [];
    }
    tagsByCategory[tag.category].push(tag);
  }

  // Generate filter data for each category
  await Promise.all(
    Object.entries(tagsByCategory).map(async ([category, categoryTags]) => {
      const categoryDir = path.join(filtersDir, category);
      await fs.mkdir(categoryDir, { recursive: true });

      return Promise.all(
        categoryTags.map((tag) => {
          const filteredTechniques = techniques.filter((technique) =>
            technique.tags?.includes(tag.name)
          );

          return fs.writeFile(
            path.join(categoryDir, `${tag.slug}.json`),
            JSON.stringify(
              {
                tag,
                techniques: filteredTechniques,
                count: filteredTechniques.length,
              },
              null,
              2
            )
          );
        })
      );
    })
  );
}

async function generateCategorySearchIndices(techniques, assuranceGoals) {
  const searchDir = path.join(dataDir, 'search');
  await fs.mkdir(searchDir, { recursive: true });

  // Generate search index for each assurance goal
  await Promise.all(
    assuranceGoals.map(async (goal) => {
      const categoryTechniques = techniques.filter((technique) =>
        technique.assurance_goals?.includes(goal.name)
      );

      const categorySearchIndex = generateSearchIndex(categoryTechniques);

      await fs.writeFile(
        path.join(searchDir, `${goal.slug}-index.json`),
        JSON.stringify(categorySearchIndex, null, 2)
      );
    })
  );

  // Generate a search index manifest
  const searchManifest = {
    global: '/data/search-index.json',
    categories: assuranceGoals.reduce((acc, goal) => {
      acc[goal.slug] = `/data/search/${goal.slug}-index.json`;
      return acc;
    }, {}),
  };

  await fs.writeFile(
    path.join(dataDir, 'search-manifest.json'),
    JSON.stringify(searchManifest, null, 2)
  );
}

function getGoalDescription(goal) {
  const descriptions = {
    Explainability:
      'Understanding how AI systems make decisions and what factors influence their outputs.',
    Fairness:
      'Ensuring AI systems treat different groups and individuals equitably.',
    Privacy:
      'Protecting personal data and maintaining confidentiality in AI systems.',
    Reliability:
      'Building AI systems that perform consistently and predictably.',
    Safety: 'Ensuring AI systems operate safely and do not cause harm.',
    Security:
      'Protecting AI systems from malicious attacks and unauthorized access.',
    Transparency:
      'Making AI systems and their decision-making processes open and understandable.',
  };
  return descriptions[goal] || `Techniques related to ${goal.toLowerCase()}.`;
}

// Run the script
generateStaticData();
