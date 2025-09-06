import * as vscode from 'vscode';
import { LanguageClient, State } from 'vscode-languageclient/node';
import { ClangdClient, LSPPosition, LSPLocation, LSPHover, LSPCompletionList } from './types';

/**
 * VSCode Language Client adapter for clangd
 * This class wraps VSCode's LanguageClient to provide the interface we need
 */
export class VSCodeClangdClient implements ClangdClient {
	private client: LanguageClient | null = null;

	/**
	 * Initialize the client by finding the active clangd language client
	 */
	public async initialize(): Promise<void> {
		// Try to find the clangd extension and its client
		const clangdExtension = vscode.extensions.getExtension('llvm-vs-code-extensions.vscode-clangd');
		
		if (!clangdExtension) {
			throw new Error('Clangd extension not found. Please install the clangd VSCode extension.');
		}

		if (!clangdExtension.isActive) {
			await clangdExtension.activate();
		}

		// Access the language client from the extension
		// Note: This may need adjustment based on clangd extension's API
		if (clangdExtension.exports && clangdExtension.exports.getClient) {
			this.client = clangdExtension.exports.getClient();
		} else {
			// Fallback: try to find any active language client
			// This is a more generic approach that might work
			this.client = await this.findActiveLanguageClient();
		}

		if (!this.client) {
			throw new Error('Could not access clangd language client');
		}

		// Wait for the client to be ready
		await this.waitForClientReady();
	}

	/**
	 * Fallback method to find active language client
	 */
	private async findActiveLanguageClient(): Promise<LanguageClient | null> {
		// This is a heuristic approach - we'll look for any language client
		// that might be clangd by checking its capabilities or ID
		// Implementation would depend on how we can access the language clients
		// For now, we'll return null and rely on the extension export
		return null;
	}

	/**
	 * Wait for the language client to be ready
	 */
	private async waitForClientReady(): Promise<void> {
		if (!this.client) {
			throw new Error('Language client not initialized');
		}

		// Wait for the client to be ready with a timeout
		const timeout = 10000; // 10 seconds
		const startTime = Date.now();

		while (!this.isReady() && (Date.now() - startTime) < timeout) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}

		if (!this.isReady()) {
			throw new Error('Language client failed to become ready within timeout');
		}
	}

	/**
	 * Check if the language client is ready
	 */
	public isReady(): boolean {
		return this.client?.state === State.Running;
	}

	/**
	 * Request definition locations for a symbol
	 */
	public async getDefinition(uri: string, position: LSPPosition): Promise<LSPLocation[]> {
		if (!this.client || !this.isReady()) {
			throw new Error('Language client not ready');
		}

		try {
			const result = await this.client.sendRequest('textDocument/definition', {
				textDocument: { uri },
				position
			});

			// Handle different response formats (Location | Location[] | LocationLink[])
			if (!result) {
				return [];
			}

			if (Array.isArray(result)) {
				return result.map(this.normalizeLocation);
			} else {
				return [this.normalizeLocation(result)];
			}
		} catch (error) {
			console.error('Error getting definition:', error);
			throw new Error(`Failed to get definition: ${error}`);
		}
	}

	/**
	 * Request references for a symbol
	 */
	public async getReferences(uri: string, position: LSPPosition, includeDeclaration = true): Promise<LSPLocation[]> {
		if (!this.client || !this.isReady()) {
			throw new Error('Language client not ready');
		}

		try {
			const result = await this.client.sendRequest('textDocument/references', {
				textDocument: { uri },
				position,
				context: { includeDeclaration }
			});

			if (!result || !Array.isArray(result)) {
				return [];
			}

			return result.map(this.normalizeLocation);
		} catch (error) {
			console.error('Error getting references:', error);
			throw new Error(`Failed to get references: ${error}`);
		}
	}

	/**
	 * Request hover information for a symbol
	 */
	public async getHover(uri: string, position: LSPPosition): Promise<LSPHover | null> {
		if (!this.client || !this.isReady()) {
			throw new Error('Language client not ready');
		}

		try {
			const result = await this.client.sendRequest('textDocument/hover', {
				textDocument: { uri },
				position
			});

			return (result as LSPHover) || null;
		} catch (error) {
			console.error('Error getting hover:', error);
			throw new Error(`Failed to get hover: ${error}`);
		}
	}

	/**
	 * Request completion suggestions
	 */
	public async getCompletion(
		uri: string, 
		position: LSPPosition, 
		triggerKind = 1, 
		triggerCharacter?: string
	): Promise<LSPCompletionList> {
		if (!this.client || !this.isReady()) {
			throw new Error('Language client not ready');
		}

		try {
			const context: any = { triggerKind };
			if (triggerCharacter) {
				context.triggerCharacter = triggerCharacter;
			}

			const result = await this.client.sendRequest('textDocument/completion', {
				textDocument: { uri },
				position,
				context
			});

			// Handle both CompletionList and CompletionItem[] formats
			if (!result) {
				return { isIncomplete: false, items: [] };
			}

			if (Array.isArray(result)) {
				return { isIncomplete: false, items: result };
			}

			return result as LSPCompletionList;
		} catch (error) {
			console.error('Error getting completion:', error);
			throw new Error(`Failed to get completion: ${error}`);
		}
	}

	/**
	 * Normalize location objects to ensure consistent format
	 */
	private normalizeLocation(location: any): LSPLocation {
		// Handle LocationLink format
		if (location.targetUri) {
			return {
				uri: location.targetUri,
				range: location.targetRange || location.targetSelectionRange
			};
		}

		// Handle standard Location format
		return {
			uri: location.uri,
			range: location.range
		};
	}

	/**
	 * Dispose of the client reference
	 */
	public dispose(): void {
		this.client = null;
	}
}