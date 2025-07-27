# Contributing Guide

## Overview

Thank you for your interest in contributing to the TEA Techniques project! This guide will help you understand the contribution workflow and ensure your contributions are aligned with the project's standards.

## Getting Started

### Prerequisites

Before you begin, please ensure you have:

1. Read the [README.md](README.md) for a project overview
2. Set up your development environment as described in [DEVELOPMENT-WORKFLOW.md](docs/DEVELOPMENT-WORKFLOW.md)
3. Familiarised yourself with the [Model Architecture](docs/MODEL-ARCHITECTURE.md) and [Frontend Guide](docs/FRONTEND-GUIDE.md)

### Code of Conduct

This project adheres to a code of conduct that promotes a welcoming and inclusive environment. By participating, you are expected to uphold this code.

## Contribution Workflow

### 1. Issue Selection

All contributions should start with an issue:

- Check existing [issues](https://github.com/chrisdburr/tea-techniques/issues) for something you'd like to work on
- If your idea isn't covered by an existing issue, create a new one
- If the issue already exists, please comment on the issue to express your interest in working on it
- Please wait for the project maintainers to respond and assign the issue to you

### 2. Branching Strategy

Once an issue is assigned to you:

1. Create a new branch from `main` with a descriptive name:

   ```bash
   git checkout -b feature/descriptive-name
   # or
   git checkout -b fix/descriptive-name
   ```

2. Use the following branch naming convention:
   - `feature/` - For new features or enhancements
   - `fix/` - For bug fixes
   - `docs/` - For documentation changes
   - `refactor/` - For code refactoring
   - `test/` - For adding or modifying tests

### 3. Development Guidelines

#### Backend (Django)

- Follow the [Django Style Guide](https://docs.djangoproject.com/en/dev/internals/contributing/writing-code/coding-style/)
- Use PascalCase for class names, snake_case for variables and functions
- Write tests for all new functionality
- Document API endpoints and models

#### Frontend (Next.js)

- Follow [TypeScript best practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- Use Functional Components with Hooks
- Use TypeScript interfaces from `src/lib/types.ts`
- Follow the component structure in `FRONTEND-GUIDE.md`
- Ensure responsive design

#### General Guidelines

- Keep commits small and focused
- Write clear commit messages
- Document complex logic
- Follow existing patterns in the codebase

### 4. Testing

All code changes should include appropriate tests:

#### Backend Tests

```bash
cd backend
uv run pytest
```

#### Frontend Tests

```bash
cd frontend
npm run test
```

### 5. Pull Request Process

When your changes are ready:

1. Ensure all tests pass
2. Update documentation as needed
3. Push your branch to your fork
4. Create a pull request to the `main` branch of the main repository
5. Provide a clear PR description explaining:
   - What the PR does
   - How to test the changes
   - Screenshots (for UI changes)
   - Related issues

Example PR template:

```markdown
## Description

Brief description of the changes

## Related Issue

Fixes #123

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## How to Test

1. Steps to test
2. Expected result

## Screenshots (if appropriate)

## Additional Notes

Any additional information
```

### 6. Code Review

All PRs require review before merging:

- Address all review comments
- Keep discussions constructive and focused on the code
- Be open to feedback and willing to make changes

### 7. Merging

Once approved, a maintainer will merge your PR. The typical merge strategy is squash and merge to keep the commit history clean.

## Data Contributions

To contribute new techniques or update existing ones:

1. Review the [Data Management Guide](docs/DATA-MANAGEMENT.md)
2. Follow the schema defined in the JSON templates
3. Submit a PR with your changes to the data files

## Documentation Contributions

Documentation improvements are highly valued:

1. Ensure information is accurate and clear
2. Follow the existing documentation structure
3. Include links to related documentation where helpful
4. Update screenshots if UI changes are significant

## Issue Reporting

If you find a bug or have a feature request:

1. Check if it's already reported
2. Use the issue template
3. Include as much detail as possible:
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots if applicable
   - Environment details

## Getting Help

If you need help with your contribution:

- Comment on the relevant issue
- Reach out to maintainers
- Join community discussions

## Recognition

All contributors will be acknowledged in the project.

<!-- TODO: Add all-contributors support. -->

## Related Links

- [Model Architecture](docs/MODEL-ARCHITECTURE.md)
- [Frontend Guide](docs/FRONTEND-GUIDE.md)
- [Testing Guide](docs/TESTING.md)
- [Data Management Guide](docs/DATA-MANAGEMENT.md)
