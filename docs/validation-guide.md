# Data Validation Guide

This guide explains how to use the JSON schema validation system for TEA Techniques data files.

## Overview

The TEA Techniques project uses JSON Schema validation to ensure data quality and consistency across all static data files. This system validates:

- The master techniques data file (`public/data/techniques.json`)
- Individual technique files (`public/data/techniques/*.json`)
- Assurance goals metadata (`public/data/assurance-goals.json`)
- Tags metadata (`public/data/tags.json`)

## Running Validation

### Validate All Data

```bash
pnpm validate
```

This command validates all data files against their respective schemas and provides a summary of results.

### Validate Specific File

```bash
pnpm validate public/data/techniques.json
```

You can validate a specific file by providing its path as an argument.

### Verbose Output

```bash
pnpm validate:verbose
```

Use the verbose flag for more detailed validation output.

## Schema Files

All schemas are located in the `/schemas` directory:

- `technique.schema.json` - Schema for technique objects
- `assurance-goal.schema.json` - Schema for assurance goals
- `tag.schema.json` - Schema for tags
- `resource.schema.json` - Schema for resource references

## Common Validation Errors

### Missing Required Fields

```
✗ public/data/techniques/example.json[0]/name: must have required property 'name'
```

**Solution:** Ensure all required fields are present in the data object.

### Invalid Field Types

```
✗ public/data/techniques.json[5]/complexity_rating: must be integer
```

**Solution:** Check that field values match the expected type in the schema.

### Pattern Violations

```
✗ public/data/techniques.json[2]/slug: must match pattern "^[a-z0-9]+(?:-[a-z0-9]+)*$"
```

**Solution:** Ensure slugs use lowercase letters, numbers, and hyphens only.

### Invalid Enum Values

```
✗ public/data/techniques.json[1]/assurance_goals[0]: must be equal to one of the allowed values
```

**Solution:** Use only the predefined values for enum fields (e.g., the 7 assurance goals).

## VS Code Integration

The project includes VS Code settings that provide:

- IntelliSense for JSON files based on schemas
- Real-time validation while editing
- Auto-completion for enum values
- Hover documentation for fields

To benefit from these features, ensure you have the `.vscode/settings.json` file in your workspace.

## CI/CD Integration

Validation runs automatically in the CI/CD pipeline:

1. On every pull request
2. Before building the static site
3. As part of the quality gates

Failed validation will block deployment to ensure data quality.

## Contributing Data

When contributing new techniques or modifying existing data:

1. Run validation locally before committing: `pnpm validate`
2. Fix any validation errors before creating a pull request
3. The CI will validate your changes automatically

## Schema Updates

If you need to update the schemas:

1. Modify the relevant schema file in `/schemas`
2. Test thoroughly with existing data
3. Update this documentation if needed
4. Consider backwards compatibility for existing data

## Troubleshooting

### "Schemas directory not found"

Run `pnpm generate-schemas` to create the schemas directory and check that all schema files exist.

### "No validation schema found"

Ensure the file path matches one of the patterns in the validation configuration. Check `scripts/validate-data.js` for supported file patterns.

### Performance Issues

For large datasets, validation may take a few seconds. The script validates files in parallel for better performance.