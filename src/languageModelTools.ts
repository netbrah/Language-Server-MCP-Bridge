import * as vscode from 'vscode';
import { VSCodeLanguageClient } from './languageClient';

/**
 * Input schema for position-based tools
 */
interface ToolPositionInput {
    uri: string;
    line: number;
    character: number;
}

/**
 * Input schema for references tool
 */
interface ToolReferencesInput extends ToolPositionInput {
    includeDeclaration?: boolean;
}

/**
 * Input schema for completion tool
 */
interface ToolCompletionInput extends ToolPositionInput {
    triggerKind?: number;
    triggerCharacter?: string;
}

/**
 * Input schema for workspace symbols tool
 */
interface ToolWorkspaceSymbolsInput {
    query: string;
}

/**
 * Input schema for document symbols tool
 */
interface ToolDocumentSymbolsInput {
    uri: string;
}

/**
 * Input schema for rename symbol tool
 */
interface ToolRenameInput extends ToolPositionInput {
    newName: string;
}

/**
 * Input schema for code actions tool
 */
interface ToolCodeActionsInput {
    uri: string;
    range: {
        start: { line: number; character: number };
        end: { line: number; character: number };
    };
    context?: {
        only?: string[];
    };
}

/**
 * Input schema for format document tool
 */
interface ToolFormatInput {
    uri: string;
    options?: any;
}

/**
 * Input schema for signature help tool
 */
interface ToolSignatureHelpInput extends ToolPositionInput {
    triggerKind?: number;
    triggerCharacter?: string;
}

/**
 * Input schema for explore symbol super tool
 */
interface ToolExploreSymbolInput extends ToolPositionInput {
    depth?: number;
    includeCallHierarchy?: boolean;
    includeTypeHierarchy?: boolean;
}

/**
 * Input schema for explore references tool
 */
interface ToolExploreReferencesInput {
    query: string;
    maxResults?: number;
}

/**
 * Register all Language Model Tools for GitHub Copilot integration
 */
