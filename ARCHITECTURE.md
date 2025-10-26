# Architecture: LSP MCP Bridge

## Overview

The **LSP MCP Bridge** is a Visual Studio Code extension that acts as a universal bridge between Language Server Protocol (LSP) implementations and AI tools like GitHub Copilot. It exposes language server capabilities through two interfaces:

1. **Language Model Tools API** - Direct integration with GitHub Copilot
2. **Model Context Protocol (MCP)** - Standard protocol for external AI clients

## The Bridge Concept

### What is the Bridge?

The "bridge" refers to the architectural pattern that connects two different protocols:

```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub Copilot                          │
│                    (Language Model API Consumer)                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ Language Model Tools API
                                │ (vscode.lm.registerTool)
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                       LSP MCP Bridge Extension                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Language Model Tools Registry                 │  │
│  │  (languageModelTools.ts)                                │  │
│  │  - lsp_definition, lsp_references, lsp_hover, etc.      │  │
│  └─────────────────────────┬────────────────────────────────┘  │
│                            │                                    │
│  ┌─────────────────────────▼────────────────────────────────┐  │
│  │         VSCodeLanguageClient (languageClient.ts)        │  │
│  │  Translates tool calls → VSCode Commands                │  │
│  └─────────────────────────┬────────────────────────────────┘  │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             │ VSCode Command API
                             │ (vscode.executeDefinitionProvider, etc.)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    VSCode Built-in Language Features            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Language Server Protocol (LSP) Client Infrastructure   │  │
│  └─────────────────────────┬────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             │ Language Server Protocol (LSP)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Active Language Servers                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  clangd  │  │ Pylance  │  │rust-analy│  │   gopls  │ ...   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ Source Code Analysis
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                       Your Project Files                        │
│              (C++, Python, Rust, Go, TypeScript, etc.)          │
└─────────────────────────────────────────────────────────────────┘
```

## Integration with clangd VS Code Extension

### How clangd Extension Works

The **clangd VS Code extension** (vscode-clangd) is a language server client that:

1. **Starts the clangd server process** - Launches `clangd` binary on your machine
2. **Communicates via LSP** - Uses JSON-RPC over stdio/pipes to communicate with clangd
3. **Relies on compile_commands.json** - clangd reads this file to understand build flags, include paths, etc.
4. **Provides IntelliSense** - Replaces the built-in C/C++ IntelliSense with clangd's more accurate analysis

### How LSP MCP Bridge Integrates with clangd

**The LSP MCP Bridge does NOT directly communicate with clangd.** Instead:

1. **Reuses VSCode's LSP Infrastructure**: The bridge leverages VSCode's existing language server connections
2. **No Direct LSP Communication**: Instead of implementing another LSP client, it uses VSCode's command API
3. **Universal Design**: Works with ANY language server, not just clangd

#### Integration Flow for clangd:

```
User asks Copilot: "Where is function Foo defined?"
        │
        ▼
┌─────────────────────────────────────────────┐
│  Copilot uses lsp_definition tool          │
│  (registered via Language Model API)        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  languageModelTools.ts                     │
│  Receives: { uri, line, character }        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  languageClient.ts                         │
│  Calls: vscode.executeDefinitionProvider   │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  VSCode's Language Features Engine         │
│  Routes to appropriate language server     │
└────────────────┬────────────────────────────┘
                 │
                 ▼ (if file is .cpp/.h)
┌─────────────────────────────────────────────┐
│  clangd extension's LSP client             │
│  Forwards request to clangd process        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  clangd language server process            │
│  - Parses C++ code                         │
│  - Consults compile_commands.json          │
│  - Returns definition location             │
└────────────────┬────────────────────────────┘
                 │
                 ▼ (Response bubbles back up)
        Returns to Copilot
```

### Key Differences from Direct clangd MCP Servers

Other clangd MCP implementations typically:

| Other clangd MCP Servers | LSP MCP Bridge |
|-------------------------|----------------|
| **Direct LSP client** - Implement their own LSP client | **Reuses VSCode's LSP client** - No direct LSP communication |
| **clangd-specific** - Only work with clangd | **Universal** - Works with ANY language server |
| **Manage clangd process** - Start/stop clangd themselves | **No process management** - Uses already-running language servers |
| **Require compile_commands.json** - Must configure directly | **Inherits configuration** - Uses whatever the extension configured |
| **Separate setup** - Need to configure independently | **Zero configuration** - Works automatically if extension installed |

