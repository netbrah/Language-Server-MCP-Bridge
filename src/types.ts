/**
 * Type definitions for Language Server Protocol (LSP) integration
 */

/**
 * LSP Position type (0-based line and character)
 */
export interface LSPPosition {
	line: number;
	character: number;
}

/**
 * LSP Location type
 */
export interface LSPLocation {
	uri: string;
	range: {
		start: LSPPosition;
		end: LSPPosition;
	};
}

/**
 * LSP Hover result
 */
export interface LSPHover {
	contents: {
		kind: string;
		value: string;
	} | string;
	range?: {
		start: LSPPosition;
		end: LSPPosition;
	};
}

/**
 * LSP Completion Item
 */
export interface LSPCompletionItem {
	label: string;
	kind?: number;
	detail?: string;
	documentation?: string | { kind: string; value: string };
	insertText?: string;
	filterText?: string;
	sortText?: string;
}

/**
 * LSP Completion Result
 */
export interface LSPCompletionList {
	isIncomplete: boolean;
	items: LSPCompletionItem[];
}

/**
 * LSP Symbol Information
 */
export interface LSPSymbolInformation {
	name: string;
	kind: number;
	location: LSPLocation;
	containerName?: string;
}

/**
 * LSP Document Symbol
 */
export interface LSPDocumentSymbol {
	name: string;
	kind: number;
	range: {
		start: LSPPosition;
		end: LSPPosition;
	};
	selectionRange: {
		start: LSPPosition;
		end: LSPPosition;
	};
	detail?: string;
	children?: LSPDocumentSymbol[];
}

/**
 * LSP Workspace Edit
 */
export interface LSPWorkspaceEdit {
	changes?: { [uri: string]: LSPTextEdit[] };
}

/**
 * LSP Text Edit
 */
export interface LSPTextEdit {
	range: {
		start: LSPPosition;
		end: LSPPosition;
	};
	newText: string;
}

/**
 * LSP Code Action
 */
export interface LSPCodeAction {
	title: string;
	kind?: string;
	edit?: LSPWorkspaceEdit;
	command?: {
		title: string;
		command: string;
		arguments?: any[];
	};
}

/**
 * LSP Signature Help
 */
export interface LSPSignatureHelp {
	signatures: LSPSignatureInformation[];
	activeSignature?: number;
	activeParameter?: number;
}

/**
 * LSP Signature Information
 */
export interface LSPSignatureInformation {
	label: string;
	documentation?: string | { kind: string; value: string };
	parameters?: LSPParameterInformation[];
}

/**
 * LSP Parameter Information
 */
export interface LSPParameterInformation {
	label: string | [number, number];
	documentation?: string | { kind: string; value: string };
}

/**
 * MCP Position type for our tool inputs
 */
export interface MCPPosition {
	line: number;
	character: number;
}

/**
 * Input schema for lsp.definition tool
 */
export interface DefinitionInput {
	uri: string;
	position: MCPPosition;
}

/**
 * Input schema for lsp.references tool
 */
export interface ReferencesInput {
	uri: string;
	position: MCPPosition;
	includeDeclaration?: boolean;
}

/**
 * Input schema for lsp.hover tool
 */
export interface HoverInput {
	uri: string;
	position: MCPPosition;
}

/**
 * Input schema for lsp.completion tool
 */
export interface CompletionInput {
	uri: string;
	position: MCPPosition;
	triggerKind?: number;
	triggerCharacter?: string;
}

/**
 * Input schema for lsp.workspaceSymbol tool
 */
export interface WorkspaceSymbolInput {
	query: string;
}

/**
 * Input schema for lsp.documentSymbol tool
 */
export interface DocumentSymbolInput {
	uri: string;
}

/**
 * Input schema for lsp.rename tool
 */
export interface RenameInput {
	uri: string;
	position: MCPPosition;
	newName: string;
}

/**
 * Input schema for lsp.codeAction tool
 */
export interface CodeActionInput {
	uri: string;
	range: {
		start: MCPPosition;
		end: MCPPosition;
	};
	context?: {
		diagnostics?: any[];
		only?: string[];
	};
}

/**
 * Input schema for lsp.formatDocument tool
 */
export interface FormatDocumentInput {
	uri: string;
	options?: {
		tabSize?: number;
		insertSpaces?: boolean;
		trimTrailingWhitespace?: boolean;
		insertFinalNewline?: boolean;
		trimFinalNewlines?: boolean;
	};
}

/**
 * Input schema for lsp.signatureHelp tool
 */
export interface SignatureHelpInput {
	uri: string;
	position: MCPPosition;
	triggerKind?: number;
	triggerCharacter?: string;
	retrigger?: boolean;
}

/**
 * Language Server client interface - abstracts VSCode's language client
 */
export interface LanguageClient {
	/**
	 * Request definition locations for a symbol
	 */
	getDefinition(uri: string, position: LSPPosition): Promise<LSPLocation[]>;

	/**
	 * Request references for a symbol
	 */
	getReferences(uri: string, position: LSPPosition, includeDeclaration?: boolean): Promise<LSPLocation[]>;

	/**
	 * Request hover information for a symbol
	 */
	getHover(uri: string, position: LSPPosition): Promise<LSPHover | null>;

	/**
	 * Request completion suggestions
	 */
	getCompletion(uri: string, position: LSPPosition, triggerKind?: number, triggerCharacter?: string): Promise<LSPCompletionList>;

	/**
	 * Search for symbols in the workspace
	 */
	getWorkspaceSymbols(query: string): Promise<LSPSymbolInformation[]>;

	/**
	 * Get symbols in a document
	 */
	getDocumentSymbols(uri: string): Promise<LSPDocumentSymbol[]>;

	/**
	 * Rename a symbol
	 */
	renameSymbol(uri: string, position: LSPPosition, newName: string): Promise<LSPWorkspaceEdit | null>;

	/**
	 * Get available code actions
	 */
	getCodeActions(uri: string, range: { start: LSPPosition; end: LSPPosition }, context?: any): Promise<LSPCodeAction[]>;

	/**
	 * Format a document
	 */
	formatDocument(uri: string, options?: any): Promise<LSPTextEdit[]>;

	/**
	 * Get signature help
	 */
	getSignatureHelp(uri: string, position: LSPPosition, triggerKind?: number, triggerCharacter?: string): Promise<LSPSignatureHelp | null>;

	/**
	 * Check if the language client is ready
	 */
	isReady(): boolean;
}