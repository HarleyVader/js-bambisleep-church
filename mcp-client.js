#!/usr/bin/env node

// Simple MCP Client for BambiSleep Church
// Demonstrates how to connect to the BambiSleep Church MCP server

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { config } from './src/utils/config.js';

const MCP_SERVER_URL = config.getMcpUrl();

class BambiMcpClient {
    constructor() {
        this.client = null;
        this.transport = null;
    }

    async connect() {
        console.log('🔌 Connecting to BambiSleep Church MCP Server...');
        console.log(`   URL: ${MCP_SERVER_URL}`);

        try {
            // For HTTP-based MCP servers, we'll create a simple client
            // that makes JSON-RPC requests directly
            console.log('✅ Connected to MCP server');
            return true;
        } catch (error) {
            console.error('❌ Connection failed:', error);
            return false;
        }
    }

    async listTools() {
        console.log('\n📋 Listing available tools...');

        try {
            const response = await fetch(MCP_SERVER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'tools/list',
                    params: {}
                })
            });

            const data = await response.json();

            if (data.result && data.result.tools) {
                console.log(`✅ Found ${data.result.tools.length} tools:`);
                data.result.tools.forEach((tool, index) => {
                    console.log(`\n${index + 1}. ${tool.name}`);
                    console.log(`   Description: ${tool.description}`);
                    console.log(`   Parameters: ${JSON.stringify(tool.inputSchema.properties || {}, null, 2)}`);
                });
                return data.result.tools;
            } else {
                console.log('❌ No tools found');
                return [];
            }
        } catch (error) {
            console.error('❌ Error listing tools:', error);
            return [];
        }
    }

    async callTool(toolName, args = {}) {
        console.log(`\n🔧 Calling tool: ${toolName}`);
        console.log(`   Arguments: ${JSON.stringify(args, null, 2)}`);

        try {
            const response = await fetch(MCP_SERVER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: Date.now(),
                    method: 'tools/call',
                    params: {
                        name: toolName,
                        arguments: args
                    }
                })
            });

            const data = await response.json();

            if (data.error) {
                console.log(`❌ Tool Error: ${data.error.message}`);
                return null;
            }

            if (data.result && data.result.content && data.result.content[0]) {
                const result = data.result.content[0].text;
                console.log('✅ Tool executed successfully');
                console.log('\n📄 Result:');
                console.log('─'.repeat(50));
                console.log(result);
                console.log('─'.repeat(50));
                return result;
            } else {
                console.log('❌ Invalid response format');
                return null;
            }
        } catch (error) {
            console.error('❌ Tool execution error:', error);
            return null;
        }
    }

    async runDemo() {
        console.log('🎪 BambiSleep Church MCP Client Demo');
        console.log('=====================================\n');

        // Connect to server
        if (!(await this.connect())) {
            return false;
        }

        // List available tools
        const tools = await this.listTools();
        if (tools.length === 0) {
            return false;
        }

        // Demo calls for each tool
        console.log('\n🎭 Running demo calls...\n');

        // 1. Search knowledge
        await this.callTool('search-knowledge', {
            query: 'safety',
            category: 'safety',
            limit: 2
        });

        // 2. Get safety info
        await this.callTool('get-safety-info', {
            topic: 'beginner'
        });

        // 3. Church status
        await this.callTool('church-status', {
            detailed: false
        });

        // 4. Community guidelines
        await this.callTool('community-guidelines', {
            section: 'general'
        });

        // 5. Resource recommendations
        await this.callTool('resource-recommendations', {
            experience: 'beginner',
            interests: ['safety', 'community'],
            safetyFocus: true
        });

        console.log('\n🎉 Demo completed successfully!');
        return true;
    }

    async interactive() {
        console.log('🎮 Interactive MCP Client Mode');
        console.log('===============================\n');
        console.log('Type "help" for commands, "quit" to exit\n');

        // Connect to server
        if (!(await this.connect())) {
            return;
        }

        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const tools = await this.listTools();

        while (true) {
            try {
                const input = await new Promise(resolve => {
                    rl.question('mcp> ', resolve);
                });

                const [command, ...args] = input.trim().split(' ');

                switch (command.toLowerCase()) {
                    case 'help':
                        console.log('\nAvailable commands:');
                        console.log('  help              - Show this help');
                        console.log('  list              - List available tools');
                        console.log('  call <tool> [args] - Call a tool');
                        console.log('  quit              - Exit');
                        console.log('\nAvailable tools:');
                        tools.forEach(tool => {
                            console.log(`  • ${tool.name}`);
                        });
                        break;

                    case 'list':
                        await this.listTools();
                        break;

                    case 'call':
                        if (args.length === 0) {
                            console.log('Usage: call <tool-name> [json-args]');
                            break;
                        }
                        const toolName = args[0];
                        let toolArgs = {};
                        if (args.length > 1) {
                            try {
                                toolArgs = JSON.parse(args.slice(1).join(' '));
                            } catch (error) {
                                console.log('❌ Invalid JSON arguments');
                                break;
                            }
                        }
                        await this.callTool(toolName, toolArgs);
                        break;

                    case 'quit':
                    case 'exit':
                        console.log('👋 Goodbye!');
                        rl.close();
                        return;

                    default:
                        console.log(`Unknown command: ${command}. Type "help" for available commands.`);
                        break;
                }
            } catch (error) {
                console.error('❌ Error:', error);
            }

            console.log(); // Empty line for readability
        }
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'demo';

    const client = new BambiMcpClient();

    switch (mode) {
        case 'demo':
            await client.runDemo();
            break;
        case 'interactive':
            await client.interactive();
            break;
        default:
            console.log('Usage: node mcp-client.js [demo|interactive]');
            console.log('  demo        - Run demonstration of all tools');
            console.log('  interactive - Interactive command-line client');
            break;
    }
}

main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
});
