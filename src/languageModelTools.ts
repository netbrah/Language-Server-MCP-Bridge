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
                        const fileName = uri.fsPath.split('/').pop() || uri.fsPath;
                        return `${index + 1}. ${fileName}:${loc.range.start.line + 1}:${loc.range.start.character + 1}`;
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

    return disposables;
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