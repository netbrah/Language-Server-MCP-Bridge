# LSP-MCP Bridge Extension - AI Coding Agent Instructions

## Project Overview

This is a **VS Code extension** that exposes **any Language Server Protocol (LSP)** capabilities as **GitHub Copilot Language Model Tools**. It's a universal bridge that makes language server intelligence automatically available to AI coding agents without any configuration.

### Core Architecture: The "Bridge" Pattern

```
GitHub Copilot → Language Model Tools API → LSP-MCP Bridge → VSCode Commands → Language Servers
```

**Key insight**: This extension does NOT implement LSP directly. Instead, it reuses VS Code's existing language server connections via the `vscode.executeCommand` API, making it universal and zero-configuration.

## Critical Components

### 1. Language Model Tools (`src/languageModelTools.ts`)
- **10 tools** registered with `vscode.lm.registerTool()` for GitHub Copilot
- Each tool translates AI requests → VSCode commands → LSP responses
- Tools: `lsp_definition`, `lsp_references`, `lsp_hover`, `lsp_completion`, `lsp_workspace_symbols`, `lsp_document_symbols`, `lsp_rename_symbol`, `lsp_code_actions`, `lsp_format_document`, `lsp_signature_help`

### 2. Language Client Adapter (`src/languageClient.ts`)
- **Adapter pattern**: Wraps VSCode command API as LSP-like interface
- Uses `vscode.commands.executeCommand('vscode.executeDefinitionProvider', ...)` instead of direct LSP
- Handles document lifecycle, position conversion, error handling

### 3. Extension Entry Point (`src/extension.ts`)
- Activates on startup and language events
- Registers tools with Language Model API
- Provides test commands for manual verification

## Key Development Patterns

### Universal Language Support Pattern
```typescript
// Works with ANY language server - no language-specific code
const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
    'vscode.executeDefinitionProvider',
    document.uri,
    vscodePosition
);
```

### Tool Registration Pattern
```typescript
vscode.lm.registerTool('lsp_definition', {
    invoke: async (options, token) => {
        const locations = await languageClient.getDefinition(input.uri, position);
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(formattedResponse)
        ]);
    }
});
```

### Error Handling Pattern
- All tools use try-catch with user-friendly error messages
- 100ms delays for language server readiness
- Graceful degradation when language servers unavailable

## Build & Development Workflow

### Essential Commands
```bash
npm run watch        # Start TypeScript compilation in watch mode
npm run compile      # One-time compilation
npm run package      # Production build with webpack
npm test            # Run test suite
```

### Build Chain
1. **TypeScript** → **Webpack** → `dist/extension.js` (single bundle)
2. **Target**: Node.js CommonJS for VS Code extension host
3. **Externals**: `vscode` module excluded from bundle
4. **Source maps**: Generated for debugging

### Testing Approach
- Unit tests for each language client method in `src/test/`
- Manual testing via Command Palette: "LSP LM Tools: Test Language Model Tools at Cursor"
- CI/CD with GitHub Actions (`.github/workflows/`)

## Project-Specific Conventions

### File Organization
- `src/extension.ts` - Extension lifecycle & registration
- `src/languageModelTools.ts` - Copilot tool implementations
- `src/languageClient.ts` - VSCode command adapter layer
- `src/types.ts` - LSP type definitions (simplified)
- `docs/` - Comprehensive architecture documentation

### Naming Patterns
- Tool names: `lsp_` prefix (e.g., `lsp_definition`)
- Tool reference names: Short descriptive (e.g., `#definition`)
- Interface names: `LSP` prefix for simplified LSP types
- Input schemas: `Tool*Input` pattern

### Documentation Strategy
- `ARCHITECTURE.md` - High-level system design
- `docs/MCP_ARCHITECTURE.md` - Detailed MCP integration
- `docs/TECHNICAL_INTEGRATION.md` - Implementation walkthrough
- `README.md` - User-facing installation/usage

## Integration Points

### VS Code APIs Used
- `vscode.lm.registerTool()` - Language Model Tools registration
- `vscode.commands.executeCommand()` - Language server command execution
- `vscode.workspace.openTextDocument()` - Document access
- Extension activation events for multiple languages

### Language Server Independence
- **Works with**: clangd, Pylance, rust-analyzer, gopls, TypeScript, etc.
- **No direct LSP**: Uses VS Code as proxy to any language server
- **Configuration inheritance**: Automatically uses user's language server settings

### External Dependencies
- **Zero runtime dependencies** - Pure VS Code extension
- **DevDependencies**: TypeScript, Webpack, ESLint, VS Code test framework

## Working with This Codebase

### To Add New LSP Capabilities
1. Add tool to `package.json` `languageModelTools` contribution
2. Implement in `languageModelTools.ts` following existing pattern
3. Add corresponding method to `languageClient.ts` if needed
4. Update types in `types.ts` for new LSP structures

### Common Debugging
- Check Output panel: "LSP MCP Bridge" for tool invocation logs
- Use "Test Language Model Tools at Cursor" command for manual testing
- Ensure language server is active for the file type being tested
- Verify VS Code version ≥1.75.0 for Language Model API support

### Performance Considerations
- Tools reuse existing language server connections (no extra processes)
- 100ms timeout padding for language server readiness
- Batch operations not implemented (tools are stateless, per-call)
- Response formatting optimized for AI consumption, not human display

This extension's value: **Makes any language server's intelligence available to AI agents universally and automatically**.