export function registerLanguageModelTools(languageClient: VSCodeLanguageClient): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];

        // Register lsp_definition tool
    disposables.push(vscode.lm.registerTool('lsp_definition', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolPositionInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const locations = await languageClient.getDefinition(input.uri, {
                    line: input.line,
                    character: input.character
                });

                if (locations.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No definition found for symbol at the specified position')
                    ]);
                }

                const response = `Found ${locations.length} definition(s):\n\n` +
                    locations.map((loc, index) => {
                        const uri = vscode.Uri.parse(loc.uri);
                        
                        // Try to get workspace-relative path, fall back to better path representation
                        let displayPath: string;
                        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
                        if (workspaceFolder) {
                            displayPath = vscode.workspace.asRelativePath(uri);
                        } else {
                            // Show last 2-3 path segments for better context
                            const pathParts = uri.fsPath.split('/');
                            if (pathParts.length > 3) {
                                displayPath = '...' + pathParts.slice(-3).join('/');
                            } else {
                                displayPath = uri.fsPath;
                            }
                        }
                        
                        return `${index + 1}. ${displayPath}:${loc.range.start.line + 1}:${loc.range.start.character + 1}`;
                    }).join('\n');

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error getting definition: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_references tool
    disposables.push(vscode.lm.registerTool('lsp_references', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolReferencesInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const locations = await languageClient.getReferences(input.uri, {
                    line: input.line,
                    character: input.character
                }, input.includeDeclaration ?? true);

                if (locations.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No references found for symbol at the specified position')
                    ]);
                }

                const response = `Found ${locations.length} reference(s):\n\n` +
                    locations.map((loc, index) => {
                        const uri = vscode.Uri.parse(loc.uri);
                        const fileName = uri.fsPath.split('/').pop() || uri.fsPath;
                        return `${index + 1}. ${fileName}:${loc.range.start.line + 1}:${loc.range.start.character + 1}`;
                    }).join('\n');

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error getting references: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_hover tool
    disposables.push(vscode.lm.registerTool('lsp_hover', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolPositionInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const hover = await languageClient.getHover(input.uri, {
                    line: input.line,
                    character: input.character
                });

                if (!hover) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No hover information available for symbol at the specified position')
                    ]);
                }

                let hoverText = '';
                if (typeof hover.contents === 'string') {
                    hoverText = hover.contents;
                } else if (hover.contents && typeof hover.contents === 'object' && 'value' in hover.contents) {
                    hoverText = hover.contents.value;
                } else {
                    hoverText = 'Hover information available but format not recognized';
                }

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Symbol Information:\n\n${hoverText}`)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error getting hover info: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_completion tool
    disposables.push(vscode.lm.registerTool('lsp_completion', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolCompletionInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const completions = await languageClient.getCompletion(input.uri, {
                    line: input.line,
                    character: input.character
                }, input.triggerKind, input.triggerCharacter);

                if (!completions.items || completions.items.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No completions available at the specified position')
                    ]);
                }

                const response = `Found ${completions.items.length} completion(s)${completions.isIncomplete ? ' (incomplete)' : ''}:\n\n` +
                    completions.items.slice(0, 20).map((item, index) => { // Limit to first 20
                        let itemText = `${index + 1}. ${item.label}`;
                        if (item.kind) {
                            itemText += ` (${getCompletionKindString(item.kind)})`;
                        }
                        if (item.detail) {
                            itemText += `\n   ${item.detail}`;
                        }
                        return itemText;
                    }).join('\n\n');

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error getting completions: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_workspace_symbols tool
    disposables.push(vscode.lm.registerTool('lsp_workspace_symbols', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolWorkspaceSymbolsInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const symbols = await languageClient.getWorkspaceSymbols(input.query);

                if (symbols.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(`No symbols found matching query: "${input.query}"`)
                    ]);
                }

                const response = `Found ${symbols.length} symbol(s) matching "${input.query}":\n\n` +
                    symbols.slice(0, 30).map((symbol, index) => {
                        const uri = vscode.Uri.parse(symbol.location.uri);
                        const fileName = uri.fsPath.split('/').pop() || uri.fsPath;
                        const kindStr = getSymbolKindString(symbol.kind);
                        return `${index + 1}. ${symbol.name} (${kindStr}) - ${fileName}:${symbol.location.range.start.line + 1}`;
                    }).join('\n');

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error searching workspace symbols: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_document_symbols tool
    disposables.push(vscode.lm.registerTool('lsp_document_symbols', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolDocumentSymbolsInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const symbols = await languageClient.getDocumentSymbols(input.uri);

                if (symbols.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No symbols found in the document')
                    ]);
                }

                const response = `Found ${symbols.length} symbol(s) in document:\n\n` +
                    formatDocumentSymbols(symbols, 0).join('\n');

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error getting document symbols: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_rename_symbol tool
    disposables.push(vscode.lm.registerTool('lsp_rename_symbol', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolRenameInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const workspaceEdit = await languageClient.renameSymbol(input.uri, {
                    line: input.line,
                    character: input.character
                }, input.newName);

                if (!workspaceEdit || !workspaceEdit.changes || Object.keys(workspaceEdit.changes).length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No renames possible for symbol at the specified position')
                    ]);
                }

                let totalEdits = 0;
                const fileChanges = Object.entries(workspaceEdit.changes).map(([uri, edits]) => {
                    totalEdits += edits.length;
                    const parsedUri = vscode.Uri.parse(uri);
                    const fileName = parsedUri.fsPath.split('/').pop() || parsedUri.fsPath;
                    return `- ${fileName}: ${edits.length} edit(s)`;
                }).join('\n');

                const response = `Rename would affect ${Object.keys(workspaceEdit.changes).length} file(s) with ${totalEdits} total edit(s):\n\n${fileChanges}`;

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error renaming symbol: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_code_actions tool
    disposables.push(vscode.lm.registerTool('lsp_code_actions', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolCodeActionsInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const codeActions = await languageClient.getCodeActions(input.uri, input.range, input.context);

                if (codeActions.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No code actions available for the specified range')
                    ]);
                }

                const response = `Found ${codeActions.length} code action(s):\n\n` +
                    codeActions.map((action, index) => {
                        let actionText = `${index + 1}. ${action.title}`;
                        if (action.kind) {
                            actionText += ` (${action.kind})`;
                        }
                        if (action.edit) {
                            const fileCount = Object.keys(action.edit.changes || {}).length;
                            actionText += ` - affects ${fileCount} file(s)`;
                        }
                        if (action.command) {
                            actionText += ` - executes command: ${action.command.command}`;
                        }
                        return actionText;
                    }).join('\n');

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error getting code actions: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_format_document tool
    disposables.push(vscode.lm.registerTool('lsp_format_document', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolFormatInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const edits = await languageClient.formatDocument(input.uri, input.options);

                if (edits.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No formatting changes needed')
                    ]);
                }

                const response = `Document formatting would apply ${edits.length} edit(s):\n\n` +
                    edits.slice(0, 10).map((edit, index) => {
                        const range = `${edit.range.start.line + 1}:${edit.range.start.character}-${edit.range.end.line + 1}:${edit.range.end.character}`;
                        const preview = edit.newText.length > 50 ? edit.newText.substring(0, 50) + '...' : edit.newText;
                        return `${index + 1}. Line ${range}: "${preview}"`;
                    }).join('\n');

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error formatting document: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_signature_help tool
    disposables.push(vscode.lm.registerTool('lsp_signature_help', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolSignatureHelpInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const signatureHelp = await languageClient.getSignatureHelp(input.uri, {
                    line: input.line,
                    character: input.character
                }, input.triggerKind, input.triggerCharacter);

                if (!signatureHelp || !signatureHelp.signatures || signatureHelp.signatures.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No signature help available at the specified position')
                    ]);
                }

                const activeSignature = signatureHelp.signatures[signatureHelp.activeSignature || 0];
                const activeParam = activeSignature.parameters?.[signatureHelp.activeParameter || 0];

                let response = `Signature Help:\n\n${activeSignature.label}`;
                
                if (activeSignature.documentation) {
                    response += `\n\nDescription: ${activeSignature.documentation}`;
                }

                if (activeParam) {
                    response += `\n\nActive Parameter: ${activeParam.label}`;
                    if (activeParam.documentation) {
                        response += `\nParameter Description: ${activeParam.documentation}`;
                    }
                }

                if (signatureHelp.signatures.length > 1) {
                    response += `\n\nOther overloads available: ${signatureHelp.signatures.length - 1}`;
                }

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error getting signature help: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_type_definition tool
    disposables.push(vscode.lm.registerTool('lsp_type_definition', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolPositionInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const locations = await languageClient.getTypeDefinition(input.uri, {
                    line: input.line,
                    character: input.character
                });

                if (locations.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No type definition found for symbol at the specified position')
                    ]);
                }

                const response = `Found ${locations.length} type definition(s):\n\n` +
                    locations.map((loc, index) => {
                        const uri = vscode.Uri.parse(loc.uri);
                        const displayPath = vscode.workspace.asRelativePath(uri);
                        return `${index + 1}. ${displayPath}:${loc.range.start.line + 1}:${loc.range.start.character + 1}`;
                    }).join('\n');

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error getting type definition: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_declaration tool
    disposables.push(vscode.lm.registerTool('lsp_declaration', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolPositionInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const locations = await languageClient.getDeclaration(input.uri, {
                    line: input.line,
                    character: input.character
                });

                if (locations.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No declaration found for symbol at the specified position')
                    ]);
                }

                const response = `Found ${locations.length} declaration(s):\n\n` +
                    locations.map((loc, index) => {
                        const uri = vscode.Uri.parse(loc.uri);
                        const displayPath = vscode.workspace.asRelativePath(uri);
                        return `${index + 1}. ${displayPath}:${loc.range.start.line + 1}:${loc.range.start.character + 1}`;
                    }).join('\n');

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error getting declaration: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_implementation tool
    disposables.push(vscode.lm.registerTool('lsp_implementation', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolPositionInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const locations = await languageClient.getImplementation(input.uri, {
                    line: input.line,
                    character: input.character
                });

                if (locations.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No implementations found for symbol at the specified position')
                    ]);
                }

                const response = `Found ${locations.length} implementation(s):\n\n` +
                    locations.map((loc, index) => {
                        const uri = vscode.Uri.parse(loc.uri);
                        const displayPath = vscode.workspace.asRelativePath(uri);
                        return `${index + 1}. ${displayPath}:${loc.range.start.line + 1}:${loc.range.start.character + 1}`;
                    }).join('\n');

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error getting implementations: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_prepare_call_hierarchy tool
    disposables.push(vscode.lm.registerTool('lsp_prepare_call_hierarchy', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolPositionInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const items = await languageClient.prepareCallHierarchy(input.uri, {
                    line: input.line,
                    character: input.character
                });

                if (items.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No call hierarchy items found at the specified position')
                    ]);
                }

                const response = `Found ${items.length} call hierarchy item(s):\n\n` +
                    items.map((item, index) => {
                        const uri = vscode.Uri.parse(item.uri);
                        const displayPath = vscode.workspace.asRelativePath(uri);
                        const kindStr = getSymbolKindString(item.kind);
                        return `${index + 1}. ${item.name} (${kindStr}) - ${displayPath}:${item.range.start.line + 1}`;
                    }).join('\n') +
                    '\n\nUse the returned items with lsp_call_hierarchy_incoming or lsp_call_hierarchy_outgoing to explore call relationships.';

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error preparing call hierarchy: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_call_hierarchy_incoming tool
    disposables.push(vscode.lm.registerTool('lsp_call_hierarchy_incoming', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<any>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const calls = await languageClient.getCallHierarchyIncomingCalls(input.item);

                if (calls.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No incoming calls found for the specified item')
                    ]);
                }

                const response = `Found ${calls.length} incoming call(s):\n\n` +
                    calls.map((call, index) => {
                        const uri = vscode.Uri.parse(call.from.uri);
                        const displayPath = vscode.workspace.asRelativePath(uri);
                        const kindStr = getSymbolKindString(call.from.kind);
                        return `${index + 1}. ${call.from.name} (${kindStr}) - ${displayPath}:${call.from.range.start.line + 1}`;
                    }).join('\n');

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error getting incoming calls: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_call_hierarchy_outgoing tool
    disposables.push(vscode.lm.registerTool('lsp_call_hierarchy_outgoing', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<any>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const calls = await languageClient.getCallHierarchyOutgoingCalls(input.item);

                if (calls.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No outgoing calls found for the specified item')
                    ]);
                }

                const response = `Found ${calls.length} outgoing call(s):\n\n` +
                    calls.map((call, index) => {
                        const uri = vscode.Uri.parse(call.to.uri);
                        const displayPath = vscode.workspace.asRelativePath(uri);
                        const kindStr = getSymbolKindString(call.to.kind);
                        return `${index + 1}. ${call.to.name} (${kindStr}) - ${displayPath}:${call.to.range.start.line + 1}`;
                    }).join('\n');

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error getting outgoing calls: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_prepare_type_hierarchy tool
    disposables.push(vscode.lm.registerTool('lsp_prepare_type_hierarchy', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolPositionInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const items = await languageClient.prepareTypeHierarchy(input.uri, {
                    line: input.line,
                    character: input.character
                });

                if (items.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No type hierarchy items found at the specified position')
                    ]);
                }

                const response = `Found ${items.length} type hierarchy item(s):\n\n` +
                    items.map((item, index) => {
                        const uri = vscode.Uri.parse(item.uri);
                        const displayPath = vscode.workspace.asRelativePath(uri);
                        const kindStr = getSymbolKindString(item.kind);
                        return `${index + 1}. ${item.name} (${kindStr}) - ${displayPath}:${item.range.start.line + 1}`;
                    }).join('\n') +
                    '\n\nUse the returned items with lsp_type_hierarchy_supertypes or lsp_type_hierarchy_subtypes to explore type relationships.';

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error preparing type hierarchy: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_type_hierarchy_supertypes tool
    disposables.push(vscode.lm.registerTool('lsp_type_hierarchy_supertypes', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<any>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const supertypes = await languageClient.getTypeHierarchySupertypes(input.item);

                if (supertypes.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No supertypes found for the specified item')
                    ]);
                }

                const response = `Found ${supertypes.length} supertype(s):\n\n` +
                    supertypes.map((item, index) => {
                        const uri = vscode.Uri.parse(item.uri);
                        const displayPath = vscode.workspace.asRelativePath(uri);
                        const kindStr = getSymbolKindString(item.kind);
                        return `${index + 1}. ${item.name} (${kindStr}) - ${displayPath}:${item.range.start.line + 1}`;
                    }).join('\n');

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error getting supertypes: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_type_hierarchy_subtypes tool
    disposables.push(vscode.lm.registerTool('lsp_type_hierarchy_subtypes', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<any>, _token: vscode.CancellationToken) => {
            const input = options.input;
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const subtypes = await languageClient.getTypeHierarchySubtypes(input.item);

                if (subtypes.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('No subtypes found for the specified item')
                    ]);
                }

                const response = `Found ${subtypes.length} subtype(s):\n\n` +
                    subtypes.map((item, index) => {
                        const uri = vscode.Uri.parse(item.uri);
                        const displayPath = vscode.workspace.asRelativePath(uri);
                        const kindStr = getSymbolKindString(item.kind);
                        return `${index + 1}. ${item.name} (${kindStr}) - ${displayPath}:${item.range.start.line + 1}`;
                    }).join('\n');

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error getting subtypes: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_explore_symbol super tool - orchestrates multiple tools
    disposables.push(vscode.lm.registerTool('lsp_explore_symbol', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolExploreSymbolInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            const depth = input.depth || 1;
            const includeCallHierarchy = input.includeCallHierarchy !== false;
            const includeTypeHierarchy = input.includeTypeHierarchy !== false;
            
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                const position = { line: input.line, character: input.character };
                const sections: string[] = [];
                let hasAnyData = false;
                
                // Section 0: Document Structure Context (helps understand symbol location)
                let documentSymbols: any[] = [];
                let symbolContext: string | null = null;
                try {
                    documentSymbols = await languageClient.getDocumentSymbols(input.uri);
                    if (documentSymbols.length > 0) {
                        // Find the symbol at the current position
                        const targetSymbol = findSymbolAtPosition(documentSymbols, position);
                        if (targetSymbol) {
                            symbolContext = formatSymbolContext(targetSymbol, documentSymbols);
                        }
                    }
                } catch (error) {
                    // Silently ignore
                }
                
                // Section 1: Basic Symbol Information
                sections.push('## SYMBOL INFORMATION');
                
                // Add document structure context if available
                if (symbolContext) {
                    sections.push(`\n**Document Context:**\n${symbolContext}`);
                    hasAnyData = true;
                }
                
                try {
                    const hover = await languageClient.getHover(input.uri, position);
                    if (hover) {
                        const hoverText = typeof hover.contents === 'string' 
                            ? hover.contents 
                            : hover.contents.value;
                        sections.push(`\n**Hover Info:**\n${hoverText}`);
                        hasAnyData = true;
                    }
                } catch (error) {
                    // Silently ignore - will report at end if no data
                }

                // Section 2: Definitions and Declarations
                sections.push('\n\n## LOCATIONS');
                let hasLocations = false;
                try {
                    const definitions = await languageClient.getDefinition(input.uri, position);
                    if (definitions.length > 0) {
                        sections.push(`\n**Definition:** ${formatLocations(definitions)}`);
                        hasAnyData = true;
                        hasLocations = true;
                    }
                } catch (error) {
                    // Silently ignore
                }

                try {
                    const typeDefinitions = await languageClient.getTypeDefinition(input.uri, position);
                    if (typeDefinitions.length > 0) {
                        sections.push(`**Type Definition:** ${formatLocations(typeDefinitions)}`);
                        hasAnyData = true;
                        hasLocations = true;
                    }
                } catch (error) {
                    // Silently ignore
                }

                try {
                    const declarations = await languageClient.getDeclaration(input.uri, position);
                    if (declarations.length > 0) {
                        sections.push(`**Declaration:** ${formatLocations(declarations)}`);
                        hasAnyData = true;
                        hasLocations = true;
                    }
                } catch (error) {
                    // Silently ignore
                }

                // Section 3: References (store for potential call hierarchy fallback)
                sections.push('\n\n## USAGE');
                let references: any[] = [];
                try {
                    references = await languageClient.getReferences(input.uri, position, true);
                    if (references.length > 0) {
                        sections.push(`\n**References:** ${references.length} locations found`);
                        if (references.length <= 10) {
                            sections.push(formatLocations(references));
                        } else {
                            sections.push(formatLocations(references.slice(0, 10)));
                            sections.push(`\n... and ${references.length - 10} more`);
                        }
                        hasAnyData = true;
                    } else {
                        console.log('lsp_explore_symbol: No references found');
                    }
                } catch (error) {
                    console.error('lsp_explore_symbol: Error getting references:', error);
                }

                // Section 4: Implementations
                try {
                    const implementations = await languageClient.getImplementation(input.uri, position);
                    if (implementations.length > 0) {
                        sections.push(`\n**Implementations:** ${implementations.length} found`);
                        sections.push(formatLocations(implementations));
                        hasAnyData = true;
                    }
                } catch (error) {
                    // Silently ignore
                }

                // Section 5: Call Hierarchy
                if (includeCallHierarchy) {
                    sections.push('\n\n## CALL HIERARCHY');
                    let hasCallHierarchyData = false;
                    try {
                        const callHierarchyItems = await languageClient.prepareCallHierarchy(input.uri, position);
                        console.log(`lsp_explore_symbol: prepareCallHierarchy returned ${callHierarchyItems.length} items`);
                        if (callHierarchyItems.length > 0) {
                            const item = callHierarchyItems[0];
                            console.log(`lsp_explore_symbol: Using call hierarchy item:`, JSON.stringify(item, null, 2));
                            
                            // Get incoming calls
                            try {
                                const incomingCalls = await languageClient.getCallHierarchyIncomingCalls(item);
                                console.log(`lsp_explore_symbol: getCallHierarchyIncomingCalls returned ${incomingCalls.length} calls`);
                                if (incomingCalls.length > 0) {
                                    sections.push(`\n**Incoming Calls (${incomingCalls.length}):**`);
                                    incomingCalls.slice(0, 5).forEach((call, idx) => {
                                        const uri = vscode.Uri.parse(call.from.uri);
                                        const displayPath = vscode.workspace.asRelativePath(uri);
                                        sections.push(`${idx + 1}. ${call.from.name} - ${displayPath}:${call.from.range.start.line + 1}`);
                                    });
                                    if (incomingCalls.length > 5) {
                                        sections.push(`... and ${incomingCalls.length - 5} more`);
                                    }
                                    hasAnyData = true;
                                    hasCallHierarchyData = true;
                                }
                            } catch (error) {
                                console.error('lsp_explore_symbol: Error getting incoming calls:', error);
                            }

                            // Get outgoing calls
                            try {
                                const outgoingCalls = await languageClient.getCallHierarchyOutgoingCalls(item);
                                console.log(`lsp_explore_symbol: getCallHierarchyOutgoingCalls returned ${outgoingCalls.length} calls`);
                                if (outgoingCalls.length > 0) {
                                    sections.push(`\n**Outgoing Calls (${outgoingCalls.length}):**`);
                                    outgoingCalls.slice(0, 5).forEach((call, idx) => {
                                        const uri = vscode.Uri.parse(call.to.uri);
                                        const displayPath = vscode.workspace.asRelativePath(uri);
                                        sections.push(`${idx + 1}. ${call.to.name} - ${displayPath}:${call.to.range.start.line + 1}`);
                                    });
                                    if (outgoingCalls.length > 5) {
                                        sections.push(`... and ${outgoingCalls.length - 5} more`);
                                    }
                                    hasAnyData = true;
                                    hasCallHierarchyData = true;
                                }
                            } catch (error) {
                                console.error('lsp_explore_symbol: Error getting outgoing calls:', error);
                            }
                            
                            // If call hierarchy preparation succeeded but returned no calls, provide explanation
                            if (!hasCallHierarchyData) {
                                sections.push(`\n⚠️ **Call hierarchy not available** - The language server prepared the call hierarchy but returned no incoming or outgoing calls.`);
                                
                                // Suggest using references as fallback
                                if (references.length > 0) {
                                    sections.push(`\n💡 **Tip:** See the USAGE section above for references to this symbol, which may indicate potential callers.`);
                                }
                            }
                        }
                    } catch (error) {
                        // Silently ignore
                    }
                }

                // Section 6: Type Hierarchy
                if (includeTypeHierarchy) {
                    sections.push('\n\n## TYPE HIERARCHY');
                    try {
                        const typeHierarchyItems = await languageClient.prepareTypeHierarchy(input.uri, position);
                        if (typeHierarchyItems.length > 0) {
                            const item = typeHierarchyItems[0];
                            
                            // Get supertypes
                            try {
                                const supertypes = await languageClient.getTypeHierarchySupertypes(item);
                                if (supertypes.length > 0) {
                                    sections.push(`\n**Supertypes (${supertypes.length}):**`);
                                    supertypes.forEach((type, idx) => {
                                        const uri = vscode.Uri.parse(type.uri);
                                        const displayPath = vscode.workspace.asRelativePath(uri);
                                        const kindStr = getSymbolKindString(type.kind);
                                        sections.push(`${idx + 1}. ${type.name} (${kindStr}) - ${displayPath}:${type.range.start.line + 1}`);
                                    });
                                    hasAnyData = true;
                                }
                            } catch (error) {
                                // Silently ignore
                            }

                            // Get subtypes
                            try {
                                const subtypes = await languageClient.getTypeHierarchySubtypes(item);
                                if (subtypes.length > 0) {
                                    sections.push(`\n**Subtypes (${subtypes.length}):**`);
                                    subtypes.slice(0, 5).forEach((type, idx) => {
                                        const uri = vscode.Uri.parse(type.uri);
                                        const displayPath = vscode.workspace.asRelativePath(uri);
                                        const kindStr = getSymbolKindString(type.kind);
                                        sections.push(`${idx + 1}. ${type.name} (${kindStr}) - ${displayPath}:${type.range.start.line + 1}`);
                                    });
                                    if (subtypes.length > 5) {
                                        sections.push(`... and ${subtypes.length - 5} more`);
                                    }
                                    hasAnyData = true;
                                }
                            } catch (error) {
                                // Silently ignore
                            }
                        }
                    } catch (error) {
                        // Silently ignore
                    }
                }

                // Check if we got any data at all
                if (!hasAnyData) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(
                            `# Symbol Exploration Results\n\n` +
                            `**Location:** ${vscode.workspace.asRelativePath(vscode.Uri.parse(input.uri))}:${input.line + 1}:${input.character + 1}\n\n` +
                            `⚠️ **No symbol information available at this position.**\n\n` +
                            `This can happen when:\n` +
                            `- The cursor is positioned on whitespace, comments, or an empty line\n` +
                            `- The language server hasn't finished indexing the file\n` +
                            `- The language server doesn't support this file type\n` +
                            `- The position is outside of any symbol definition\n\n` +
                            `**Suggestions:**\n` +
                            `- Try positioning the cursor on a function name, variable, or class\n` +
                            `- Ensure the C++ language server (clangd) is running and has indexed the file\n` +
                            `- Check that the file compiles without errors`
                        )
                    ]);
                }

                // Build final response
                const response = `# Symbol Exploration Results\n\n` +
                    `**Location:** ${vscode.workspace.asRelativePath(vscode.Uri.parse(input.uri))}:${input.line + 1}:${input.character + 1}\n\n` +
                    sections.join('\n');

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error exploring symbol: ${error}`)
                ]);
            }
        }
    }));

    // Register lsp_explore_references tool - intelligent reference exploration
    disposables.push(vscode.lm.registerTool('lsp_explore_references', {
        invoke: async (options: vscode.LanguageModelToolInvocationOptions<ToolExploreReferencesInput>, _token: vscode.CancellationToken) => {
            const input = options.input;
            const maxResults = input.maxResults || 100;
            
            try {
                if (!languageClient.isReady()) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Error: Language client is not ready')
                    ]);
                }

                // Step 1: Search for the symbol using workspace symbols
                const symbols = await languageClient.getWorkspaceSymbols(input.query);
                
                if (symbols.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(`No symbol found matching "${input.query}".\n\nSuggestions:\n- Check the symbol name spelling\n- Try a partial name (e.g., "secondaryIsAPrimary" instead of "Keyserver::secondaryIsAPrimary")\n- Ensure the file is indexed by the language server`)
                    ]);
                }

                // Use the first matching symbol
                const symbol = symbols[0];
                const symbolUri = symbol.location.uri;
                const symbolPosition = symbol.location.range.start;

                // Step 2: Get references for this symbol
                const references = await languageClient.getReferences(symbolUri, symbolPosition, true);
                
                if (references.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(`Found symbol "${symbol.name}" but no references found.\n\nThis might mean:\n- The symbol is defined but never used\n- The language server hasn't finished indexing\n- The symbol is in a different compilation unit`)
                    ]);
                }

                // Step 3: Format the results
                const sections: string[] = [];
                sections.push(`# Reference Exploration: ${symbol.name}`);
                sections.push(`\n**Symbol Type:** ${getSymbolKindString(symbol.kind)}`);
                sections.push(`**Definition:** ${vscode.workspace.asRelativePath(vscode.Uri.parse(symbolUri))}:${symbolPosition.line + 1}:${symbolPosition.character + 1}`);
                sections.push(`\n**Found ${references.length} reference(s):**\n`);

                // Group references by file
                const referencesByFile = new Map<string, Array<{line: number, character: number}>>();
                for (const ref of references) {
                    const uri = vscode.Uri.parse(ref.uri);
                    const relativePath = vscode.workspace.asRelativePath(uri);
                    
                    if (!referencesByFile.has(relativePath)) {
                        referencesByFile.set(relativePath, []);
                    }
                    referencesByFile.get(relativePath)!.push({
                        line: ref.range.start.line,
                        character: ref.range.start.character
                    });
                }

                // Sort files and format output
                const sortedFiles = Array.from(referencesByFile.keys()).sort();
                let displayedCount = 0;
                
                for (const file of sortedFiles) {
                    const refs = referencesByFile.get(file)!;
                    // Sort by line number
                    refs.sort((a, b) => a.line - b.line);
                    
                    sections.push(`\n**${file}** (${refs.length} reference${refs.length > 1 ? 's' : ''}):`);
                    
                    for (const ref of refs) {
                        if (displayedCount >= maxResults) {
                            sections.push(`\n... and ${references.length - displayedCount} more references (use maxResults parameter to show more)`);
                            break;
                        }
                        sections.push(`  Line ${ref.line + 1}:${ref.character + 1}`);
                        displayedCount++;
                    }
                    
                    if (displayedCount >= maxResults) {
                        break;
                    }
                }

                // Add summary statistics
                sections.push(`\n## Summary`);
                sections.push(`- Total references: ${references.length}`);
                sections.push(`- Files with references: ${referencesByFile.size}`);
                sections.push(`- Symbol: ${symbol.name} (${getSymbolKindString(symbol.kind)})`);

                const response = sections.join('\n');
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error exploring references: ${error}`)
                ]);
            }
        }
    }));

    return disposables;
}

/**
 * Find the symbol at a specific position in the document symbol tree
 */
function findSymbolAtPosition(symbols: any[], position: { line: number; character: number }): any | null {
    for (const symbol of symbols) {
        const range = symbol.range || symbol.location?.range;
        if (range) {
            const startLine = range.start.line;
            const endLine = range.end.line;
            const startChar = range.start.character;
            const endChar = range.end.character;
            
            // Check if position is within this symbol's range
            if (position.line >= startLine && position.line <= endLine) {
                if (position.line === startLine && position.character < startChar) {
                    continue;
                }
                if (position.line === endLine && position.character > endChar) {
                    continue;
                }
                
                // Check children first (more specific)
                if (symbol.children && symbol.children.length > 0) {
                    const childResult = findSymbolAtPosition(symbol.children, position);
                    if (childResult) {
                        return childResult;
                    }
                }
                
                // This symbol contains the position
                return symbol;
            }
        }
    }
    return null;
}

/**
 * Format symbol context showing where the symbol is in the document structure
 */
function formatSymbolContext(symbol: any, allSymbols: any[]): string {
    const kindStr = getSymbolKindString(symbol.kind);
    const line = symbol.range?.start.line || symbol.location?.range?.start.line;
    const lineNum = line !== undefined ? line + 1 : '?';
    
    let context = `Symbol: \`${symbol.name}\` (${kindStr}) at line ${lineNum}`;
    
    // Find parent context
    const parent = findParentSymbol(symbol, allSymbols);
    if (parent) {
        const parentKind = getSymbolKindString(parent.kind);
        context += `\nParent: \`${parent.name}\` (${parentKind})`;
    }
    
    // Find siblings (other symbols at same level)
    const siblings = findSiblings(symbol, allSymbols);
    if (siblings.length > 0) {
        context += `\nSiblings: ${siblings.length} other symbols at same level`;
        
        // Show immediate neighbors (before/after)
        const symbolIndex = siblings.findIndex(s => s.name === symbol.name && s.kind === symbol.kind);
        if (symbolIndex > 0) {
            const before = siblings[symbolIndex - 1];
            context += `\n  - Before: \`${before.name}\` (${getSymbolKindString(before.kind)})`;
        }
        if (symbolIndex < siblings.length - 1 && symbolIndex !== -1) {
            const after = siblings[symbolIndex + 1];
            context += `\n  - After: \`${after.name}\` (${getSymbolKindString(after.kind)})`;
        }
    }
    
    return context;
}

