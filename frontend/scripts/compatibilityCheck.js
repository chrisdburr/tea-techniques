#!/usr/bin/env node

/**
 * Compatibility Check Script
 * Ensures backward compatibility when updating API mocks
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ANSI color codes
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

// Configuration
const API_DIR = path.join(__dirname, "..", "public", "api");
const TECHNIQUES_DIR = path.join(API_DIR, "techniques");

// Compatibility rules
const COMPATIBILITY_RULES = {
  // Fields that must never be removed
  requiredFields: {
    technique: ["slug", "name", "description"],
    techniqueList: ["techniques"],
  },
  // Fields that can be deprecated but not removed
  deprecatedFields: [],
  // Field type changes that are allowed
  allowedTypeChanges: {
    string_to_array: true, // e.g., category -> categories
    object_to_array: true, // e.g., resource -> resources
  },
};

// Results tracking
const results = {
  passed: 0,
  warnings: 0,
  errors: 0,
  breaking: [],
  deprecations: [],
};

// Helper functions
function log(level, message, details = null) {
  const prefix = {
    error: `${colors.red}❌ ERROR`,
    warning: `${colors.yellow}⚠️  WARNING`,
    success: `${colors.green}✅ SUCCESS`,
    info: `${colors.blue}ℹ️  INFO`,
  };

  console.log(`${prefix[level] || ""}${colors.reset}: ${message}`);

  if (details) {
    console.log(`   ${JSON.stringify(details, null, 2)}`);
  }

  // Track results
  if (level === "error") results.errors++;
  else if (level === "warning") results.warnings++;
  else if (level === "success") results.passed++;
}

// Get current git branch
function getCurrentBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
    }).trim();
  } catch (error) {
    log("error", "Failed to get current branch", error.message);
    return null;
  }
}

// Get base branch for comparison
function getBaseBranch(currentBranch) {
  if (currentBranch === "main") return "main~1";
  return "main";
}

// Load JSON file safely
function loadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    log("error", `Failed to load JSON: ${filePath}`, error.message);
    return null;
  }
}

// Get API structure from a specific git revision
function getAPIStructureFromGit(revision, relativePath) {
  try {
    const content = execSync(
      `git show ${revision}:${relativePath} 2>/dev/null`,
      { encoding: "utf8" },
    );
    return JSON.parse(content);
  } catch (error) {
    // File might not exist in that revision
    return null;
  }
}

// Deep compare objects
function deepCompare(obj1, obj2, path = "") {
  const changes = {
    added: [],
    removed: [],
    modified: [],
  };

  // Check for removed fields
  for (const key in obj1) {
    if (!(key in obj2)) {
      changes.removed.push(`${path}.${key}`);
    } else if (typeof obj1[key] === "object" && typeof obj2[key] === "object") {
      // Recursively check nested objects
      const nestedChanges = deepCompare(obj1[key], obj2[key], `${path}.${key}`);
      changes.added.push(...nestedChanges.added);
      changes.removed.push(...nestedChanges.removed);
      changes.modified.push(...nestedChanges.modified);
    } else if (typeof obj1[key] !== typeof obj2[key]) {
      changes.modified.push({
        path: `${path}.${key}`,
        oldType: typeof obj1[key],
        newType: typeof obj2[key],
      });
    }
  }

  // Check for added fields
  for (const key in obj2) {
    if (!(key in obj1)) {
      changes.added.push(`${path}.${key}`);
    }
  }

  return changes;
}

// Check field compatibility
function checkFieldCompatibility(changes, context) {
  // Check for removed required fields
  for (const removed of changes.removed) {
    const fieldName = removed.split(".").pop();
    if (COMPATIBILITY_RULES.requiredFields.technique.includes(fieldName)) {
      log(
        "error",
        `Breaking change: Required field removed in ${context}`,
        removed,
      );
      results.breaking.push({ type: "field_removed", field: removed, context });
      return false;
    }
  }

  // Check for type changes
  for (const modified of changes.modified) {
    const changeType = `${modified.oldType}_to_${modified.newType}`;
    if (!COMPATIBILITY_RULES.allowedTypeChanges[changeType]) {
      log(
        "error",
        `Breaking change: Incompatible type change in ${context}`,
        modified,
      );
      results.breaking.push({ type: "type_change", ...modified, context });
      return false;
    }
  }

  return true;
}

// Check techniques list compatibility
function checkTechniquesListCompatibility() {
  log("info", "Checking techniques list compatibility...");

  const currentBranch = getCurrentBranch();
  if (!currentBranch) return;

  const baseBranch = getBaseBranch(currentBranch);
  const relativePath = "frontend/public/api/techniques.json";

  const oldData = getAPIStructureFromGit(baseBranch, relativePath);
  const newData = loadJSON(path.join(API_DIR, "techniques.json"));

  if (!oldData || !newData) {
    log("warning", "Cannot compare techniques list - missing data");
    return;
  }

  // Check structure changes
  const changes = deepCompare(oldData, newData, "techniques");

  if (changes.removed.length > 0) {
    log("warning", "Fields removed from techniques list", changes.removed);
  }

  if (changes.added.length > 0) {
    log("success", "New fields added to techniques list", changes.added);
  }

  checkFieldCompatibility(changes, "techniques list");

  // Check individual technique compatibility
  if (oldData.techniques && newData.techniques) {
    const oldSlugs = new Set(oldData.techniques.map((t) => t.slug));
    const newSlugs = new Set(newData.techniques.map((t) => t.slug));

    // Check for removed techniques
    for (const slug of oldSlugs) {
      if (!newSlugs.has(slug)) {
        log("error", `Breaking change: Technique removed`, slug);
        results.breaking.push({ type: "technique_removed", slug });
      }
    }

    // Check for added techniques
    for (const slug of newSlugs) {
      if (!oldSlugs.has(slug)) {
        log("success", `New technique added`, slug);
      }
    }
  }
}

// Check individual technique files
function checkIndividualTechniques() {
  log("info", "Checking individual technique compatibility...");

  const currentBranch = getCurrentBranch();
  if (!currentBranch) return;

  const baseBranch = getBaseBranch(currentBranch);

  // Get list of technique files
  if (!fs.existsSync(TECHNIQUES_DIR)) {
    log("error", "Techniques directory not found");
    return;
  }

  const files = fs
    .readdirSync(TECHNIQUES_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json");

  for (const file of files) {
    const slug = file.replace(".json", "");
    const relativePath = `frontend/public/api/techniques/${file}`;

    const oldData = getAPIStructureFromGit(baseBranch, relativePath);
    const newData = loadJSON(path.join(TECHNIQUES_DIR, file));

    if (!oldData) {
      // New technique file
      log("success", `New technique file added`, slug);
      continue;
    }

    if (!newData) {
      // Technique file removed
      log("error", `Breaking change: Technique file removed`, slug);
      results.breaking.push({ type: "technique_file_removed", slug });
      continue;
    }

    // Compare technique structure
    const changes = deepCompare(oldData, newData, slug);

    if (!checkFieldCompatibility(changes, `technique: ${slug}`)) {
      continue;
    }

    if (changes.removed.length === 0 && changes.modified.length === 0) {
      results.passed++;
    }
  }
}

// Check API version compatibility
function checkAPIVersion() {
  log("info", "Checking API version...");

  // In a real implementation, you might track API versions
  const versionFile = path.join(API_DIR, "version.json");

  if (fs.existsSync(versionFile)) {
    const version = loadJSON(versionFile);
    if (version) {
      log("info", `API version: ${version.version || "unknown"}`);
    }
  } else {
    log(
      "warning",
      "No API version file found - consider adding version tracking",
    );
  }
}

// Generate compatibility report
function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("COMPATIBILITY CHECK SUMMARY");
  console.log("=".repeat(60) + "\n");

  console.log(
    `Total checks: ${results.passed + results.warnings + results.errors}`,
  );
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${results.warnings}${colors.reset}`);
  console.log(`${colors.red}Errors: ${results.errors}${colors.reset}`);

  if (results.breaking.length > 0) {
    console.log(`\n${colors.red}BREAKING CHANGES DETECTED:${colors.reset}`);
    results.breaking.forEach((change) => {
      console.log(`  - ${change.type}: ${JSON.stringify(change)}`);
    });
  }

  if (results.deprecations.length > 0) {
    console.log(`\n${colors.yellow}DEPRECATIONS:${colors.reset}`);
    results.deprecations.forEach((dep) => {
      console.log(`  - ${dep}`);
    });
  }

  // Create compatibility report file
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: results.passed,
      warnings: results.warnings,
      errors: results.errors,
      hasBreakingChanges: results.breaking.length > 0,
    },
    breakingChanges: results.breaking,
    deprecations: results.deprecations,
  };

  fs.writeFileSync(
    path.join(__dirname, "..", "compatibility-report.json"),
    JSON.stringify(report, null, 2),
  );

  if (results.breaking.length > 0) {
    console.log(
      `\n${colors.red}Compatibility check FAILED - Breaking changes detected${colors.reset}`,
    );
    process.exit(1);
  } else if (results.errors > 0) {
    console.log(
      `\n${colors.red}Compatibility check FAILED - Errors detected${colors.reset}`,
    );
    process.exit(1);
  } else if (results.warnings > 0) {
    console.log(
      `\n${colors.yellow}Compatibility check passed with warnings${colors.reset}`,
    );
  } else {
    console.log(`\n${colors.green}Compatibility check PASSED${colors.reset}`);
  }
}

// Main execution
function main() {
  console.log(`${colors.blue}API Compatibility Check${colors.reset}`);
  console.log("=".repeat(60) + "\n");

  // Check if we're in a git repository
  try {
    execSync("git rev-parse --git-dir", { stdio: "ignore" });
  } catch (error) {
    log("error", "Not in a git repository - cannot check compatibility");
    process.exit(1);
  }

  // Run compatibility checks
  checkAPIVersion();
  checkTechniquesListCompatibility();
  checkIndividualTechniques();

  // Generate report
  generateReport();
}

// Run the script
main();
