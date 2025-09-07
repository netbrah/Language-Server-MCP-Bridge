# LSP MCP Bridge

A Visual Studio Code extension that exposes **any Language Server Protocol (LSP)** capabilities as [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) tools and **GitHub Copilot Language Model Tools**. This universal extension works with any programming language that has an active language server in VSCode.

I created this because I work on an incredibly large C++ project (with `clangd`) and Copilot is not able find objects efficiently.

## 🎯 Purpose

This extension bridges the gap between any existing language server's capabilities and MCP clients + GitHub Copilot, enabling AI models and tools to:

- Navigate codebases intelligently across **any programming language**
- Provide context-aware code suggestions and analysis
- Answer questions about code structure and functionality  
- Assist with code refactoring and analysis
- **Automatically enhance GitHub Copilot** with deep language server insights

## 🚀 Features

### Language Model Tools for GitHub Copilot (10 Tools)

The extension exposes comprehensive LSP capabilities as GitHub Copilot tools that can be used **automatically**:

1. **`lsp_definition`** - Find symbol definitions
2. **`lsp_references`** - Find all references to a symbol  
3. **`lsp_hover`** - Get symbol information and documentation
4. **`lsp_completion`** - Get code completion suggestions
5. **`lsp_workspace_symbols`** - Search symbols across the workspace
6. **`lsp_document_symbols`** - Get document structure/outline
7. **`lsp_rename_symbol`** - Preview symbol rename impact
8. **`lsp_code_actions`** - Get available quick fixes and refactorings
9. **`lsp_format_document`** - Preview document formatting
10. **`lsp_signature_help`** - Get function signature and parameter help

### Universal Language Support

Works with **any programming language** that has an active language server in VSCode:
- **Python** (Pylance, Jedi)
- **TypeScript/JavaScript** (Built-in)
- **Rust** (rust-analyzer)
- **Go** (Go extension)
- **C/C++** (C/C++ extension, clangd)
- **Java** (Language Support for Java)
- **C#** (.NET extension)
- **PHP** (Intelephense)
- **Ruby** (Solargraph)
- **And many more...**

## 📦 Installation

### Prerequisites

- Visual Studio Code 1.103.0 or later
- Node.js 18.x or later
- Any language server configured in your VSCode environment

### From VSIX Package

1. Download the latest `lsp-mcp-bridge-0.0.1.vsix` release
2. Install the extension:
   ```bash
   code --install-extension lsp-mcp-bridge-0.0.1.vsix
   ```
3. Reload VSCode
4. The tools are automatically available to GitHub Copilot!

### From Source

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd lsp-mcp-bridge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile and package:
   ```bash
   npm run compile
   npx @vscode/vsce package
   ```

4. Install the extension:
   ```bash
   code --install-extension lsp-mcp-bridge-0.0.1.vsix
   ```

## 🛠️ Usage

### With GitHub Copilot (Automatic)

Once installed, all LSP tools are **automatically available** to GitHub Copilot. Copilot will use them automatically when:

- You ask about code structure or symbols
- You need to understand unfamiliar code
- You want to find references or definitions
- You're working on refactoring tasks
- You ask for code suggestions or improvements

**Example**: Just ask Copilot *"What does this function do?"* while your cursor is on a function, and it will automatically use the `hover` and `definition` tools to provide a comprehensive answer.

### Auto-Discovery by VS Code

The extension automatically registers itself with VS Code's MCP system, so:

- **No manual startup required** - Tools are immediately available
- **Automatic tool discovery** - VS Code finds the extension's capabilities automatically  
- **Seamless integration** - Works with VS Code's built-in MCP support

### Manual Testing

Use the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

1. **"LSP MCP: Test MCP Tools at Cursor"** - Test the core tools at your cursor position
2. **"LSP MCP: List Language Model Tools"** - See all 10 registered tools

### With External MCP Clients

The extension also automatically registers with VS Code's MCP system, making it discoverable by external MCP clients without any additional configuration.

## 🔧 Configuration

**No additional configuration required!** The extension automatically works with any language servers you have configured in VSCode.

### Supported Language Servers

The extension works with any LSP-compliant language server installed in VSCode:

| Language | Language Server | Extension |
|----------|----------------|-----------|
| C/C++ | C/C++ extension, clangd | C/C++ or clangd extension |
| Python | Pylance, Jedi | Python extension |
| TypeScript/JavaScript | Built-in TS Server | Built-in |
| Rust | rust-analyzer | rust-analyzer extension |
| Go | gopls | Go extension |
| Java | Eclipse JDT | Language Support for Java |
| C# | OmniSharp | C# Dev Kit |
| PHP | Intelephense | PHP Intelephense |
| Ruby | Solargraph | Ruby LSP |

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test
```

The test suite includes:
- Unit tests for all LSP client methods
- Mock implementations for testing
- Integration tests for MCP server functionality
- Type validation tests
- GitHub Copilot tool registration tests

## 📚 API Reference

### Language Model Tools

All tools are automatically registered with GitHub Copilot and can be referenced by their `toolReferenceName`:

| Tool | Reference Name | Description |
|------|----------------|-------------|
| `lsp_definition` | `#definition` | Find symbol definitions |
| `lsp_references` | `#references` | Find symbol references |
| `lsp_hover` | `#hover` | Get symbol information |
| `lsp_completion` | `#completion` | Get completions |
| `lsp_workspace_symbols` | `#workspace_symbols` | Search workspace symbols |
| `lsp_document_symbols` | `#document_symbols` | Get document outline |
| `lsp_rename_symbol` | `#rename` | Preview rename impact |
| `lsp_code_actions` | `#code_actions` | Get quick fixes |
| `lsp_format_document` | `#format` | Preview formatting |
| `lsp_signature_help` | `#signature_help` | Get function signatures |

### Input Schemas

All tools use consistent input schemas based on LSP specifications:

**Position-based tools** (definition, references, hover, completion, signature_help):
```typescript
{
  uri: string;        // File URI (e.g., "file:///path/to/file.py")
  line: number;       // 0-based line number
  character: number;  // 0-based character offset
}
```

**Workspace symbol search**:
```typescript
{
  query: string;      // Search query for symbol names
}
```

**Document symbols**:
```typescript
{
  uri: string;        // File URI
}
```

**Code actions**:
```typescript
{
  uri: string;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}
```

## 🔍 How It Works

1. **Extension Activation**: Registers all 10 LSP tools with VSCode's Language Model API
2. **GitHub Copilot Integration**: Tools are automatically available to Copilot via `toolReferenceName`
3. **LSP Bridge**: Uses VSCode's `executeCommand` API to access any active language server
4. **Universal Support**: Works with any LSP-compliant language server
5. **No Extra Processes**: Reuses existing language server connections

## 🐛 Troubleshooting

### Tools Not Appearing in Copilot
- Ensure VSCode is version 1.103.0 or later
- Reload VSCode after installation
- Check that the extension is enabled in Extensions view

### No Results from Tools
- Ensure you have a language server active for your file type
- Check that the file is saved and language server is initialized
- Verify cursor position is on a valid symbol

### Language Server Not Working
- Install the appropriate language extension for your programming language
- Check VSCode's Output panel for language server logs
- Ensure your project is properly configured (e.g., `package.json` for Node.js)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-capability`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Built on top of VSCode's excellent Language Server Protocol support
- Inspired by the Model Context Protocol specification
- Designed to enhance GitHub Copilot's capabilities