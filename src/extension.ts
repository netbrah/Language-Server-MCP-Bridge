import * as vscode from 'vscode';
import { VSCodeClangdClient } from './clangdClient';
import { ClangdMCPServer } from './mcpServer';

let mcpServer: ClangdMCPServer | undefined;
let clangdClient: VSCodeClangdClient | undefined;

/**
 * Activates the Clangd MCP Server extension.
 * This extension exposes clangd Language Server capabilities as MCP tools.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
	console.log('Clangd MCP Server extension is now activating...');

	try {
		// Initialize the clangd client adapter
		clangdClient = new VSCodeClangdClient();
		await clangdClient.initialize();

		// Create and start the MCP server
		mcpServer = new ClangdMCPServer(clangdClient);
		
		// Note: The MCP server runs in stdio mode, so we don't start it here
		// It will be started when a client connects via stdio transport
		
		console.log('Clangd MCP Server extension activated successfully');
		
		// Add to disposables for cleanup
		context.subscriptions.push({
			dispose() {
				clangdClient?.dispose();
			}
		});

		// Register a command to manually start the MCP server for testing
		const startServerCommand = vscode.commands.registerCommand(
			'clangd-mcp-server.startServer',
			async () => {
				if (mcpServer) {
					try {
						await mcpServer.start();
						vscode.window.showInformationMessage('MCP Server started successfully');
					} catch (error) {
						vscode.window.showErrorMessage(`Failed to start MCP Server: ${error}`);
					}
				}
			}
		);

		context.subscriptions.push(startServerCommand);

	} catch (error) {
		console.error('Failed to activate Clangd MCP Server extension:', error);
		vscode.window.showErrorMessage(`Failed to activate Clangd MCP Server: ${error}`);
	}
}

/**
 * Deactivates the extension.
 */
export function deactivate(): void {
	console.log('Clangd MCP Server extension deactivated');
	clangdClient?.dispose();
	mcpServer = undefined;
	clangdClient = undefined;
}
