import * as vscode from 'vscode';
import { 
	LanguageClient, 
	LSPPosition, 
	LSPLocation, 
	LSPHover, 
	LSPCompletionList,
	LSPSymbolInformation,
	LSPDocumentSymbol,
	LSPWorkspaceEdit,
	LSPTextEdit,
	LSPCodeAction,
	LSPSignatureHelp
} from './types';

/**
 * VSCode Language Features adapter
 * This class uses VSCode's built-in language features instead of directly accessing the language client
 */
export class VSCodeLanguageClient implements LanguageClient {
	private isInitialized = false;

	/**
	 * Initialize the client - just mark as ready for VSCode language features
	 */
	public async initialize(): Promise<void> {
		// VSCode handles language servers internally, so we just mark as initialized
		this.isInitialized = true;
		console.log('VSCodeLanguageClient initialized successfully');
	}

	/**
	 * Check if the client is ready
	 */
	public isReady(): boolean {
		return this.isInitialized;
	}

	/**
	 * Get definition locations using VSCode's built-in definition provider
	 */
	public async getDefinition(uri: string, position: LSPPosition): Promise<LSPLocation[]> {
		if (!this.isReady()) {
			throw new Error('Client not initialized');
		}

		try {
			// Add small delay to ensure language server is ready
			await new Promise(resolve => setTimeout(resolve, 100));
			
			const document = await this.getDocument(uri);
			const vscodePosition = new vscode.Position(position.line, position.character);

			// Validate position is within document bounds
			if (position.line >= document.lineCount) {
				console.warn(`Position line ${position.line} exceeds document line count ${document.lineCount}`);
				return [];
			}

			const line = document.lineAt(position.line);
			if (position.character > line.text.length) {
				console.warn(`Position character ${position.character} exceeds line length ${line.text.length}`);
				return [];
			}

			// Use VSCode's definition provider with timeout
			const definitions = await Promise.race([
				vscode.commands.executeCommand<(vscode.Location | vscode.LocationLink)[]>(
					'vscode.executeDefinitionProvider',
					document.uri,
					vscodePosition
				),
				new Promise<undefined>((_, reject) => 
					setTimeout(() => reject(new Error('Definition request timeout')), 5000)
				)
			]);

			if (!definitions || definitions.length === 0) {
				console.log('No definitions found for position', position);
				return [];
			}

			// Convert VSCode locations to our format
			return definitions.map(def => {
				// Handle both Location and LocationLink types
				if ('targetUri' in def) {
					// LocationLink
					const targetUri = def.targetUri.toString();
					const range = def.targetRange || def.targetSelectionRange;
					
					// Handle case where range might be undefined
					if (!range) {
						console.warn('LocationLink found but no range available:', def);
						return {
							uri: targetUri,
							range: {
								start: { line: 0, character: 0 },
								end: { line: 0, character: 0 }
							}
						};
					}
					
					return {
						uri: targetUri,
						range: {
							start: {
								line: range.start.line,
								character: range.start.character
							},
							end: {
								line: range.end.line,
								character: range.end.character
							}
						}
					};
				} else {
					// Location
					const location = def as vscode.Location;
					return {
						uri: location.uri.toString(),
						range: {
							start: {
								line: location.range.start.line,
								character: location.range.start.character
							},
							end: {
								line: location.range.end.line,
								character: location.range.end.character
							}
						}
					};
				}
			});
		} catch (error) {
			console.error('Error getting definitions:', error);
			return []; // Return empty array instead of throwing
		}
	}

	/**
	 * Get reference locations using VSCode's built-in reference provider
	 */
	public async getReferences(uri: string, position: LSPPosition, includeDeclaration = true): Promise<LSPLocation[]> {
		if (!this.isReady()) {
			throw new Error('Client not initialized');
		}

		try {
			const document = await this.getDocument(uri);
			const vscodePosition = new vscode.Position(position.line, position.character);

			// Use VSCode's reference provider
			const references = await vscode.commands.executeCommand<vscode.Location[]>(
				'vscode.executeReferenceProvider',
				document.uri,
				vscodePosition
			);

			if (!references) {
				return [];
			}

			// Convert VSCode locations to our format
			let results = references.map(ref => ({
				uri: ref.uri.toString(),
				range: {
					start: {
						line: ref.range.start.line,
						character: ref.range.start.character
					},
					end: {
						line: ref.range.end.line,
						character: ref.range.end.character
					}
				}
			}));

			// If includeDeclaration is false, try to filter out the declaration
			if (!includeDeclaration) {
				// This is a best-effort attempt - we'll include all for now
				// since distinguishing declaration from references is complex
			}

			return results;
		} catch (error) {
			console.error('Error getting references:', error);
			return []; // Return empty array instead of throwing
		}
	}

