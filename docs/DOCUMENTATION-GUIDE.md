# Documentation Guide

> [!NOTE] Overview
> This guide explains how to manage and maintain documentation for the TEA Techniques project. Keeping documentation in sync with code is essential for project clarity and developer onboarding.

## Documentation Structure

The project documentation is organized in the `docs/` directory as Markdown files:

```
docs/
├── API-GUIDE.md          - API endpoints, authentication, parameters
├── DATA-MANAGEMENT.md    - Data import/export procedures
├── DEPLOYMENT.md         - Deployment options and environments
├── DEVELOPMENT-WORKFLOW.md - Local development setup and workflow
├── DOCUMENTATION-GUIDE.md - How to maintain documentation (this file)
├── FRONTEND-GUIDE.md     - Frontend architecture and components
├── FUTURE-ROADMAP.md     - Planned future improvements
├── GLOSSARY.md           - Terminology and definitions
├── MODEL-ARCHITECTURE.md - Database models and relationships
├── TAILSCALE-DEPLOYMENT.md - Tailscale-specific deployment
├── TESTING.md            - Testing procedures and tools
└── USER-GUIDE.md         - End-user documentation
```

## When to Update Documentation

Documentation should be updated in the following situations:

1. **Code Changes**: When modifying code that affects behavior described in documentation
2. **API Changes**: When adding, modifying, or removing API endpoints
3. **Model Changes**: When changing model fields, validators, or relationships
4. **Process Changes**: When changing development, deployment, or testing procedures
5. **Bug Fixes**: When fixing bugs that were caused by incorrect documentation

## Documentation Update Process

### 1. Identify Affected Documentation

When making code changes, first identify which documentation files might need updating:

- **API changes** → Update `API-GUIDE.md`
- **Model changes** → Update `MODEL-ARCHITECTURE.md`
- **Frontend component changes** → Update `FRONTEND-GUIDE.md`
- **Environment or deployment changes** → Update `DEPLOYMENT.md` and/or `TAILSCALE-DEPLOYMENT.md`
- **Development workflow changes** → Update `DEVELOPMENT-WORKFLOW.md`
- **Testing changes** → Update `TESTING.md`

### 2. Update Documentation as Part of the Same PR

Documentation updates should be included in the same pull request as the code changes:

1. Make the code changes
2. Update relevant documentation to reflect those changes
3. Include both in the same pull request

This ensures documentation and code stay synchronized.

### 3. Documentation Review Checklist

When reviewing a PR that includes documentation changes, check for:

- **Accuracy**: Does the documentation correctly describe the current implementation?
- **Completeness**: Are all relevant aspects of the change documented?
- **Consistency**: Does the documentation use consistent terminology and formatting?
- **Clarity**: Is the documentation clear and understandable?
- **Examples**: Are examples up-to-date and correct?

### 4. Documentation-Only Changes

For documentation-only changes (fixing typos, clarifying existing functionality):

1. Create a documentation-specific branch (e.g., `docs/update-api-examples`)
2. Make the documentation changes
3. Submit a PR with a clear title indicating it's a documentation update

## Documentation Style Guide

### Markdown Standards

- Use standard GitHub-flavored Markdown
- Use level-1 (`#`) for document titles
- Use level-2 (`##`) for major sections
- Use level-3 (`###`) for subsections
- Use backticks for code, commands, and file paths
- Use code blocks with language syntax highlighting
- Use numbered lists for sequential steps
- Use bullet points for non-sequential items

### Note Blocks

Use GitHub-compatible note blocks for important information:

```markdown
> [!NOTE]
> This is a standard note with important information.

> [!TIP]
> This is a helpful tip or suggestion.

> [!IMPORTANT]
> This is crucial information that requires attention.

> [!WARNING]
> This warns about potential problems or risks.
```

### Code Examples

Include both command examples and expected outputs:

```markdown
```bash
docker-compose -f docker-compose.development.yml exec backend python manage.py migrate
```

Expected output:
```
Operations to perform:
  Apply all migrations: admin, api, auth, contenttypes, sessions
Running migrations:
  ...
```
```

### API Documentation

For API endpoints, include:

1. URL pattern
2. HTTP methods
3. Request parameters
4. Response format
5. Authentication requirements
6. Example requests and responses

## Keeping Documentation in Sync

### Regular Documentation Review

Schedule periodic reviews of documentation (at least quarterly) to ensure it remains accurate:

1. Review all documentation files
2. Test described procedures 
3. Update as needed

### Automation

For certain types of documentation, consider implementing automation:

- **API Documentation**: Use tools like Swagger or drf-yasg to auto-generate API docs
- **Model Diagrams**: Use tools to generate ERD diagrams from the current models

## Common Documentation Issues

### 1. Outdated Examples

Symptoms:
- Examples don't work when followed exactly
- Examples reference files, paths, or features that don't exist

Solution:
- Verify all examples work exactly as written
- Update examples when related code changes

### 2. Inconsistent Terminology

Symptoms:
- Same concept described with different terms in different docs
- Confusion about what specific terms mean

Solution:
- Maintain the `GLOSSARY.md` file
- Use consistent terminology across all documentation
- Reference official Django/React terminology when applicable

### A Note on Documentation Debt

Documentation debt is similar to technical debt - when documentation falls out of sync with implementation, it creates confusion and problems. Prioritize keeping documentation current to avoid this.

## Related Links

- [Contributing Guide](../CONTRIBUTING.md) - Developer contribution guidelines
- [GitHub Markdown Guide](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax) - Reference for Markdown syntax