# CI/CD Workflow Diagram

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                            │
│                   netbrah/Language-Server-MCP-Bridge                │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
         ┌──────────────────┐          ┌──────────────────┐
         │  Push to Branch  │          │   Pull Request   │
         └──────────────────┘          └──────────────────┘
                    │                             │
                    │                             │
         ┌──────────┴──────────┐                 │
         │                     │                 │
         ▼                     ▼                 ▼
    ┌─────────┐          ┌─────────┐       ┌─────────┐
    │  main   │          │   dev   │       │  Any PR │
    │ branch  │          │ branch  │       │         │
    └─────────┘          └─────────┘       └─────────┘
         │                     │                 │
         │                     │                 │
         ▼                     ▼                 ▼
    ┌─────────┐          ┌─────────┐       ┌─────────┐
    │  ci.yml │          │  ci.yml │       │  ci.yml │
    │         │          │         │       │         │
    │ Lint    │          │ Lint    │       │ Lint    │
    │ Build   │          │ Build   │       │ Build   │
    │ Test    │          │ Test    │       │ Test    │
    └─────────┘          └─────────┘       └─────────┘
         │                     │
         │                     │
         ▼                     ▼
    ┌─────────┐          ┌──────────────┐
    │ build-  │          │   build-dev- │
    │ release.│          │   artifact.  │
    │   yml   │          │      yml     │
    │         │          │              │
    │ Package │          │   Package    │
    │ Release │          │   Release    │
    │ Upload  │          │ Replace Tag  │
    └─────────┘          │   Upload     │
         │               └──────────────┘
         │                     │
         ▼                     ▼
    ┌─────────┐          ┌──────────────┐
    │ v1.0.1- │          │ dev-feature- │
    │ build.42│          │   new-tool   │
    │         │          │              │
    │ + VSIX  │          │   + VSIX     │
    └─────────┘          │ (Pre-release)│
                         └──────────────┘
```

## Manual Release Flow

```
┌──────────────────────────────────────────────────────────┐
│           Maintainer Action Required                     │
│                                                          │
│   Repository → Actions → Publish to Marketplace         │
│                                                          │
│   Input: Version number (e.g., 1.0.2)                  │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  publish-marketplace│
              │        .yml         │
              │                     │
              │  Update version     │
              │  Lint              │
              │  Build             │
              │  Test              │
              │  Package           │
              │  Create Release    │
              │  Publish → Marketplace│
              └─────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │     v1.0.2          │
              │                     │
              │  + VSIX            │
              │  + Marketplace     │
              │  + Open VSX        │
              └─────────────────────┘
```

## Workflow Triggers

| Workflow | Trigger | Frequency | Duration |
|----------|---------|-----------|----------|
| **ci.yml** | Push to any branch, All PRs | Very High | 4-6 min |
| **build-dev-artifact.yml** | Push to non-main branches | High | 4-6 min |
| **build-release.yml** | Push to main branch | Medium | 4-6 min |
| **publish-marketplace.yml** | Manual dispatch | Low | 5-8 min |

## Tag/Release Strategy

### Dev Branches
```
Branch: feature-new-tool
  └─→ Tag: dev-feature-new-tool (replaced on each push)
      └─→ Release: 🚧 Dev Build: feature-new-tool (pre-release)
          └─→ Asset: lsp-mcp-bridge-dev.vsix
```

### Main Branch
```
Branch: main
  └─→ Tag: v1.0.1-build.42 (unique for each push)
      └─→ Release: Main Build v1.0.1-build.42
          └─→ Asset: lsp-mcp-bridge.vsix
```

### Marketplace Release
```
Manual: Dispatch with version input
  └─→ Tag: v1.0.2 (semver, unique)
      └─→ Release: Release v1.0.2
          ├─→ Asset: lsp-mcp-bridge.vsix
          ├─→ VS Code Marketplace: Published
          └─→ Open VSX Registry: Published
```

## Fail-Fast Pipeline

Each workflow follows the fail-fast principle:

```
┌──────┐     ┌───────┐     ┌──────┐
│ Lint │ ──> │ Build │ ──> │ Test │
└──────┘     └───────┘     └──────┘
   ↓            ↓              ↓
   ✗            ✗              ✗
   │            │              │
   └────────────┴──────────────┘
                │
                ▼
           Stop Pipeline
```

If lint fails → Build and Test don't run (saves time)
If build fails → Test doesn't run (saves time)

## Artifact Availability

### Workflow Artifacts
- Available in Actions tab for 30-90 days
- Requires authentication to download
- Good for debugging specific runs

### GitHub Releases
- Available indefinitely (or until deleted)
- Public download (no auth required)
- Better for sharing and testing
- **Primary method for dev builds**

## Development Workflow Example

```
Developer Creates Feature Branch
              │
              ▼
      Push First Commit
              │
              ├─→ ci.yml: Validates code
              │
              └─→ build-dev-artifact.yml: Creates release
                  - Tag: dev-feature-branch
                  - Release: Pre-release with VSIX
              │
              ▼
      Make More Changes
              │
              ▼
      Push Second Commit
              │
              ├─→ ci.yml: Validates code
              │
              └─→ build-dev-artifact.yml: 
                  - Deletes old tag: dev-feature-branch
                  - Deletes old release
                  - Creates new tag: dev-feature-branch
                  - Creates new release with updated VSIX
              │
              ▼
      Create Pull Request
              │
              └─→ ci.yml: Validates code
              │
              ▼
      Merge to Main
              │
              ├─→ ci.yml: Validates merge
              │
              └─→ build-release.yml: Creates main build
                  - Tag: v1.0.1-build.N
                  - Release: Main Build with VSIX
```

## Benefits Summary

| Aspect | Benefit |
|--------|---------|
| **Speed** | 60-70% faster feedback |
| **Clarity** | Clear separation of dev/build/release |
| **Access** | Easy VSIX download from Releases |
| **History** | Detailed changelogs with attribution |
| **Cleanliness** | No tag accumulation on dev branches |
| **Safety** | Fail-fast prevents wasted resources |
| **Testing** | All builds validated before artifacts |