/**
 * Find the parent symbol of a given symbol
 */
function findParentSymbol(targetSymbol: any, symbols: any[], parent: any = null): any | null {
    for (const symbol of symbols) {
        if (symbol.children && symbol.children.length > 0) {
            // Check if target is a direct child
            const isDirectChild = symbol.children.some((child: any) => 
                child.name === targetSymbol.name && 
                child.kind === targetSymbol.kind &&
                child.range?.start.line === targetSymbol.range?.start.line
            );
            
            if (isDirectChild) {
                return symbol;
            }
            
            // Recursively search in children
            const result = findParentSymbol(targetSymbol, symbol.children, symbol);
            if (result) {
                return result;
            }
        }
    }
    return null;
}

/**
 * Find sibling symbols (at the same level as the target)
 */
function findSiblings(targetSymbol: any, symbols: any[]): any[] {
    // Find the parent
    const parent = findParentSymbol(targetSymbol, symbols);
    
    if (parent && parent.children) {
        return parent.children;
    }
    
    // If no parent, siblings are top-level symbols
    return symbols;
}

/**
 * Helper function to format locations
 */
function formatLocations(locations: any[]): string {
    return locations.map((loc, index) => {
        const uri = vscode.Uri.parse(loc.uri);
        const displayPath = vscode.workspace.asRelativePath(uri);
        return `${index + 1}. ${displayPath}:${loc.range.start.line + 1}:${loc.range.start.character + 1}`;
    }).join('\n');
}

