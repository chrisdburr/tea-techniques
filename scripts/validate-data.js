#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'public', 'data');
const schemasDir = path.join(rootDir, 'schemas');

// Initialize AJV with strict mode
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: true,
  validateFormats: true,
  validateSchema: false, // Don't validate schema against meta-schema
});
addFormats(ajv);

// Cache for compiled validators
const validatorCache = new Map();

// Validation configuration
const validationConfig = {
  'techniques.json': {
    schema: 'technique.schema.json',
    isArray: true,
  },
  'assurance-goals.json': {
    schema: 'assurance-goal.schema.json',
    isArray: true,
  },
  'tags.json': {
    schema: 'tag.schema.json',
    isArray: true,
  },
  'techniques/*.json': {
    schema: 'technique.schema.json',
    isArray: false,
  },
};

// Custom logger to handle console usage
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

// Utility functions
function formatError(error, filePath) {
  const instancePath = error.instancePath || '/';
  const message = error.message || 'Unknown error';
  const params = error.params ? ` (${JSON.stringify(error.params)})` : '';

  return chalk.red(`  ✗ ${filePath}${instancePath}: ${message}${params}`);
}

async function loadSchema(schemaName) {
  const schemaPath = path.join(schemasDir, schemaName);
  try {
    const schemaContent = await fs.readFile(schemaPath, 'utf-8');
    return JSON.parse(schemaContent);
  } catch (error) {
    logger.error(
      chalk.red(`Failed to load schema ${schemaName}: ${error.message}`)
    );
    throw error;
  }
}

function validateArrayData(data, validate) {
  const errors = [];
  let valid = true;

  if (!Array.isArray(data)) {
    return {
      valid: false,
      errors: [
        {
          instancePath: '',
          message: 'Data should be an array',
        },
      ],
    };
  }

  for (let i = 0; i < data.length; i++) {
    if (!validate(data[i])) {
      valid = false;
      for (const error of validate.errors || []) {
        errors.push({
          ...error,
          instancePath: `[${i}]${error.instancePath}`,
        });
      }
    }
  }

  return { valid, errors };
}

async function validateFile(filePath, schemaName, isArray = false) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Check cache for compiled validator
    let validate = validatorCache.get(schemaName);
    if (!validate) {
      // Load and compile schema
      const schema = await loadSchema(schemaName);
      validate = ajv.compile(schema);
      validatorCache.set(schemaName, validate);
    }

    // Handle array validation
    if (isArray) {
      const result = validateArrayData(data, validate);
      return { ...result, filePath };
    }

    // Single item validation
    const valid = validate(data);
    return {
      valid,
      errors: valid ? [] : validate.errors || [],
      filePath,
    };
  } catch (error) {
    logger.error(
      chalk.red(`Error in validateFile for ${filePath}: ${error.message}`)
    );
    logger.error(chalk.red(`Stack: ${error.stack}`));
    return {
      valid: false,
      errors: [{ message: `Failed to validate: ${error.message}` }],
      filePath,
    };
  }
}

async function validateGlobPattern(pattern, schemaName, isArray) {
  const basePath = path.join(dataDir, path.dirname(pattern));
  const filePattern = path.basename(pattern);

  try {
    const files = await fs.readdir(basePath);
    const matchingFiles = files.filter((file) => {
      if (filePattern === '*.json') {
        return file.endsWith('.json');
      }
      return file === filePattern;
    });

    // Process files in parallel for better performance
    const validationPromises = matchingFiles.map((file) => {
      const filePath = path.join(basePath, file);
      return validateFile(filePath, schemaName, isArray);
    });

    return Promise.all(validationPromises);
  } catch (error) {
    logger.error(
      chalk.red(`Error reading directory ${basePath}: ${error.message}`)
    );
    return [];
  }
}