	/**
	 * Get hover information using VSCode's built-in hover provider
	 */
	public async getHover(uri: string, position: LSPPosition): Promise<LSPHover | null> {
		if (!this.isReady()) {
			throw new Error('Client not initialized');
		}

		try {
			const document = await this.getDocument(uri);
			const vscodePosition = new vscode.Position(position.line, position.character);

			// Use VSCode's hover provider
			const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
				'vscode.executeHoverProvider',
				document.uri,
				vscodePosition
			);

			if (!hovers || hovers.length === 0) {
				return null;
			}

			// Take the first hover result
			const hover = hovers[0];
			let contents: string | { kind: string; value: string };

			// Convert hover contents to our format
			if (hover.contents.length > 0) {
				const content = hover.contents[0];
				if (typeof content === 'string') {
					contents = content;
				} else if (content instanceof vscode.MarkdownString) {
					contents = {
						kind: 'markdown',
						value: content.value
					};
				} else {
					contents = content.value || content.toString();
				}
			} else {
				return null;
			}

			// Convert range if present
			let range;
			if (hover.range) {
				range = {
					start: {
						line: hover.range.start.line,
						character: hover.range.start.character
					},
					end: {
						line: hover.range.end.line,
						character: hover.range.end.character
					}
				};
			}

			return {
				contents,
				range
			};
		} catch (error) {
			console.error('Error getting hover:', error);
			return null; // Return null instead of throwing
		}
	}

	/**
	 * Rename a symbol using VSCode's built-in rename provider
	 */
	public async renameSymbol(uri: string, position: LSPPosition, newName: string): Promise<LSPWorkspaceEdit | null> {
		if (!this.isReady()) {
			throw new Error('Client not initialized');
		}

		try {
			const document = await this.getDocument(uri);
			const vscodePosition = new vscode.Position(position.line, position.character);

			// Use VSCode's rename provider
			const workspaceEdit = await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
				'vscode.executeDocumentRenameProvider',
				document.uri,
				vscodePosition,
				newName
			);

			if (!workspaceEdit) {
				return null;
			}

			// Convert VSCode workspace edit to our format
			const changes: { [uri: string]: LSPTextEdit[] } = {};
			
			workspaceEdit.entries().forEach(([uri, edits]) => {
				changes[uri.toString()] = edits.map(edit => ({
					range: {
						start: {
							line: edit.range.start.line,
							character: edit.range.start.character
						},
						end: {
							line: edit.range.end.line,
							character: edit.range.end.character
						}
					},
					newText: edit.newText
				}));
			});

			return { changes };
		} catch (error) {
			console.error('Error renaming symbol:', error);
			return null; // Return null instead of throwing
		}
	}

	/**
	 * Get code actions using VSCode's built-in code action provider
	 */
	public async getCodeActions(
		uri: string, 
		range: { start: LSPPosition; end: LSPPosition }, 
		context?: any
	): Promise<LSPCodeAction[]> {
		if (!this.isReady()) {
			throw new Error('Client not initialized');
		}

		try {
			const document = await this.getDocument(uri);
			const vscodeRange = new vscode.Range(
				new vscode.Position(range.start.line, range.start.character),
				new vscode.Position(range.end.line, range.end.character)
			);

			// Use VSCode's code action provider
			const codeActions = await vscode.commands.executeCommand<(vscode.CodeAction | vscode.Command)[]>(
				'vscode.executeCodeActionProvider',
				document.uri,
				vscodeRange,
				context?.only
			);

			if (!codeActions) {
				return [];
			}

			// Convert VSCode code actions to our format
			return codeActions.map((action): LSPCodeAction => {
				if (action && typeof action === 'object' && 'edit' in action && action.edit) {
					// It's a CodeAction with edit
					const changes: { [uri: string]: LSPTextEdit[] } = {};
					
					action.edit.entries().forEach(([uri, edits]) => {
						changes[uri.toString()] = edits.map(edit => ({
							range: {
								start: {
									line: edit.range.start.line,
									character: edit.range.start.character
								},
								end: {
									line: edit.range.end.line,
									character: edit.range.end.character
								}
							},
							newText: edit.newText
						}));
					});

					return {
						title: action.title || 'Unknown',
						kind: action.kind?.value,
						edit: { changes }
					};
				} else {
					// It's a Command or CodeAction with command
					const hasTitle = action && typeof action === 'object' && 'title' in action;
					const hasCommand = action && typeof action === 'object' && 'command' in action;
					
					if (hasCommand && action.command) {
						const cmd = action.command;
						if (typeof cmd === 'string') {
							// Direct command string
							return {
								title: hasTitle ? action.title : 'Unknown',
								command: {
									title: hasTitle ? action.title : 'Unknown',
									command: cmd,
									arguments: []
								}
							};
						} else if (cmd && typeof cmd === 'object') {
							// Command object
							return {
								title: hasTitle ? action.title : (cmd.title || 'Unknown'),
								command: {
									title: cmd.title || (hasTitle ? action.title : 'Unknown'),
									command: cmd.command || '',
									arguments: cmd.arguments || []
								}
							};
						}
					}
					
					// Fallback for actions without commands
					return {
						title: hasTitle ? action.title : 'Unknown'
					};
				}
			});
		} catch (error) {
			console.error('Error getting code actions:', error);
			return []; // Return empty array instead of throwing
		}
	}

	/**
	 * Format a document using VSCode's built-in formatting provider
	 */
	public async formatDocument(uri: string, options?: any): Promise<LSPTextEdit[]> {
		if (!this.isReady()) {
			throw new Error('Client not initialized');
		}

		try {
			const document = await this.getDocument(uri);

			// Create formatting options
			const formattingOptions: vscode.FormattingOptions = {
				tabSize: options?.tabSize || 4,
				insertSpaces: options?.insertSpaces !== false
			};

			// Use VSCode's document formatting provider
			const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
				'vscode.executeFormatDocumentProvider',
				document.uri,
				formattingOptions
			);

			if (!edits) {
				return [];
			}

			// Convert VSCode text edits to our format
			return edits.map(edit => ({
				range: {
					start: {
						line: edit.range.start.line,
						character: edit.range.start.character
					},
					end: {
						line: edit.range.end.line,
						character: edit.range.end.character
					}
				},
				newText: edit.newText
			}));
		} catch (error) {
			console.error('Error formatting document:', error);
			return []; // Return empty array instead of throwing
		}
	}

	/**
	 * Get signature help using VSCode's built-in signature help provider
	 */
	public async getSignatureHelp(
		uri: string, 
		position: LSPPosition, 
		triggerKind?: number, 
		triggerCharacter?: string
	): Promise<LSPSignatureHelp | null> {
		if (!this.isReady()) {
			throw new Error('Client not initialized');
		}

		try {
			const document = await this.getDocument(uri);
			const vscodePosition = new vscode.Position(position.line, position.character);

			// Use VSCode's signature help provider
			const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
				'vscode.executeSignatureHelpProvider',
				document.uri,
				vscodePosition,
				triggerCharacter
			);

			if (!signatureHelp) {
				return null;
			}

			// Convert VSCode signature help to our format
			return {
				signatures: signatureHelp.signatures.map(sig => ({
					label: sig.label,
					documentation: typeof sig.documentation === 'string' 
						? sig.documentation 
						: sig.documentation?.value,
					parameters: sig.parameters?.map(param => ({
						label: typeof param.label === 'string' 
							? param.label 
							: [param.label[0], param.label[1]],
						documentation: typeof param.documentation === 'string' 
							? param.documentation 
							: param.documentation?.value
					}))
				})),
				activeSignature: signatureHelp.activeSignature,
				activeParameter: signatureHelp.activeParameter
			};
		} catch (error) {
			console.error('Error getting signature help:', error);
			return null; // Return null instead of throwing
		}
	}

	/**
	 * Get workspace symbols using VSCode's built-in workspace symbol provider
	 */
	public async getWorkspaceSymbols(query: string): Promise<LSPSymbolInformation[]> {
		if (!this.isReady()) {
			throw new Error('Client not initialized');
		}

		try {
			// Use VSCode's workspace symbol provider
			const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
				'vscode.executeWorkspaceSymbolProvider',
				query
			);

			if (!symbols) {
				return [];
			}

			// Convert VSCode symbols to our format
			return symbols.map(symbol => ({
				name: symbol.name,
				kind: symbol.kind,
				location: {
					uri: symbol.location.uri.toString(),
					range: {
						start: {
							line: symbol.location.range.start.line,
							character: symbol.location.range.start.character
						},
						end: {
							line: symbol.location.range.end.line,
							character: symbol.location.range.end.character
						}
					}
				},
				containerName: symbol.containerName
			}));
		} catch (error) {
			console.error('Error getting workspace symbols:', error);
			return []; // Return empty array instead of throwing
		}
	}

	/**
	 * Get document symbols using VSCode's built-in document symbol provider
	 */
	public async getDocumentSymbols(uri: string): Promise<LSPDocumentSymbol[]> {
		if (!this.isReady()) {
			throw new Error('Client not initialized');
		}

		try {
			const document = await this.getDocument(uri);

			// Use VSCode's document symbol provider
			const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
				'vscode.executeDocumentSymbolProvider',
				document.uri
			);

			if (!symbols) {
				return [];
			}

			// Convert VSCode symbols to our format
			const convertSymbol = (symbol: vscode.DocumentSymbol): LSPDocumentSymbol => ({
				name: symbol.name,
				kind: symbol.kind,
				range: {
					start: {
						line: symbol.range.start.line,
						character: symbol.range.start.character
					},
					end: {
						line: symbol.range.end.line,
						character: symbol.range.end.character
					}
				},
				selectionRange: {
					start: {
						line: symbol.selectionRange.start.line,
						character: symbol.selectionRange.start.character
					},
					end: {
						line: symbol.selectionRange.end.line,
						character: symbol.selectionRange.end.character
					}
				},
				detail: symbol.detail,
				children: symbol.children?.map(convertSymbol)
			});

			return symbols.map(convertSymbol);
		} catch (error) {
			console.error('Error getting document symbols:', error);
			return []; // Return empty array instead of throwing
		}
	}
	public async getCompletion(
		uri: string, 
		position: LSPPosition, 
		triggerKind?: number, 
		triggerCharacter?: string
	): Promise<LSPCompletionList> {
		if (!this.isReady()) {
			throw new Error('Client not initialized');
		}

		try {
			const document = await this.getDocument(uri);
			const vscodePosition = new vscode.Position(position.line, position.character);

			// Use VSCode's completion provider
			const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
				'vscode.executeCompletionItemProvider',
				document.uri,
				vscodePosition,
				triggerCharacter
			);

			if (!completions) {
				return {
					isIncomplete: false,
					items: []
				};
			}

			// Convert VSCode completion items to our format
			const items = completions.items.map(item => ({
				label: item.label.toString(),
				kind: item.kind,
				detail: item.detail,
				documentation: typeof item.documentation === 'string' 
					? item.documentation 
					: item.documentation?.value,
				insertText: item.insertText?.toString() || item.label.toString(),
				filterText: item.filterText,
				sortText: item.sortText
			}));

			return {
				isIncomplete: completions.isIncomplete || false,
				items
			};
		} catch (error) {
			console.error('Error getting completions:', error);
			return { isIncomplete: false, items: [] }; // Return empty list instead of throwing
		}
	}

	/**
	 * Helper method to get or open a document
	 */
	private async getDocument(uri: string): Promise<vscode.TextDocument> {
		const documentUri = vscode.Uri.parse(uri);
		
		// Try to find the document if it's already open
		const openDoc = vscode.workspace.textDocuments.find(doc => 
			doc.uri.toString() === documentUri.toString()
		);

		if (openDoc) {
			return openDoc;
		}

		// Open the document
		try {
			return await vscode.workspace.openTextDocument(documentUri);
		} catch (error) {
			throw new Error(`Could not open document: ${uri}`);
		}
	}

	/**
	 * Dispose of any resources
	 */
	public dispose(): void {
		this.isInitialized = false;
	}
}