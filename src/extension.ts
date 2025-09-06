import * as vscode from 'vscode';

/**
 * Activates the Clangd MCP Server extension.
 * This extension exposes clangd Language Server capabilities as MCP tools.
 */
export function activate(context: vscode.ExtensionContext): void {
	console.log('Clangd MCP Server extension is now active');

	// TODO: Initialize MCP server and register tools
	// - clangd.definition
	// - clangd.references  
	// - clangd.hover
	// - clangd.completion
}

/**
 * Deactivates the extension.
 */
export function deactivate(): void {
	console.log('Clangd MCP Server extension deactivated');
}
