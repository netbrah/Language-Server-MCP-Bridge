import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { LanguageClient, DefinitionInput, ReferencesInput, HoverInput, CompletionInput } from './types';

/**
 * MCP Server that exposes Language Server Protocol capabilities as tools
 */
export class LSPMCPServer {
	private mcpServer: McpServer;
	private languageClient: LanguageClient;

	constructor(languageClient: LanguageClient) {
		this.languageClient = languageClient;
		
		this.mcpServer = new McpServer({
			name: 'lsp-mcp-bridge',
			version: '0.0.1',
		});

		this.registerTools();
	}

	/**
	 * Register all MCP tools
	 */
	private registerTools(): void {
		this.registerDefinitionTool();
		this.registerReferencesTool();
		this.registerHoverTool();
		this.registerCompletionTool();
	}

	/**
	 * Register the lsp.definition tool
	 */
	private registerDefinitionTool(): void {
		this.mcpServer.registerTool(
			'lsp.definition',
			{
				title: 'Get Definition',
				description: 'Get the definition location of a symbol at a specific position in a source file',
				inputSchema: {
					uri: z.string().describe('File URI (file:// scheme)'),
					position: z.object({
						line: z.number().describe('Line number (0-based)'),
						character: z.number().describe('Character offset in line (0-based)')
					}).describe('Position in the document')
				}
			},
			async (input) => {
				const { uri, position } = input as DefinitionInput;

				if (!this.languageClient.isReady()) {
					return {
						content: [{
							type: 'text',
							text: 'Error: Language client is not ready'
						}],
						isError: true
					};
				}

				try {
					const locations = await this.languageClient.getDefinition(uri, position);
					
					if (locations.length === 0) {
						return {
							content: [{
								type: 'text',
								text: 'No definition found for symbol at the specified position'
							}]
						};
					}

					const response = locations.map(loc => 
						`Definition found at: ${loc.uri}\n` +
						`Line ${loc.range.start.line + 1}, Column ${loc.range.start.character + 1}`
					).join('\n\n');

					return {
						content: [{
							type: 'text',
							text: response
						}]
					};
				} catch (error) {
					return {
						content: [{
							type: 'text',
							text: `Error getting definition: ${error}`
						}],
						isError: true
					};
				}
			}
		);
	}

	/**
	 * Register the lsp.references tool
	 */
	private registerReferencesTool(): void {
		this.mcpServer.registerTool(
			'lsp.references',
			{
				title: 'Get References',
				description: 'Find all references to a symbol at a specific position in a source file',
				inputSchema: {
					uri: z.string().describe('File URI (file:// scheme)'),
					position: z.object({
						line: z.number().describe('Line number (0-based)'),
						character: z.number().describe('Character offset in line (0-based)')
					}).describe('Position in the document'),
					includeDeclaration: z.boolean().optional().describe('Whether to include the declaration in results (default: true)')
				}
			},
			async (input) => {
				const { uri, position, includeDeclaration = true } = input as ReferencesInput;

				if (!this.languageClient.isReady()) {
					return {
						content: [{
							type: 'text',
							text: 'Error: Language client is not ready'
						}],
						isError: true
					};
				}

				try {
					const locations = await this.languageClient.getReferences(uri, position, includeDeclaration);
					
					if (locations.length === 0) {
						return {
							content: [{
								type: 'text',
								text: 'No references found for symbol at the specified position'
							}]
						};
					}

					const response = `Found ${locations.length} reference(s):\n\n` +
						locations.map((loc, index) => 
							`${index + 1}. ${loc.uri}\n` +
							`   Line ${loc.range.start.line + 1}, Column ${loc.range.start.character + 1}`
						).join('\n');

					return {
						content: [{
							type: 'text',
							text: response
						}]
					};
				} catch (error) {
					return {
						content: [{
							type: 'text',
							text: `Error getting references: ${error}`
						}],
						isError: true
					};
				}
			}
		);
	}

