import * as assert from 'assert';
import * as vscode from 'vscode';
import { VSCodeLanguageClient } from '../languageClient';
import { LSPPosition } from '../types';

suite('VSCode Language Client Test Suite', () => {
    let client: VSCodeLanguageClient;

    setup(async () => {
        client = new VSCodeLanguageClient();
        await client.initialize();
    });

    suite('Initialization Tests', () => {
        test('should initialize successfully', async () => {
            const newClient = new VSCodeLanguageClient();
            await newClient.initialize();
            assert.ok(newClient.isReady());
        });

        test('should be ready after initialization', async () => {
            assert.strictEqual(client.isReady(), true);
        });

        test('should allow multiple initializations', async () => {
            await client.initialize();
            await client.initialize();
            assert.strictEqual(client.isReady(), true);
        });
    });

    suite('Definition Provider Tests', () => {
        test('should handle getDefinition with valid position', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            // This will return empty results if no language server is active, which is fine
            const result = await client.getDefinition('file:///nonexistent.ts', position);
            
            assert.ok(result);
            assert.ok(Array.isArray(result));
        });

        test('should handle getDefinition without throwing on invalid URI', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            // Should not throw, just return empty or error message
            const result = await client.getDefinition('invalid-uri', position);
            
            assert.ok(result);
        });

        test('should handle getDefinition with boundary positions', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            const result = await client.getDefinition('file:///test.ts', position);
            
            assert.ok(Array.isArray(result));
        });

        test('should require initialization before use', async () => {
            const uninitializedClient = new VSCodeLanguageClient();
            const position: LSPPosition = { line: 0, character: 0 };
            
            await assert.rejects(
                async () => await uninitializedClient.getDefinition('file:///test.ts', position),
                /not initialized/i
            );
        });
    });

    suite('References Provider Tests', () => {
        test('should handle getReferences with valid position', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            const result = await client.getReferences('file:///nonexistent.ts', position);
            
            assert.ok(result);
            assert.ok(Array.isArray(result));
        });

        test('should handle getReferences with includeDeclaration true', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            const result = await client.getReferences('file:///test.ts', position, true);
            
            assert.ok(Array.isArray(result));
        });

        test('should handle getReferences with includeDeclaration false', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            const result = await client.getReferences('file:///test.ts', position, false);
            
            assert.ok(Array.isArray(result));
        });

        test('should handle getReferences with default includeDeclaration', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            const result = await client.getReferences('file:///test.ts', position);
            
            assert.ok(Array.isArray(result));
        });
    });

    suite('Hover Provider Tests', () => {
        test('should handle getHover with valid position', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            const result = await client.getHover('file:///nonexistent.ts', position);
            
            // Result can be null or hover object
            assert.ok(result === null || typeof result === 'object');
        });

        test('should handle getHover with different positions', async () => {
            const positions: LSPPosition[] = [
                { line: 0, character: 0 },
                { line: 5, character: 10 },
                { line: 100, character: 50 }
            ];
            
            for (const position of positions) {
                const result = await client.getHover('file:///test.ts', position);
                assert.ok(result === null || typeof result === 'object');
            }
        });
    });

    suite('Completion Provider Tests', () => {
        test('should handle getCompletion with valid position', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            const result = await client.getCompletion('file:///nonexistent.ts', position);
            
            assert.ok(result);
            assert.ok('items' in result);
            assert.ok(Array.isArray(result.items));
        });

        test('should handle getCompletion with trigger kind', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            const result = await client.getCompletion('file:///test.ts', position, 1);
            
            assert.ok(result);
            assert.ok(Array.isArray(result.items));
        });

        test('should handle getCompletion with trigger character', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            const result = await client.getCompletion('file:///test.ts', position, 2, '.');
            
            assert.ok(result);
            assert.ok(Array.isArray(result.items));
        });

        test('should handle getCompletion with both trigger parameters', async () => {
            const position: LSPPosition = { line: 5, character: 10 };
            
            const result = await client.getCompletion('file:///test.ts', position, 2, '.');
            
            assert.ok(result);
            assert.strictEqual(typeof result.isIncomplete, 'boolean');
        });
    });

    suite('Workspace Symbols Tests', () => {
        test('should handle getWorkspaceSymbols with query', async () => {
            const result = await client.getWorkspaceSymbols('test');
            
            assert.ok(result);
            assert.ok(Array.isArray(result));
        });

        test('should handle getWorkspaceSymbols with empty query', async () => {
            const result = await client.getWorkspaceSymbols('');
            
            assert.ok(Array.isArray(result));
        });

        test('should handle getWorkspaceSymbols with special characters', async () => {
            const queries = ['test*', 'test?', 'test.method', 'Test::Class'];
            
            for (const query of queries) {
                const result = await client.getWorkspaceSymbols(query);
                assert.ok(Array.isArray(result));
            }
        });
    });

    suite('Document Symbols Tests', () => {
        test('should handle getDocumentSymbols with URI', async () => {
            const result = await client.getDocumentSymbols('file:///nonexistent.ts');
            
            assert.ok(result);
            assert.ok(Array.isArray(result));
        });

        test('should handle getDocumentSymbols with different file types', async () => {
            const uris = [
                'file:///test.ts',
                'file:///test.js',
                'file:///test.py',
                'file:///test.cpp'
            ];
            
            for (const uri of uris) {
                const result = await client.getDocumentSymbols(uri);
                assert.ok(Array.isArray(result));
            }
        });
    });

    suite('Rename Symbol Tests', () => {
        test('should handle renameSymbol with valid parameters', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            const result = await client.renameSymbol('file:///test.ts', position, 'newName');
            
            // Result can be null or workspace edit
            assert.ok(result === null || typeof result === 'object');
        });

        test('should handle renameSymbol with different names', async () => {
            const position: LSPPosition = { line: 5, character: 10 };
            const names = ['newName', 'testVariable', 'MY_CONSTANT', 'functionName'];
            
            for (const name of names) {
                const result = await client.renameSymbol('file:///test.ts', position, name);
                assert.ok(result === null || typeof result === 'object');
            }
        });

        test('should handle renameSymbol with special character names', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            const names = ['_private', '$jquery', 'test123', 'camelCase'];
            
            for (const name of names) {
                const result = await client.renameSymbol('file:///test.ts', position, name);
                assert.ok(result === null || typeof result === 'object');
            }
        });
    });

    suite('Code Actions Tests', () => {
        test('should handle getCodeActions with valid range', async () => {
            const range = {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 10 }
            };
            
            const result = await client.getCodeActions('file:///test.ts', range);
            
            assert.ok(result);
            assert.ok(Array.isArray(result));
        });

        test('should handle getCodeActions with context', async () => {
            const range = {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 10 }
            };
            const context = {
                diagnostics: [],
                only: ['quickfix']
            };
            
            const result = await client.getCodeActions('file:///test.ts', range, context);
            
            assert.ok(Array.isArray(result));
        });

        test('should handle getCodeActions with multi-line range', async () => {
            const range = {
                start: { line: 0, character: 0 },
                end: { line: 5, character: 20 }
            };
            
            const result = await client.getCodeActions('file:///test.ts', range);
            
            assert.ok(Array.isArray(result));
        });
    });

    suite('Format Document Tests', () => {
        test('should handle formatDocument with URI', async () => {
            const result = await client.formatDocument('file:///test.ts');
            
            assert.ok(result);
            assert.ok(Array.isArray(result));
        });

        test('should handle formatDocument with options', async () => {
            const options = {
                tabSize: 4,
                insertSpaces: true
            };
            
            const result = await client.formatDocument('file:///test.ts', options);
            
            assert.ok(Array.isArray(result));
        });

        test('should handle formatDocument with different tab sizes', async () => {
            const tabSizes = [2, 4, 8];
            
            for (const tabSize of tabSizes) {
                const options = { tabSize, insertSpaces: true };
                const result = await client.formatDocument('file:///test.ts', options);
                assert.ok(Array.isArray(result));
            }
        });
    });

    suite('Signature Help Tests', () => {
        test('should handle getSignatureHelp with valid position', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            const result = await client.getSignatureHelp('file:///test.ts', position);
            
            // Result can be null or signature help
            assert.ok(result === null || typeof result === 'object');
        });

        test('should handle getSignatureHelp with trigger kind', async () => {
            const position: LSPPosition = { line: 5, character: 10 };
            
            const result = await client.getSignatureHelp('file:///test.ts', position, 1);
            
            assert.ok(result === null || typeof result === 'object');
        });

        test('should handle getSignatureHelp with trigger character', async () => {
            const position: LSPPosition = { line: 5, character: 10 };
            
            const result = await client.getSignatureHelp('file:///test.ts', position, 2, '(');
            
            assert.ok(result === null || typeof result === 'object');
        });
    });

    suite('Error Handling Tests', () => {
        test('should handle invalid URI gracefully', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            // Should not crash, return empty or error
            const result = await client.getDefinition('not-a-uri', position);
            assert.ok(result);
        });

        test('should handle negative positions gracefully', async () => {
            const position: LSPPosition = { line: -1, character: -1 };
            
            // Should handle gracefully, not crash
            const result = await client.getDefinition('file:///test.ts', position);
            assert.ok(result);
        });

        test('should handle very large positions', async () => {
            const position: LSPPosition = { line: 999999, character: 999999 };
            
            const result = await client.getDefinition('file:///test.ts', position);
            assert.ok(result);
        });
    });

    suite('Client State Tests', () => {
        test('should report ready state correctly', () => {
            assert.strictEqual(client.isReady(), true);
        });

        test('should maintain state across operations', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            await client.getDefinition('file:///test.ts', position);
            assert.strictEqual(client.isReady(), true);
            
            await client.getReferences('file:///test.ts', position);
            assert.strictEqual(client.isReady(), true);
            
            await client.getHover('file:///test.ts', position);
            assert.strictEqual(client.isReady(), true);
        });

        test('should handle dispose if implemented', () => {
            // Test that dispose doesn't throw
            if (typeof (client as any).dispose === 'function') {
                (client as any).dispose();
            }
            assert.ok(true);
        });
    });

    suite('Concurrent Operations Tests', () => {
        test('should handle multiple concurrent getDefinition calls', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            const promises = [
                client.getDefinition('file:///test1.ts', position),
                client.getDefinition('file:///test2.ts', position),
                client.getDefinition('file:///test3.ts', position)
            ];
            
            const results = await Promise.all(promises);
            
            assert.strictEqual(results.length, 3);
            results.forEach(result => assert.ok(Array.isArray(result)));
        });

        test('should handle mixed concurrent operations', async () => {
            const position: LSPPosition = { line: 0, character: 0 };
            
            const promises = [
                client.getDefinition('file:///test.ts', position),
                client.getReferences('file:///test.ts', position),
                client.getHover('file:///test.ts', position),
                client.getCompletion('file:///test.ts', position)
            ];
            
            const results = await Promise.all(promises);
            
            assert.strictEqual(results.length, 4);
            assert.ok(results.every(r => r !== undefined));
        });
    });

    suite('Position Conversion Tests', () => {
        test('should handle zero-based positions correctly', async () => {
            const zeroPosition: LSPPosition = { line: 0, character: 0 };
            
            const result = await client.getDefinition('file:///test.ts', zeroPosition);
            
            assert.ok(Array.isArray(result));
        });

        test('should handle various position values', async () => {
            const positions: LSPPosition[] = [
                { line: 0, character: 0 },
                { line: 1, character: 1 },
                { line: 10, character: 20 },
                { line: 100, character: 50 }
            ];
            
            for (const position of positions) {
                const result = await client.getDefinition('file:///test.ts', position);
                assert.ok(Array.isArray(result));
            }
        });
    });
});
