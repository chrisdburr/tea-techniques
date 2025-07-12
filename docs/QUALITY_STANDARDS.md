# TEA Techniques - Quality Assurance Standards

This document establishes non-negotiable quality gates and coverage requirements for the TEA Techniques project. These standards ensure maintainable, reliable, and secure code.

## 🎯 Quality Philosophy

**"Quality is not an act, it is a habit"** - All code must meet these standards before merging.

### Core Principles
1. **Fail Fast**: Catch issues as early as possible in the development cycle
2. **Comprehensive Coverage**: Test the critical paths that matter to users
3. **Security First**: Never compromise on security for convenience
4. **Performance Awareness**: Maintain performance standards as the codebase grows
5. **Accessibility Compliance**: Ensure inclusive user experiences

---

## 🔧 Backend Quality Standards

### Coverage Requirements

#### Minimum Coverage Thresholds
- **Line Coverage**: 90% minimum across all modules
- **Branch Coverage**: 85% minimum (pytest-cov tracks this automatically)
- **Function Coverage**: 95% for public API methods
- **Critical Path Coverage**: 100% for business logic functions

#### Coverage Configuration
```bash
# Run tests with coverage
uv run pytest --cov=api --cov-report=term-missing --cov-report=html

# Coverage fails if below 90%
uv run pytest --cov-fail-under=90
```

#### Exemptions from Coverage
- Migration files (`*/migrations/*`)
- Test files themselves (`*/tests/*`)
- Configuration files (`config/settings/*`)
- Django admin configurations (when justified)
- `__str__` and `__repr__` methods (unless business critical)

### Code Quality Standards

#### Type Checking (mypy)
- **Strictness Level**: Progressive typing approach
- **Required**: All new functions must have type hints
- **Configuration**: Defined in `pyproject.toml`
- **Enforcement**: CI fails on mypy errors

```bash
# Run type checking
uv run mypy api/
```

#### Linting (Ruff)
- **Modern Tool**: Rust-based linter for speed and accuracy
- **Line Length**: Maximum 120 characters
- **Complexity**: Maximum 15 branches per function
- **Configuration**: Django-aware rules in pyproject.toml

```bash
# Run linting
uv run ruff check api/
```

#### Code Formatting
- **Tool**: Ruff (automatic formatting and import sorting)
- **Line Length**: 120 characters (consistent with linting)
- **Import Sorting**: Built into Ruff for consistent organization

```bash
# Format code
uv run ruff format api/
```

### Testing Standards

#### Test Organization
```
api/tests/
├── unit/           # 60% of tests - Pure unit tests
├── integration/    # 30% of tests - Database integration
├── api/           # 10% of tests - Full HTTP testing
├── fixtures/       # Test data
├── factories/      # Model factories
└── utils/          # Test utilities
```

#### Test Quality Requirements
- **Isolation**: Each test must be independent and repeatable
- **Realistic Data**: Use domain-specific test data (TEA techniques, goals)
- **Performance**: Individual tests must complete under 1 second
- **Clarity**: Test names must clearly describe what is being tested

