import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ClangdClient, DefinitionInput, ReferencesInput, HoverInput, CompletionInput } from './types';

/**
 * MCP Server that exposes clangd Language Server capabilities as tools
 */
export class ClangdMCPServer {
	private mcpServer: McpServer;
	private clangdClient: ClangdClient;

	constructor(clangdClient: ClangdClient) {
		this.clangdClient = clangdClient;
		
		this.mcpServer = new McpServer({
			name: 'clangd-mcp-server',
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
	 * Register the clangd.definition tool
	 */
	private registerDefinitionTool(): void {
		this.mcpServer.registerTool(
			'clangd.definition',
			{
				title: 'Get Definition',
				description: 'Get the definition location of a symbol at a specific position in a C/C++ file',
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

				if (!this.clangdClient.isReady()) {
					return {
						content: [{
							type: 'text',
							text: 'Error: Clangd language client is not ready'
						}],
						isError: true
					};
				}

				try {
					const locations = await this.clangdClient.getDefinition(uri, position);
					
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
	 * Register the clangd.references tool
	 */
	private registerReferencesTool(): void {
		this.mcpServer.registerTool(
			'clangd.references',
			{
				title: 'Get References',
				description: 'Find all references to a symbol at a specific position in a C/C++ file',
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

				if (!this.clangdClient.isReady()) {
					return {
						content: [{
							type: 'text',
							text: 'Error: Clangd language client is not ready'
						}],
						isError: true
					};
				}

				try {
					const locations = await this.clangdClient.getReferences(uri, position, includeDeclaration);
					
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
	 * Register the clangd.hover tool
	 */
	private registerHoverTool(): void {
		this.mcpServer.registerTool(
			'clangd.hover',
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

				if (!this.clangdClient.isReady()) {
					return {
						content: [{
							type: 'text',
							text: 'Error: Clangd language client is not ready'
						}],
						isError: true
					};
				}

				try {
					const hover = await this.clangdClient.getHover(uri, position);
					
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
	 * Register the clangd.completion tool
	 */
	private registerCompletionTool(): void {
		this.mcpServer.registerTool(
			'clangd.completion',
			{
				title: 'Get Completions',
				description: 'Get code completion suggestions at a specific position in a C/C++ file',
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

				if (!this.clangdClient.isReady()) {
					return {
						content: [{
							type: 'text',
							text: 'Error: Clangd language client is not ready'
						}],
						isError: true
					};
				}

				try {
					const completions = await this.clangdClient.getCompletion(uri, position, triggerKind, triggerCharacter);
					
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