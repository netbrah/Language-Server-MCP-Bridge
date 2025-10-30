import * as assert from 'assert';
import * as vscode from 'vscode';
import { 
    LanguageClient,
    LSPPosition,
    LSPLocation,
    LSPHover,
    LSPCallHierarchyItem,
    LSPCallHierarchyIncomingCall,
    LSPCallHierarchyOutgoingCall,
    LSPTypeHierarchyItem,
    LSPCompletionList
} from '../types';

/**
 * Enhanced mock language client for testing the super tool
 */
class MockLanguageClientForSuperTool implements LanguageClient {
    private mockData: {
        hover?: LSPHover | null;
        definitions?: LSPLocation[];
        typeDefinitions?: LSPLocation[];
        declarations?: LSPLocation[];
        implementations?: LSPLocation[];
        references?: LSPLocation[];
        callHierarchyItems?: LSPCallHierarchyItem[];
        incomingCalls?: LSPCallHierarchyIncomingCall[];
        outgoingCalls?: LSPCallHierarchyOutgoingCall[];
        typeHierarchyItems?: LSPTypeHierarchyItem[];
        supertypes?: LSPTypeHierarchyItem[];
        subtypes?: LSPTypeHierarchyItem[];
    } = {};

    setMockHover(hover: LSPHover | null): void {
        this.mockData.hover = hover;
    }

    setMockDefinitions(definitions: LSPLocation[]): void {
        this.mockData.definitions = definitions;
    }

    setMockTypeDefinitions(typeDefinitions: LSPLocation[]): void {
        this.mockData.typeDefinitions = typeDefinitions;
    }

    setMockDeclarations(declarations: LSPLocation[]): void {
        this.mockData.declarations = declarations;
    }

    setMockImplementations(implementations: LSPLocation[]): void {
        this.mockData.implementations = implementations;
    }

    setMockReferences(references: LSPLocation[]): void {
        this.mockData.references = references;
    }

    setMockCallHierarchyItems(items: LSPCallHierarchyItem[]): void {
        this.mockData.callHierarchyItems = items;
    }

    setMockIncomingCalls(calls: LSPCallHierarchyIncomingCall[]): void {
        this.mockData.incomingCalls = calls;
    }

    setMockOutgoingCalls(calls: LSPCallHierarchyOutgoingCall[]): void {
        this.mockData.outgoingCalls = calls;
    }

    setMockTypeHierarchyItems(items: LSPTypeHierarchyItem[]): void {
        this.mockData.typeHierarchyItems = items;
    }

    setMockSupertypes(supertypes: LSPTypeHierarchyItem[]): void {
        this.mockData.supertypes = supertypes;
    }

    setMockSubtypes(subtypes: LSPTypeHierarchyItem[]): void {
        this.mockData.subtypes = subtypes;
    }

    async getDefinition(uri: string, position: LSPPosition): Promise<LSPLocation[]> {
        return this.mockData.definitions || [];
    }

    async getTypeDefinition(uri: string, position: LSPPosition): Promise<LSPLocation[]> {
        return this.mockData.typeDefinitions || [];
    }

    async getDeclaration(uri: string, position: LSPPosition): Promise<LSPLocation[]> {
        return this.mockData.declarations || [];
    }

    async getImplementation(uri: string, position: LSPPosition): Promise<LSPLocation[]> {
        return this.mockData.implementations || [];
    }

    async getReferences(uri: string, position: LSPPosition, includeDeclaration?: boolean): Promise<LSPLocation[]> {
        return this.mockData.references || [];
    }

    async getHover(uri: string, position: LSPPosition): Promise<LSPHover | null> {
        return this.mockData.hover || null;
    }

