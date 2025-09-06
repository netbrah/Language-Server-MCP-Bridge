/**
 * Type definitions for clangd LSP integration
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
 * MCP Position type for our tool inputs
 */
export interface MCPPosition {
	line: number;
	character: number;
}

/**
 * Input schema for clangd.definition tool
 */
export interface DefinitionInput {
	uri: string;
	position: MCPPosition;
}

/**
 * Input schema for clangd.references tool
 */
export interface ReferencesInput {
	uri: string;
	position: MCPPosition;
	includeDeclaration?: boolean;
}

/**
 * Input schema for clangd.hover tool
 */
export interface HoverInput {
	uri: string;
	position: MCPPosition;
}

/**
 * Input schema for clangd.completion tool
 */
export interface CompletionInput {
	uri: string;
	position: MCPPosition;
	triggerKind?: number;
	triggerCharacter?: string;
}

/**
 * Clangd language client interface - abstracts VSCode's language client
 */
export interface ClangdClient {
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
	 * Check if the language client is ready
	 */
	isReady(): boolean;
}