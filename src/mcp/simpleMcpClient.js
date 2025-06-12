/**
 * Simple MCP Client for interacting with the standalone server
 * Provides easy methods to use MCP tools
 */

const { spawn } = require('child_process');
const path = require('path');

class SimpleMcpClient {
    constructor() {
        this.messageId = 1;
        this.server = null;
        this.responses = new Map();
        this.initialized = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.isConnecting = false;
    }    async connect() {
        if (this.isConnecting) return;
        this.isConnecting = true;

        const serverPath = path.join(__dirname, 'standaloneMcpServer.js');
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
                    } catch (error) {
                        // Ignore parse errors for robustness
                    }
                }
            }
        });

        this.server.stderr.on('data', (data) => {
            console.error('MCP Server error:', data.toString());
        });

        this.server.on('exit', (code) => {
            console.warn(`MCP Server exited with code ${code}`);
            this.initialized = false;
            this.server = null;
            this.isConnecting = false;
            
            // Auto-reconnect on unexpected exit
            if (code !== 0 && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
                setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
            }
        });

        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 500));

        // Initialize the connection
        try {
            await this.initialize();
            this.reconnectAttempts = 0; // Reset on successful connection
            this.isConnecting = false;
        } catch (error) {
            this.isConnecting = false;
            throw error;
        }
    }

    async initialize() {
        const result = await this.sendMessage('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
                name: 'simple-mcp-client',
                version: '1.0.0'
            }
        });
        this.initialized = true;
        return result;
    }

    async sendMessage(method, params = {}) {
        if (!this.server) {
            throw new Error('Not connected to server');
        }

        const id = this.messageId++;
        const message = {
            jsonrpc: '2.0',
            id,
            method,
            params
        };

        this.server.stdin.write(JSON.stringify(message) + '\n');
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, 5000);

            const checkResponse = () => {
                if (this.responses.has(id)) {
                    clearTimeout(timeout);
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
            checkResponse();
        });
    }

    async callTool(name, args) {
        return await this.sendMessage('tools/call', {
            name,
            arguments: args
        });
    }

    // Convenience methods
    async fetchUrl(url, options = {}) {
        const result = await this.callTool('fetch_url', {
            url,
            ...options
        });
        return JSON.parse(result.content[0].text);
    }

    async readDataFile(fileName, filter = null) {
        const result = await this.callTool('read_data_file', {
            fileName,
            filter
        });
        return JSON.parse(result.content[0].text);
    }

    async writeDataFile(fileName, data, operation = 'append') {
        const result = await this.callTool('write_data_file', {
            fileName,
            data,
            operation
        });
        return JSON.parse(result.content[0].text);
    }

    async processUrlContent(content, url, extractType = null) {
        const result = await this.callTool('process_url_content', {
            content,
            url,
            extractType
        });
        return JSON.parse(result.content[0].text);
    }

    async listTools() {
        return await this.sendMessage('tools/list');
    }

    async listResources() {
        return await this.sendMessage('resources/list');
    }

    async readResource(uri) {
        return await this.sendMessage('resources/read', { uri });
    }    disconnect() {
        if (this.server) {
            this.server.removeAllListeners();
            this.server.kill('SIGTERM');
            
            // Force kill if it doesn't exit gracefully
            setTimeout(() => {
                if (this.server && !this.server.killed) {
                    this.server.kill('SIGKILL');
                }
            }, 5000);
            
            this.server = null;
            this.initialized = false;
            this.responses.clear();
        }
    }
}

module.exports = SimpleMcpClient;
