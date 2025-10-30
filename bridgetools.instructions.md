# LSP-MCP Bridge Tools: AI Agent Usage Instructions

## Overview

This document provides comprehensive instructions for AI coding agents on how to effectively use the LSP-MCP Bridge tools. These tools expose Language Server Protocol (LSP) capabilities through GitHub Copilot's Language Model Tools API, enabling intelligent code navigation, analysis, and exploration.

**Total Tools Available: 19 Tools + 1 Super Tool**

## Quick Reference

| Tool | When to Use | Key Input |
|------|-------------|-----------|
| `lsp_explore_symbol` | 🌟 **First choice** for broad questions | `uri`, `line`, `character` |
| `lsp_explore_references` | Find symbol usages by name | `query` (symbol name) |
| `lsp_hover` | Get type info & documentation | `uri`, `line`, `character` |
| `lsp_definition` | Find where symbol is defined | `uri`, `line`, `character` |
| `lsp_references` | Find all symbol usages | `uri`, `line`, `character` |
| `lsp_workspace_symbols` | Search for symbols by name | `query` (search term) |
| `lsp_document_symbols` | Get file structure/outline | `uri` |

## 🌟 Super Tool: Start Here

### `lsp_explore_symbol` - Comprehensive Symbol Analysis

**Use this FIRST** when users ask broad questions about code!

**When to Use:**
- User asks "What is this?"
- "Tell me about this function/class"
- "Analyze this symbol"
- "Help me understand this code"
- Any comprehensive analysis request

**Input Schema:**
```json
{
  "uri": "file:///absolute/path/to/file.py",
  "line": 45,
  "character": 10,
  "depth": 1,
  "includeCallHierarchy": true,
  "includeTypeHierarchy": true
}
```

**What It Does Automatically:**
- ✅ Hover information (type, docs)
- ✅ Definition location
- ✅ All references
- ✅ Type definitions
- ✅ Implementations
- ✅ Call hierarchy (who calls it, what it calls)
- ✅ Type hierarchy (parent/child classes)

**Example:**
```json
{
  "tool": "lsp_explore_symbol",
  "input": {
    "uri": "file:///workspace/src/calculator.py",
    "line": 23,
    "character": 8
  }
}
```

**Returns:** Comprehensive markdown report with all symbol information organized in sections.

---

## Position-Based Tools

These tools require a specific position in a file (URI + line + character).

### `lsp_hover` - Get Symbol Information

**When to Use:**
- Need type information quickly
- Want documentation/signature
- First step to understand a symbol

**Input Schema:**
```json
{
  "uri": "file:///path/to/file.ts",
  "line": 10,
  "character": 5
}
```

**Example:**
```json
{
  "tool": "lsp_hover",
  "input": {
    "uri": "file:///workspace/src/utils.ts",
    "line": 42,
    "character": 9
  }
}
```

**Returns:** Type signature, documentation, and symbol details.

---

### `lsp_definition` - Find Symbol Definition

**When to Use:**
- "Where is this defined?"
- "Show me the implementation"
- "Jump to definition"

**Input Schema:**
```json
{
  "uri": "file:///path/to/file.js",
  "line": 15,
  "character": 20
}
```

**Example:**
```json
{
  "tool": "lsp_definition",
  "input": {
    "uri": "file:///workspace/src/app.js",
    "line": 67,
    "character": 15
  }
}
```

**Returns:** Location(s) where the symbol is defined (file:line:character).

---

### `lsp_type_definition` - Find Type Definition

**When to Use:**
- "What type is this variable?"
- "Where is this type defined?"
- Working with TypeScript, Java, C++

**Input Schema:**
```json
{
  "uri": "file:///path/to/file.ts",
  "line": 8,
  "character": 12
}
```

**Example:**
```json
{
  "tool": "lsp_type_definition",
  "input": {
    "uri": "file:///workspace/types/models.ts",
    "line": 25,
    "character": 10
  }
}
```

**Returns:** Location of the type definition.

---

### `lsp_declaration` - Find Symbol Declaration

**When to Use:**
- C/C++ code (headers vs implementation)
- "Where is this declared?"
- Need forward declaration location

**Input Schema:**
```json
{
  "uri": "file:///path/to/file.cpp",
  "line": 50,
  "character": 8
}
```

**Example:**
```json
{
  "tool": "lsp_declaration",
  "input": {
    "uri": "file:///workspace/src/main.cpp",
    "line": 120,
    "character": 15
  }
}
```