## Built-in VSCode Tools Used

The bridge uses VSCode's **Language Features API**, which provides standardized commands for any language server:

### Core Commands Used

| Command | Purpose | File |
|---------|---------|------|
| `vscode.executeDefinitionProvider` | Find symbol definitions | `languageClient.ts` (line 69) |
| `vscode.executeReferenceProvider` | Find symbol references | `languageClient.ts` (line 150) |
| `vscode.executeHoverProvider` | Get hover information | `languageClient.ts` (line 204) |
| `vscode.executeCompletionItemProvider` | Get code completions | `languageClient.ts` (line 626) |
| `vscode.executeWorkspaceSymbolProvider` | Search workspace symbols | `languageClient.ts` (line 522) |
| `vscode.executeDocumentSymbolProvider` | Get document outline | `languageClient.ts` (line 568) |
| `vscode.executeDocumentRenameProvider` | Preview symbol renames | `languageClient.ts` (line 273) |
| `vscode.executeCodeActionProvider` | Get quick fixes/refactorings | `languageClient.ts` (line 330) |
| `vscode.executeFormatDocumentProvider` | Format documents | `languageClient.ts` (line 428) |
| `vscode.executeSignatureHelpProvider` | Get function signatures | `languageClient.ts` (line 476) |

### Why Use VSCode Commands Instead of Direct LSP?

**Advantages:**

1. **No LSP Implementation Needed** - VSCode handles all protocol details
2. **Automatic Language Detection** - VSCode routes to the correct language server based on file type
3. **Unified API** - Same code works for Python, C++, Rust, Go, TypeScript, etc.
4. **Respects User Configuration** - Inherits all language server settings from user's extensions
5. **No Process Management** - VSCode manages language server lifecycle
6. **Built-in Error Handling** - VSCode handles timeouts, restarts, crashes
7. **Performance** - Reuses existing connections instead of creating new ones

**This is the core innovation of the bridge: universal LSP access without implementing LSP.**

## Language Model API Usage

### Yes, Language Model API is Used

The extension **extensively uses** VSCode's Language Model API introduced in VS Code 1.103+:

```typescript
// From languageModelTools.ts
vscode.lm.registerTool('lsp_definition', {
    invoke: async (options, token) => {
        // Tool implementation
        return new vscode.LanguageModelToolResult([...]);
    }
});
```

### What is the Language Model API?

The **Language Model API** (`vscode.lm`) is VSCode's official API for:

- **Registering tools** that language models (like Copilot) can use
- **Automatic discovery** - Copilot automatically finds registered tools
- **Structured invocation** - Type-safe tool calls with schemas
- **Results formatting** - Standardized response format

### 10 Language Model Tools Registered

The extension registers these tools (see `package.json` lines 79-459 for full definitions, and `languageModelTools.ts` lines 82-518 for implementations):

1. **lsp_definition** - Find definitions (`#definition` reference)
2. **lsp_references** - Find references (`#references` reference)
3. **lsp_hover** - Get hover info (`#hover` reference)
4. **lsp_completion** - Get completions (`#completion` reference)
5. **lsp_workspace_symbols** - Search workspace (`#workspace_symbols` reference)
6. **lsp_document_symbols** - Get document structure (`#document_symbols` reference)
7. **lsp_rename_symbol** - Preview renames (`#rename` reference)
8. **lsp_code_actions** - Get quick fixes (`#code_actions` reference)
9. **lsp_format_document** - Preview formatting (`#format` reference)
10. **lsp_signature_help** - Get signatures (`#signature_help` reference)

### Tool Registration Flow

```typescript
// extension.ts line 112
const lmToolsDisposables = registerLanguageModelTools(languageClient);

// languageModelTools.ts lines 82-518
export function registerLanguageModelTools(languageClient: VSCodeLanguageClient) {
    const disposables: vscode.Disposable[] = [];
    
    // Register each tool with Language Model API
    disposables.push(vscode.lm.registerTool('lsp_definition', {
        invoke: async (options, token) => {
            // Get input parameters
            const input = options.input;
            
            // Call language client
            const locations = await languageClient.getDefinition(
                input.uri, 
                { line: input.line, character: input.character }
            );
            
            // Format and return results
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(formattedResponse)
            ]);
        }
    }));
    
    // ... register other 9 tools ...
    
    return disposables;
}
```

