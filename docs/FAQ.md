# FAQ: Understanding MCP Usage in LSP-MCP-Bridge

This document answers common questions about how MCP is used in this extension.

## Q: How is MCP being used here?

**A:** MCP (Model Context Protocol) is used in **two ways**:

1. **Primary: Language Model Tools API** - The extension registers 10 tools using VS Code's `vscode.lm.registerTool()` API, which follows MCP principles. These tools are automatically available to GitHub Copilot.

2. **Secondary: MCP Server Provider** - The extension implements `McpServerDefinitionProvider` to register with VS Code's MCP discovery system (though currently returns empty definitions).

## Q: Is it contributing tools?

**A: Yes!** The extension contributes **10 LSP tools** to the MCP ecosystem:

1. `lsp_definition` - Find symbol definitions
2. `lsp_references` - Find all references to a symbol
3. `lsp_hover` - Get symbol information and documentation
4. `lsp_completion` - Get code completion suggestions
5. `lsp_workspace_symbols` - Search symbols across the workspace
6. `lsp_document_symbols` - Get document structure/outline
7. `lsp_rename_symbol` - Preview symbol rename impact
8. `lsp_code_actions` - Get available quick fixes and refactorings
9. `lsp_format_document` - Preview document formatting
10. `lsp_signature_help` - Get function signature and parameter help

These tools are:
- ✅ Declared in `package.json` under `contributes.languageModelTools`
- ✅ Implemented in `src/languageModelTools.ts`
- ✅ Automatically discovered by GitHub Copilot
- ✅ Can be referenced in prompts using `#` syntax (e.g., `#definition`)

## Q: How does this integrate with the clangd VS Code extension?

**A:** This extension **does NOT directly integrate with clangd**. Instead:

```
Your Question: "What does calculateDistance do?"
          ↓
GitHub Copilot (uses tools automatically)
          ↓
LSP-MCP-Bridge Extension (this extension)
    - Registers tools with VS Code
    - Calls vscode.commands.executeCommand()
          ↓
VS Code Built-in APIs
    - vscode.executeHoverProvider
    - vscode.executeDefinitionProvider
          ↓
VS Code Extension Host
    - Routes to active language server
          ↓
clangd Extension (separate extension)
    - Started and managed independently
    - Provides LSP features for C++ files
          ↓
clangd Language Server (binary process)
    - Analyzes C++ code
    - Uses compile_commands.json
    - Returns results
```

**Key Points:**
- LSP-MCP-Bridge **does not start or manage clangd**
- clangd extension handles all clangd-specific tasks
- LSP-MCP-Bridge only queries what clangd already provides through VS Code APIs

## Q: Does this use VS Code's built-in tools for symbol lookup?

**A:** Yes and no. More precisely:

- **No**: This is not using "VS Code tools" directly
- **Yes**: This uses **VS Code's unified LSP API** to access language servers

VS Code provides commands like:
- `vscode.executeDefinitionProvider`
- `vscode.executeReferenceProvider`
- `vscode.executeHoverProvider`

These commands are **proxies** that route to whichever language server is active for the current file. So:

- For `main.cpp` → routes to clangd (if installed)
- For `app.py` → routes to Pylance (if installed)
- For `main.rs` → routes to rust-analyzer (if installed)

This extension **wraps these VS Code commands** in an MCP-compatible tool interface.

## Q: What's the bridge?

**A:** The "bridge" has **three meanings**:

1. **Protocol Bridge**: Translates between MCP (tool-based) and LSP (position-based) protocols
2. **AI Bridge**: Connects AI language models to traditional language servers
3. **API Bridge**: Bridges VS Code's extension APIs to GitHub Copilot's tool system

```
MCP Tools (AI-friendly)   ←→   LSP Features (editor-friendly)
─────────────────────────────────────────────────────────────
lsp_definition tool       ←→   textDocument/definition
lsp_references tool       ←→   textDocument/references
lsp_hover tool           ←→   textDocument/hover
```

## Q: Is languageModelApi used?

**A: Yes!** The extension uses VS Code's Language Model API extensively:

```typescript
// From languageModelTools.ts
vscode.lm.registerTool('lsp_definition', {
    invoke: async (options, token) => {
        // Implementation
    }
});

// From mcpServerProvider.ts
vscode.lm.registerMcpServerDefinitionProvider('lsp-mcp-bridge', provider);
```

The Language Model API is VS Code's implementation of MCP concepts for tool registration and discovery.

## Q: How do other clangd MCP servers work?

**A:** Other clangd MCP servers typically:

1. **Run as standalone processes** (not VS Code extensions)
2. **Start their own clangd instance** via stdio
3. **Require compile_commands.json** in the project
4. **Communicate directly with clangd** via LSP/JSON-RPC
5. **Expose results as MCP tools** to AI clients