**Returns:** Location of the declaration (may differ from definition in C/C++).

---

### `lsp_references` - Find All Symbol References

**When to Use:**
- "Where is this used?"
- "Find all usages"
- Impact analysis before refactoring
- Understanding symbol scope

**Input Schema:**
```json
{
  "uri": "file:///path/to/file.py",
  "line": 30,
  "character": 7,
  "includeDeclaration": true
}
```

**Parameters:**
- `includeDeclaration` (optional, default: true) - Include the declaration in results

**Example:**
```json
{
  "tool": "lsp_references",
  "input": {
    "uri": "file:///workspace/lib/helpers.py",
    "line": 15,
    "character": 9,
    "includeDeclaration": false
  }
}
```

**Returns:** List of all locations where the symbol is referenced.

---

### `lsp_implementation` - Find Implementations

**When to Use:**
- "What implements this interface?"
- "Show me concrete classes"
- Working with abstract classes/interfaces

**Input Schema:**
```json
{
  "uri": "file:///path/to/interface.java",
  "line": 5,
  "character": 17
}
```

**Example:**
```json
{
  "tool": "lsp_implementation",
  "input": {
    "uri": "file:///workspace/src/IService.java",
    "line": 3,
    "character": 18
  }
}
```

**Returns:** All classes that implement the interface/abstract class.

---

### `lsp_completion` - Get Code Completions

**When to Use:**
- "What can I type here?"
- "Show available methods"
- "What properties are available?"

**Input Schema:**
```json
{
  "uri": "file:///path/to/file.js",
  "line": 25,
  "character": 10,
  "triggerKind": 1,
  "triggerCharacter": "."
}
```

**Parameters:**
- `triggerKind` (optional): 1=Invoked, 2=TriggerCharacter, 3=Incomplete
- `triggerCharacter` (optional): Character that triggered completion (e.g., ".")

**Example:**
```json
{
  "tool": "lsp_completion",
  "input": {
    "uri": "file:///workspace/src/api.js",
    "line": 88,
    "character": 15,
    "triggerKind": 2,
    "triggerCharacter": "."
  }
}
```

**Returns:** List of completion suggestions with types and documentation.

---

### `lsp_signature_help` - Get Function Signature

**When to Use:**
- "What parameters does this function take?"
- "Show me the function signature"
- User is writing a function call

**Input Schema:**
```json
{
  "uri": "file:///path/to/file.py",
  "line": 40,
  "character": 25,
  "triggerKind": 1,
  "triggerCharacter": "("
}
```

**Parameters:**
- `triggerKind` (optional): How signature help was triggered
- `triggerCharacter` (optional): Trigger character (e.g., "(", ",")

**Example:**
```json
{
  "tool": "lsp_signature_help",
  "input": {
    "uri": "file:///workspace/src/math.py",
    "line": 55,
    "character": 20
  }
}
```

**Returns:** Function signature with parameter information and documentation.

---

### `lsp_code_actions` - Get Quick Fixes & Refactorings

**When to Use:**
- "How can I fix this?"
- "What refactorings are available?"
- Need quick fixes for errors

**Input Schema:**
```json
{
  "uri": "file:///path/to/file.ts",
  "range": {
    "start": { "line": 10, "character": 0 },
    "end": { "line": 10, "character": 50 }
  },
  "context": {
    "only": ["quickfix"]
  }
}
```

**Parameters:**
- `context.only` (optional): Filter by action kind (e.g., ["quickfix", "refactor"])

**Example:**
```json
{
  "tool": "lsp_code_actions",
  "input": {
    "uri": "file:///workspace/src/component.tsx",
    "range": {
      "start": { "line": 22, "character": 0 },
      "end": { "line": 22, "character": 80 }
    }
  }
}
```

**Returns:** Available code actions (quick fixes, refactorings) for the range.

---

### `lsp_format_document` - Preview Document Formatting

**When to Use:**
- "How would this file be formatted?"
- "What formatting changes are needed?"
- Preview style changes

**Input Schema:**
```json
{
  "uri": "file:///path/to/file.js",
  "options": {
    "tabSize": 2,
    "insertSpaces": true
  }
}
```

**Parameters:**
- `options` (optional): Formatting options (tabSize, insertSpaces, etc.)

**Example:**
```json
{
  "tool": "lsp_format_document",
  "input": {
    "uri": "file:///workspace/src/styles.css"
  }
}
```

**Returns:** List of text edits that would be applied for formatting.

---