## Architecture Components

### 1. Extension Entry Point (`extension.ts`)

**Responsibilities:**
- Extension activation and lifecycle management
- Initializes the language client adapter
- Registers Language Model Tools with Copilot
- Registers MCP Server Provider for external clients
- Provides test commands for manual verification

**Key Code:**
```typescript
export async function activate(context: vscode.ExtensionContext) {
    // Initialize language client (wraps VSCode commands)
    languageClient = new VSCodeLanguageClient();
    await languageClient.initialize();
    
    // Create MCP server (for external clients)
    mcpServer = new LSPMCPServer(languageClient);
    
    // Register tools with GitHub Copilot
    const lmToolsDisposables = registerLanguageModelTools(languageClient);
    
    // Register MCP provider for external clients
    const mcpProviderDisposable = registerMcpServerProvider(context);
}
```

### 2. Language Client Adapter (`languageClient.ts`)

**Responsibilities:**
- Adapter pattern: wraps VSCode command API as LSP-like interface
- Handles all 10 LSP operations
- Document lifecycle management
- Error handling and validation

**Key Pattern:**
```typescript
export class VSCodeLanguageClient implements LanguageClient {
    async getDefinition(uri: string, position: LSPPosition): Promise<LSPLocation[]> {
        // 1. Get document
        const document = await this.getDocument(uri);
        
        // 2. Convert position format
        const vscodePosition = new vscode.Position(position.line, position.character);
        
        // 3. Call VSCode command (this routes to language server)
        const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeDefinitionProvider',
            document.uri,
            vscodePosition
        );
        
        // 4. Convert response format
        return definitions.map(def => convertToLSPLocation(def));
    }
    
    // Similar methods for references, hover, completion, etc.
}
```

**No Direct LSP Communication:** This class never sends JSON-RPC messages, never manages sockets/stdio, never implements the LSP protocol. It purely translates between the tool API and VSCode commands.

### 3. Language Model Tools (`languageModelTools.ts`)

**Responsibilities:**
- Registers all 10 tools with VSCode's Language Model API
- Defines tool schemas (input parameters)
- Handles tool invocations from Copilot
- Formats responses in natural language for AI consumption

