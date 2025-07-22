#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Validation schemas for each data type
const schemas = {
  technique: {
    required: [
      "slug",
      "name",
      "description",
      "assurance_goals",
      "tags",
      "related_techniques",
      "resources",
      "example_use_cases",
      "limitations",
    ],
    types: {
      slug: "string",
      name: "string",
      description: "string",
      acronym: ["string", "null"],
      complexity_rating: ["number", "null"],
      computational_cost_rating: ["number", "null"],
      assurance_goals: "array",
      tags: "array",
      related_techniques: "array",
      resources: "array",
      example_use_cases: "array",
      limitations: "array",
    },
  },
  assuranceGoal: {
    required: ["name", "description"],
    types: {
      name: "string",
      description: "string",
    },
  },
  tag: {
    required: ["name", "category", "description"],
    types: {
      name: "string",
      category: "string",
      description: "string",
    },
  },
  resourceType: {
    required: ["name", "description"],
    types: {
      name: "string",
      description: "string",
    },
  },
  apiResponse: {
    required: ["count", "next", "previous", "results"],
    types: {
      count: "number",
      next: ["string", "null"],
      previous: ["string", "null"],
      results: "array",
    },
  },
};

// Helper function to check if a value matches expected types
function validateType(value, expectedType) {
  if (Array.isArray(expectedType)) {
    return expectedType.some((type) => validateType(value, type));
  }

  if (expectedType === "null") {
    return value === null;
  }

  if (expectedType === "array") {
    return Array.isArray(value);
  }

  return typeof value === expectedType;
}

// Validate a single object against a schema
function validateObject(obj, schema, objName) {
  const errors = [];

  // Check required fields
  schema.required.forEach((field) => {
    if (!(field in obj)) {
      errors.push(`${objName}: Missing required field '${field}'`);
    }
  });

  // Check field types
  Object.entries(schema.types).forEach(([field, expectedType]) => {
    if (field in obj && !validateType(obj[field], expectedType)) {
      errors.push(
        `${objName}: Field '${field}' has incorrect type. Expected ${expectedType}, got ${typeof obj[
          field
        ]}`,
      );
    }
  });

  return errors;
}

// Validate API response structure
function validateApiResponse(data, itemSchema, fileName) {
  const errors = [];

  // Validate response wrapper
  errors.push(...validateObject(data, schemas.apiResponse, fileName));

  // Validate each item in results
  if (data.results && Array.isArray(data.results)) {
    data.results.forEach((item, index) => {
      errors.push(
        ...validateObject(item, itemSchema, `${fileName}.results[${index}]`),
      );
    });
  }

  return errors;
}

// Validate relationships between techniques
function validateRelationships(techniques) {
  const errors = [];
  const slugs = new Set(techniques.map((t) => t.slug));

  techniques.forEach((technique) => {
    technique.related_techniques.forEach((relatedSlug) => {
      if (!slugs.has(relatedSlug)) {
        errors.push(
          `Technique '${technique.slug}' references non-existent related technique '${relatedSlug}'`,
        );
      }
    });
  });

  return errors;
}

// Validate all assurance goal references
function validateAssuranceGoalReferences(techniques, assuranceGoals) {
  const errors = [];
  const goalNames = new Set(assuranceGoals.map((g) => g.name));

  techniques.forEach((technique) => {
    // Check assurance goals (now just strings)
    if (Array.isArray(technique.assurance_goals)) {
      technique.assurance_goals.forEach((goalName) => {
        if (!goalNames.has(goalName)) {
          errors.push(
            `Technique '${technique.slug}' references non-existent assurance goal '${goalName}'`,
          );
        }
      });
    }

    // Check example use cases
    if (Array.isArray(technique.example_use_cases)) {
      technique.example_use_cases.forEach((useCase, idx) => {
        if (useCase.goal && !goalNames.has(useCase.goal)) {
          errors.push(
            `Technique '${technique.slug}' use case ${idx} references non-existent assurance goal '${useCase.goal}'`,
          );
        }
      });
    }
  });

  return errors;
}

