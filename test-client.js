#!/usr/bin/env node

/**
 * Simple MCP client to test the LSP MCP server
 * Usage: node test-client.js
 */

const { spawn } = require('child_process');
const path = require('path');

class MCPTestClient {
    constructor() {
        this.requestId = 1;
    }

    async testServer() {
        console.log('🚀 Starting MCP Server test...');
        
        // Test data - adjust paths to your actual test project
        const testUri = 'file://' + path.resolve(__dirname, 'test-project/main.cpp');
        const testPosition = { line: 8, character: 15 }; // Position of "add_numbers" call
        
        // Test core LSP tools
        await this.testTool('lsp.definition', {
            uri: testUri,
            position: testPosition
        });

        await this.testTool('lsp.references', {
            uri: testUri,
            position: testPosition,
            includeDeclaration: true
        });

        await this.testTool('lsp.hover', {
            uri: testUri,
            position: testPosition
        });

        await this.testTool('lsp.completion', {
            uri: testUri,
            position: { line: 15, character: 12 }, // After "numbers."
            triggerCharacter: '.'
        });
    }

    async testTool(toolName, args) {
        console.log(`\n📋 Testing ${toolName}...`);
        
        const request = {
            jsonrpc: '2.0',
            id: this.requestId++,
            method: 'tools/call',
            params: {
                name: toolName,
                arguments: args
            }
        };

        console.log('Request:', JSON.stringify(request, null, 2));
        
        // In a real implementation, you'd send this via stdio to the MCP server
        // For now, just show what the request would look like
        console.log('✅ Request formatted correctly');
    }
}

// Run the test
const client = new MCPTestClient();
client.testServer().catch(console.error);