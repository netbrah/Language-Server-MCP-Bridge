import * as assert from 'assert';
import * as vscode from 'vscode';
import { LanguageClient, LSPPosition, LSPLocation, LSPHover, LSPCompletionList } from '../types';

/**
 * Mock Language Client for testing language model tools
 */
class MockLanguageClient implements LanguageClient {
    private mockDefinitions: LSPLocation[] = [];
    private mockReferences: LSPLocation[] = [];
    private mockHover: LSPHover | null = null;
    private mockCompletions: LSPCompletionList = { isIncomplete: false, items: [] };
    private ready: boolean = true;

    setMockDefinitions(definitions: LSPLocation[]): void {
        this.mockDefinitions = definitions;
    }

    setMockReferences(references: LSPLocation[]): void {
        this.mockReferences = references;
    }

    setMockHover(hover: LSPHover | null): void {
        this.mockHover = hover;
    }

    setMockCompletions(completions: LSPCompletionList): void {
        this.mockCompletions = completions;
    }

    setReady(ready: boolean): void {
        this.ready = ready;
    }

    async getDefinition(uri: string, position: LSPPosition): Promise<LSPLocation[]> {
        if (!this.ready) {
            throw new Error('Client not ready');
        }
        return this.mockDefinitions;
    }

    async getReferences(uri: string, position: LSPPosition, includeDeclaration?: boolean): Promise<LSPLocation[]> {
        if (!this.ready) {
            throw new Error('Client not ready');
        }
        return this.mockReferences;
    }

    async getHover(uri: string, position: LSPPosition): Promise<LSPHover | null> {
        if (!this.ready) {
            throw new Error('Client not ready');
        }
        return this.mockHover;
    }

    async getCompletion(uri: string, position: LSPPosition, triggerKind?: number, triggerCharacter?: string): Promise<LSPCompletionList> {
        if (!this.ready) {
            throw new Error('Client not ready');
        }
        return this.mockCompletions;
    }

    async getWorkspaceSymbols(query: string): Promise<any[]> {
        return [];
    }

    async getDocumentSymbols(uri: string): Promise<any[]> {
        return [];
    }

    async renameSymbol(uri: string, position: LSPPosition, newName: string): Promise<any> {
        return null;
    }

    async getCodeActions(uri: string, range: any, context?: any): Promise<any[]> {
        return [];
    }

    async formatDocument(uri: string, options?: any): Promise<any[]> {
        return [];
    }

    async getSignatureHelp(uri: string, position: LSPPosition, triggerKind?: number, triggerCharacter?: string): Promise<any> {
        return null;
    }

    isReady(): boolean {
        return this.ready;
    }
}

