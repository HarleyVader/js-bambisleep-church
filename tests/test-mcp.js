/**
 * Test script for the standalone MCP server
 * Tests the JSON-RPC communication and tool functionality
 */

const { spawn } = require('child_process');
const path = require('path');

class McpTester {
    constructor() {
        this.messageId = 1;
        this.server = null;
        this.responses = new Map();
    }

    async startServer() {
        const serverPath = path.join(__dirname, '..', 'src', 'mcp', 'standaloneMcpServer.js');
        this.server = spawn('node', [serverPath], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        this.server.stdout.on('data', (data) => {
            const lines = data.toString().trim().split('\n');
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const response = JSON.parse(line);
                        if (response.id) {
                            this.responses.set(response.id, response);
                        }
                        console.log('Response:', JSON.stringify(response, null, 2));
                    } catch (error) {
                        console.log('Raw output:', line);
                    }
                }
            }
        });

        this.server.stderr.on('data', (data) => {
            console.log('Server log:', data.toString());
        });

        // Wait a moment for server to start
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    sendMessage(method, params = {}) {
        const id = this.messageId++;
        const message = {
            jsonrpc: '2.0',
            id,
            method,
            params
        };

        console.log('Sending:', JSON.stringify(message, null, 2));
        this.server.stdin.write(JSON.stringify(message) + '\n');
        
        return new Promise((resolve, reject) => {
            const checkResponse = () => {
                if (this.responses.has(id)) {
                    const response = this.responses.get(id);
                    this.responses.delete(id);
                    if (response.error) {
                        reject(new Error(response.error.message));
                    } else {
                        resolve(response.result);
                    }
                } else {
                    setTimeout(checkResponse, 50);
                }
            };
            setTimeout(checkResponse, 50);
        });
    }

    async runTests() {
        try {
            console.log('=== Starting MCP Server Tests ===\n');

            // Test 1: Initialize
            console.log('Test 1: Initialize');
            const initResult = await this.sendMessage('initialize', {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'test-client',
                    version: '1.0.0'
                }
            });
            console.log('✓ Initialize successful\n');

            // Test 2: List tools
            console.log('Test 2: List tools');
            const toolsResult = await this.sendMessage('tools/list');
            console.log(`✓ Found ${toolsResult.tools.length} tools\n`);

            // Test 3: List resources
            console.log('Test 3: List resources');
            const resourcesResult = await this.sendMessage('resources/list');
            console.log(`✓ Found ${resourcesResult.resources.length} resources\n`);

            // Test 4: Read data file
            console.log('Test 4: Read data file');
            const readResult = await this.sendMessage('tools/call', {
                name: 'read_data_file',
                arguments: { fileName: 'links' }
            });
            console.log('✓ Read data file successful\n');

            // Test 5: Fetch URL (example.com)
            console.log('Test 5: Fetch URL');
            const fetchResult = await this.sendMessage('tools/call', {
                name: 'fetch_url',
                arguments: { 
                    url: 'http://example.com',
                    extractData: true
                }
            });
            console.log('✓ Fetch URL successful\n');

            // Test 6: Write test data
            console.log('Test 6: Write test data');
            const writeResult = await this.sendMessage('tools/call', {
                name: 'write_data_file',
                arguments: {
                    fileName: 'links',
                    data: {
                        id: 'test-' + Date.now(),
                        title: 'Test Link',
                        url: 'http://example.com',
                        type: 'website',
                        timestamp: new Date().toISOString()
                    },
                    operation: 'append'
                }
            });
            console.log('✓ Write data successful\n');

            console.log('=== All tests passed! ===');

        } catch (error) {
            console.error('Test failed:', error.message);
        } finally {
            this.server.kill();
        }
    }

    async stop() {
        if (this.server) {
            this.server.kill();
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new McpTester();
    tester.startServer()
        .then(() => tester.runTests())
        .catch(error => console.error('Failed to start tests:', error));
}
