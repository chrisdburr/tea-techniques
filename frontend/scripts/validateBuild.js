#!/usr/bin/env node

/**
 * Build validation script
 * Validates environment and configuration before building
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

// Build mode from environment or command line
const buildMode =
  process.env.NEXT_PUBLIC_DATA_SOURCE || process.argv[2] || "api";

console.log(
  `${colors.blue}Validating build for mode: ${buildMode}${colors.reset}\n`,
);

// Validation checks
const checks = [];

// Check 1: Valid build mode
function validateBuildMode() {
  const validModes = ["api", "static", "mock"];
  if (!validModes.includes(buildMode)) {
    return {
      name: "Build Mode",
      passed: false,
      message: `Invalid build mode: ${buildMode}. Must be one of: ${validModes.join(
        ", ",
      )}`,
    };
  }
  return {
    name: "Build Mode",
    passed: true,
    message: `Valid mode: ${buildMode}`,
  };
}

// Check 2: Required environment variables
function validateEnvironmentVariables() {
  const requiredVars = {
    static: ["NEXT_PUBLIC_DATA_SOURCE"],
    mock: ["NEXT_PUBLIC_DATA_SOURCE"],
    api: ["NEXT_PUBLIC_DATA_SOURCE", "NEXT_PUBLIC_API_URL"],
  };

  const missing = [];
  const required = requiredVars[buildMode] || [];

  required.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    return {
      name: "Environment Variables",
      passed: false,
      message: `Missing required variables: ${missing.join(", ")}`,
    };
  }

  return {
    name: "Environment Variables",
    passed: true,
    message: "All required variables are set",
  };
}

// Check 3: Static data availability
function validateStaticData() {
  if (buildMode !== "static" && buildMode !== "mock") {
    return {
      name: "Static Data",
      passed: true,
      message: "Not required for API mode",
    };
  }

  const apiDir = path.join(__dirname, "../public/api");
  const techniquesFile = path.join(apiDir, "techniques.json");

  if (!fs.existsSync(apiDir)) {
    return {
      name: "Static Data",
      passed: false,
      message: "API directory not found. Run: pnpm generate-api",
    };
  }

  if (!fs.existsSync(techniquesFile)) {
    return {
      name: "Static Data",
      passed: false,
      message: "techniques.json not found. Run: pnpm generate-api",
    };
  }

  // Check if data is recent
  const stats = fs.statSync(techniquesFile);
  const ageInHours = (Date.now() - stats.mtime) / (1000 * 60 * 60);

  if (ageInHours > 24) {
    return {
      name: "Static Data",
      passed: true,
      warning: true,
      message: `Data is ${Math.round(
        ageInHours,
      )} hours old. Consider running: pnpm sync-data`,
    };
  }

  return {
    name: "Static Data",
    passed: true,
    message: "Static data is present and recent",
  };
}

// Check 4: Node version
function validateNodeVersion() {
  const requiredVersion = 18;
  const currentVersion = parseInt(process.version.slice(1).split(".")[0]);

  if (currentVersion < requiredVersion) {
    return {
      name: "Node Version",
      passed: false,
      message: `Node ${requiredVersion}+ required, found ${process.version}`,
    };
  }

  return {
    name: "Node Version",
    passed: true,
    message: `Using Node ${process.version}`,
  };
}

// Check 5: Dependencies installed
function validateDependencies() {
  const nodeModulesExists = fs.existsSync(
    path.join(__dirname, "../node_modules"),
  );

  if (!nodeModulesExists) {
    return {
      name: "Dependencies",
      passed: false,
      message: "node_modules not found. Run: pnpm install",
    };
  }

  // Check if lockfile is in sync
  const lockfilePath = path.join(__dirname, "../pnpm-lock.yaml");
  const packageJsonPath = path.join(__dirname, "../package.json");

  if (fs.existsSync(lockfilePath) && fs.existsSync(packageJsonPath)) {
    const lockfileStats = fs.statSync(lockfilePath);
    const packageStats = fs.statSync(packageJsonPath);

    if (packageStats.mtime > lockfileStats.mtime) {
      return {
        name: "Dependencies",
        passed: true,
        warning: true,
        message:
          "package.json is newer than lockfile. Consider running: pnpm install",
      };
    }
  }

  return {
    name: "Dependencies",
    passed: true,
    message: "Dependencies are installed",
  };
}

// Check 6: GitHub Pages specific validation
function validateGitHubPages() {
  if (buildMode !== "static") {
    return {
      name: "GitHub Pages Config",
      passed: true,
      message: "Not required for non-static builds",
    };
  }

  const warnings = [];

  if (!process.env.NEXT_PUBLIC_BASE_PATH) {
    warnings.push("NEXT_PUBLIC_BASE_PATH not set (required for GitHub Pages)");
  }

  if (!process.env.NEXT_PUBLIC_ASSET_PREFIX) {
    warnings.push(
      "NEXT_PUBLIC_ASSET_PREFIX not set (required for GitHub Pages)",
    );
  }

  if (warnings.length > 0) {
    return {
      name: "GitHub Pages Config",
      passed: false,
      message: warnings.join("; "),
    };
  }

  return {
    name: "GitHub Pages Config",
    passed: true,
    message: "GitHub Pages configuration is valid",
  };
}

// Run all checks
checks.push(validateBuildMode());
checks.push(validateNodeVersion());
checks.push(validateEnvironmentVariables());
checks.push(validateDependencies());
checks.push(validateStaticData());
checks.push(validateGitHubPages());

// Display results
console.log("Validation Results:");
console.log("==================\n");

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
console.log("==================");
if (hasErrors) {
  console.log(`${colors.red}Build validation failed!${colors.reset}`);
  console.log("Please fix the errors above before building.\n");
  process.exit(1);
} else if (hasWarnings) {
  console.log(
    `${colors.yellow}Build validation passed with warnings.${colors.reset}`,
  );
  console.log("Consider addressing the warnings above.\n");
  process.exit(0);
} else {
  console.log(`${colors.green}Build validation passed!${colors.reset}`);
  console.log(`Ready to build in ${buildMode} mode.\n`);
  process.exit(0);
}
