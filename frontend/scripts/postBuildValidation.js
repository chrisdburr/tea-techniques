#!/usr/bin/env node

/**
 * Post-build validation script
 * Validates the build output based on the build mode
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

// Build mode from environment
const buildMode = process.env.NEXT_PUBLIC_DATA_SOURCE || "api";

console.log(
  `${colors.blue}Validating ${buildMode} build output...${colors.reset}\n`,
);

// Validation checks
const checks = [];

// Check 1: Build output directory exists
function validateBuildOutput() {
  const isStaticBuild = buildMode === "static" || buildMode === "mock";
  const outputDir = isStaticBuild ? "out" : ".next";
  const outputPath = path.join(__dirname, "..", outputDir);

  if (!fs.existsSync(outputPath)) {
    return {
      name: "Build Output",
      passed: false,
      message: `${outputDir} directory not found. Build may have failed.`,
    };
  }

  return {
    name: "Build Output",
    passed: true,
    message: `${outputDir} directory exists`,
  };
}

// Check 2: Static export validation
function validateStaticExport() {
  if (buildMode !== "static" && buildMode !== "mock") {
    return {
      name: "Static Export",
      passed: true,
      message: "Not applicable for API mode",
    };
  }

  const outDir = path.join(__dirname, "..", "out");
  const requiredFiles = ["index.html", "404.html"];
  const missing = [];

  requiredFiles.forEach((file) => {
    if (!fs.existsSync(path.join(outDir, file))) {
      missing.push(file);
    }
  });

  if (missing.length > 0) {
    return {
      name: "Static Export",
      passed: false,
      message: `Missing required files: ${missing.join(", ")}`,
    };
  }

  // Check for API mock files
  const apiDir = path.join(outDir, "api");
  if (!fs.existsSync(apiDir)) {
    return {
      name: "Static Export",
      passed: false,
      message: "API mock directory not found in output",
    };
  }

  return {
    name: "Static Export",
    passed: true,
    message: "All required static files present",
  };
}

// Check 3: Asset paths validation
function validateAssetPaths() {
  if (buildMode !== "static" && buildMode !== "mock") {
    return {
      name: "Asset Paths",
      passed: true,
      message: "Not applicable for API mode",
    };
  }

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const outDir = path.join(__dirname, "..", "out");
  const indexPath = path.join(outDir, "index.html");

  if (!fs.existsSync(indexPath)) {
    return {
      name: "Asset Paths",
      passed: false,
      message: "index.html not found",
    };
  }

  const indexContent = fs.readFileSync(indexPath, "utf8");

  // Check if base path is properly applied
  if (basePath && !indexContent.includes(`"${basePath}/_next`)) {
    return {
      name: "Asset Paths",
      passed: false,
      message: `Base path ${basePath} not found in asset URLs`,
    };
  }

  return {
    name: "Asset Paths",
    passed: true,
    message: basePath
      ? `Assets correctly prefixed with ${basePath}`
      : "No base path configured",
  };
}

// Check 4: Page exclusions
function validatePageExclusions() {
  if (buildMode !== "static" && buildMode !== "mock") {
    return {
      name: "Page Exclusions",
      passed: true,
      message: "All pages included in dynamic build",
    };
  }

  const outDir = path.join(__dirname, "..", "out");
  const excludedPages = ["login.html", "api-test.html"];
  const incorrectlyIncluded = [];

  excludedPages.forEach((page) => {
    if (fs.existsSync(path.join(outDir, page))) {
      incorrectlyIncluded.push(page);
    }
  });

  if (incorrectlyIncluded.length > 0) {
    return {
      name: "Page Exclusions",
      passed: false,
      message: `Auth pages found in static build: ${incorrectlyIncluded.join(
        ", ",
      )}`,
    };
  }

  return {
    name: "Page Exclusions",
    passed: true,
    message: "Auth/API pages correctly excluded",
  };
}

// Check 5: Build size
function validateBuildSize() {
  const isStaticBuild = buildMode === "static" || buildMode === "mock";
  const outputDir = isStaticBuild ? "out" : ".next";
  const outputPath = path.join(__dirname, "..", outputDir);

  if (!fs.existsSync(outputPath)) {
    return {
      name: "Build Size",
      passed: false,
      message: "Output directory not found",
    };
  }

  // Calculate directory size
  const getDirSize = (dirPath) => {
    let size = 0;
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    });

    return size;
  };

  const sizeInBytes = getDirSize(outputPath);
  const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

  // Warning thresholds
  const warningThreshold = isStaticBuild ? 50 : 100; // MB

  if (sizeInMB > warningThreshold) {
    return {
      name: "Build Size",
      passed: true,
      warning: true,
      message: `Build size: ${sizeInMB}MB (exceeds ${warningThreshold}MB threshold)`,
    };
  }

  return {
    name: "Build Size",
    passed: true,
    message: `Build size: ${sizeInMB}MB`,
  };
}

// Check 6: GitHub Pages specific files
function validateGitHubPagesFiles() {
  if (buildMode !== "static") {
    return {
      name: "GitHub Pages Files",
      passed: true,
      message: "Not applicable for non-static builds",
    };
  }

  const outDir = path.join(__dirname, "..", "out");
  const nojekyllPath = path.join(outDir, ".nojekyll");

  // Check if .nojekyll exists (created by build:github-pages script)
  if (!fs.existsSync(nojekyllPath)) {
    return {
      name: "GitHub Pages Files",
      passed: true,
      warning: true,
      message:
        ".nojekyll file not found. Use 'pnpm build:github-pages' for GitHub Pages deployment",
    };
  }

  return {
    name: "GitHub Pages Files",
    passed: true,
    message: ".nojekyll file present for GitHub Pages",
  };
}

// Run all checks
checks.push(validateBuildOutput());
checks.push(validateStaticExport());
checks.push(validateAssetPaths());
checks.push(validatePageExclusions());
checks.push(validateBuildSize());
checks.push(validateGitHubPagesFiles());

// Display results
console.log("Post-Build Validation Results:");
console.log("==============================\n");

let hasErrors = false;
let hasWarnings = false;

checks.forEach((check) => {
  const status = check.passed
    ? check.warning
      ? `${colors.yellow}⚠${colors.reset}`
      : `${colors.green}✓${colors.reset}`
    : `${colors.red}✗${colors.reset}`;

  console.log(`${status} ${check.name}`);
  console.log(`  ${check.message}\n`);

  if (!check.passed) hasErrors = true;
  if (check.warning) hasWarnings = true;
});

// Summary
console.log("==============================");
if (hasErrors) {
  console.log(`${colors.red}Post-build validation failed!${colors.reset}`);
  console.log("The build output has issues that need to be resolved.\n");
  process.exit(1);
} else if (hasWarnings) {
  console.log(
    `${colors.yellow}Post-build validation passed with warnings.${colors.reset}`,
  );
  console.log("The build is usable but consider addressing the warnings.\n");
  process.exit(0);
} else {
  console.log(`${colors.green}Post-build validation passed!${colors.reset}`);
  console.log(`The ${buildMode} build is ready for deployment.\n`);
  process.exit(0);
}
