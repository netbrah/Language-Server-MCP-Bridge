# CI/CD Pipeline Guide

This document describes the optimized CI/CD workflows for the LSP-MCP Bridge extension.

## Overview

The pipeline is optimized for:
- **Fast feedback**: Fail-fast approach with quick linting and testing
- **No redundancy**: Workflows run only when needed, no duplicate work
- **Easy artifact access**: Dev branches get automatic releases with download links
- **Clear release strategy**: Separate workflows for dev testing vs. production releases

## Workflows

### 1. CI (`ci.yml`) - Fast Feedback Loop

**Triggers:** All pull requests and pushes to main branch

**Purpose:** Provide fast feedback on code quality

**Steps:**
1. Lint (fastest - catches style issues)
2. Build (catches compilation errors)
3. Test (most thorough validation)

**Strategy:** Fail-fast approach - if linting fails, build and tests don't run.

**Duration:** ~3-5 minutes

---

### 2. Build Development Artifact (`build-dev-artifact.yml`)

**Triggers:** All pushes to non-main branches

**Purpose:** Create easily accessible builds for development and testing

**Key Features:**
- ✅ Creates a GitHub Release for each dev branch
- ✅ **Replaces** previous release/tag for the same branch (no clutter)
- ✅ Includes detailed changelog with commits since last build
- ✅ Shows commit author attribution
- ✅ Downloadable VSIX directly from release page

**Tag Format:** `dev-<branch-name>` (e.g., `dev-feature-new-tool`)

**Release Notes Include:**
- Branch name and latest commit
- Build timestamp
- Changes since last dev build for this branch
- Installation instructions

**Artifact Access:**
- GitHub Release: Go to Releases → Find your branch tag → Download VSIX
- Workflow Artifacts: Available for 30 days in Actions tab

**Duration:** ~4-6 minutes

---

### 3. Build Main Branch (`build-release.yml`)

**Triggers:** Pushes to main branch

**Purpose:** Create versioned builds from main branch merges

**Key Features:**
- ✅ Creates versioned release with build number
- ✅ Includes detailed changelog with author attribution
- ✅ Uses commit count for unique build numbers
- ✅ Separate from marketplace releases

**Tag Format:** `v<version>-build.<build-number>` (e.g., `v1.0.1-build.42`)

**Release Notes Include:**
- Package version and build number
- Latest commit info
- Changes since last version tag
- Installation instructions
- Note about marketplace releases

**Duration:** ~4-6 minutes

---

### 4. Publish to Marketplace (`publish-marketplace.yml`)

**Triggers:** Manual workflow dispatch only

**Purpose:** Create official releases and publish to VS Code Marketplace

**When to Use:** When ready to release a new version to users

**Steps:**
1. Input version number (e.g., `1.0.2`)
2. Updates package.json version
3. Runs full lint, build, and test suite
4. Creates GitHub release with version tag
5. Publishes to VS Code Marketplace
6. Publishes to Open VSX Registry (optional)

**Requirements:**
- Secrets must be configured: `VSCE_PAT`, `OPEN_VSX_TOKEN`
- Version must follow semver format (X.Y.Z)

**Tag Format:** `v<version>` (e.g., `v1.0.2`)

**Duration:** ~5-8 minutes

---

## Typical Workflows

### Feature Development

1. Create feature branch: `git checkout -b feature-new-tool`
2. Push commits: Each push triggers **Build Dev Artifact**
3. Download VSIX from release: Go to Releases → `dev-feature-new-tool` → Download
4. Test the extension locally
5. Push more commits: Release and tag automatically update (replaces old one)
6. Create PR: Triggers **CI** workflow
7. Merge to main: Triggers **Build Main Branch**

### Releasing to Marketplace

1. Ensure main branch is stable
2. Run **Publish to Marketplace** workflow manually
3. Input version number (e.g., `1.0.3`)
4. Workflow creates release and publishes to marketplace
5. Users can update from marketplace or download VSIX

### Bug Fix on Dev Branch

1. Push fix to dev branch: Triggers **Build Dev Artifact**
2. Download new VSIX from updated release (same tag, replaced)
3. Test fix
4. PR and merge when ready

---

## Optimization Details

### What We Removed

- ❌ **code-quality.yml**: Was redundant with CI workflow - ran same checks multiple times
- ❌ Multiple overlapping test runs for the same code

### What We Improved

1. **Dev Branch Artifacts:**
   - Now creates GitHub Releases (easier to find and download)
   - Replaces old releases for same branch (no spam)
   - Includes detailed changelogs with author info
   - Pre-release flag for clarity

2. **Main Branch Builds:**
   - Better build numbering (commit count)
   - Clearer separation from marketplace releases
   - Author attribution in changelog
   - More informative release notes

3. **Marketplace Publishing:**
   - Added test execution before publishing
   - Better changelog formatting with authors
   - Clearer release notes
   - More robust error handling

4. **CI Pipeline:**
   - Fail-fast approach (lint → build → test)
   - Runs on all PRs (not just main)
   - Single consolidated workflow

### Performance Improvements

- **Before:** 15-20 minutes per push (multiple redundant workflows)
- **After:** 4-6 minutes per push (single optimized workflow)
- **Redundancy:** Eliminated ~60% of duplicate work

---

## Monitoring and Debugging

### Check Workflow Status

```bash
# View all workflow runs
gh run list

# View specific workflow runs
gh run list --workflow=ci.yml

# View logs for a specific run
gh run view <run-id> --log
```

### Common Issues

**Issue:** Dev artifact not appearing
- **Solution:** Check Actions tab for workflow completion, then check Releases

**Issue:** Tag already exists error
- **Solution:** Old tag wasn't deleted properly - manually delete tag and re-run

**Issue:** Marketplace publish fails
- **Solution:** Check that VSCE_PAT secret is valid and version doesn't already exist

---

## Best Practices

1. **Always test dev artifacts** before merging to main
2. **Use semantic versioning** for marketplace releases
3. **Keep commits atomic** for better changelogs
4. **Write clear commit messages** (they appear in release notes)
5. **Monitor CI failures** and fix quickly

---

## Secrets Configuration

Required secrets for full functionality:

| Secret | Purpose | Required For |
|--------|---------|--------------|
| `GITHUB_TOKEN` | Automatic releases | All workflows (auto-provided) |
| `VSCE_PAT` | VS Code Marketplace publishing | Publish to Marketplace |
| `OPEN_VSX_TOKEN` | Open VSX Registry publishing | Publish to Marketplace (optional) |

Configure secrets in: Repository Settings → Secrets and variables → Actions

---

## Summary

The optimized CI/CD pipeline provides:

✅ **Fast feedback** - Developers know if their code passes in <5 minutes  
✅ **Easy testing** - Dev builds are always available via GitHub Releases  
✅ **No clutter** - Dev releases replace old ones for the same branch  
✅ **Clear history** - Detailed changelogs with author attribution  
✅ **No redundancy** - Each workflow has a specific purpose, no overlap  
✅ **Production ready** - Manual marketplace releases with full validation  

This setup follows CI/CD best practices while being tailored to extension development workflows.