### `lsp_rename_symbol` - Preview Rename Impact

**When to Use:**
- "What would change if I rename this?"
- "Show rename impact"
- Refactoring analysis

**Input Schema:**
```json
{
  "uri": "file:///path/to/file.py",
  "line": 12,
  "character": 8,
  "newName": "calculateTotal"
}
```

**Example:**
```json
{
  "tool": "lsp_rename_symbol",
  "input": {
    "uri": "file:///workspace/src/calculator.py",
    "line": 35,
    "character": 9,
    "newName": "processData"
  }
}
```

**Returns:** Preview of all files and locations that would be affected by the rename.

---

## Search Tools

### `lsp_workspace_symbols` - Search Symbols Across Workspace

**When to Use:**
- "Find function X"
- "Where is class Y?"
- Don't know file location
- Broad symbol search

**Input Schema:**
```json
{
  "query": "calculateTotal"
}
```

**Example:**
```json
{
  "tool": "lsp_workspace_symbols",
  "input": {
    "query": "UserService"
  }
}
```

**Returns:** List of matching symbols across the entire workspace with locations.

---

### `lsp_document_symbols` - Get Document Structure

**When to Use:**
- "What's in this file?"
- "Show me the file structure"
- "List all functions in this file"
- Getting oriented in a new file

**Input Schema:**
```json
{
  "uri": "file:///path/to/file.java"
}
```

**Example:**
```json
{
  "tool": "lsp_document_symbols",
  "input": {
    "uri": "file:///workspace/src/UserController.java"
  }
}
```

**Returns:** Hierarchical outline of all symbols in the document (classes, methods, variables).

---

### `lsp_explore_references` - Find References by Symbol Name

**When to Use:**
- "Where is functionX used?" (know name, not location)
- "Find all usages of className"
- Search by symbol name instead of position

**Input Schema:**
```json
{
  "query": "Keyserver::secondaryIsAPrimary",
  "maxResults": 100
}
```

**Parameters:**
- `maxResults` (optional, default: 100): Limit number of references displayed

**Example:**
```json
{
  "tool": "lsp_explore_references",
  "input": {
    "query": "calculateDistance",
    "maxResults": 50
  }
}
```

**Returns:** Symbol information + all references grouped by file with line numbers.

---

## Call Hierarchy Tools

These tools work in a two-step pattern: prepare → query.

### `lsp_prepare_call_hierarchy` - Initialize Call Hierarchy

**When to Use:**
- First step before getting incoming/outgoing calls
- "Who calls this function?"
- "What does this function call?"

**Input Schema:**
```json
{
  "uri": "file:///path/to/file.cpp",
  "line": 50,
  "character": 10
}
```

**Example:**
```json
{
  "tool": "lsp_prepare_call_hierarchy",
  "input": {
    "uri": "file:///workspace/src/network.cpp",
    "line": 145,
    "character": 8
  }
}
```

**Returns:** Call hierarchy item(s) to use with incoming/outgoing calls tools.

---

### `lsp_call_hierarchy_incoming` - Get Callers

**When to Use:**
- After `lsp_prepare_call_hierarchy`
- "Who calls this function?"
- "Where is this called from?"

**Input Schema:**
```json
{
  "item": {
    // Call hierarchy item from lsp_prepare_call_hierarchy
    "name": "processRequest",
    "kind": 12,
    "uri": "file:///path/to/file.ts",
    "range": { ... },
    "selectionRange": { ... }
  }
}
```

**Example:**
```json
{
  "tool": "lsp_call_hierarchy_incoming",
  "input": {
    "item": {
      "name": "handleRequest",
      "kind": 6,
      "uri": "file:///workspace/src/handler.ts",
      "range": {
        "start": { "line": 25, "character": 0 },
        "end": { "line": 35, "character": 1 }
      },
      "selectionRange": {
        "start": { "line": 25, "character": 9 },
        "end": { "line": 25, "character": 22 }
      }
    }
  }
}
```

**Returns:** List of functions that call this function.

---

### `lsp_call_hierarchy_outgoing` - Get Callees

**When to Use:**
- After `lsp_prepare_call_hierarchy`
- "What does this function call?"
- "What are the dependencies?"

**Input Schema:**
```json
{
  "item": {
    // Call hierarchy item from lsp_prepare_call_hierarchy
    "name": "processData",
    "kind": 12,
    "uri": "file:///path/to/file.py",
    "range": { ... },
    "selectionRange": { ... }
  }
}
```

**Returns:** List of functions called by this function.

