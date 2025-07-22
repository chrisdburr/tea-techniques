#!/usr/bin/env node

/**
 * API Mock Validation Script
 * Validates that generated mock API files match the expected schema
 */

const fs = require("fs");
const path = require("path");

// ANSI color codes
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

// Paths
const API_DIR = path.join(__dirname, "..", "public", "api");
const TECHNIQUES_DIR = path.join(API_DIR, "techniques");

// Validation results
const validationResults = [];
let hasErrors = false;

// Log functions
function logError(message, file = null) {
  console.error(
    `${colors.red}❌ ERROR${file ? ` [${file}]` : ""}: ${message}${
      colors.reset
    }`,
  );
  validationResults.push({ type: "error", message, file });
  hasErrors = true;
}

function logWarning(message, file = null) {
  console.warn(
    `${colors.yellow}⚠️  WARNING${file ? ` [${file}]` : ""}: ${message}${
      colors.reset
    }`,
  );
  validationResults.push({ type: "warning", message, file });
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
  validationResults.push({ type: "success", message });
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

// Schema definitions
const techniqueSummarySchema = {
  required: ["slug", "name", "description"],
  properties: {
    slug: { type: "string", pattern: /^[a-z0-9-]+$/ },
    name: { type: "string", minLength: 1 },
    acronym: { type: "string", optional: true },
    description: { type: "string", minLength: 10 },
    categories: { type: "array", items: { type: "string" } },
    goals: { type: "array", items: { type: "string" }, optional: true },
  },
};

const techniqueDetailSchema = {
  required: [
    "slug",
    "name",
    "description",
    "purpose",
    "suited_for",
    "categories",
  ],
  properties: {
    slug: { type: "string", pattern: /^[a-z0-9-]+$/ },
    name: { type: "string", minLength: 1 },
    acronym: { type: "string", optional: true },
    description: { type: "string", minLength: 10 },
    purpose: { type: "string", minLength: 10 },
    suited_for: { type: "string", minLength: 10 },
    not_suited_for: { type: "string", optional: true },
    categories: { type: "array", items: { type: "string" } },
    goals: { type: "array", items: { type: "string" }, optional: true },
    prerequisites: { type: "array", items: { type: "string" }, optional: true },
    tags: { type: "array", items: { type: "string" }, optional: true },
    resources: {
      type: "array",
      items: {
        type: "object",
        required: ["title", "url"],
        properties: {
          title: { type: "string" },
          url: { type: "string", pattern: /^https?:\/\// },
          type: { type: "string", optional: true },
        },
      },
      optional: true,
    },
    related_technique_slugs: {
      type: "array",
      items: { type: "string" },
      optional: true,
    },
  },
};

// Validation functions
function validateType(value, type) {
  if (type === "string") return typeof value === "string";
  if (type === "array") return Array.isArray(value);
  if (type === "object") return typeof value === "object" && value !== null;
  return false;
}

function validateField(obj, fieldName, fieldSchema, context) {
  const value = obj[fieldName];

  // Check if field exists
  if (value === undefined || value === null) {
    if (!fieldSchema.optional) {
      logError(`Missing required field: ${fieldName}`, context);
      return false;
    }
    return true;
  }

  // Validate type
  if (!validateType(value, fieldSchema.type)) {
    logError(
      `Invalid type for field ${fieldName}: expected ${
        fieldSchema.type
      }, got ${typeof value}`,
      context,
    );
    return false;
  }

  // Validate pattern
  if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
    logError(
      `Field ${fieldName} does not match pattern: ${fieldSchema.pattern}`,
      context,
    );
    return false;
  }

  // Validate minLength
  if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
    logError(
      `Field ${fieldName} is too short: minimum length is ${fieldSchema.minLength}`,
      context,
    );
    return false;
  }

  // Validate array items
  if (fieldSchema.type === "array" && fieldSchema.items) {
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      if (fieldSchema.items.type === "object") {
        validateObject(
          item,
          fieldSchema.items,
          `${context}[${fieldName}][${i}]`,
        );
      } else if (!validateType(item, fieldSchema.items.type)) {
        logError(`Invalid type for array item in ${fieldName}[${i}]`, context);
        return false;
      }
    }
  }

  return true;
}

function validateObject(obj, schema, context) {
  let isValid = true;

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!obj.hasOwnProperty(field)) {
        logError(`Missing required field: ${field}`, context);
        isValid = false;
      }
    }
  }

  // Validate each property
  if (schema.properties) {
    for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
      if (!validateField(obj, fieldName, fieldSchema, context)) {
        isValid = false;
      }
    }
  }

  return isValid;
}

// Main validation functions
function validateTechniquesList() {
  logInfo("Validating techniques list...");

  const files = ["techniques.json", "techniques/index.json"];
  const techniques = new Map();

  for (const file of files) {
    const filePath = path.join(API_DIR, file);

    if (!fs.existsSync(filePath)) {
      logError(`Missing required file: ${file}`);
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

      if (!data.techniques || !Array.isArray(data.techniques)) {
        logError("Invalid structure: missing techniques array", file);
        continue;
      }

      logSuccess(`Found ${data.techniques.length} techniques in ${file}`);

      // Validate each technique summary
      data.techniques.forEach((technique, index) => {
        validateObject(
          technique,
          {
            required: techniqueSummarySchema.required,
            properties: techniqueSummarySchema.properties,
          },
          `${file}[${index}]`,
        );
        techniques.set(technique.slug, technique);
      });
    } catch (error) {
      logError(`Failed to parse JSON: ${error.message}`, file);
    }
  }

  return techniques;
}