suite('Language Model Tools Test Suite', () => {
    let mockClient: MockLanguageClient;

    setup(() => {
        mockClient = new MockLanguageClient();
    });

    suite('Definition Tool Tests', () => {
        test('should return definitions when available', async () => {
            const mockDef: LSPLocation = {
                uri: 'file:///test.ts',
                range: {
                    start: { line: 10, character: 5 },
                    end: { line: 10, character: 15 }
                }
            };
            mockClient.setMockDefinitions([mockDef]);

            const result = await mockClient.getDefinition('file:///test.ts', { line: 5, character: 10 });
            
            assert.ok(result);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].uri, 'file:///test.ts');
            assert.strictEqual(result[0].range.start.line, 10);
        });

        test('should return empty array when no definitions found', async () => {
            mockClient.setMockDefinitions([]);

            const result = await mockClient.getDefinition('file:///test.ts', { line: 5, character: 10 });
            
            assert.ok(result);
            assert.strictEqual(result.length, 0);
        });

        test('should handle multiple definitions', async () => {
            const defs: LSPLocation[] = [
                {
                    uri: 'file:///test1.ts',
                    range: { start: { line: 1, character: 0 }, end: { line: 1, character: 10 } }
                },
                {
                    uri: 'file:///test2.ts',
                    range: { start: { line: 2, character: 0 }, end: { line: 2, character: 10 } }
                }
            ];
            mockClient.setMockDefinitions(defs);

            const result = await mockClient.getDefinition('file:///test.ts', { line: 5, character: 10 });
            
            assert.strictEqual(result.length, 2);
        });

        test('should throw error when client not ready', async () => {
            mockClient.setReady(false);

            await assert.rejects(
                async () => await mockClient.getDefinition('file:///test.ts', { line: 5, character: 10 }),
                /Client not ready/
            );
        });
    });

    suite('References Tool Tests', () => {
        test('should return references when available', async () => {
            const mockRef: LSPLocation = {
                uri: 'file:///usage.ts',
                range: {
                    start: { line: 20, character: 8 },
                    end: { line: 20, character: 18 }
                }
            };
            mockClient.setMockReferences([mockRef]);

            const result = await mockClient.getReferences('file:///test.ts', { line: 5, character: 10 });
            
            assert.ok(result);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].uri, 'file:///usage.ts');
        });

        test('should return empty array when no references found', async () => {
            mockClient.setMockReferences([]);

            const result = await mockClient.getReferences('file:///test.ts', { line: 5, character: 10 });
            
            assert.strictEqual(result.length, 0);
        });

        test('should handle includeDeclaration parameter', async () => {
            const refs: LSPLocation[] = [
                {
                    uri: 'file:///test.ts',
                    range: { start: { line: 5, character: 10 }, end: { line: 5, character: 20 } }
                }
            ];
            mockClient.setMockReferences(refs);

            const result = await mockClient.getReferences('file:///test.ts', { line: 5, character: 10 }, true);
            
            assert.ok(result);
            assert.strictEqual(result.length, 1);
        });

        test('should throw error when client not ready', async () => {
            mockClient.setReady(false);

            await assert.rejects(
                async () => await mockClient.getReferences('file:///test.ts', { line: 5, character: 10 }),
                /Client not ready/
            );
        });
    });

    suite('Hover Tool Tests', () => {
        test('should return hover information with markdown content', async () => {
            const mockHoverData: LSPHover = {
                contents: {
                    kind: 'markdown',
                    value: '```typescript\nfunction test(): void\n```'
                },
                range: {
                    start: { line: 5, character: 10 },
                    end: { line: 5, character: 14 }
                }
            };
            mockClient.setMockHover(mockHoverData);

            const result = await mockClient.getHover('file:///test.ts', { line: 5, character: 10 });
            
            assert.ok(result);
            assert.ok(typeof result.contents === 'object');
            if (typeof result.contents === 'object') {
                assert.strictEqual(result.contents.kind, 'markdown');
                assert.ok(result.contents.value.includes('function test()'));
            }
        });

        test('should return hover information with string content', async () => {
            const mockHoverData: LSPHover = {
                contents: 'Simple hover text'
            };
            mockClient.setMockHover(mockHoverData);

            const result = await mockClient.getHover('file:///test.ts', { line: 5, character: 10 });
            
            assert.ok(result);
            assert.strictEqual(result.contents, 'Simple hover text');
        });

        test('should return null when no hover information available', async () => {
            mockClient.setMockHover(null);

            const result = await mockClient.getHover('file:///test.ts', { line: 5, character: 10 });
            
            assert.strictEqual(result, null);
        });

        test('should throw error when client not ready', async () => {
            mockClient.setReady(false);

            await assert.rejects(
                async () => await mockClient.getHover('file:///test.ts', { line: 5, character: 10 }),
                /Client not ready/
            );
        });
    });

    suite('Completion Tool Tests', () => {
        test('should return completion items', async () => {
            const mockCompletionData: LSPCompletionList = {
                isIncomplete: false,
                items: [
                    {
                        label: 'testMethod',
                        kind: 2, // Method
                        detail: 'method(): void',
                        insertText: 'testMethod()'
                    }
                ]
            };
            mockClient.setMockCompletions(mockCompletionData);

            const result = await mockClient.getCompletion('file:///test.ts', { line: 5, character: 10 });
            
            assert.ok(result);
            assert.strictEqual(result.items.length, 1);
            assert.strictEqual(result.items[0].label, 'testMethod');
            assert.strictEqual(result.isIncomplete, false);
        });

        test('should handle incomplete completion lists', async () => {
            const mockCompletionData: LSPCompletionList = {
                isIncomplete: true,
                items: [
                    { label: 'item1' },
                    { label: 'item2' }
                ]
            };
            mockClient.setMockCompletions(mockCompletionData);

            const result = await mockClient.getCompletion('file:///test.ts', { line: 5, character: 10 });
            
            assert.strictEqual(result.isIncomplete, true);
            assert.strictEqual(result.items.length, 2);
        });

        test('should return empty completion list when no suggestions', async () => {
            const mockCompletionData: LSPCompletionList = {
                isIncomplete: false,
                items: []
            };
            mockClient.setMockCompletions(mockCompletionData);

            const result = await mockClient.getCompletion('file:///test.ts', { line: 5, character: 10 });
            
            assert.ok(result);
            assert.strictEqual(result.items.length, 0);
        });

        test('should handle trigger character completion', async () => {
            const mockCompletionData: LSPCompletionList = {
                isIncomplete: false,
                items: [
                    { label: 'property1' },
                    { label: 'property2' }
                ]
            };
            mockClient.setMockCompletions(mockCompletionData);

            const result = await mockClient.getCompletion('file:///test.ts', { line: 5, character: 10 }, 2, '.');
            
            assert.ok(result);
            assert.strictEqual(result.items.length, 2);
        });

        test('should throw error when client not ready', async () => {
            mockClient.setReady(false);

            await assert.rejects(
                async () => await mockClient.getCompletion('file:///test.ts', { line: 5, character: 10 }),
                /Client not ready/
            );
        });
    });

    suite('Input Validation Tests', () => {
        test('should validate position coordinates are numbers', () => {
            const position: LSPPosition = { line: 10, character: 5 };
            assert.strictEqual(typeof position.line, 'number');
            assert.strictEqual(typeof position.character, 'number');
        });

        test('should validate URI format', () => {
            const validUris = [
                'file:///path/to/file.ts',
                'file:///c:/Users/test/file.js',
                'file:///home/user/project/main.py'
            ];

            validUris.forEach(uri => {
                assert.ok(uri.startsWith('file://'));
            });
        });

        test('should validate location structure', () => {
            const location: LSPLocation = {
                uri: 'file:///test.ts',
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 10 }
                }
            };

            assert.ok(location.uri);
            assert.ok(location.range.start);
            assert.ok(location.range.end);
            assert.strictEqual(typeof location.range.start.line, 'number');
            assert.strictEqual(typeof location.range.end.character, 'number');
        });
    });

    suite('Edge Cases Tests', () => {
        test('should handle zero-based positions', async () => {
            mockClient.setMockDefinitions([
                {
                    uri: 'file:///test.ts',
                    range: {
                        start: { line: 0, character: 0 },
                        end: { line: 0, character: 5 }
                    }
                }
            ]);

            const result = await mockClient.getDefinition('file:///test.ts', { line: 0, character: 0 });
            
            assert.ok(result);
            assert.strictEqual(result[0].range.start.line, 0);
            assert.strictEqual(result[0].range.start.character, 0);
        });

        test('should handle large line numbers', async () => {
            const largePosition: LSPPosition = { line: 10000, character: 500 };
            mockClient.setMockDefinitions([
                {
                    uri: 'file:///test.ts',
                    range: {
                        start: largePosition,
                        end: { line: largePosition.line, character: largePosition.character + 10 }
                    }
                }
            ]);

            const result = await mockClient.getDefinition('file:///test.ts', largePosition);
            
            assert.ok(result);
            assert.strictEqual(result[0].range.start.line, 10000);
        });

        test('should handle empty file URIs gracefully', async () => {
            mockClient.setMockDefinitions([]);

            const result = await mockClient.getDefinition('', { line: 0, character: 0 });
            
            // Should not throw, just return empty results
            assert.ok(Array.isArray(result));
        });
    });
});
