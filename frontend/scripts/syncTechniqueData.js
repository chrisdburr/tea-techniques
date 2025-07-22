#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

// Helper to color console output
function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Calculate hash of a file
function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return crypto.createHash("sha256").update(content).digest("hex");
  } catch (error) {
    return null;
  }
}

// Calculate hash of an object (for comparison)
function getObjectHash(obj) {
  const content = JSON.stringify(obj, null, 2);
  return crypto.createHash("sha256").update(content).digest("hex");
}

// Load or create manifest
function loadManifest(manifestPath) {
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  } catch {
    return {
      version: "1.0.0",
      lastSync: null,
      sourceHash: null,
      files: {},
    };
  }
}

// Save manifest
function saveManifest(manifestPath, manifest) {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

// Main sync function
async function syncTechniqueData() {
  colorLog("blue", "\n🔄 Starting technique data synchronization...\n");

  const sourcePath = path.join(__dirname, "../../backend/data/techniques.json");
  const apiDir = path.join(__dirname, "../public/api");
  const manifestPath = path.join(apiDir, ".sync-manifest.json");

  // Check if source file exists
  if (!fs.existsSync(sourcePath)) {
    colorLog("red", "❌ Source file not found: " + sourcePath);
    process.exit(1);
  }

  // Load manifest
  const manifest = loadManifest(manifestPath);

  // Check source file hash
  const currentSourceHash = getFileHash(sourcePath);

  if (manifest.sourceHash === currentSourceHash) {
    colorLog("green", "✅ Source data unchanged since last sync");
    colorLog("yellow", `   Last sync: ${manifest.lastSync || "Never"}`);

    // Quick validation of existing files
    let missingFiles = [];
    const expectedFiles = [
      "techniques.json",
      "assurance-goals.json",
      "tags.json",
      "resource-types.json",
      "search-index.json",
      "filter-index.json",
    ];

    expectedFiles.forEach((file) => {
      if (!fs.existsSync(path.join(apiDir, file))) {
        missingFiles.push(file);
      }
    });

    if (missingFiles.length > 0) {
      colorLog("yellow", "\n⚠️  Some generated files are missing:");
      missingFiles.forEach((file) => console.log(`   - ${file}`));
      colorLog("yellow", "\nRegenerating missing files...\n");
    } else {
      colorLog("green", "✅ All generated files are present");
      return;
    }
  } else {
    colorLog(
      "yellow",
      "🔍 Source data has changed, regenerating static API...\n",
    );
  }

  // Run the generator
  try {
    const generateScript = path.join(__dirname, "generateStaticApi.js");
    require(generateScript);

    // Wait a bit for generation to complete (hacky but works for now)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update manifest
    manifest.sourceHash = currentSourceHash;
    manifest.lastSync = new Date().toISOString();
    manifest.files = {};

    // Record generated files
    const generatedFiles = fs
      .readdirSync(apiDir)
      .filter((f) => f.endsWith(".json") && !f.startsWith("."));
    generatedFiles.forEach((file) => {
      const filePath = path.join(apiDir, file);
      manifest.files[file] = {
        hash: getFileHash(filePath),
        size: fs.statSync(filePath).size,
        generated: new Date().toISOString(),
      };
    });

    // Count technique files
    const techniqueFiles = fs
      .readdirSync(path.join(apiDir, "techniques"))
      .filter((f) => f.endsWith(".json"));
    manifest.techniqueCount = techniqueFiles.length;

    saveManifest(manifestPath, manifest);

    colorLog("green", "\n✅ Synchronization complete!");
    colorLog("blue", `   Generated ${generatedFiles.length} API files`);
    colorLog(
      "blue",
      `   Generated ${techniqueFiles.length} individual technique files`,
    );
    colorLog("blue", `   Manifest saved to: ${manifestPath}`);

    // Show summary
    console.log("\n📊 File Summary:");
    Object.entries(manifest.files).forEach(([file, info]) => {
      const sizeKB = (info.size / 1024).toFixed(1);
      console.log(`   - ${file} (${sizeKB} KB)`);
    });
  } catch (error) {
    colorLog("red", "❌ Error during synchronization:");
    console.error(error);
    process.exit(1);
  }
}

// Check if called with --check flag
if (process.argv.includes("--check")) {
  // Check-only mode
  const sourcePath = path.join(__dirname, "../../backend/data/techniques.json");
  const manifestPath = path.join(
    __dirname,
    "../public/api/.sync-manifest.json",
  );

  const manifest = loadManifest(manifestPath);
  const currentSourceHash = getFileHash(sourcePath);

  if (manifest.sourceHash === currentSourceHash) {
    colorLog("green", "✅ Static data is up to date");
    process.exit(0);
  } else {
    colorLog("yellow", "⚠️  Static data is out of sync");
    process.exit(1);
  }
} else {
  // Run sync
  syncTechniqueData().catch((error) => {
    colorLog("red", "💥 Fatal error:");
    console.error(error);
    process.exit(1);
  });
}