#### Prohibited Testing Patterns
- **No Mocking Database**: Use real database interactions in integration tests
- **No Overmocking**: Mock only external services, not internal code
- **No Flaky Tests**: Tests must pass consistently 100% of the time
- **No Skipped Tests**: All tests must run in CI (mark slow tests, don't skip)

### Security Standards

#### Django Security
- **SECRET_KEY**: Must be environment variable, never hardcoded
- **DEBUG**: Must be False in production
- **ALLOWED_HOSTS**: Properly configured for deployment environment
- **HTTPS**: Enforce HTTPS in production settings

#### Dependency Security
- **Vulnerability Scanning**: All dependencies scanned for known vulnerabilities
- **Regular Updates**: Security updates applied within 48 hours
- **License Compliance**: All dependencies must have compatible licenses

#### Data Protection
- **Sensitive Data**: No sensitive data in logs or error messages
- **Input Validation**: All user inputs validated and sanitized
- **SQL Injection**: Use Django ORM, no raw SQL without justification

---

## 🎨 Frontend Quality Standards

### Coverage Requirements

#### Component Coverage Thresholds
- **Line Coverage**: 85% minimum for all components
- **Branch Coverage**: 80% minimum for conditional logic
- **Function Coverage**: 90% for event handlers and methods
- **User Interaction Coverage**: 100% of interactive elements tested

#### Coverage Configuration (Vitest)
```json
{
  "coverage": {
    "thresholds": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 85,
        "statements": 85
      }
    }
  }
}
```

#### Exemptions from Coverage
- Next.js generated files (`layout.tsx`, `globals.css`)
- Type definition files (`*.d.ts`)
- Storybook configuration files
- Build and configuration files

### Code Quality Standards

#### TypeScript Standards
- **Strictness**: `strict: true` in tsconfig.json
- **No Any**: Avoid `any` type, use proper typing
- **Type Coverage**: 95% of code should be properly typed
- **Enforcement**: CI fails on TypeScript errors

```bash
# Type checking
pnpm type-check
```

#### Linting (ESLint)
- **Configuration**: Next.js recommended + custom rules
- **Accessibility**: eslint-plugin-jsx-a11y for accessibility compliance
- **React Hooks**: Proper hooks dependency arrays
- **Performance**: Prevent common React performance issues

```bash
# Run linting
pnpm lint
```

#### Code Formatting (Prettier)
- **Automatic Formatting**: Enforced in pre-commit hooks
- **Configuration**: Consistent with backend line length (120 chars)
- **Import Organization**: Automatic import sorting

### Testing Standards

#### Test Organization
```
src/tests/
├── components/     # Component unit tests
├── integration/    # Page and feature integration tests
├── fixtures/       # Realistic test data
├── utils/          # Test utilities and helpers
└── e2e/           # End-to-end tests (Playwright)
```

#### Component Testing Requirements
- **User-Centric**: Test from user perspective, not implementation details
- **Accessibility**: Every interactive component tested with jest-axe
- **Real Interactions**: Use user-event for realistic interactions
- **Error States**: Test loading, error, and empty states

#### API Integration Testing
- **Minimal Mocking**: Direct API testing where possible
- **Realistic Responses**: Use actual API response shapes
- **Error Handling**: Test network failures and API errors
- **Performance**: Monitor API response times

### Accessibility Standards

#### WCAG Compliance
- **Level**: WCAG 2.1 AA compliance minimum
- **Testing**: Automated testing with jest-axe
- **Manual Testing**: Keyboard navigation and screen reader testing
- **Tools**: axe-core for comprehensive accessibility checking

#### Required Accessibility Features
- **Keyboard Navigation**: All interactive elements keyboard accessible
- **Screen Reader**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 ratio for normal text
- **Focus Management**: Visible focus indicators and logical tab order

```javascript
// Example accessibility test
it('meets WCAG accessibility standards', async () => {
  const renderResult = renderWithProviders(<Component />)
  await testAccessibility(renderResult)
})
```

### Performance Standards

#### Runtime Performance
- **Component Rendering**: Individual components render under 50ms
- **Page Load**: Initial page load under 3 seconds
- **Bundle Size**: JavaScript bundles optimized and code-split
- **Lighthouse**: Performance score above 90

#### Build Performance
- **Test Execution**: 90% of tests complete under 5 seconds
- **Type Checking**: Complete type check under 30 seconds
- **Build Time**: Production build under 5 minutes

---

## 🚀 CI/CD Quality Gates

### Pre-Commit Requirements
Every commit must pass these checks locally:

#### Backend Pre-Commit
```bash
# Type checking
uv run mypy api/

# Linting
uv run ruff check api/

# Code formatting
uv run ruff format --check api/

# Security scanning
uv run bandit -r api/

# Tests with coverage
uv run pytest --cov=api --cov-fail-under=90
```

#### Frontend Pre-Commit
```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Tests with coverage
pnpm test:coverage

# Build verification
pnpm build
```

### CI Pipeline Quality Gates

#### Stage 1: Static Analysis (< 2 minutes)
- **Code Formatting**: Ruff, Prettier verification
- **Linting**: Ruff, ESLint with zero warnings
- **Type Checking**: mypy, TypeScript strict mode
- **Security Scanning**: bandit, npm audit
- **Dependency Vulnerability**: Check for known vulnerabilities

#### Stage 2: Unit Testing (< 5 minutes)
- **Backend Unit Tests**: pytest with coverage reporting
- **Frontend Component Tests**: Vitest with coverage reporting
- **Performance Benchmarks**: Ensure no regression
- **Test Quality**: No flaky tests, proper isolation

#### Stage 3: Integration Testing (< 8 minutes)
- **Backend Integration**: Database operations, command testing
- **Frontend Integration**: Page-level functionality
- **API Integration**: End-to-end API testing
- **Cross-Service**: Backend + Frontend integration

#### Stage 4: End-to-End Testing (< 10 minutes)
- **Critical Paths**: Core user journeys
- **Cross-Browser**: Chrome, Firefox, Safari
- **Accessibility**: Automated WCAG compliance
- **Performance**: Lighthouse CI performance audit

#### Stage 5: Security & Performance (< 3 minutes)
- **Security Audit**: Comprehensive security scanning
- **Performance Regression**: Bundle size, response times
- **Database Performance**: Query optimization validation

### Deployment Gates

#### Production Deployment Requirements
- **All Tests Pass**: 100% test pass rate required
- **Coverage Maintained**: No coverage regression allowed
- **Security Clear**: No high or critical vulnerabilities
- **Performance Verified**: No significant performance regression
- **Documentation Updated**: CHANGELOG.md updated for user-facing changes

#### Rollback Triggers
- **Test Failures**: Any test failure triggers automatic rollback
- **Performance Degradation**: >20% response time increase
- **Error Rate Spike**: >1% error rate increase
- **Security Alert**: Any security vulnerability discovered

---

## 📊 Quality Monitoring

### Metrics Dashboard

#### Test Health Metrics
- **Test Pass Rate**: Target 100%, alert if <99%
- **Test Execution Time**: Track and optimize slow tests
- **Coverage Trends**: Monitor coverage over time
- **Flaky Test Detection**: Identify and fix unstable tests

#### Code Quality Metrics
- **Technical Debt**: Track linting violations and complexity
- **Type Coverage**: Monitor TypeScript adoption
- **Dependency Health**: Track outdated and vulnerable dependencies
- **Code Churn**: Monitor files with frequent changes

#### Performance Metrics
- **Build Times**: CI pipeline efficiency
- **Bundle Sizes**: Frontend performance impact
- **API Response Times**: Backend performance monitoring
- **Database Query Performance**: Optimize slow queries

### Quality Reports

#### Weekly Quality Report
- Coverage trends and gaps
- Security vulnerability status
- Performance regression analysis
- Test health and flaky test identification

#### Release Quality Report
- Test execution summary
- Coverage differential from previous release
- Performance benchmark comparison
- Security audit results

---

## 🎯 Quality Enforcement

### Automated Enforcement

#### Pre-Commit Hooks
```bash
# Install pre-commit hooks
pre-commit install

# Hooks include:
# - Code formatting (black, prettier)
# - Linting (pylint, eslint)
# - Type checking (mypy, tsc)
# - Basic security checks
```

#### Branch Protection Rules
- **Required Reviews**: Minimum 1 reviewer for all PRs
- **Status Checks**: All CI checks must pass
- **No Direct Pushes**: Main branch protected, changes via PR only
- **Up-to-Date Branches**: Require branches to be up-to-date before merge

#### Automated Quality Checks
- **Coverage Enforcement**: PRs fail if coverage decreases
- **Performance Regression**: Alert on significant performance changes
- **Security Scanning**: Block PRs with security vulnerabilities using Safety
- **Accessibility Compliance**: Require a11y tests for UI changes

### Manual Quality Reviews

#### Code Review Standards
- **Test Coverage**: Reviewer verifies adequate test coverage
- **Performance Impact**: Assess performance implications
- **Security Review**: Check for security best practices
- **Accessibility Review**: Verify a11y compliance for UI changes
- **Documentation**: Ensure code is well-documented

#### Definition of Done
A feature is not complete until:
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] Integration tests cover critical paths
- [ ] Code coverage thresholds maintained
- [ ] Accessibility requirements verified
- [ ] Performance impact assessed
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Manual testing completed
- [ ] Code review approved

