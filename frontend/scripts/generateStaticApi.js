#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Static data maps for goals and resource types
const ASSURANCE_GOALS = {
  Explainability: {
    name: "Explainability",
    description: "Making AI systems understandable to humans",
  },
  Fairness: {
    name: "Fairness",
    description:
      "Ensuring AI systems treat all individuals and groups equitably",
  },
  Reliability: {
    name: "Reliability",
    description: "Ensuring AI systems perform consistently and predictably",
  },
  Security: {
    name: "Security",
    description: "Protecting AI systems from malicious attacks and misuse",
  },
  Privacy: {
    name: "Privacy",
    description: "Protecting individual data and ensuring appropriate use",
  },
  Transparency: {
    name: "Transparency",
    description:
      "Ensuring AI systems and their decision-making processes are open and understandable",
  },
  Safety: {
    name: "Safety",
    description: "Ensuring AI systems operate safely and do not cause harm",
  },
};

const RESOURCE_TYPES = {
  academic_paper: {
    name: "Academic Paper",
    description: "Peer-reviewed research publication",
  },
  documentation: {
    name: "Documentation",
    description: "Official documentation or guide",
  },
  code: { name: "Code", description: "Source code or implementation" },
  tutorial: {
    name: "Tutorial",
    description: "Educational material or tutorial",
  },
  tool: { name: "Tool", description: "Software tool or application" },
};

// Helper to generate tag from string
function generateTag(tagStr) {
  const parts = tagStr.split("/");
  const category = parts[0] || "other";
  const name = parts[parts.length - 1]
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    name: tagStr,
    category: category,
    description: name,
  };
}

// Generate all unique tags from source data
function generateAllTags(techniques) {
  const uniqueTags = new Set();
  techniques.forEach((tech) => {
    tech.tags.forEach((tag) => uniqueTags.add(tag));
  });

  return Array.from(uniqueTags)
    .sort()
    .map((tag, index) => ({
      ...generateTag(tag),
      id: index + 1, // Add sequential id field starting from 1
    }));
}

// Convert source technique to API format
function convertTechnique(source, allTags) {
  // Convert assurance goals to objects with id and name
  // Use consistent IDs based on the order in ASSURANCE_GOALS object
  const assuranceGoalKeys = Object.keys(ASSURANCE_GOALS);
  const assuranceGoals = source.assurance_goals
    .filter((g) => ASSURANCE_GOALS[g])
    .map((g) => ({
      id: assuranceGoalKeys.indexOf(g) + 1, // Use consistent global ID
      name: ASSURANCE_GOALS[g].name,
    }));

  // Convert tags to objects with name and id properties to match API structure
  const tags = source.tags.map((tagName) => {
    const foundTag = allTags.find((tag) => tag.name === tagName);
    return foundTag ? { name: tagName, id: foundTag.id } : { name: tagName };
  });

  // Convert resources - keep original structure without IDs
  const resources = (source.resources || []).map((r) => ({
    title: r.title,
    url: r.url,
    description: r.description,
    authors: r.authors || "",
    publication_date: r.publication_date || null,
    source_type: r.source_type || "website",
    resource_type: r.resource_type || "documentation",
  }));

  // Convert example use cases - without IDs
  const exampleUseCases = source.example_use_cases.map((uc) => ({
    description: uc.description,
    goal: uc.goal,
  }));

  // Keep limitations as objects with description field
  const limitations = source.limitations;

  return {
    slug: source.slug,
    name: source.name,
    acronym: source.acronym || null,
    description: source.description,
    complexity_rating: source.complexity_rating || null,
    computational_cost_rating: source.computational_cost_rating || null,
    assurance_goals: assuranceGoals,
    tags: tags,
    related_techniques: source.related_techniques || [],
    related_technique_slugs: source.related_techniques || [],
    resources: resources,
    example_use_cases: exampleUseCases,
    limitations: limitations,
  };
}

