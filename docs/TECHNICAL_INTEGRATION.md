# Technical Integration Guide

## MCP Tool Contribution Details

This document provides technical details on how the LSP-MCP-Bridge extension contributes tools to the Model Context Protocol ecosystem.

## Tool Registration Flow

### 1. Extension Activation (extension.ts)

```typescript
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    // Initialize the language client adapter
    languageClient = new VSCodeLanguageClient();
    await languageClient.initialize();

    // Create MCP server (not started in current implementation)
    mcpServer = new LSPMCPServer(languageClient);
    
    // Register Language Model Tools for GitHub Copilot
    const lmToolsDisposables = registerLanguageModelTools(languageClient);
    
    // Register MCP server provider for auto-discovery
    const mcpProviderDisposable = registerMcpServerProvider(context);
}
```

### 2. Tool Registration (languageModelTools.ts)

Each tool follows this pattern:

```typescript
disposables.push(vscode.lm.registerTool('lsp_definition', {
    invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolPositionInput>, 
                   _token: vscode.CancellationToken) => {
        const input = options.input;
        
        // Validate language client is ready
        if (!languageClient.isReady()) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart('Error: Language client is not ready')
            ]);
        }

        // Call underlying LSP function
        const locations = await languageClient.getDefinition(
            input.uri,
            { line: input.line, character: input.character }
        );

        // Format results for AI consumption
        const response = formatLocations(locations);
        
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(response)
        ]);
    }
}));
```

### 3. LSP Execution (languageClient.ts)

The VSCodeLanguageClient class bridges to VS Code's built-in LSP APIs:

```typescript
public async getDefinition(uri: string, position: LSPPosition): Promise<LSPLocation[]> {
    const document = await this.getDocument(uri);
    const vscodePosition = new vscode.Position(position.line, position.character);

    // Use VS Code's definition provider
    const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
        'vscode.executeDefinitionProvider',
        document.uri,
        vscodePosition
    );

    // Convert VS Code locations to LSP format
    return definitions.map(convertToLSPLocation);
}
```

## Tool Declaration (package.json)

Each tool is declared in the extension manifest:

```json
{
  "contributes": {
    "languageModelTools": [
      {
        "name": "lsp_definition",
        "tags": ["lsp", "definition"],
        "toolReferenceName": "definition",
        "displayName": "Get Symbol Definition",
        "modelDescription": "Find the definition/declaration location of a symbol...",
        "canBeReferencedInPrompt": true,
        "inputSchema": {
          "type": "object",
          "properties": {
            "uri": {
              "type": "string",
              "description": "File URI (e.g., file:///path/to/file.py)"
            },
            "line": {
              "type": "number",
              "description": "Line number (0-based)"
            },
            "character": {
              "type": "number",
              "description": "Character offset in line (0-based)"
            }
          },
          "required": ["uri", "line", "character"]
        }
      }
    ]
  }
}
```

## VS Code LSP Commands Used

The extension leverages these built-in VS Code commands:

| Command | Purpose | Returns |
|---------|---------|---------|
| `vscode.executeDefinitionProvider` | Find definitions | `Location[]` or `LocationLink[]` |
| `vscode.executeReferenceProvider` | Find references | `Location[]` |
| `vscode.executeHoverProvider` | Get hover info | `Hover[]` |
| `vscode.executeCompletionItemProvider` | Get completions | `CompletionList` |
| `vscode.executeWorkspaceSymbolProvider` | Search symbols | `SymbolInformation[]` |
| `vscode.executeDocumentSymbolProvider` | Get document outline | `DocumentSymbol[]` |
| `vscode.executeDocumentRenameProvider` | Preview rename | `WorkspaceEdit` |
| `vscode.executeCodeActionProvider` | Get code actions | `CodeAction[]` |
| `vscode.executeFormatDocumentProvider` | Format document | `TextEdit[]` |
| `vscode.executeSignatureHelpProvider` | Get signatures | `SignatureHelp` |

## MCP Server Provider (mcpServerProvider.ts)

The extension implements VS Code's MCP server discovery interface:

