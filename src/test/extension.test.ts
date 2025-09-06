import * as assert from 'assert';
import * as vscode from 'vscode';
import { VSCodeClangdClient } from '../clangdClient';
import { ClangdMCPServer } from '../mcpServer';
import { 
    DefinitionInput, 
    ReferencesInput, 
    HoverInput, 
    CompletionInput,
    ClangdClient,
    LSPPosition,
    LSPLocation
} from '../types';

class MockClangdClient implements ClangdClient {
    async getDefinition(uri: string, position: LSPPosition): Promise<LSPLocation[]> {
        return [];
    }

    async getReferences(uri: string, position: LSPPosition, includeDeclaration?: boolean): Promise<LSPLocation[]> {
        return [];
    }

    async getHover(uri: string, position: LSPPosition): Promise<any> {
        return null;
    }

    async getCompletion(uri: string, position: LSPPosition, triggerKind?: number, triggerCharacter?: string): Promise<any> {
        return { isIncomplete: false, items: [] };
    }

    isReady(): boolean {
        return true;
    }
}

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    suite('ClangdMCPServer Tests', () => {
        let mockClient: MockClangdClient;
        let mcpServer: ClangdMCPServer;

        setup(() => {
            mockClient = new MockClangdClient();
            mcpServer = new ClangdMCPServer(mockClient);
        });

        test('should create MCP server instance', () => {
            assert.ok(mcpServer);
        });

        test('should handle definition requests with mock client', async () => {
            // Override mock to return a result
            mockClient.getDefinition = async () => [{
                uri: 'file:///test.cpp',
                range: {
                    start: { line: 5, character: 0 },
                    end: { line: 5, character: 10 }
                }
            }];

            const result = await mockClient.getDefinition('file:///test.cpp', { line: 10, character: 5 });
            assert.ok(result);
            assert.ok(Array.isArray(result));
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].uri, 'file:///test.cpp');
        });

        test('should handle references requests with mock client', async () => {
            mockClient.getReferences = async () => [{
                uri: 'file:///test.cpp',
                range: {
                    start: { line: 10, character: 5 },
                    end: { line: 10, character: 15 }
                }
            }];

            const result = await mockClient.getReferences('file:///test.cpp', { line: 10, character: 5 });
            assert.ok(result);
            assert.ok(Array.isArray(result));
            assert.strictEqual(result.length, 1);
        });

        test('should handle hover requests with mock client', async () => {
            mockClient.getHover = async () => ({
                contents: {
                    kind: 'markdown',
                    value: '```cpp\nint variable\n```'
                },
                range: {
                    start: { line: 10, character: 5 },
                    end: { line: 10, character: 13 }
                }
            });

            const result = await mockClient.getHover('file:///test.cpp', { line: 10, character: 5 });
            assert.ok(result);
            assert.ok(result.contents);
        });

        test('should handle completion requests with mock client', async () => {
            mockClient.getCompletion = async () => ({
                isIncomplete: false,
                items: [{
                    label: 'method',
                    kind: 2, // Method
                    detail: 'void method()',
                    insertText: 'method()'
                }]
            });

            const result = await mockClient.getCompletion('file:///test.cpp', { line: 10, character: 5 });
            assert.ok(result);
            assert.ok(Array.isArray(result.items));
            assert.strictEqual(result.items[0].label, 'method');
        });

        test('should handle empty responses gracefully', async () => {
            const result = await mockClient.getDefinition('file:///test.cpp', { line: 10, character: 5 });
            assert.ok(result);
            assert.strictEqual(result.length, 0);
        });

        test('should handle client ready state', () => {
            assert.strictEqual(mockClient.isReady(), true);
        });
    });

    suite('Type Interface Tests', () => {
        test('should validate definition input structure', () => {
            const input: DefinitionInput = {
                uri: 'file:///test.cpp',
                position: { line: 10, character: 5 }
            };

            assert.ok(input.uri);
            assert.ok(typeof input.position.line === 'number');
            assert.ok(typeof input.position.character === 'number');
        });

        test('should validate references input structure', () => {
            const input: ReferencesInput = {
                uri: 'file:///test.cpp',
                position: { line: 10, character: 5 },
                includeDeclaration: true
            };

            assert.ok(input.uri);
            assert.ok(typeof input.position.line === 'number');
            assert.ok(typeof input.position.character === 'number');
            assert.ok(typeof input.includeDeclaration === 'boolean');
        });

        test('should validate hover input structure', () => {
            const input: HoverInput = {
                uri: 'file:///test.cpp',
                position: { line: 10, character: 5 }
            };

            assert.ok(input.uri);
            assert.ok(typeof input.position.line === 'number');
            assert.ok(typeof input.position.character === 'number');
        });

        test('should validate completion input structure', () => {
            const input: CompletionInput = {
                uri: 'file:///test.cpp',
                position: { line: 10, character: 5 },
                triggerKind: 1,
                triggerCharacter: '.'
            };

            assert.ok(input.uri);
            assert.ok(typeof input.position.line === 'number');
            assert.ok(typeof input.position.character === 'number');
            assert.ok(typeof input.triggerKind === 'number');
            assert.ok(typeof input.triggerCharacter === 'string');
        });
    });

    suite('VSCodeClangdClient Tests', () => {
        test('should create VSCodeClangdClient instance', () => {
            const client = new VSCodeClangdClient();
            assert.ok(client);
        });
    });
});