// Main validation function
async function validateStaticData() {
  console.log("🔍 Starting static data validation...\n");

  const apiDir = path.join(__dirname, "../public/api");
  let totalErrors = 0;

  try {
    // Load all data files
    const techniquesData = JSON.parse(
      fs.readFileSync(path.join(apiDir, "techniques.json"), "utf-8"),
    );
    const assuranceGoalsData = JSON.parse(
      fs.readFileSync(path.join(apiDir, "assurance-goals.json"), "utf-8"),
    );
    const tagsData = JSON.parse(
      fs.readFileSync(path.join(apiDir, "tags.json"), "utf-8"),
    );
    const resourceTypesData = JSON.parse(
      fs.readFileSync(path.join(apiDir, "resource-types.json"), "utf-8"),
    );

    // Validate techniques.json
    console.log("📋 Validating techniques.json...");
    let errors = validateApiResponse(
      techniquesData,
      schemas.technique,
      "techniques.json",
    );
    if (errors.length > 0) {
      console.error("❌ Errors in techniques.json:");
      errors.forEach((err) => console.error(`   - ${err}`));
      totalErrors += errors.length;
    } else {
      console.log("✅ techniques.json is valid");
    }

    // Validate assurance-goals.json
    console.log("\n📋 Validating assurance-goals.json...");
    errors = validateApiResponse(
      assuranceGoalsData,
      schemas.assuranceGoal,
      "assurance-goals.json",
    );
    if (errors.length > 0) {
      console.error("❌ Errors in assurance-goals.json:");
      errors.forEach((err) => console.error(`   - ${err}`));
      totalErrors += errors.length;
    } else {
      console.log("✅ assurance-goals.json is valid");
    }

    // Validate tags.json
    console.log("\n📋 Validating tags.json...");
    errors = validateApiResponse(tagsData, schemas.tag, "tags.json");
    if (errors.length > 0) {
      console.error("❌ Errors in tags.json:");
      errors.forEach((err) => console.error(`   - ${err}`));
      totalErrors += errors.length;
    } else {
      console.log("✅ tags.json is valid");
    }

    // Validate resource-types.json
    console.log("\n📋 Validating resource-types.json...");
    errors = validateApiResponse(
      resourceTypesData,
      schemas.resourceType,
      "resource-types.json",
    );
    if (errors.length > 0) {
      console.error("❌ Errors in resource-types.json:");
      errors.forEach((err) => console.error(`   - ${err}`));
      totalErrors += errors.length;
    } else {
      console.log("✅ resource-types.json is valid");
    }

    // Validate relationships
    console.log("\n🔗 Validating relationships...");
    errors = validateRelationships(techniquesData.results);
    if (errors.length > 0) {
      console.error("❌ Relationship errors:");
      errors.forEach((err) => console.error(`   - ${err}`));
      totalErrors += errors.length;
    } else {
      console.log("✅ All technique relationships are valid");
    }

    // Validate assurance goal references
    errors = validateAssuranceGoalReferences(
      techniquesData.results,
      assuranceGoalsData.results,
    );
    if (errors.length > 0) {
      console.error("❌ Assurance goal reference errors:");
      errors.forEach((err) => console.error(`   - ${err}`));
      totalErrors += errors.length;
    } else {
      console.log("✅ All assurance goal references are valid");
    }

    // Validate individual technique files
    console.log("\n📂 Validating individual technique files...");
    const techniquesDir = path.join(apiDir, "techniques");
    const techniqueFiles = fs
      .readdirSync(techniquesDir)
      .filter((f) => f.endsWith(".json"));
    let fileErrors = 0;

    for (const file of techniqueFiles) {
      const techniqueData = JSON.parse(
        fs.readFileSync(path.join(techniquesDir, file), "utf-8"),
      );
      const errors = validateObject(
        techniqueData,
        schemas.technique,
        `techniques/${file}`,
      );
      if (errors.length > 0) {
        fileErrors += errors.length;
        errors.forEach((err) => console.error(`   - ${err}`));
      }
    }

    if (fileErrors === 0) {
      console.log(
        `✅ All ${techniqueFiles.length} individual technique files are valid`,
      );
    } else {
      console.error(
        `❌ Found ${fileErrors} errors in individual technique files`,
      );
      totalErrors += fileErrors;
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    if (totalErrors === 0) {
      console.log("🎉 All static data validation passed!");
      process.exit(0);
    } else {
      console.error(`❌ Found ${totalErrors} total validation errors`);
      process.exit(1);
    }
  } catch (error) {
    console.error("💥 Fatal error during validation:", error.message);
    process.exit(1);
  }
}

// Run validation
validateStaticData();
