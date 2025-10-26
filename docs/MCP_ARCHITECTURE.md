# MCP Architecture & Integration Guide

## Overview

This document explains how the Model Context Protocol (MCP) is used in the Language-Server-MCP-Bridge extension and how it integrates with VS Code, language servers (like clangd), and GitHub Copilot.

## How MCP is Being Used

The Language-Server-MCP-Bridge extension uses MCP in **two distinct ways**:

### 1. **Language Model Tools API (Primary Integration)**

The extension's **primary mechanism** for exposing LSP capabilities is through VS Code's **Language Model Tools API** (`vscode.lm.registerTool`), which is built on MCP concepts. This is what makes the tools automatically available to GitHub Copilot.

#### How it works:

```typescript
// In languageModelTools.ts
vscode.lm.registerTool('lsp_definition', {
    invoke: async (options, token) => {
        // Call LSP through VS Code's built-in APIs
        const locations = await languageClient.getDefinition(...);
        return new vscode.LanguageModelToolResult([...]);
    }
});
```

**10 Tools Registered:**
1. `lsp_definition` - Find symbol definitions
2. `lsp_references` - Find symbol references  
3. `lsp_hover` - Get symbol hover information
4. `lsp_completion` - Get code completions
5. `lsp_workspace_symbols` - Search workspace symbols
6. `lsp_document_symbols` - Get document structure
7. `lsp_rename_symbol` - Preview rename operations
8. `lsp_code_actions` - Get available code actions/refactorings
9. `lsp_format_document` - Preview document formatting
10. `lsp_signature_help` - Get function signatures

**Key aspects:**
- Tools are **automatically discovered** by GitHub Copilot
- Each tool has a `toolReferenceName` that can be used in prompts (e.g., `#definition`)
- Tools receive typed inputs and return structured results
- No manual configuration required by users

### 2. **MCP Server Definition Provider (Secondary Integration)**

The extension also implements VS Code's `McpServerDefinitionProvider` interface to register as an MCP server that external MCP clients can discover.

```typescript
// In mcpServerProvider.ts
export class LSPMcpServerProvider implements vscode.McpServerDefinitionProvider {
    public async provideMcpServerDefinitions(): Promise<vscode.McpServerDefinition[]> {
        // Currently returns empty array
        // Future: Could provide stdio server for external clients
        return [];
    }
}
```

**Current status:**
- Registered with VS Code's MCP system via `vscode.lm.registerMcpServerDefinitionProvider`
- Currently returns empty definitions (Language Model Tools are the primary integration)
- Could be expanded in the future to provide a standalone MCP server via stdio

### 3. **MCP Server Implementation (mcpServer.ts)**

The extension includes a full MCP server implementation using the `@modelcontextprotocol/sdk`:

```typescript
// In mcpServer.ts
export class LSPMCPServer {
    private mcpServer: McpServer;
    
    constructor(languageClient: LanguageClient) {
        this.mcpServer = new McpServer({
            name: 'lsp-mcp-bridge',
            version: '0.0.1',
        });
        this.registerTools(); // Registers 4 basic tools
    }
}
```

**Note:** This MCP server implementation exists but is **not currently started** in the main extension activation. It demonstrates how the extension could be run as a standalone MCP server.

## Integration with clangd and VS Code Language Servers

### How Language Servers Work in VS Code

When you have a C++ file open with the clangd extension installed:

1. **VS Code Extension Host** runs your extensions
2. **clangd Extension** starts the `clangd` language server process
3. **Language Server** communicates via JSON-RPC over stdin/stdout
4. **VS Code Language Client** provides APIs to access LSP features

### This Extension's Bridge Role

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Copilot                            │
│                  (AI Language Model)                         │
└────────────────────────┬────────────────────────────────────┘
                         │ Uses tools via Language Model API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           LSP-MCP-Bridge Extension                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ languageModelTools.ts                                │   │