**Tool Structure:**
```typescript
vscode.lm.registerTool('lsp_definition', {
    invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolPositionInput>) => {
        try {
            // 1. Extract parameters
            const input = options.input;
            
            // 2. Call language client
            const locations = await languageClient.getDefinition(
                input.uri,
                { line: input.line, character: input.character }
            );
            
            // 3. Format for AI consumption
            const response = `Found ${locations.length} definition(s):\n` +
                locations.map((loc, i) => 
                    `${i+1}. ${formatPath(loc.uri)}:${loc.range.start.line+1}`
                ).join('\n');
            
            // 4. Return structured result
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(response)
            ]);
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Error: ${error}`)
            ]);
        }
    }
});
```

### 4. MCP Server (`mcpServer.ts`)

**Responsibilities:**
- Implements Model Context Protocol server
- Exposes LSP capabilities as MCP tools
- Can run as standalone stdio server for external clients
- Currently limited to 4 core tools (definition, references, hover, completion)

**Note:** This component is less important than Language Model Tools for GitHub Copilot integration. It's primarily for external MCP clients.

### 5. MCP Server Provider (`mcpServerProvider.ts`)

**Responsibilities:**
- Implements `vscode.McpServerDefinitionProvider` interface
- Registers with VSCode's MCP system
- Enables auto-discovery by external MCP clients
- Currently returns empty definitions (tools are primary integration)

## How compile_commands.json Fits In

### For clangd Specifically

The `compile_commands.json` file is **still used by clangd**, but the LSP MCP Bridge doesn't interact with it directly:

```
┌─────────────────────────────────────────────────────────────┐
│  Your C++ Project                                           │
│  ├── src/                                                   │
│  ├── include/                                               │
│  └── compile_commands.json  ← clangd reads this           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼ (clangd parses and uses)
┌─────────────────────────────────────────────────────────────┐
│  clangd Language Server Process                             │
│  - Knows compilation flags                                  │
│  - Knows include paths                                      │
│  - Provides accurate IntelliSense                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼ (LSP protocol)
┌─────────────────────────────────────────────────────────────┐
│  VSCode + clangd extension                                  │
│  - Manages clangd process                                   │
│  - Handles LSP communication                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼ (vscode.executeDefinitionProvider)
┌─────────────────────────────────────────────────────────────┐
│  LSP MCP Bridge                                             │
│  - Uses results from clangd (via VSCode)                    │
│  - Never reads compile_commands.json itself                 │
└─────────────────────────────────────────────────────────────┘
```

### The Bridge's Perspective

From the LSP MCP Bridge's perspective:

1. **Configuration is transparent** - The bridge doesn't know or care about `compile_commands.json`
2. **Inherits accuracy** - If clangd is configured correctly, the bridge gets accurate results
3. **No special handling** - C++ is treated the same as Python, Rust, Go, etc.
4. **User's responsibility** - Users must set up clangd (and compile_commands.json) themselves

## Comparison: LSP MCP Bridge vs. clangd as IntelliSense

### clangd Extension (vscode-clangd)

**Purpose:** Replace Visual Studio Code's built-in C/C++ IntelliSense

**What it does:**
- Starts and manages the clangd language server process
- Communicates with clangd via LSP (JSON-RPC)
- Provides IntelliSense features in the editor
- Shows diagnostics, errors, warnings inline
- Powers autocomplete, go-to-definition, etc.

**User sees:** Better, faster, more accurate C++ code completion and navigation **in the editor**

### LSP MCP Bridge (this extension)

**Purpose:** Expose language server capabilities to AI tools like GitHub Copilot

**What it does:**
- Registers tools with VSCode's Language Model API
- Proxies AI tool calls to VSCode's language features
- Formats results for AI consumption
- Works with ANY language server (not just clangd)

**User sees:** GitHub Copilot has deeper understanding of codebase and can answer questions about code structure, find definitions, references, etc.

### They Work Together

```
┌─────────────────────────────────────────────────────────────┐
│  Developer Experience                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Editor with clangd IntelliSense]  ←→  [GitHub Copilot]  │
│                                                             │
│  Developer types code               AI assistant helps     │
│  Gets accurate autocomplete         with intelligent       │
│  Sees inline errors                 code understanding     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
        │                                       │
        │                                       │
        ▼                                       ▼
┌──────────────────────┐          ┌──────────────────────────┐
│  clangd Extension    │          │  LSP MCP Bridge          │
│  (Language Server)   │          │  (AI Tools Bridge)       │
└──────────┬───────────┘          └───────────┬──────────────┘
           │                                  │
           │        ┌─────────────────────────┘
           │        │
           ▼        ▼
      ┌────────────────────┐
      │  VSCode LSP Client │
      └─────────┬──────────┘
                │
                ▼
         ┌────────────┐
         │   clangd   │
         │  (process) │
         └────────────┘
```

**Both extensions enhance the developer experience, but in different ways:**
- **clangd extension** → Better IntelliSense in the editor
- **LSP MCP Bridge** → Better AI understanding of your code

## Key Architectural Advantages

### 1. Universal Language Support
Works with ANY language server without modification. No language-specific code.

### 2. Zero Configuration
If a language extension works in VSCode, it works with this bridge automatically.

### 3. Reuses Infrastructure
Doesn't duplicate LSP clients, process management, or protocol handling.

### 4. Lightweight
~70KB of code vs. hundreds of KB for full LSP client implementations.

### 5. Maintainable
VSCode handles breaking changes in LSP protocol. Bridge only depends on stable command API.

### 6. Consistent
Same bridge code serves Python, C++, Rust, Go, TypeScript, etc.

## Summary

The **LSP MCP Bridge** is a **smart adapter** that:

1. **Sits between** GitHub Copilot and any language server
2. **Uses** VSCode's Language Model API to register tools
3. **Leverages** VSCode's built-in language features commands
4. **Reuses** existing language server connections (including clangd)
5. **Inherits** all configuration from user's installed extensions
6. **Provides** universal LSP access without implementing LSP

**The "bridge" is the abstraction layer** that makes language server capabilities available to AI tools through standardized VSCode APIs, without requiring direct protocol implementation or process management.

This architecture is fundamentally different from other clangd MCP servers because it's **universal, reusable, and zero-configuration** rather than **language-specific, standalone, and requiring setup**.
