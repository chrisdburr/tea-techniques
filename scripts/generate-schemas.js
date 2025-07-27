#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const rootDir = path.resolve(__dirname, '..');
const schemasDir = path.join(rootDir, 'schemas');

// Create logger
const logger = {
  info: (message) => {
    // biome-ignore lint/suspicious/noConsole: CLI tool needs console output
    console.log(message);
  },
  error: (message) => {
    // biome-ignore lint/suspicious/noConsole: CLI tool needs console output
    console.error(message);
  },
};

async function main() {
  try {
    // Check if schemas directory exists
    try {
      await fs.access(schemasDir);
      logger.info('✓ Schemas directory already exists');
    } catch {
      logger.info('Creating schemas directory...');
      await fs.mkdir(schemasDir, { recursive: true });
      logger.info('✓ Schemas directory created');
    }

    // Check if schemas already exist
    const schemaFiles = [
      'technique.schema.json',
      'assurance-goal.schema.json',
      'tag.schema.json',
      'resource.schema.json',
    ];

    // Check all schema files in parallel
    const schemaChecks = schemaFiles.map((file) =>
      fs
        .access(path.join(schemasDir, file))
        .then(() => true)
        .catch(() => false)
    );

    const results = await Promise.all(schemaChecks);
    const allSchemasExist = results.every((exists) => exists);

    if (allSchemasExist) {
      logger.info('✓ All schemas already exist');
      logger.info('\nNote: This script currently creates schemas manually.');
      logger.info(
        'In the future, it could generate them from TypeScript types.'
      );
    } else {
      logger.error(
        '❌ Some schemas are missing. Please create them manually or check the schemas directory.'
      );
      process.exit(1);
    }

    logger.info('\n✅ Schema generation complete!');
  } catch (error) {
    logger.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