---

## Type Hierarchy Tools

These tools work in a two-step pattern: prepare → query.

### `lsp_prepare_type_hierarchy` - Initialize Type Hierarchy

**When to Use:**
- First step before getting supertypes/subtypes
- "What's the class hierarchy?"
- "Show inheritance tree"

**Input Schema:**
```json
{
  "uri": "file:///path/to/file.java",
  "line": 10,
  "character": 13
}
```

**Example:**
```json
{
  "tool": "lsp_prepare_type_hierarchy",
  "input": {
    "uri": "file:///workspace/src/models/User.java",
    "line": 8,
    "character": 13
  }
}
```

**Returns:** Type hierarchy item(s) to use with supertypes/subtypes tools.

---

### `lsp_type_hierarchy_supertypes` - Get Parent Classes

**When to Use:**
- After `lsp_prepare_type_hierarchy`
- "What does this class extend?"
- "Show parent classes"
- "What interfaces does it implement?"

**Input Schema:**
```json
{
  "item": {
    // Type hierarchy item from lsp_prepare_type_hierarchy
    "name": "Dog",
    "kind": 5,
    "uri": "file:///path/to/file.ts",
    "range": { ... },
    "selectionRange": { ... }
  }
}
```

**Returns:** Parent classes and implemented interfaces.

---

### `lsp_type_hierarchy_subtypes` - Get Child Classes

**When to Use:**
- After `lsp_prepare_type_hierarchy`
- "What extends this class?"
- "Show child classes"
- "What implements this interface?"

**Input Schema:**
```json
{
  "item": {
    // Type hierarchy item from lsp_prepare_type_hierarchy
    "name": "Animal",
    "kind": 5,
    "uri": "file:///path/to/file.ts",
    "range": { ... },
    "selectionRange": { ... }
  }
}
```

**Returns:** All classes that extend/implement this type.

---

## Best Practices for AI Agents

### 1. **Start with Super Tool**
When users ask broad questions, use `lsp_explore_symbol` first. It's more efficient than multiple individual calls.

✅ **Good:**
```
User: "What is this function?"
→ Use lsp_explore_symbol (gets everything)
```

❌ **Bad:**
```
User: "What is this function?"
→ Call lsp_hover
→ Call lsp_definition
→ Call lsp_references
→ Call lsp_prepare_call_hierarchy
→ Call lsp_call_hierarchy_incoming
→ Call lsp_call_hierarchy_outgoing
(6 calls when 1 would suffice)
```

### 2. **Use Specific Tools for Specific Questions**
When users ask specific questions, use the targeted tool.

✅ **Good:**
```
User: "Where is calculateTotal defined?"
→ Use lsp_definition (specific answer)
```

### 3. **Handle Prepare-Query Patterns Automatically**
For call/type hierarchy, make the prepare call first, then use the result.

✅ **Good:**
```javascript
// Step 1: Prepare
const hierarchyItems = await lsp_prepare_call_hierarchy({...});

// Step 2: Query (use item from step 1)
const incomingCalls = await lsp_call_hierarchy_incoming({
  item: hierarchyItems[0]
});
```

### 4. **Use Search Tools When Position Unknown**
If you don't know the file location, use search tools first.

✅ **Good:**
```
User: "Find function calculateTotal"
→ Use lsp_workspace_symbols (search by name)
→ Then use position-based tools with the result
```

### 5. **Provide Workspace-Relative Paths**
When referencing files in responses, use workspace-relative paths for clarity.

✅ **Good:** `src/components/Button.tsx`  
❌ **Bad:** `file:///home/user/project/src/components/Button.tsx`

### 6. **Handle Errors Gracefully**
Tools may fail if the language server isn't ready or doesn't support the feature.

✅ **Good:**
```
Try the tool → If error, explain to user what might be wrong:
- Language server not initialized
- Feature not supported for this language
- Position is outside a symbol
```

### 7. **Respect Tool Limitations**
Each language server supports different features:
- Python: Good support for most features
- TypeScript: Excellent support for all features
- C++: Requires compile_commands.json for best results
- Some languages may not support type/call hierarchy

---

## Common Patterns

### Pattern 1: Exploring Unfamiliar Code
```
1. Use lsp_explore_symbol at cursor position
2. Review returned information
3. If needed, follow up with specific tools for details
```

### Pattern 2: Finding and Analyzing a Symbol
```
1. Use lsp_workspace_symbols to find the symbol
2. Use lsp_explore_symbol at the found location
3. Get comprehensive analysis
```

