import * as vscode from 'vscode';
import * as path from 'path';

/**
 * MCP Server Definition Provider that registers our LSP MCP server with VS Code
 */
export class LSPMcpServerProvider implements vscode.McpServerDefinitionProvider {
	private _onDidChangeMcpServerDefinitions = new vscode.EventEmitter<void>();
	public readonly onDidChangeMcpServerDefinitions = this._onDidChangeMcpServerDefinitions.event;

	/**
	 * Provide the MCP server definitions
	 */
	public async provideMcpServerDefinitions(): Promise<vscode.McpServerDefinition[]> {
		// For now, return empty array since we're primarily using Language Model Tools
		// In the future, this could provide a stdio server for external clients
		console.log('MCP server definitions requested - currently using Language Model Tools integration');
		return [];
	}

	/**
	 * Resolve MCP server definition - called when the server needs to be started
	 */
	public async resolveMcpServerDefinition(
		definition: vscode.McpServerDefinition
	): Promise<vscode.McpServerDefinition> {
		// No additional resolution needed for our simple stdio server
		return definition;
	}

	/**
	 * Dispose the provider
	 */
	public dispose(): void {
		this._onDidChangeMcpServerDefinitions.dispose();
	}
}

/**
 * Register the MCP server provider with VS Code
 */
export function registerMcpServerProvider(context: vscode.ExtensionContext): vscode.Disposable {
	const provider = new LSPMcpServerProvider();
	
	const disposable = vscode.lm.registerMcpServerDefinitionProvider(
		'lsp-mcp-bridge',
		provider
	);

	context.subscriptions.push(provider, disposable);
	
	return disposable;
}