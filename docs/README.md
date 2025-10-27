# Index of Documentation

This directory contains comprehensive documentation about how MCP (Model Context Protocol) is used in the LSP-MCP-Bridge extension.

## Quick Start

**New to this project?** Start here:
1. Read [../MCP_USAGE.md](../MCP_USAGE.md) - High-level summary answering "How is MCP being used?"
2. Browse [FAQ.md](FAQ.md) - Common questions and answers
3. Review [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) - Visual architecture overview

## Documentation Files

### [MCP_USAGE.md](../MCP_USAGE.md)
**Location:** Root directory  
**Purpose:** Direct answer to "How is MCP being used here?"  
**Best for:** Quick understanding, executive summary

**Key topics:**
- 10 tools contributed via MCP
- How tools are registered
- Integration with clangd and VS Code
- Real-world usage examples

### [FAQ.md](FAQ.md)
**Purpose:** Answers to common questions  
**Best for:** Clarifying specific doubts, troubleshooting understanding

**Questions answered:**
- Is MCP contributing tools?
- How does this integrate with clangd?
- Is the Language Model API used?
- Does this replace IntelliSense?
- Why is there an unused mcpServer.ts?
- Can I use these tools from external MCP clients?

### [MCP_ARCHITECTURE.md](MCP_ARCHITECTURE.md)
**Purpose:** Comprehensive architecture explanation  
**Best for:** Deep understanding, architectural decisions

**Topics covered:**
- Three ways MCP is used in the project
- Integration with VS Code language servers
- Comparison with clangd extension
- Tool contribution mechanism
- Architecture patterns
- Future enhancements

### [TECHNICAL_INTEGRATION.md](TECHNICAL_INTEGRATION.md)
**Purpose:** Implementation details and code walkthroughs  
**Best for:** Developers, contributors, code understanding

**Contents:**
- Tool registration flow with code examples
- VS Code LSP commands used
- MCP server provider implementation
- Data flow diagrams
- Type system overview
- Error handling patterns
- Extensibility guide

### [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)
**Purpose:** Visual representation of system architecture  
**Best for:** Visual learners, understanding data flow

**Includes:**
- High-level architecture diagram
- Detailed data flow example
- Protocol translation examples
- Component responsibility table
- Comparison with standalone MCP servers

## Reading Paths

### Path 1: "I just want to understand what this does"
1. [../MCP_USAGE.md](../MCP_USAGE.md) - 10 minutes
2. [FAQ.md](FAQ.md) - Skim for relevant questions

### Path 2: "I need to explain this to others"
1. [../MCP_USAGE.md](../MCP_USAGE.md)
2. [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)
3. [FAQ.md](FAQ.md)

### Path 3: "I want to contribute or extend this"
1. [TECHNICAL_INTEGRATION.md](TECHNICAL_INTEGRATION.md) - Detailed walkthrough
2. [MCP_ARCHITECTURE.md](MCP_ARCHITECTURE.md) - Architectural decisions
3. [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) - Visual reference

### Path 4: "I'm researching MCP implementations"
1. [MCP_ARCHITECTURE.md](MCP_ARCHITECTURE.md) - Architecture overview
2. [TECHNICAL_INTEGRATION.md](TECHNICAL_INTEGRATION.md) - Implementation details
3. [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) - Comparison with other approaches

## Key Concepts

### MCP (Model Context Protocol)
A protocol for exposing tools and resources to AI language models. This extension uses MCP principles via VS Code's Language Model API.

### LSP (Language Server Protocol)
A protocol for providing language features (IntelliSense, go-to-definition, etc.) to code editors. Language servers like clangd implement LSP.

### Language Model Tools API
VS Code's implementation of MCP concepts. Extensions can register tools that AI assistants like GitHub Copilot can use automatically.

### The Bridge
This extension bridges MCP (tool-based, AI-friendly) and LSP (position-based, editor-friendly) protocols, making language server intelligence accessible to AI.

## Visual Summary

```
MCP Tools              LSP Features
(AI uses)              (Editors use)
    ↓                       ↑
    └──── This Bridge ──────┘
```

The extension translates between:
- AI queries → Language server requests
- Language server responses → AI-friendly results

## Quick Reference

| Tool Name | LSP Feature | Purpose |
|-----------|-------------|---------|
| `lsp_definition` | textDocument/definition | Find where symbols are defined |
| `lsp_references` | textDocument/references | Find all uses of a symbol |
| `lsp_hover` | textDocument/hover | Get type info and docs |
| `lsp_completion` | textDocument/completion | Get completion suggestions |
| `lsp_workspace_symbols` | workspace/symbol | Search symbols across workspace |
| `lsp_document_symbols` | textDocument/documentSymbol | Get file structure |
| `lsp_rename_symbol` | textDocument/rename | Preview rename impact |
| `lsp_code_actions` | textDocument/codeAction | Get quick fixes |
| `lsp_format_document` | textDocument/formatting | Preview formatting |
| `lsp_signature_help` | textDocument/signatureHelp | Get function signatures |

## External Resources

### Official Documentation
- [Model Context Protocol](https://modelcontextprotocol.io/) - Official MCP specification
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) - Official LSP specification
- [VS Code Language Extensions](https://code.visualstudio.com/api/language-extensions/overview) - VS Code extension guide

### Related Projects
- [clangd](https://clangd.llvm.org/) - C/C++ language server
- [vscode-clangd](https://github.com/llvm/vscode-clangd) - VS Code extension for clangd
- [GitHub Copilot](https://github.com/features/copilot) - AI pair programmer

## Contributing

See the main [README.md](../README.md) for contribution guidelines.

When adding new documentation:
1. Keep it focused on a specific topic
2. Link to related documents
3. Update this index
4. Include code examples where relevant
5. Add diagrams for complex concepts

## Feedback

Found documentation unclear or missing information? Please open an issue on the GitHub repository!

---

**Last Updated:** 2025-10-26  
**Documentation Version:** 1.0