```typescript
export class LSPMcpServerProvider implements vscode.McpServerDefinitionProvider {
    public async provideMcpServerDefinitions(): Promise<vscode.McpServerDefinition[]> {
        // Currently returns empty - tools are provided via Language Model API
        // Could be extended to provide stdio server definitions
        return [];
    }

    public async resolveMcpServerDefinition(
        definition: vscode.McpServerDefinition
    ): Promise<vscode.McpServerDefinition> {
        return definition;
    }
}

export function registerMcpServerProvider(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new LSPMcpServerProvider();
    return vscode.lm.registerMcpServerDefinitionProvider('lsp-mcp-bridge', provider);
}
```

## Standalone MCP Server (mcpServer.ts)

The extension includes an MCP server implementation that could be used standalone:

```typescript
export class LSPMCPServer {
    private mcpServer: McpServer;
    private languageClient: LanguageClient;

    constructor(languageClient: LanguageClient) {
        this.languageClient = languageClient;
        
        this.mcpServer = new McpServer({
            name: 'lsp-mcp-bridge',
            version: '0.0.1',
        });

        this.registerTools();
    }

    private registerTools(): void {
        this.mcpServer.registerTool('lsp.definition', {
            title: 'Get Definition',
            description: 'Get the definition location of a symbol...',
            inputSchema: { /* Zod schema */ }
        }, async (input) => {
            // Tool implementation
            const locations = await this.languageClient.getDefinition(...);
            return { content: [{ type: 'text', text: formatResult(locations) }] };
        });
    }

    public async start(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.mcpServer.connect(transport);
    }
}
```

**Note:** This server is created but not started. To use it as a standalone MCP server, you would need to:
1. Call `mcpServer.start()` in the activation function
2. Configure stdio transport properly
3. Update mcp.json with connection details

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────┐
│ GitHub Copilot Chat                                  │
│ - User asks: "What does calculateDistance do?"       │
└──────────────┬───────────────────────────────────────┘
               │
               │ Tool Invocation
               │ lsp_hover({ uri, line, character })
               ▼
┌──────────────────────────────────────────────────────┐
│ VS Code Language Model API                           │
│ - Routes to registered tool handler                  │
└──────────────┬───────────────────────────────────────┘
               │
               │ invoke()
               ▼
┌──────────────────────────────────────────────────────┐
│ languageModelTools.ts                                │
│ - Tool: lsp_hover                                    │
│ - Validates input                                    │
│ - Calls languageClient.getHover()                    │
└──────────────┬───────────────────────────────────────┘
               │
               │ getHover(uri, position)
               ▼
┌──────────────────────────────────────────────────────┐
│ languageClient.ts (VSCodeLanguageClient)             │
│ - Opens document if needed                           │
│ - Converts position to VS Code format                │
│ - Calls vscode.commands.executeCommand()             │
└──────────────┬───────────────────────────────────────┘
               │
               │ executeCommand('vscode.executeHoverProvider')
               ▼
┌──────────────────────────────────────────────────────┐
│ VS Code Extension Host                               │
│ - Finds active language server for document          │
│ - Routes request to language server client           │
└──────────────┬───────────────────────────────────────┘
               │
               │ textDocument/hover (JSON-RPC)
               ▼
┌──────────────────────────────────────────────────────┐
│ Language Server (e.g., clangd)                       │
│ - Analyzes C++ code at position                     │
│ - Looks up symbol in AST                            │
│ - Returns hover information                          │
└──────────────┬───────────────────────────────────────┘
               │
               │ Hover response
               │ { contents: "int calculateDistance(Point a, Point b)" }
               ▼
┌──────────────────────────────────────────────────────┐
│ Back through the chain...                            │
│ - VS Code converts to vscode.Hover                   │
│ - languageClient converts to LSPHover                │
│ - Tool formats for AI consumption                    │
│ - Returns LanguageModelToolResult                    │
└──────────────┬───────────────────────────────────────┘
               │
               │ Tool Result
               │ "Symbol Information: int calculateDistance(Point a, Point b)"
               ▼
