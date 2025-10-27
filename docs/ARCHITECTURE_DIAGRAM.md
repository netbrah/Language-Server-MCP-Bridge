# Visual Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User / Developer                         │
│            Asks: "What does this function do?"               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  GitHub Copilot Chat                         │
│  • Understands natural language queries                      │
│  • Automatically selects appropriate tools                   │
│  • Synthesizes responses from tool results                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ vscode.lm API (MCP-based)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         LSP-MCP-Bridge Extension (This Project)              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Language Model Tools (10 tools)                       │  │
│  │  • lsp_definition     • lsp_workspace_symbols         │  │
│  │  • lsp_references     • lsp_document_symbols          │  │
│  │  • lsp_hover          • lsp_rename_symbol             │  │
│  │  • lsp_completion     • lsp_code_actions              │  │
│  │  • lsp_signature_help • lsp_format_document           │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │ VSCodeLanguageClient                                  │  │
│  │  • Adapts LSP calls to VS Code APIs                   │  │
│  │  • Handles document opening and validation            │  │
│  │  • Converts between formats                           │  │
│  └───────────────────────┬───────────────────────────────┘  │
└────────────────────────────┼──────────────────────────────────┘
                           │
                           │ vscode.commands.executeCommand()
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         VS Code Built-in Language Features API               │
│  • vscode.executeDefinitionProvider                          │
│  • vscode.executeReferenceProvider                           │
│  • vscode.executeHoverProvider                               │
│  • vscode.executeCompletionItemProvider                      │
│  • vscode.executeWorkspaceSymbolProvider                     │
│  • vscode.executeDocumentSymbolProvider                      │
│  • vscode.executeDocumentRenameProvider                      │
│  • vscode.executeCodeActionProvider                          │
│  • vscode.executeFormatDocumentProvider                      │
│  • vscode.executeSignatureHelpProvider                       │
└────────────────────────────┬────────────────────────────────┘
                           │
                           │ Language Server Protocol (JSON-RPC)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Language Server Extensions                      │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────┐          │
│  │   clangd    │  │ Pylance  │  │ rust-analyzer  │  ...     │
│  │  Extension  │  │Extension │  │   Extension    │          │
│  └──────┬──────┘  └────┬─────┘  └────────┬───────┘          │
│         │              │                  │                  │
│         ▼              ▼                  ▼                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐              │
│  │  clangd  │  │  Pylance │  │rust-analyzer │              │
│  │ (binary) │  │ (server) │  │   (binary)   │              │
│  └──────┬───┘  └────┬─────┘  └────────┬─────┘              │
└─────────┼───────────┼─────────────────┼────────────────────┘
          │           │                 │
          ▼           ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Source Code Files                          │
│  • main.cpp (with compile_commands.json)                    │
│  • app.py                                                    │
│  • main.rs (with Cargo.toml)                                │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Example: "Find Definition"

```
1. User asks Copilot: "What does calculateDistance do?"
   ↓
2. GitHub Copilot decides to use #definition tool
   ↓
3. Copilot calls: lsp_definition({
     uri: "file:///project/src/main.cpp",
     line: 42,
     character: 15
   })
   ↓
4. LSP-MCP-Bridge's lsp_definition handler receives request
   ↓
5. Handler calls: languageClient.getDefinition(uri, position)
   ↓
6. VSCodeLanguageClient calls: 
   vscode.commands.executeCommand(
     'vscode.executeDefinitionProvider',
     uri,
     position
   )
   ↓
7. VS Code routes to clangd extension (for .cpp files)
   ↓
8. clangd extension sends LSP request to clangd process:
   {
     "method": "textDocument/definition",
     "params": {
       "textDocument": {"uri": "file:///project/src/main.cpp"},
       "position": {"line": 42, "character": 15}
     }
   }
   ↓
9. clangd analyzes code using AST and compile_commands.json
   ↓
10. clangd returns:
    [
      {
        "uri": "file:///project/src/geometry.cpp",
        "range": {
          "start": {"line": 10, "character": 4},
          "end": {"line": 15, "character": 1}
        }
      }
    ]
   ↓
11. VS Code converts to vscode.Location
   ↓
12. VSCodeLanguageClient converts to LSPLocation
   ↓
13. lsp_definition handler formats result:
    "Found 1 definition(s):
     1. geometry.cpp:11:5"
   ↓
14. Returns: LanguageModelToolResult with formatted text
   ↓
15. GitHub Copilot receives result
   ↓
16. Copilot synthesizes response:
    "The calculateDistance function is defined in geometry.cpp 
    at line 11. It takes two Point parameters..."
   ↓
17. User sees helpful response with actual code knowledge!
```

## Protocol Translation

The bridge translates between two protocol styles:

### MCP Tool Call (AI-friendly)
```json
{
  "tool": "lsp_definition",
  "input": {
    "uri": "file:///path/to/file.cpp",
    "line": 42,
    "character": 15
  }
}
```

### LSP Request (Editor-friendly)
```json
{
  "jsonrpc": "2.0",
  "method": "textDocument/definition",
  "params": {
    "textDocument": {
      "uri": "file:///path/to/file.cpp"
    },
    "position": {
      "line": 42,
      "character": 15
    }
  }
}
```

## Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **GitHub Copilot** | Natural language understanding, tool selection, response generation |
| **LSP-MCP-Bridge** | Tool registration, input validation, format conversion |
| **VS Code APIs** | Unified language server access, provider routing |
| **Language Server Extensions** | Language server lifecycle management |
| **Language Servers** | Code analysis, symbol resolution, semantic understanding |
| **Build Systems** | compile_commands.json, project configuration |

## Why This Architecture Works

1. **Separation of Concerns**: Each component has a clear responsibility
2. **Loose Coupling**: Components communicate through well-defined APIs
3. **Extensibility**: Easy to add new tools or support new language servers
4. **Universal**: Works with any LSP-compliant language server
5. **Zero Configuration**: Leverages existing VS Code setup
6. **Performance**: Reuses existing language server connections

## Comparison with Standalone MCP Servers

### Traditional MCP Server (e.g., standalone clangd MCP)
```
AI Client (Claude Desktop)
    ↓ stdio
Standalone MCP Server
    ↓ stdio
clangd (started by MCP server)
    ↓ reads
compile_commands.json
```

**Characteristics:**
- ✅ Works with any MCP client
- ✅ Portable across editors
- ❌ Starts separate clangd instance
- ❌ Requires manual configuration
- ❌ Duplicate processes if editor also uses clangd

### This Extension (VS Code Integrated)
```
GitHub Copilot (built-in VS Code)
    ↓ Language Model API
LSP-MCP-Bridge Extension
    ↓ VS Code APIs
VS Code's LSP infrastructure
    ↓ LSP
clangd (already running for IntelliSense)
    ↓ reads
compile_commands.json
```

**Characteristics:**
- ✅ No duplicate processes
- ✅ Zero configuration
- ✅ Leverages existing setup
- ✅ Universal language support
- ❌ Only works in VS Code
- ❌ Only works with built-in AI features

Both approaches are valid for different use cases!