---

## 🔧 Quality Tools Configuration

### Local Development Setup

#### Backend Quality Tools
```bash
# Install quality tools
uv sync

# Set up pre-commit hooks
pre-commit install

# Run all quality checks
uv run ruff check api/ && uv run ruff format --check api/ && uv run mypy api/ && uv run pytest --cov=api --cov-fail-under=90
```

#### Frontend Quality Tools
```bash
# Install dependencies
pnpm install

# Run all quality checks
pnpm quality-check  # Custom script for all checks
```

### IDE Configuration

#### VS Code Settings (`.vscode/settings.json`)
- **Auto-format on save**: Black, Prettier
- **Linting**: Real-time pylint, ESLint feedback
- **Type Checking**: Real-time mypy, TypeScript errors
- **Test Integration**: Run tests directly from IDE

#### Recommended Extensions
- **Backend**: Python, Pylance, Python Test Explorer
- **Frontend**: TypeScript, ESLint, Prettier, Jest Test Explorer
- **General**: GitLens, Better Comments, Code Coverage

---

## 📋 Quality Checklist

### Before Creating PR
- [ ] All tests pass locally
- [ ] Code coverage requirements met
- [ ] No linting errors or warnings
- [ ] Type checking passes
- [ ] Security scan clean
- [ ] Performance benchmarks acceptable
- [ ] Accessibility tests pass (for UI changes)
- [ ] Documentation updated if needed

### Before Merging PR
- [ ] All CI checks pass
- [ ] Code review approved
- [ ] No merge conflicts
- [ ] Branch up-to-date with main
- [ ] Release notes updated (if applicable)

### Before Production Deployment
- [ ] All quality gates passed
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Database migration plan verified (if applicable)
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

---

This document serves as the definitive guide for quality standards in the TEA Techniques project. These standards are non-negotiable and must be maintained as the project evolves.