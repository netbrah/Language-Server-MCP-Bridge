import * as vscode from 'vscode';
import { VSCodeLanguageClient } from './languageClient';
import { registerLanguageModelTools } from './languageModelTools';

let languageClient: VSCodeLanguageClient | undefined;

/**
 * Test function to demonstrate Language Model tools usage
 */
async function testLanguageModelTools(
	document: vscode.TextDocument, 
	position: vscode.Position
): Promise<void> {
	const uri = document.uri.toString();
	const lspPosition = { line: position.line, character: position.character };

	console.log(`Testing Language Model tools at ${uri}:${position.line}:${position.character}`);

	// Test Definition
	try {
		console.log('🔍 Testing lsp_definition...');
		const definitions = await languageClient?.getDefinition(uri, lspPosition);
		console.log('Definition results:', definitions);
		
		if (definitions && definitions.length > 0) {
			vscode.window.showInformationMessage(
				`Found ${definitions.length} definition(s) for symbol at cursor`
			);
		} else {
			vscode.window.showInformationMessage('No definitions found');
		}
	} catch (error) {
		console.error('Definition test failed:', error);
	}

	// Test References
	try {
		console.log('🔗 Testing lsp_references...');
		const references = await languageClient?.getReferences(uri, lspPosition, true);
		console.log('References results:', references);
		
		if (references && references.length > 0) {
			vscode.window.showInformationMessage(
				`Found ${references.length} reference(s) for symbol at cursor`
			);
		} else {
			vscode.window.showInformationMessage('No references found');
		}
	} catch (error) {
		console.error('References test failed:', error);
	}

	// Test Hover
	try {
		console.log('💬 Testing lsp_hover...');
		const hover = await languageClient?.getHover(uri, lspPosition);
		console.log('Hover results:', hover);
		
		if (hover) {
			const contents = typeof hover.contents === 'string' 
				? hover.contents 
				: hover.contents.value || 'Hover info available';
			vscode.window.showInformationMessage(`Hover: ${contents.substring(0, 100)}...`);
		} else {
			vscode.window.showInformationMessage('No hover information found');
		}
	} catch (error) {
		console.error('Hover test failed:', error);
	}

	// Test Completion
	try {
		console.log('💡 Testing lsp_completion...');
		const completions = await languageClient?.getCompletion(uri, lspPosition);
		console.log('Completion results:', completions);
		
		if (completions && completions.items.length > 0) {
			vscode.window.showInformationMessage(
				`Found ${completions.items.length} completion suggestion(s)`
			);
		} else {
			vscode.window.showInformationMessage('No completions found');
		}
	} catch (error) {
		console.error('Completion test failed:', error);
	}

	// Show completion message
	vscode.window.showInformationMessage('✅ Language Model tools test completed! Check console for details.');
}

/**
 * Activates the LSP Language Model Tools extension.
 * This extension exposes Language Server Protocol capabilities as GitHub Copilot Language Model Tools.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
	console.log('LSP Language Model Tools extension is now activating...');

	try {
		// Initialize the language client adapter
		languageClient = new VSCodeLanguageClient();
		await languageClient.initialize();
		
		// Register Language Model Tools for GitHub Copilot integration
		const lmToolsDisposables = registerLanguageModelTools(languageClient);
		
		console.log('LSP Language Model Tools extension activated successfully');
		console.log('- GitHub Copilot tools: 10 tools automatically available');
		
		// Add to disposables for cleanup
		context.subscriptions.push({
			dispose() {
				languageClient?.dispose();
			}
		}, ...lmToolsDisposables);

		// Register a command to test the Language Model tools directly
		const testToolsCommand = vscode.commands.registerCommand(
			'lsp-mcp-bridge.testTools',
			async () => {
				const editor = vscode.window.activeTextEditor;
				if (!editor) {
					vscode.window.showErrorMessage('No active editor. Please open a source file.');
					return;
				}

				const document = editor.document;
				const position = editor.selection.active;

				// Test all tools at the current cursor position
				try {
					await testLanguageModelTools(document, position);
				} catch (error) {
					vscode.window.showErrorMessage(`Tool test failed: ${error}`);
				}
			}
		);

		// Register a command to list available Language Model Tools
		const listToolsCommand = vscode.commands.registerCommand(
			'lsp-mcp-bridge.listLMTools',
			async () => {
				const tools = vscode.lm.tools;
				const ourTools = tools.filter(tool => tool.name.startsWith('lsp_'));
				
				if (ourTools.length === 0) {
					vscode.window.showInformationMessage('No LSP tools found in language model registry');
				} else {
					const toolsList = ourTools.map(tool => `• ${tool.name}: ${tool.description}`).join('\n');
					vscode.window.showInformationMessage(`Found ${ourTools.length} LSP Language Model Tools:\n\n${toolsList}`);
				}
			}
		);

		context.subscriptions.push(testToolsCommand, listToolsCommand);

	} catch (error) {
		console.error('Failed to activate LSP Language Model Tools extension:', error);
		vscode.window.showErrorMessage(`Failed to activate LSP Language Model Tools: ${error}`);
	}
}

/**
 * Deactivates the extension.
 */
export function deactivate(): void {
	console.log('LSP Language Model Tools extension deactivated');
	languageClient?.dispose();
	languageClient = undefined;
}
