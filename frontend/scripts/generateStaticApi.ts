#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Define proper __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Type definitions matching the Django models
interface AssuranceGoal {
  id: number;
  name: string;
  description: string;
}

interface Tag {
  id: number;
  name: string;
  category: string;
  description: string;
}

interface ResourceType {
  id: number;
  name: string;
  description: string;
}

interface TechniqueResource {
  id: number;
  resource_type: number;
  resource_type_name: string;
  title: string;
  url: string;
  description: string;
  authors: string;
  publication_date: string | null;
  source_type: string;
}

interface TechniqueExampleUseCase {
  id: number;
  description: string;
  assurance_goal: number | null;
  assurance_goal_name: string | null;
}

interface TechniqueLimitation {
  id: number;
  description: string;
}

interface Technique {
  slug: string;
  name: string;
  acronym: string | null;
  description: string;
  complexity_rating: number | null;
  computational_cost_rating: number | null;
  assurance_goals: AssuranceGoal[];
  tags: Tag[];
  related_techniques: string[];
  resources: TechniqueResource[];
  example_use_cases: TechniqueExampleUseCase[];
  limitations: TechniqueLimitation[];
}

interface APIResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Source data structure (from backend/data/techniques.json)
interface SourceTechnique {
  slug: string;
  name: string;
  description: string;
  acronym?: string;
  assurance_goals: string[];
  tags: string[];
  example_use_cases: Array<{
    description: string;
    goal: string;
  }>;
  limitations: Array<{
    description: string;
  }>;
  complexity_rating?: number;
  computational_cost_rating?: number;
  related_technique_slugs?: string[];
  resources?: Array<{
    title: string;
    url: string;
    description: string;
    authors?: string;
    publication_date?: string;
    source_type?: string;
    resource_type?: string;
  }>;
}

// Static data maps for goals, tags, and resource types
const ASSURANCE_GOALS: Record<string, AssuranceGoal> = {
  Explainability: {
    id: 1,
    name: "Explainability",
    description: "Making AI systems understandable to humans",
  },
  Fairness: {
    id: 2,
    name: "Fairness",
    description:
      "Ensuring AI systems treat all individuals and groups equitably",
  },
  Reliability: {
    id: 3,
    name: "Reliability",
    description: "Ensuring AI systems perform consistently and predictably",
  },
  Security: {
    id: 4,
    name: "Security",
    description: "Protecting AI systems from malicious attacks and misuse",
  },
  Privacy: {
    id: 5,
    name: "Privacy",
    description: "Protecting individual data and ensuring appropriate use",
  },
};

const RESOURCE_TYPES: Record<string, ResourceType> = {
  academic_paper: {
    id: 1,
    name: "Academic Paper",
    description: "Peer-reviewed research publication",
  },
  documentation: {
    id: 2,
    name: "Documentation",
    description: "Official documentation or guide",
  },
  code: { id: 3, name: "Code", description: "Source code or implementation" },
  tutorial: {
    id: 4,
    name: "Tutorial",
    description: "Educational material or tutorial",
  },
  tool: { id: 5, name: "Tool", description: "Software tool or application" },
};

// Helper to generate tag from string
function generateTag(tagStr: string, index: number): Tag {
  const parts = tagStr.split("/");
  const category = parts[0] || "other";
  const name = parts[parts.length - 1]
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: index + 1,
    name: tagStr,
    category: category,
    description: name,
  };
}

// Generate all unique tags from source data
function generateAllTags(techniques: SourceTechnique[]): Tag[] {
  const uniqueTags = new Set<string>();
  techniques.forEach((tech) => {
    tech.tags.forEach((tag) => uniqueTags.add(tag));
  });

  return Array.from(uniqueTags)
    .sort()
    .map((tag, index) => generateTag(tag, index));
}

// Convert source technique to API format
function convertTechnique(
  source: SourceTechnique,
  index: number,
  allTags: Tag[],
): Technique {
  const tagMap = new Map(allTags.map((t) => [t.name, t]));

  // Convert assurance goals
  const assuranceGoals = source.assurance_goals
    .map((g) => ASSURANCE_GOALS[g])
    .filter(Boolean);

  // Convert tags
  const tags = source.tags
    .map((t) => tagMap.get(t))
    .filter((t): t is Tag => t !== undefined);

  // Convert resources
  const resources: TechniqueResource[] = (source.resources || []).map(
    (r, idx) => ({
      id: index * 100 + idx + 1,
      resource_type:
        RESOURCE_TYPES[r.resource_type || "documentation"]?.id || 2,
      resource_type_name:
        RESOURCE_TYPES[r.resource_type || "documentation"]?.name ||
        "Documentation",
      title: r.title,
      url: r.url,
      description: r.description,
      authors: r.authors || "",
      publication_date: r.publication_date || null,
      source_type: r.source_type || "website",
    }),
  );

  // Convert example use cases
  const exampleUseCases: TechniqueExampleUseCase[] =
    source.example_use_cases.map((uc, idx) => {
      const goal = ASSURANCE_GOALS[uc.goal];
      return {
        id: index * 100 + idx + 1,
        description: uc.description,
        assurance_goal: goal?.id || null,
        assurance_goal_name: goal?.name || null,
      };
    });

  // Convert limitations
  const limitations: TechniqueLimitation[] = source.limitations.map(
    (lim, idx) => ({
      id: index * 100 + idx + 1,
      description: lim.description,
    }),
  );

  return {
    slug: source.slug,
    name: source.name,
    acronym: source.acronym || null,
    description: source.description,
    complexity_rating: source.complexity_rating || null,
    computational_cost_rating: source.computational_cost_rating || null,
    assurance_goals: assuranceGoals,
    tags: tags,
    related_techniques: source.related_technique_slugs || [],
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
  const sourceData: SourceTechnique[] = JSON.parse(
    fs.readFileSync(sourcePath, "utf-8"),
  );
  console.log(`📖 Read ${sourceData.length} techniques from source`);

  // Generate all tags first
  const allTags = generateAllTags(sourceData);
  console.log(`🏷️  Generated ${allTags.length} unique tags`);

  // Convert techniques
  const techniques = sourceData.map((source, index) =>
    convertTechnique(source, index + 1, allTags),
  );

  // Create output directory
  const outputDir = path.join(__dirname, "../public/api");
  const techniquesDir = path.join(outputDir, "techniques");

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(techniquesDir, { recursive: true });

  // Write main techniques list
  const techniquesList: APIResponse<Technique> = {
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

  // Write assurance goals
  const assuranceGoalsList: APIResponse<AssuranceGoal> = {
    count: Object.keys(ASSURANCE_GOALS).length,
    next: null,
    previous: null,
    results: Object.values(ASSURANCE_GOALS),
  };

  fs.writeFileSync(
    path.join(outputDir, "assurance-goals.json"),
    JSON.stringify(assuranceGoalsList, null, 2),
  );
  console.log(`✅ Generated assurance-goals.json`);

  // Write tags
  const tagsList: APIResponse<Tag> = {
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
  const resourceTypesList: APIResponse<ResourceType> = {
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

  console.log("🎉 Static API generation complete!");
}

// Run the generator
generateStaticApi().catch(console.error);