	/**
	 * Register the lsp.hover tool
	 */
	private registerHoverTool(): void {
		this.mcpServer.registerTool(
			'lsp.hover',
			{
				title: 'Get Hover Info',
				description: 'Get hover information (type, documentation) for a symbol at a specific position',
				inputSchema: {
					uri: z.string().describe('File URI (file:// scheme)'),
					position: z.object({
						line: z.number().describe('Line number (0-based)'),
						character: z.number().describe('Character offset in line (0-based)')
					}).describe('Position in the document')
				}
			},
			async (input) => {
				const { uri, position } = input as HoverInput;

				if (!this.languageClient.isReady()) {
					return {
						content: [{
							type: 'text',
							text: 'Error: Language client is not ready'
						}],
						isError: true
					};
				}

				try {
					const hover = await this.languageClient.getHover(uri, position);
					
					if (!hover) {
						return {
							content: [{
								type: 'text',
								text: 'No hover information available for symbol at the specified position'
							}]
						};
					}

					let hoverText = '';
					if (typeof hover.contents === 'string') {
						hoverText = hover.contents;
					} else if (hover.contents && typeof hover.contents === 'object') {
						hoverText = hover.contents.value || hover.contents.toString();
					}

					return {
						content: [{
							type: 'text',
							text: hoverText || 'No hover content available'
						}]
					};
				} catch (error) {
					return {
						content: [{
							type: 'text',
							text: `Error getting hover info: ${error}`
						}],
						isError: true
					};
				}
			}
		);
	}

	/**
	 * Register the lsp.completion tool
	 */
	private registerCompletionTool(): void {
		this.mcpServer.registerTool(
			'lsp.completion',
			{
				title: 'Get Completions',
				description: 'Get code completion suggestions at a specific position in a source file',
				inputSchema: {
					uri: z.string().describe('File URI (file:// scheme)'),
					position: z.object({
						line: z.number().describe('Line number (0-based)'),
						character: z.number().describe('Character offset in line (0-based)')
					}).describe('Position in the document'),
					triggerKind: z.number().optional().describe('How completion was triggered (1=Invoked, 2=TriggerCharacter, 3=TriggerForIncompleteCompletions) (default: 1)'),
					triggerCharacter: z.string().optional().describe('The trigger character if triggerKind is 2')
				}
			},
			async (input) => {
				const { uri, position, triggerKind = 1, triggerCharacter } = input as CompletionInput;

				if (!this.languageClient.isReady()) {
					return {
						content: [{
							type: 'text',
							text: 'Error: Language client is not ready'
						}],
						isError: true
					};
				}

				try {
					const completions = await this.languageClient.getCompletion(uri, position, triggerKind, triggerCharacter);
					
					if (!completions.items || completions.items.length === 0) {
						return {
							content: [{
								type: 'text',
								text: 'No completions available at the specified position'
							}]
						};
					}

					const response = `Found ${completions.items.length} completion(s)${completions.isIncomplete ? ' (incomplete)' : ''}:\n\n` +
						completions.items.slice(0, 20).map((item, index) => { // Limit to first 20 for readability
							let itemText = `${index + 1}. ${item.label}`;
							if (item.kind) {
								itemText += ` (kind: ${item.kind})`;
							}
							if (item.detail) {
								itemText += `\n   Detail: ${item.detail}`;
							}
							if (item.documentation) {
								const doc = typeof item.documentation === 'string' 
									? item.documentation 
									: item.documentation.value;
								itemText += `\n   Doc: ${doc.substring(0, 100)}${doc.length > 100 ? '...' : ''}`;
							}
							return itemText;
						}).join('\n\n');

					const truncatedNote = completions.items.length > 20 
						? `\n\n(Showing first 20 of ${completions.items.length} completions)`
						: '';

					return {
						content: [{
							type: 'text',
							text: response + truncatedNote
						}]
					};
				} catch (error) {
					return {
						content: [{
							type: 'text',
							text: `Error getting completions: ${error}`
						}],
						isError: true
					};
				}
			}
		);
	}

	/**
	 * Start the MCP server with stdio transport
	 */
	public async start(): Promise<void> {
		const transport = new StdioServerTransport();
		await this.mcpServer.connect(transport);
	}

	/**
	 * Get the underlying MCP server instance
	 */
	public getServer(): McpServer {
		return this.mcpServer;
	}
}