function validateIndividualTechniques(techniquesList) {
  logInfo("\nValidating individual technique files...");

  const slugsInIndex = new Set(techniquesList.keys());
  const filesFound = new Set();

  // Check all files in techniques directory
  if (!fs.existsSync(TECHNIQUES_DIR)) {
    logError("Missing techniques directory");
    return;
  }

  const files = fs.readdirSync(TECHNIQUES_DIR);

  for (const file of files) {
    if (file === "index.json") continue;
    if (!file.endsWith(".json")) continue;

    const slug = file.replace(".json", "");
    filesFound.add(slug);

    const filePath = path.join(TECHNIQUES_DIR, file);

    try {
      const technique = JSON.parse(fs.readFileSync(filePath, "utf8"));

      // Validate schema
      validateObject(
        technique,
        {
          required: techniqueDetailSchema.required,
          properties: techniqueDetailSchema.properties,
        },
        `techniques/${file}`,
      );

      // Check slug matches filename
      if (technique.slug !== slug) {
        logError(
          `Slug mismatch: file is ${slug}.json but slug field is ${technique.slug}`,
          file,
        );
      }

      // Check if technique is in index
      if (!slugsInIndex.has(slug)) {
        logWarning(`Technique ${slug} not found in index`, file);
      }

      // Validate related techniques exist
      if (technique.related_technique_slugs) {
        for (const relatedSlug of technique.related_technique_slugs) {
          if (!slugsInIndex.has(relatedSlug)) {
            logWarning(
              `Related technique ${relatedSlug} not found in index`,
              file,
            );
          }
        }
      }
    } catch (error) {
      logError(`Failed to parse JSON: ${error.message}`, file);
    }
  }

  // Check for missing files
  for (const slug of slugsInIndex) {
    if (!filesFound.has(slug)) {
      logError(`Missing technique file for slug: ${slug}`);
    }
  }

  logSuccess(`Validated ${filesFound.size} individual technique files`);
}

function validateCrossReferences() {
  logInfo("\nValidating cross-references...");

  const categoriesUsed = new Set();
  const goalsUsed = new Set();
  const tagsUsed = new Set();

  // Collect all used values
  const files = fs.readdirSync(TECHNIQUES_DIR);
  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const filePath = path.join(TECHNIQUES_DIR, file);
    try {
      const technique = JSON.parse(fs.readFileSync(filePath, "utf8"));

      if (technique.categories) {
        technique.categories.forEach((cat) => categoriesUsed.add(cat));
      }
      if (technique.goals) {
        technique.goals.forEach((goal) => goalsUsed.add(goal));
      }
      if (technique.tags) {
        technique.tags.forEach((tag) => tagsUsed.add(tag));
      }
    } catch (error) {
      // Already reported in previous validation
    }
  }

  logSuccess(
    `Found ${categoriesUsed.size} categories, ${goalsUsed.size} goals, ${tagsUsed.size} tags`,
  );
}

function validateApiStructure() {
  logInfo("\nValidating API structure...");

  // Check required directories
  const requiredDirs = [API_DIR, TECHNIQUES_DIR];

  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      logError(`Missing required directory: ${dir}`);
    } else {
      logSuccess(`Directory exists: ${path.relative(process.cwd(), dir)}`);
    }
  }

  // Check for unexpected files
  if (fs.existsSync(API_DIR)) {
    const files = fs.readdirSync(API_DIR);
    const expectedFiles = ["techniques.json", "techniques"];

    for (const file of files) {
      if (!expectedFiles.includes(file)) {
        logWarning(`Unexpected file in API directory: ${file}`);
      }
    }
  }
}

// Generate validation report
function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("VALIDATION SUMMARY");
  console.log("=".repeat(60) + "\n");

  const errorCount = validationResults.filter((r) => r.type === "error").length;
  const warningCount = validationResults.filter(
    (r) => r.type === "warning",
  ).length;
  const successCount = validationResults.filter(
    (r) => r.type === "success",
  ).length;

  console.log(`Total checks performed: ${validationResults.length}`);
  console.log(`${colors.green}✅ Passed: ${successCount}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${warningCount}${colors.reset}`);
  console.log(`${colors.red}❌ Errors: ${errorCount}${colors.reset}`);

  if (hasErrors) {
    console.log(
      `\n${colors.red}Validation FAILED - Fix errors before proceeding${colors.reset}`,
    );
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(
      `\n${colors.yellow}Validation passed with warnings${colors.reset}`,
    );
  } else {
    console.log(
      `\n${colors.green}Validation PASSED - All checks successful!${colors.reset}`,
    );
  }
}

// Main execution
function main() {
  console.log(`${colors.blue}API Mock Validation Script${colors.reset}`);
  console.log("=".repeat(60) + "\n");

  // Run validations
  validateApiStructure();
  const techniquesList = validateTechniquesList();
  validateIndividualTechniques(techniquesList);
  validateCrossReferences();

  // Generate report
  generateReport();
}

// Run the script
main();