**Example architecture of typical clangd MCP server:**
```
AI Client (Claude, etc.)
    ↓ (MCP protocol over stdio)
Standalone MCP Server
    ↓ (LSP over stdio)
clangd process (started by MCP server)
    ↓ (reads)
compile_commands.json
```

**This extension is different:**
```
GitHub Copilot (built into VS Code)
    ↓ (Language Model API)
LSP-MCP-Bridge Extension (this)
    ↓ (VS Code executeCommand API)
VS Code's LSP infrastructure
    ↓ (LSP over stdio)
clangd process (started by clangd extension)
    ↓ (reads)
compile_commands.json
```

## Q: Does this replace IntelliSense?

**A: No!** This extension:

- ❌ Does NOT replace IntelliSense
- ❌ Does NOT provide code completion in the editor
- ❌ Does NOT show inline documentation
- ❌ Does NOT start language servers

Instead:
- ✅ Makes IntelliSense data available to AI
- ✅ Enhances GitHub Copilot's understanding
- ✅ Works alongside existing language features
- ✅ Requires language servers to already be running

## Q: Why is there an mcpServer.ts file if it's not used?

**A:** The `mcpServer.ts` file contains a complete MCP server implementation that **could** be used to run this as a standalone MCP server (like other clangd MCP servers). Currently:

- ✅ The code exists and is compiled
- ✅ An instance is created in `extension.ts`
- ❌ The `.start()` method is never called
- ❌ No stdio transport is connected

This demonstrates **two possible deployment modes**:

1. **Current Mode**: VS Code extension with Language Model Tools
2. **Potential Mode**: Standalone MCP server over stdio

To enable standalone mode, you would:
```typescript
// In extension.ts
const mcpServer = new LSPMCPServer(languageClient);
await mcpServer.start(); // Add this line
```

## Q: What's in mcp.json?

**A:** The `mcp.json` file is a **metadata file** that describes the MCP server capabilities. It's used for documentation and potential future MCP client discovery. Key contents:

```json
{
  "mcpVersion": "2024-11-05",
  "name": "lsp-mcp-bridge",
  "description": "MCP server that exposes Language Server Protocol capabilities",
  "tools": [
    {
      "name": "lsp.definition",
      "description": "Get the definition location of a symbol",
      "inputSchema": { /* JSON Schema */ }
    }
    // ... 3 more tools
  ]
}
```

**Note:** The mcp.json currently only lists 4 tools (the ones in mcpServer.ts), while the extension actually provides 10 tools via Language Model API.

## Q: How does GitHub Copilot discover these tools?

**A:** Automatic discovery through VS Code's extension system:

1. **Extension Activation**: When VS Code starts or opens a supported file
2. **Tool Registration**: Extension calls `vscode.lm.registerTool()` for each tool
3. **VS Code Registry**: VS Code maintains a registry of all language model tools
4. **Copilot Access**: GitHub Copilot queries this registry
5. **Automatic Usage**: Copilot uses tools when relevant to user queries

No manual configuration needed!

## Q: Can I use these tools from Claude Desktop or other MCP clients?

**A: Not currently.** The tools are registered via VS Code's Language Model API, which is specific to VS Code. To use with external MCP clients, you would need to:

1. Enable the standalone MCP server mode (start mcpServer)
2. Configure stdio transport
3. Update mcp.json with connection details
4. Add all 10 tools to mcpServer.ts (currently only has 4)

This could be a future enhancement!

## Q: What's the performance impact?

**A: Minimal!** The extension:

- ✅ Reuses existing language server connections (no new processes)
- ✅ Only activates when relevant languages are opened
- ✅ Uses async/await for non-blocking operations
- ✅ Implements timeouts to prevent hanging
- ✅ Lazy-loads documents only when needed

The only overhead is the tool wrapper code, which is negligible.

## Q: Does this work with all programming languages?

**A: Yes!** As long as:

1. ✅ VS Code supports the language
2. ✅ A language server extension is installed
3. ✅ The language server provides the requested capability

Examples:
- C/C++: clangd or Microsoft C/C++ extension
- Python: Pylance
- TypeScript/JavaScript: Built-in
- Rust: rust-analyzer
- Go: Go extension
- Java: Language Support for Java
- etc.

The extension is **truly universal** because it uses VS Code's unified LSP API.

## Summary

**How MCP is being used:**
- ✅ Contributing 10 tools via Language Model API (MCP-based)
- ✅ Tools automatically available to GitHub Copilot
- ✅ Follows MCP principles for tool definition and invocation
- ✅ Includes standalone MCP server implementation (unused)

**What it does:**
- ✅ Makes language server features accessible to AI
- ✅ Bridges MCP protocol to LSP protocol
- ✅ Works with any language server via VS Code APIs
- ❌ Does NOT replace IntelliSense or language servers

**The value:**
GitHub Copilot can now intelligently navigate large codebases (like C++ projects with clangd) by using these tools to find definitions, references, hover info, and more!