// Main generator function
async function generateStaticApi() {
  console.log("🔄 Starting static API generation...");

  // Read source data
  const sourcePath = path.join(__dirname, "../../backend/data/techniques.json");
  const sourceData = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));
  console.log(`📖 Read ${sourceData.length} techniques from source`);

  // Generate all tags first
  const allTags = generateAllTags(sourceData);
  console.log(`🏷️  Generated ${allTags.length} unique tags`);

  // Convert techniques
  const techniques = sourceData.map((source) =>
    convertTechnique(source, allTags),
  );

  // Create output directory
  const outputDir = path.join(__dirname, "../public/api");
  const techniquesDir = path.join(outputDir, "techniques");

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(techniquesDir, { recursive: true });

  // Write main techniques list
  const techniquesList = {
    count: techniques.length,
    next: null,
    previous: null,
    results: techniques,
  };

  fs.writeFileSync(
    path.join(outputDir, "techniques.json"),
    JSON.stringify(techniquesList, null, 2),
  );
  console.log(`✅ Generated techniques.json`);

  // Write individual technique files
  techniques.forEach((technique) => {
    fs.writeFileSync(
      path.join(techniquesDir, `${technique.slug}.json`),
      JSON.stringify(technique, null, 2),
    );
  });
  console.log(`✅ Generated ${techniques.length} individual technique files`);

  // Write assurance goals with IDs
  const assuranceGoalsArray = Object.entries(ASSURANCE_GOALS).map(
    ([, goal], index) => ({
      id: index + 1,
      name: goal.name,
      description: goal.description,
    }),
  );

  const assuranceGoalsList = {
    count: assuranceGoalsArray.length,
    next: null,
    previous: null,
    results: assuranceGoalsArray,
  };

  fs.writeFileSync(
    path.join(outputDir, "assurance-goals.json"),
    JSON.stringify(assuranceGoalsList, null, 2),
  );
  console.log(`✅ Generated assurance-goals.json`);

  // Write tags
  const tagsList = {
    count: allTags.length,
    next: null,
    previous: null,
    results: allTags,
  };

  fs.writeFileSync(
    path.join(outputDir, "tags.json"),
    JSON.stringify(tagsList, null, 2),
  );
  console.log(`✅ Generated tags.json`);

  // Write resource types
  const resourceTypesList = {
    count: Object.keys(RESOURCE_TYPES).length,
    next: null,
    previous: null,
    results: Object.values(RESOURCE_TYPES),
  };

  fs.writeFileSync(
    path.join(outputDir, "resource-types.json"),
    JSON.stringify(resourceTypesList, null, 2),
  );
  console.log(`✅ Generated resource-types.json`);

  // Generate search index
  console.log("\n🔍 Generating search index...");
  const searchIndex = generateSearchIndex(techniques);
  fs.writeFileSync(
    path.join(outputDir, "search-index.json"),
    JSON.stringify(searchIndex, null, 2),
  );
  console.log(`✅ Generated search-index.json`);

  // Generate filter index
  console.log("\n📊 Generating filter index...");
  const filterIndex = generateFilterIndex(techniques, allTags);
  fs.writeFileSync(
    path.join(outputDir, "filter-index.json"),
    JSON.stringify(filterIndex, null, 2),
  );
  console.log(`✅ Generated filter-index.json`);

  console.log("\n🎉 Static API generation complete!");
}

// Generate search index for fast client-side searching
function generateSearchIndex(techniques) {
  const searchData = techniques.map((technique) => {
    // Create searchable text from multiple fields
    const searchableText = [
      technique.name,
      technique.acronym,
      technique.description,
      ...technique.tags.map((t) => t.name),
      ...technique.assurance_goals.map((g) => g.name),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return {
      slug: technique.slug,
      name: technique.name,
      acronym: technique.acronym,
      searchableText,
      // Pre-compute tokens for faster searching
      tokens: searchableText.split(/\s+/).filter((token) => token.length > 2),
    };
  });

  // Also create an inverted index for even faster searching
  const invertedIndex = {};
  searchData.forEach((item) => {
    item.tokens.forEach((token) => {
      if (!invertedIndex[token]) {
        invertedIndex[token] = [];
      }
      invertedIndex[token].push(item.slug);
    });
  });

  return {
    techniques: searchData,
    invertedIndex,
    metadata: {
      totalTechniques: techniques.length,
      generatedAt: new Date().toISOString(),
    },
  };
}

// Generate filter index with pre-computed aggregations
function generateFilterIndex(techniques, tags) {
  // Count techniques per tag (using tag names as keys)
  const tagCounts = {};
  tags.forEach((tag) => {
    tagCounts[tag.name] = {
      ...tag,
      techniqueCount: techniques.filter((t) =>
        t.tags.some((tag_obj) => tag_obj.name === tag.name),
      ).length,
    };
  });

  // Count techniques per assurance goal (using goal names as keys)
  const goalCounts = {};
  Object.values(ASSURANCE_GOALS).forEach((goal) => {
    goalCounts[goal.name] = {
      name: goal.name,
      description: goal.description,
      techniqueCount: techniques.filter((t) =>
        t.assurance_goals.some((goal_obj) => goal_obj.name === goal.name),
      ).length,
    };
  });

  // Complexity and cost rating distributions
  const complexityDistribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: techniques.filter((t) => t.complexity_rating === rating).length,
  }));

  const costDistribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: techniques.filter((t) => t.computational_cost_rating === rating)
      .length,
  }));

  // Tag categories with counts
  const tagCategories = {};
  tags.forEach((tag) => {
    if (!tagCategories[tag.category]) {
      tagCategories[tag.category] = {
        name: tag.category,
        tags: [],
        totalTechniques: 0,
      };
    }
    tagCategories[tag.category].tags.push(tag.name);
  });

  // Calculate total techniques per category
  Object.values(tagCategories).forEach((category) => {
    const techniquesInCategory = new Set();
    techniques.forEach((technique) => {
      if (technique.tags.some((t) => category.tags.includes(t.name))) {
        techniquesInCategory.add(technique.slug);
      }
    });
    category.totalTechniques = techniquesInCategory.size;
  });

  return {
    tags: tagCounts,
    assuranceGoals: goalCounts,
    tagCategories,
    complexityDistribution,
    costDistribution,
    metadata: {
      totalTechniques: techniques.length,
      totalTags: tags.length,
      totalGoals: Object.keys(ASSURANCE_GOALS).length,
      generatedAt: new Date().toISOString(),
    },
  };
}

// Run the generator
generateStaticApi().catch(console.error);
