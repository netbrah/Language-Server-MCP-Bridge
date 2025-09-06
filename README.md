# Clangd MCP Server

A Visual Studio Code extension that exposes [clangd](https://clangd.llvm.org/) Language Server Protocol (LSP) capabilities as [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) tools. This extension allows MCP clients to access C/C++ code intelligence through clangd without spawning additional processes.

## 🎯 Purpose

This extension bridges the gap between clangd's powerful C/C++ language server capabilities and MCP clients, enabling AI models and tools to:

- Navigate C/C++ codebases intelligently
- Provide context-aware code suggestions
- Answer questions about code structure and functionality
- Assist with code refactoring and analysis

## 🚀 Features

### MCP Tools Provided

The extension exposes four core clangd capabilities as MCP tools:

1. **`clangd.definition`** - Find symbol definitions
2. **`clangd.references`** - Find all references to a symbol
3. **`clangd.hover`** - Get symbol information and documentation
4. **`clangd.completion`** - Get code completion suggestions

### Key Benefits

- **🔄 Process Reuse**: Leverages the existing clangd LanguageClient in VSCode (no new clangd process)
- **⚡ High Performance**: Direct integration with VSCode's language services
- **🛡️ Type Safety**: Full TypeScript implementation with comprehensive error handling
- **🧪 Well Tested**: Complete test suite with mock implementations
- **📋 Standards Compliant**: Follows MCP protocol specifications

## 📦 Installation

### Prerequisites

- Visual Studio Code 1.74.0 or later
- Node.js 18.x or later
- clangd installed and configured in your VSCode environment

### From Source

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd clangd-mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Install the extension in VSCode:
   ```bash
   # Package the extension
   npx vsce package
   
   # Install the .vsix file in VSCode
   code --install-extension clangd-mcp-server-*.vsix
   ```

## 🛠️ Configuration

### MCP Manifest

The extension provides a `mcp.json` manifest that describes the available tools:

```json
{
  "name": "clangd-mcp-server",
  "version": "1.0.0",
  "description": "Exposes clangd LSP capabilities as MCP tools",
  "tools": [
    {
      "name": "clangd.definition",
      "description": "Find symbol definitions using clangd",
      "inputSchema": {
        "type": "object",
        "properties": {
          "uri": { "type": "string", "description": "File URI" },
          "position": {
            "type": "object",
            "properties": {
              "line": { "type": "number", "description": "0-based line number" },
              "character": { "type": "number", "description": "0-based character offset" }
            }
          }
        }
      }
    }
    // ... other tools
  ]
}
```

### VSCode Settings

Ensure clangd is properly configured in your VSCode settings:

```json
{
  "clangd.path": "/path/to/clangd",
  "clangd.arguments": ["--log=verbose", "--pretty"],
  "clangd.fallbackFlags": ["-std=c++17"]
}
```

## 📚 Usage

### Setting Up a C++ Project

1. Create a `compile_commands.json` file in your project root:
   ```json
   [
     {
       "directory": "/path/to/your/project",
       "command": "clang++ -std=c++17 -o main main.cpp",
       "file": "/path/to/your/project/main.cpp"
     }
   ]
   ```

2. Open the project in VSCode and ensure clangd activates

3. The MCP server will automatically be available when the extension activates

### Using MCP Tools

#### Finding Definitions

```typescript
// MCP client request
{
  "method": "tools/call",
  "params": {
    "name": "clangd.definition",
    "arguments": {
      "uri": "file:///path/to/file.cpp",
      "position": {
        "line": 10,
        "character": 5
      }
    }
  }
}
```

#### Finding References

```typescript
{
  "method": "tools/call", 
  "params": {
    "name": "clangd.references",
    "arguments": {
      "uri": "file:///path/to/file.cpp",
      "position": {
        "line": 10,
        "character": 5
      },
      "includeDeclaration": true
    }
  }
}
```

#### Getting Hover Information

```typescript
{
  "method": "tools/call",
  "params": {
    "name": "clangd.hover", 
    "arguments": {
      "uri": "file:///path/to/file.cpp",
      "position": {
        "line": 10,
        "character": 5
      }
    }
  }
}
```

#### Getting Completions

```typescript
{
  "method": "tools/call",
  "params": {
    "name": "clangd.completion",
    "arguments": {
      "uri": "file:///path/to/file.cpp", 
      "position": {
        "line": 10,
        "character": 5
      },
      "triggerCharacter": "."
    }
  }
}
```

## 🏗️ Architecture

### Project Structure

```
src/
├── extension.ts         # VSCode extension entry point
├── mcpServer.ts        # Main MCP server implementation  
├── clangdClient.ts     # VSCode LanguageClient wrapper
├── types.ts            # TypeScript type definitions
└── test/
    └── extension.test.ts # Comprehensive test suite

test-project/           # Example C++ project for testing
├── main.cpp
├── utils.h
├── utils.cpp
├── compile_commands.json
└── Makefile

mcp.json               # MCP manifest
package.json           # Extension manifest
tsconfig.json          # TypeScript configuration
```

### Core Components

1. **ClangdMCPServer**: Main MCP server class that registers and handles tool calls
2. **VSCodeClangdClient**: Adapter that wraps VSCode's LanguageClient for clangd
3. **Type System**: Comprehensive TypeScript interfaces for LSP and MCP integration
4. **Validation**: Zod schemas for runtime input validation and type safety

### Data Flow

```
MCP Client Request → ClangdMCPServer → VSCodeClangdClient → clangd LSP → Response
```

## 🧪 Testing

Run the complete test suite:

```bash
npm test
```

This will:
1. Compile TypeScript code
2. Run ESLint for code quality
3. Execute all unit tests in VSCode test environment

### Test Coverage

- ✅ MCP server instantiation and tool registration
- ✅ Mock clangd client implementations
- ✅ Request/response handling for all four tools
- ✅ Input validation and error handling
- ✅ TypeScript interface compliance
- ✅ Empty response scenarios

## 📋 Development

### Building

```bash
# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Lint code
npm run lint
```

### Testing the Extension

1. Open the project in VSCode
2. Press `F5` to launch Extension Development Host
3. Open the test-project folder in the new window
4. Use Command Palette: "Start MCP Server" to manually start the server
5. The MCP server will be available for client connections

### Adding New Tools

1. Define the tool schema in `mcp.json`
2. Add corresponding TypeScript interfaces in `types.ts`
3. Implement the tool handler in `mcpServer.ts`
4. Add comprehensive tests in `extension.test.ts`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm test`
5. Commit your changes: `git commit -m 'feat: add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `test:` adding or updating tests
- `refactor:` code refactoring
- `chore:` maintenance tasks

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [clangd](https://clangd.llvm.org/) - The C++ language server
- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol specification
- [VSCode Language Client](https://github.com/microsoft/vscode-languageserver-node) - LSP client implementation

## 🐛 Troubleshooting

### Common Issues

**Q: clangd not found or not responding**
A: Ensure clangd is installed and the path is correctly set in VSCode settings. Check that `compile_commands.json` exists in your project.

**Q: MCP server fails to start**
A: Check the VSCode Developer Console (Help → Toggle Developer Tools) for error messages. Ensure all dependencies are installed.

**Q: No completion results**
A: Verify that the file is saved and clangd has finished indexing. Check that the cursor position is valid for the file content.

**Q: Extension doesn't activate**
A: Ensure you have C/C++ files in your workspace. The extension only activates for C/C++ language contexts.

### Debug Mode

Enable verbose logging by setting clangd arguments in VSCode settings:

```json
{
  "clangd.arguments": ["--log=verbose", "--pretty"]
}
```

View logs in: VSCode Output Panel → "Clang Language Server"

---

For more help, please [open an issue](https://github.com/your-username/clangd-mcp-server/issues) on GitHub.