### Pattern 3: Refactoring Impact Analysis
```
1. Use lsp_references to see all usages
2. Use lsp_rename_symbol to preview changes
3. Use lsp_call_hierarchy_incoming to see callers
4. Assess impact before suggesting changes
```

### Pattern 4: Understanding Type Relationships
```
1. Use lsp_prepare_type_hierarchy at class definition
2. Use lsp_type_hierarchy_supertypes to see parents
3. Use lsp_type_hierarchy_subtypes to see children
4. Build complete inheritance tree
```

---

## Troubleshooting

### No Results from Tools?

**Check:**
1. **Language server active?** - Ensure the file type has a language server
2. **File saved?** - Some language servers require saved files
3. **Cursor position?** - Must be on a valid symbol (not whitespace/comments)
4. **Indexing complete?** - Language server may still be indexing

**Solutions:**
- Wait a moment for language server to initialize
- Ensure cursor is positioned on a symbol name
- Check file is saved and has correct extension
- Verify language server is installed for the language

### Tool Returns "Not Ready" Error?

**Cause:** Language server hasn't finished initializing

**Solution:** Wait 1-2 seconds and retry, or try a different tool

### Empty Hierarchy Results?

**Cause:** Language or language server doesn't support call/type hierarchy

**Solution:** Use alternative tools:
- Instead of call hierarchy → use `lsp_references` to find usages
- Instead of type hierarchy → use `lsp_implementation` for interfaces

---

## URI Format

All tools use file URIs in the format:
```
file:///absolute/path/to/file.ext
```

**Examples:**
- Windows: `file:///c:/Users/name/project/src/app.js`
- Linux/Mac: `file:///home/user/project/src/app.py`

**Important:** Always use absolute paths, not relative paths.

---

## Position Indexing

All positions are **0-based**:
- `line: 0` = First line
- `character: 0` = First character

**Example:**
```
Line 1: function hello() {
         ^        ^
         |        character: 9
         character: 0
```

To reference "hello":
```json
{
  "line": 0,     // First line (0-based)
  "character": 9 // Position of 'h' in 'hello'
}
```

---

## Summary

### Decision Tree for Tool Selection

```
Is the question broad ("What is this?", "Analyze X")?
├─ YES → Use lsp_explore_symbol (super tool)
└─ NO → Continue...

Do you know the file and position?
├─ YES → Use position-based tool (lsp_hover, lsp_definition, etc.)
└─ NO → Continue...

Do you know the symbol name?
├─ YES → Use lsp_workspace_symbols or lsp_explore_references
└─ NO → Ask user for more context

Need call relationships?
├─ Use lsp_prepare_call_hierarchy + lsp_call_hierarchy_incoming/outgoing
└─ Or use lsp_explore_symbol (does it automatically)

Need type relationships?
├─ Use lsp_prepare_type_hierarchy + lsp_type_hierarchy_supertypes/subtypes
└─ Or use lsp_explore_symbol (does it automatically)
```

### Quick Command Reference

**Most Common Commands:**
1. `lsp_explore_symbol` - Comprehensive analysis ⭐
2. `lsp_hover` - Quick type info
3. `lsp_definition` - Find definition
4. `lsp_references` - Find usages
5. `lsp_workspace_symbols` - Search by name

**Use these 5 tools for 90% of tasks!**

---

## Additional Resources

- **README.md** - User-facing documentation
- **MCP_USAGE.md** - MCP integration details
- **SUPER_TOOL_DOCUMENTATION.md** - Deep dive into lsp_explore_symbol
- **ARCHITECTURE.md** - Technical architecture
- **package.json** - Complete tool schemas

---

## Tool Feature Matrix

| Feature | Tools That Support It |
|---------|----------------------|
| Position Required | definition, references, hover, completion, signature_help, type_definition, declaration, implementation, prepare_call_hierarchy, prepare_type_hierarchy, rename_symbol, code_actions, format_document, explore_symbol |
| Search by Name | workspace_symbols, explore_references |
| No Position Needed | document_symbols, workspace_symbols, explore_references |
| Requires Prepare Step | call_hierarchy_incoming, call_hierarchy_outgoing, type_hierarchy_supertypes, type_hierarchy_subtypes |
| Works Across Files | references, workspace_symbols, explore_references, rename_symbol |

---

**Last Updated:** 2025-10-30  
**Extension Version:** 1.0.1  
**API Version:** VS Code Language Model Tools API
