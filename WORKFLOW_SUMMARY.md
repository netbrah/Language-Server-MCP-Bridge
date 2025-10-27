# GitHub Workflows Summary

This document describes the GitHub Actions workflows configured for this repository.

## Workflows

### 1. `ci.yml` (Existing)
**Trigger**: Push to main, PRs to main

**Jobs**:
- Test: Lint, build, and test the extension

**Purpose**: Basic CI for main branch integration

---

### 2. `code-quality.yml` (New)
**Trigger**: Push to any branch, PRs to any branch

**Jobs**:
1. **lint** - Run ESLint on source code
2. **build** - Compile TypeScript and build production package
3. **test** - Compile and run test suite
4. **type-check** - Run TypeScript type checking without emitting files
5. **validate-package** - Validate package.json and check for vulnerabilities
6. **all-checks-pass** - Aggregate job that ensures all checks passed

**Purpose**: Comprehensive code quality checks on every commit

**Features**:
- Runs on all branches and PRs
- Multiple independent quality checks
- Validates package.json structure
- Security vulnerability scanning
- Final status aggregation

---

### 3. `copilot-setup-steps.yml` (New)
**Trigger**: Manual (workflow_dispatch)

**Jobs**:
1. **setup-validation**
   - Validate package.json configuration for Copilot
   - Check enabledApiProposals includes languageModelToolsForAgent
   - Verify all 10 LSP tools are registered
   - Validate VS Code API version compatibility
   - Check required source files exist
   - Verify tool registration code
   - Run test suite
   - Generate setup summary

2. **documentation**
   - Create comprehensive setup guide (COPILOT_SETUP.md)
   - Upload setup guide as artifact
   - Display setup instructions

**Purpose**: Validate and document GitHub Copilot integration

**Features**:
- Manual trigger for validation
- Comprehensive integration checks
- Generates setup documentation
- Provides step-by-step setup instructions
- Can optionally run full test suite

---

### 4. `release.yml` (Existing)
**Trigger**: Release creation

**Jobs**:
- Publish: Build and publish to VS Code Marketplace and Open VSX

**Purpose**: Automated release to extension marketplaces

---

## Workflow Dependencies

```
code-quality.yml (Every commit)
├── lint
├── build
├── test
├── type-check
├── validate-package
└── all-checks-pass (requires all above)

ci.yml (Main branch only)
└── test (lint + build + test)

copilot-setup-steps.yml (Manual)
├── setup-validation
└── documentation

release.yml (On release)
└── publish
```

## CI/CD Pipeline

### On Every Commit (Any Branch)
1. `code-quality.yml` runs automatically
   - Ensures code quality
   - Runs all tests
   - Validates TypeScript types
   - Checks for vulnerabilities

### On Main Branch
1. `ci.yml` runs for integration testing
2. If release is created, `release.yml` publishes to marketplace

### Manual Validation
1. `copilot-setup-steps.yml` can be triggered to:
   - Verify Copilot integration
   - Generate setup documentation
   - Validate tool registration

## Status Badges

You can add these badges to README.md:

```markdown
![CI](https://github.com/netbrah/Language-Server-MCP-Bridge/workflows/CI/badge.svg)
![Code Quality](https://github.com/netbrah/Language-Server-MCP-Bridge/workflows/Code%20Quality%20Check/badge.svg)
```

## Running Workflows Locally

### Simulate code-quality.yml
```bash
npm ci
npm run lint
npm run compile
npm run package
npm run compile-tests
npm test
npx tsc --noEmit
```

### Simulate copilot-setup-steps.yml validation
```bash
# Check for languageModelToolsForAgent
grep -q "languageModelToolsForAgent" package.json && echo "✅ API enabled"

# Count tools
grep -c "\"name\": \"lsp_" package.json

# Run tests
npm test
```

## Maintenance

- Workflows are defined in `.github/workflows/`
- All workflows use Node.js 20
- Dependencies are cached for faster runs
- Use `npm ci` for reproducible builds
- Artifacts are retained for 30 days