│  │ - Registers 10 tools with vscode.lm.registerTool()  │   │
│  │ - Each tool wraps an LSP capability                  │   │
│  └─────────────────────┬────────────────────────────────┘   │
│                        │                                     │
│  ┌─────────────────────▼────────────────────────────────┐   │
│  │ languageClient.ts (VSCodeLanguageClient)             │   │
│  │ - Calls vscode.commands.executeCommand()             │   │
│  │ - Uses built-in VS Code LSP providers                │   │
│  └─────────────────────┬────────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              VS Code Built-in APIs                           │
│  - vscode.executeDefinitionProvider                          │
│  - vscode.executeReferenceProvider                           │
│  - vscode.executeHoverProvider                               │
│  - vscode.executeCompletionItemProvider                      │
│  - etc.                                                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│         Active Language Server (e.g., clangd)                │
│  - Analyzes C++ code using compile_commands.json            │
│  - Maintains AST and symbol database                        │
│  - Responds to LSP requests                                 │
└─────────────────────────────────────────────────────────────┘
```

### Key Points:

1. **No Direct LSP Connection**: This extension does NOT communicate directly with language servers
2. **Uses VS Code APIs**: It leverages VS Code's built-in `executeCommand` APIs that proxy to active language servers
3. **Universal Language Support**: Works with ANY language server that VS Code supports (clangd, Pylance, rust-analyzer, etc.)
4. **No compile_commands.json Dependency**: The extension doesn't need `compile_commands.json` - that's handled by clangd itself

## Comparison with clangd Extension

### clangd Extension (llvm/vscode-clangd)
- Starts and manages the `clangd` language server process
- Provides language features (IntelliSense) for C/C++ files
- **Replacement for Microsoft's C/C++ IntelliSense**
- Requires `compile_commands.json` for project understanding
- Communicates via LSP over stdio

### LSP-MCP-Bridge Extension (This Project)
- **Does NOT start any language servers**
- **Does NOT replace IntelliSense**
- **Augments GitHub Copilot** with LSP capabilities
- Works with existing language servers (including clangd)
- Exposes LSP features as tools for AI consumption

**They are complementary, not alternatives:**
- clangd extension = Provides IntelliSense
- LSP-MCP-Bridge = Makes IntelliSense data available to Copilot

## MCP's Role: Contributing Tools

**Yes, MCP is contributing tools!** Here's how:

### Tool Contribution Mechanism

1. **Registration Phase** (Extension Activation):
   ```typescript
   // In extension.ts
   const lmToolsDisposables = registerLanguageModelTools(languageClient);
   ```

2. **Tool Definition** (package.json):
   ```json
   {
     "contributes": {
       "languageModelTools": [
         {
           "name": "lsp_definition",
           "toolReferenceName": "definition",
           "displayName": "Get Symbol Definition",
           "modelDescription": "Find the definition/declaration...",
           "canBeReferencedInPrompt": true,
           "inputSchema": { /* JSON Schema */ }
         }
       ]
     }
   }
   ```

3. **Tool Implementation**:
   ```typescript
   vscode.lm.registerTool('lsp_definition', {
       invoke: async (options, token) => {
           // Execute LSP request
           // Return formatted result for AI
       }
   });
   ```

### What Makes This MCP-Based?

The Language Model Tools API is built on **MCP principles**:

1. **Tool Discovery**: Tools are automatically discoverable by compatible clients
2. **Structured Input**: Each tool has a JSON Schema defining its inputs
3. **Structured Output**: Tools return `LanguageModelToolResult` objects
4. **Stateless Invocation**: Each tool call is independent
5. **Prompt References**: Tools can be explicitly referenced in prompts via `#` syntax

### Example: How Copilot Uses the Tools

```
User: "What does the function calculateDistance do?"

Copilot's Internal Process:
1. Detects user wants function information
2. Identifies cursor/symbol location  
3. Calls #hover tool: lsp_hover({uri, line, character})
4. Receives hover information from language server
5. May also call #definition to see implementation
6. Synthesizes response with retrieved information
```

## Architecture Patterns

### 1. Adapter Pattern
The `VSCodeLanguageClient` class adapts VS Code's LSP APIs to a common interface that MCP tools can use.

### 2. Proxy Pattern  
The extension acts as a proxy between AI language models and language servers, translating between different protocol styles.

### 3. Bridge Pattern
The name "bridge" is literal - it bridges:
- **MCP protocol** (tool-based, AI-friendly)
- **LSP protocol** (position-based, editor-friendly)

## Configuration & Usage

### No Configuration Required!

One of the key features is **zero configuration**:

1. Install the extension
2. Tools automatically register with VS Code
3. GitHub Copilot automatically discovers and uses tools
4. Works with whatever language servers you already have

### Manual Testing

Commands available:
- `LSP MCP: Test MCP Tools at Cursor` - Tests tools at cursor position
- `LSP MCP: List Language Model Tools` - Shows all registered tools

## Future Enhancements

The architecture supports several potential expansions:

1. **Standalone MCP Server**: The `LSPMCPServer` class could be connected to stdio to run as a standalone MCP server for external clients

2. **Additional Tools**: More LSP capabilities could be exposed:
   - Type hierarchy
   - Call hierarchy  
   - Workspace edits
   - Semantic tokens

3. **Multi-Language Server Support**: Currently uses the "best match" language server; could be enhanced to explicitly select among multiple servers

## Summary

**How MCP is Used:**
- ✅ **Yes, MCP is contributing tools** - 10 LSP capabilities exposed as Language Model Tools
- ✅ Primary integration via VS Code's Language Model Tools API (MCP-based)
- ✅ Tools automatically available to GitHub Copilot
- ✅ Includes standalone MCP server implementation (currently unused)
- ✅ Registered as MCP server definition provider for future extensibility

**The Bridge:**
- Bridges AI language models ↔ Language servers
- Bridges MCP protocol ↔ LSP protocol  
- Makes language server intelligence accessible to AI assistants

**Not a Replacement:**
- Does NOT replace clangd or other language server extensions
- Does NOT handle compile_commands.json (that's clangd's job)
- Complements existing tools by making their data AI-accessible