┌──────────────────────────────────────────────────────┐
│ GitHub Copilot                                       │
│ - Receives structured result                         │
│ - Synthesizes natural language response              │
│ - Shows to user: "The calculateDistance function..." │
└──────────────────────────────────────────────────────┘
```

## Language Server Detection

The extension works with any language server through VS Code's unified API:

1. **User opens a file**: e.g., `main.cpp`
2. **VS Code detects language**: `languageId: "cpp"`
3. **Extension activates**: If registered for that language
4. **Language server starts**: e.g., clangd extension starts clangd
5. **VS Code registers providers**: Definition, hover, etc.
6. **Our extension queries**: Via `vscode.commands.executeCommand`

The extension **does not need to know**:
- Which language server is running
- How to start/configure the language server
- Language server specific details

It only needs:
- VS Code's unified provider commands
- Document URI and position information

## Error Handling

Each tool implements robust error handling:

```typescript
try {
    if (!languageClient.isReady()) {
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart('Error: Language client is not ready')
        ]);
    }

    const result = await languageClient.someOperation(...);
    
    if (!result || result.length === 0) {
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart('No results found')
        ]);
    }

    return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(formatResult(result))
    ]);
} catch (error) {
    return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Error: ${error}`)
    ]);
}
```

## Type System

The extension uses TypeScript interfaces to maintain type safety:

```typescript
// From types.ts
export interface LSPPosition {
    line: number;
    character: number;
}

export interface LSPRange {
    start: LSPPosition;
    end: LSPPosition;
}

export interface LSPLocation {
    uri: string;
    range: LSPRange;
}

export interface LanguageClient {
    initialize(): Promise<void>;
    isReady(): boolean;
    getDefinition(uri: string, position: LSPPosition): Promise<LSPLocation[]>;
    // ... other methods
}
```

## Testing

The extension can be tested via:

1. **Command Palette**: `LSP MCP: Test MCP Tools at Cursor`
   - Tests all tools at current cursor position
   - Displays results in notifications

2. **Command Palette**: `LSP MCP: List Language Model Tools`
   - Shows all 10 registered tools
   - Confirms tools are available

3. **GitHub Copilot**: Natural usage
   - Ask questions that require code navigation
   - Copilot automatically uses appropriate tools

## Performance Considerations

- **No Process Overhead**: Reuses existing language server connections
- **Async Operations**: All LSP calls are async/await
- **Timeouts**: Definition requests have 5s timeout
- **Result Limiting**: Some tools limit results (e.g., 20 completions)
- **Lazy Loading**: Documents opened only when needed

## Extensibility

The architecture supports easy addition of new tools:

1. Add tool declaration to `package.json`
2. Implement tool handler in `languageModelTools.ts`
3. Add LSP method to `languageClient.ts` if needed
4. Update type definitions in `types.ts`

Example adding a new "type hierarchy" tool:

```typescript
// 1. Add to package.json contributes.languageModelTools
{
  "name": "lsp_type_hierarchy",
  "toolReferenceName": "type_hierarchy",
  // ... schema
}

// 2. Register in languageModelTools.ts
disposables.push(vscode.lm.registerTool('lsp_type_hierarchy', {
    invoke: async (options, token) => {
        const result = await languageClient.getTypeHierarchy(...);
        return formatTypeHierarchy(result);
    }
}));

// 3. Implement in languageClient.ts
public async getTypeHierarchy(uri: string, position: LSPPosition): Promise<LSPTypeHierarchy[]> {
    return await vscode.commands.executeCommand(
        'vscode.executeTypeHierarchyProvider',
        uri,
        position
    );
}
```

## Summary

The LSP-MCP-Bridge extension contributes tools to the MCP ecosystem by:

1. ✅ **Registering 10 tools** via VS Code's Language Model API
2. ✅ **Leveraging existing LSP infrastructure** through VS Code APIs
3. ✅ **Providing structured input/output** for AI consumption
4. ✅ **Supporting universal language coverage** through LSP
5. ✅ **Enabling automatic discovery** by compatible MCP clients
6. ✅ **Maintaining extensibility** for future tool additions

The tools are **true MCP tools** that follow MCP principles while integrating seamlessly with VS Code's extension ecosystem.