function processValidationResults(results, rootPath) {
  let totalErrors = 0;
  let failedFiles = 0;

  for (const result of results) {
    const relativePath = path.relative(rootPath, result.filePath);

    if (result.valid) {
      logger.info(chalk.green(`✓ ${relativePath}`));
    } else {
      failedFiles++;
      logger.info(chalk.red(`✗ ${relativePath}`));
      for (const error of result.errors) {
        totalErrors++;
        logger.info(formatError(error, ''));
      }
      logger.info(''); // Empty line after errors
    }
  }

  return { totalErrors, failedFiles };
}

async function validateAllData() {
  logger.info(chalk.blue('\n📋 Validating TEA Techniques data files...\n'));

  let totalFiles = 0;
  let totalFailedFiles = 0;
  let totalErrorCount = 0;

  // Process all validation configs in parallel where possible
  const validationPromises = [];

  for (const [filePattern, config] of Object.entries(validationConfig)) {
    const isGlob = filePattern.includes('*');

    if (isGlob) {
      validationPromises.push(
        validateGlobPattern(filePattern, config.schema, config.isArray).then(
          (results) => ({ results, filePattern })
        )
      );
    } else {
      const filePath = path.join(dataDir, filePattern);
      validationPromises.push(
        validateFile(filePath, config.schema, config.isArray).then(
          (result) => ({ results: [result], filePattern })
        )
      );
    }
  }

  const allResults = await Promise.all(validationPromises);

  // Process results sequentially to avoid await in loop
  const processPromises = allResults.map(({ results }) => {
    totalFiles += results.length;
    const { totalErrors, failedFiles } = processValidationResults(
      results,
      rootDir
    );
    totalErrorCount += totalErrors;
    totalFailedFiles += failedFiles;
    return Promise.resolve();
  });

  await Promise.all(processPromises);

  // Summary
  logger.info(chalk.blue('\n📊 Validation Summary:'));
  logger.info(`  Total files checked: ${totalFiles}`);
  logger.info(
    `  ${chalk.green(`✓ Valid files: ${totalFiles - totalFailedFiles}`)}`
  );

  if (totalFailedFiles > 0) {
    logger.info(`  ${chalk.red(`✗ Invalid files: ${totalFailedFiles}`)}`);
    logger.info(`  ${chalk.red(`Total errors: ${totalErrorCount}`)}`);
  }

  return totalFailedFiles === 0;
}

// Parse command line arguments
const args = process.argv.slice(2);
const _verbose = args.includes('--verbose'); // Prefixed with _ as it's not used yet
const specificFile = args.find((arg) => !arg.startsWith('--'));

// Main execution
async function main() {
  try {
    // Check if schemas directory exists
    try {
      await fs.access(schemasDir);
    } catch {
      logger.error(
        chalk.red(
          '❌ Schemas directory not found. Please run generate-schemas first.'
        )
      );
      process.exit(1);
    }

    let success;

    if (specificFile) {
      // Validate specific file
      const filePath = path.resolve(specificFile);
      const filePattern = Object.keys(validationConfig).find((pattern) => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace('*', '.*'));
          return regex.test(path.relative(dataDir, filePath));
        }
        return path.join(dataDir, pattern) === filePath;
      });

      if (!filePattern) {
        logger.error(
          chalk.red(`❌ No validation schema found for ${specificFile}`)
        );
        process.exit(1);
      }

      const config = validationConfig[filePattern];
      const result = await validateFile(
        filePath,
        config.schema,
        config.isArray
      );

      if (result.valid) {
        logger.info(chalk.green(`✓ ${specificFile} is valid`));
        success = true;
      } else {
        logger.info(chalk.red(`✗ ${specificFile} is invalid`));
        for (const error of result.errors) {
          logger.info(formatError(error, ''));
        }
        success = false;
      }
    } else {
      // Validate all files
      success = await validateAllData();
    }

    if (success) {
      logger.info(chalk.green('\n✅ All validations passed!'));
      process.exit(0);
    } else {
      logger.info(chalk.red('\n❌ Validation failed!'));
      process.exit(1);
    }
  } catch (error) {
    logger.error(chalk.red(`❌ Unexpected error: ${error}`));
    process.exit(1);
  }
}

main();