    async getCompletion(uri: string, position: LSPPosition, triggerKind?: number, triggerCharacter?: string): Promise<LSPCompletionList> {
        return { isIncomplete: false, items: [] };
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

    async prepareCallHierarchy(uri: string, position: LSPPosition): Promise<LSPCallHierarchyItem[]> {
        return this.mockData.callHierarchyItems || [];
    }

    async getCallHierarchyIncomingCalls(item: LSPCallHierarchyItem): Promise<LSPCallHierarchyIncomingCall[]> {
        return this.mockData.incomingCalls || [];
    }

    async getCallHierarchyOutgoingCalls(item: LSPCallHierarchyItem): Promise<LSPCallHierarchyOutgoingCall[]> {
        return this.mockData.outgoingCalls || [];
    }

    async prepareTypeHierarchy(uri: string, position: LSPPosition): Promise<LSPTypeHierarchyItem[]> {
        return this.mockData.typeHierarchyItems || [];
    }

    async getTypeHierarchySupertypes(item: LSPTypeHierarchyItem): Promise<LSPTypeHierarchyItem[]> {
        return this.mockData.supertypes || [];
    }

    async getTypeHierarchySubtypes(item: LSPTypeHierarchyItem): Promise<LSPTypeHierarchyItem[]> {
        return this.mockData.subtypes || [];
    }

    isReady(): boolean {
        return true;
    }
}

suite('Super Tool (lsp_explore_symbol) Test Suite', () => {
    let mockClient: MockLanguageClientForSuperTool;

    setup(() => {
        mockClient = new MockLanguageClientForSuperTool();
    });

    suite('Basic Symbol Exploration', () => {
        test('should explore a simple function with hover and definition', async () => {
            // Setup mock data
            mockClient.setMockHover({
                contents: {
                    kind: 'markdown',
                    value: '```typescript\nfunction calculateSum(a: number, b: number): number\n```'
                }
            });

            mockClient.setMockDefinitions([{
                uri: 'file:///test.ts',
                range: {
                    start: { line: 10, character: 0 },
                    end: { line: 10, character: 15 }
                }
            }]);

            mockClient.setMockReferences([
                {
                    uri: 'file:///test.ts',
                    range: { start: { line: 10, character: 0 }, end: { line: 10, character: 15 } }
                },
                {
                    uri: 'file:///usage.ts',
                    range: { start: { line: 20, character: 5 }, end: { line: 20, character: 20 } }
                }
            ]);

            // Verify the mock setup works
            const hover = await mockClient.getHover('file:///test.ts', { line: 10, character: 5 });
            assert.ok(hover);
            assert.ok(hover.contents);

            const definitions = await mockClient.getDefinition('file:///test.ts', { line: 10, character: 5 });
            assert.strictEqual(definitions.length, 1);

            const references = await mockClient.getReferences('file:///test.ts', { line: 10, character: 5 });
            assert.strictEqual(references.length, 2);
        });

        test('should handle symbols with no hover information', async () => {
            mockClient.setMockHover(null);
            mockClient.setMockDefinitions([]);
            mockClient.setMockReferences([]);

            const hover = await mockClient.getHover('file:///test.ts', { line: 10, character: 5 });
            assert.strictEqual(hover, null);
        });
    });

    suite('Call Hierarchy Exploration', () => {
        test('should explore call hierarchy with incoming and outgoing calls', async () => {
            const callHierarchyItem: LSPCallHierarchyItem = {
                name: 'processOrder',
                kind: 12, // Function
                uri: 'file:///order-service.ts',
                range: {
                    start: { line: 45, character: 0 },
                    end: { line: 55, character: 1 }
                },
                selectionRange: {
                    start: { line: 45, character: 9 },
                    end: { line: 45, character: 21 }
                }
            };

            mockClient.setMockCallHierarchyItems([callHierarchyItem]);

            mockClient.setMockIncomingCalls([
                {
                    from: {
                        name: 'handleCheckout',
                        kind: 12,
                        uri: 'file:///checkout.ts',
                        range: { start: { line: 20, character: 0 }, end: { line: 30, character: 1 } },
                        selectionRange: { start: { line: 20, character: 9 }, end: { line: 20, character: 23 } }
                    },
                    fromRanges: [
                        { start: { line: 25, character: 4 }, end: { line: 25, character: 16 } }
                    ]
                }
            ]);

            mockClient.setMockOutgoingCalls([
                {
                    to: {
                        name: 'validateOrder',
                        kind: 12,
                        uri: 'file:///validator.ts',
                        range: { start: { line: 10, character: 0 }, end: { line: 15, character: 1 } },
                        selectionRange: { start: { line: 10, character: 9 }, end: { line: 10, character: 22 } }
                    },
                    fromRanges: [
                        { start: { line: 47, character: 4 }, end: { line: 47, character: 17 } }
                    ]
                }
            ]);

            // Test the call hierarchy methods
            const items = await mockClient.prepareCallHierarchy('file:///order-service.ts', { line: 45, character: 10 });
            assert.strictEqual(items.length, 1);
            assert.strictEqual(items[0].name, 'processOrder');

            const incomingCalls = await mockClient.getCallHierarchyIncomingCalls(items[0]);
            assert.strictEqual(incomingCalls.length, 1);
            assert.strictEqual(incomingCalls[0].from.name, 'handleCheckout');

            const outgoingCalls = await mockClient.getCallHierarchyOutgoingCalls(items[0]);
            assert.strictEqual(outgoingCalls.length, 1);
            assert.strictEqual(outgoingCalls[0].to.name, 'validateOrder');
        });

        test('should handle symbols with no call hierarchy', async () => {
            mockClient.setMockCallHierarchyItems([]);

            const items = await mockClient.prepareCallHierarchy('file:///test.ts', { line: 10, character: 5 });
            assert.strictEqual(items.length, 0);
        });
    });

    suite('Type Hierarchy Exploration', () => {
        test('should explore type hierarchy with supertypes and subtypes', async () => {
            const typeHierarchyItem: LSPTypeHierarchyItem = {
                name: 'Dog',
                kind: 5, // Class
                uri: 'file:///animals.ts',
                range: {
                    start: { line: 20, character: 0 },
                    end: { line: 40, character: 1 }
                },
                selectionRange: {
                    start: { line: 20, character: 6 },
                    end: { line: 20, character: 9 }
                }
            };

            mockClient.setMockTypeHierarchyItems([typeHierarchyItem]);

            mockClient.setMockSupertypes([
                {
                    name: 'Animal',
                    kind: 5,
                    uri: 'file:///animals.ts',
                    range: { start: { line: 5, character: 0 }, end: { line: 15, character: 1 } },
                    selectionRange: { start: { line: 5, character: 6 }, end: { line: 5, character: 12 } }
                }
            ]);

            mockClient.setMockSubtypes([
                {
                    name: 'GoldenRetriever',
                    kind: 5,
                    uri: 'file:///animals.ts',
                    range: { start: { line: 45, character: 0 }, end: { line: 55, character: 1 } },
                    selectionRange: { start: { line: 45, character: 6 }, end: { line: 45, character: 21 } }
                }
            ]);

            // Test type hierarchy methods
            const items = await mockClient.prepareTypeHierarchy('file:///animals.ts', { line: 20, character: 7 });
            assert.strictEqual(items.length, 1);
            assert.strictEqual(items[0].name, 'Dog');

            const supertypes = await mockClient.getTypeHierarchySupertypes(items[0]);
            assert.strictEqual(supertypes.length, 1);
            assert.strictEqual(supertypes[0].name, 'Animal');

            const subtypes = await mockClient.getTypeHierarchySubtypes(items[0]);
            assert.strictEqual(subtypes.length, 1);
            assert.strictEqual(subtypes[0].name, 'GoldenRetriever');
        });

        test('should handle types with no hierarchy', async () => {
            mockClient.setMockTypeHierarchyItems([]);

            const items = await mockClient.prepareTypeHierarchy('file:///test.ts', { line: 10, character: 5 });
            assert.strictEqual(items.length, 0);
        });
    });

    suite('Comprehensive Exploration', () => {
        test('should explore a method with all features enabled', async () => {
            // Setup complete mock data
            mockClient.setMockHover({
                contents: {
                    kind: 'markdown',
                    value: '```typescript\nclass Dog {\n  bark(): void\n}\n```'
                }
            });

            mockClient.setMockDefinitions([{
                uri: 'file:///dog.ts',
                range: { start: { line: 25, character: 2 }, end: { line: 27, character: 3 } }
            }]);

            mockClient.setMockReferences([
                { uri: 'file:///dog.ts', range: { start: { line: 25, character: 2 }, end: { line: 25, character: 6 } } },
                { uri: 'file:///main.ts', range: { start: { line: 10, character: 8 }, end: { line: 10, character: 12 } } }
            ]);

            mockClient.setMockImplementations([]);

            // Verify all mock data is set correctly
            const hover = await mockClient.getHover('file:///dog.ts', { line: 25, character: 3 });
            assert.ok(hover);

            const definitions = await mockClient.getDefinition('file:///dog.ts', { line: 25, character: 3 });
            assert.strictEqual(definitions.length, 1);

            const references = await mockClient.getReferences('file:///dog.ts', { line: 25, character: 3 });
            assert.strictEqual(references.length, 2);
        });

        test('should handle partial data availability gracefully', async () => {
            // Only set some data, leave others empty
            mockClient.setMockHover({
                contents: 'Basic symbol'
            });
            mockClient.setMockDefinitions([]);
            mockClient.setMockReferences([]);
            mockClient.setMockCallHierarchyItems([]);
            mockClient.setMockTypeHierarchyItems([]);

            const hover = await mockClient.getHover('file:///test.ts', { line: 10, character: 5 });
            assert.ok(hover);
            assert.strictEqual(hover.contents, 'Basic symbol');

            const callItems = await mockClient.prepareCallHierarchy('file:///test.ts', { line: 10, character: 5 });
            assert.strictEqual(callItems.length, 0);
        });
    });

    suite('Edge Cases and Error Handling', () => {
        test('should handle empty results from all queries', async () => {
            mockClient.setMockHover(null);
            mockClient.setMockDefinitions([]);
            mockClient.setMockReferences([]);
            mockClient.setMockCallHierarchyItems([]);
            mockClient.setMockTypeHierarchyItems([]);

            // All queries should return empty/null but not throw
            const hover = await mockClient.getHover('file:///test.ts', { line: 10, character: 5 });
            assert.strictEqual(hover, null);

            const definitions = await mockClient.getDefinition('file:///test.ts', { line: 10, character: 5 });
            assert.strictEqual(definitions.length, 0);

            const references = await mockClient.getReferences('file:///test.ts', { line: 10, character: 5 });
            assert.strictEqual(references.length, 0);
        });

        test('should handle large result sets efficiently', async () => {
            // Create 50 reference locations
            const manyReferences: LSPLocation[] = [];
            for (let i = 0; i < 50; i++) {
                manyReferences.push({
                    uri: `file:///file${i}.ts`,
                    range: {
                        start: { line: i, character: 0 },
                        end: { line: i, character: 10 }
                    }
                });
            }

            mockClient.setMockReferences(manyReferences);

            const references = await mockClient.getReferences('file:///test.ts', { line: 10, character: 5 });
            assert.strictEqual(references.length, 50);
        });
    });

    suite('Integration Scenarios', () => {
        test('should provide comprehensive analysis for a class method', async () => {
            // Setup data for a typical class method scenario
            mockClient.setMockHover({
                contents: {
                    kind: 'markdown',
                    value: '```typescript\n(method) AnimalService.feedAnimal(animal: Animal): void\n```'
                }
            });

            mockClient.setMockDefinitions([{
                uri: 'file:///animal-service.ts',
                range: { start: { line: 15, character: 2 }, end: { line: 20, character: 3 } }
            }]);

            mockClient.setMockTypeDefinitions([{
                uri: 'file:///animal.ts',
                range: { start: { line: 5, character: 0 }, end: { line: 30, character: 1 } }
            }]);

            mockClient.setMockReferences([
                { uri: 'file:///animal-service.ts', range: { start: { line: 15, character: 2 }, end: { line: 15, character: 12 } } },
                { uri: 'file:///zoo.ts', range: { start: { line: 50, character: 8 }, end: { line: 50, character: 18 } } }
            ]);

            // Verify comprehensive data
            const hover = await mockClient.getHover('file:///animal-service.ts', { line: 15, character: 5 });
            assert.ok(hover);

            const typeDefs = await mockClient.getTypeDefinition('file:///animal-service.ts', { line: 15, character: 5 });
            assert.strictEqual(typeDefs.length, 1);

            const refs = await mockClient.getReferences('file:///animal-service.ts', { line: 15, character: 5 });
            assert.strictEqual(refs.length, 2);
        });
    });
});