/**
 * Convert completion kind number to readable string
 */
function getCompletionKindString(kind: number): string {
    const kinds: { [key: number]: string } = {
        1: 'Text',
        2: 'Method',
        3: 'Function',
        4: 'Constructor',
        5: 'Field',
        6: 'Variable',
        7: 'Class',
        8: 'Interface',
        9: 'Module',
        10: 'Property',
        11: 'Unit',
        12: 'Value',
        13: 'Enum',
        14: 'Keyword',
        15: 'Snippet',
        16: 'Color',
        17: 'File',
        18: 'Reference',
        19: 'Folder',
        20: 'EnumMember',
        21: 'Constant',
        22: 'Struct',
        23: 'Event',
        24: 'Operator',
        25: 'TypeParameter'
    };
    return kinds[kind] || `Kind${kind}`;
}

/**
 * Convert symbol kind number to readable string
 */
function getSymbolKindString(kind: number): string {
    const kinds: { [key: number]: string } = {
        1: 'File',
        2: 'Module',
        3: 'Namespace',
        4: 'Package',
        5: 'Class',
        6: 'Method',
        7: 'Property',
        8: 'Field',
        9: 'Constructor',
        10: 'Enum',
        11: 'Interface',
        12: 'Function',
        13: 'Variable',
        14: 'Constant',
        15: 'String',
        16: 'Number',
        17: 'Boolean',
        18: 'Array',
        19: 'Object',
        20: 'Key',
        21: 'Null',
        22: 'EnumMember',
        23: 'Struct',
        24: 'Event',
        25: 'Operator',
        26: 'TypeParameter'
    };
    return kinds[kind] || `Kind${kind}`;
}

/**
 * Format document symbols hierarchically
 */
function formatDocumentSymbols(symbols: any[], depth: number): string[] {
    const indent = '  '.repeat(depth);
    const result: string[] = [];
    
    for (const symbol of symbols) {
        const kindStr = getSymbolKindString(symbol.kind);
        const range = symbol.range || symbol.location?.range;
        const line = range ? range.start.line + 1 : '?';
        
        result.push(`${indent}${symbol.name} (${kindStr}) - Line ${line}`);
        
        // Handle nested children if they exist
        if (symbol.children && symbol.children.length > 0) {
            result.push(...formatDocumentSymbols(symbol.children, depth + 1));
        }
    }
    
    return result;
}