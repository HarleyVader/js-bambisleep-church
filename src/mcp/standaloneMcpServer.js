#!/usr/bin/env node

/**
 * Standalone MCP Server Implementation
 * Implements Model Context Protocol without SDK dependencies
 * Handles JSON-RPC 2.0 over stdio
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

class StandaloneMcpServer {
    constructor() {
        this.tools = new Map();
        this.resources = new Map();
        this.dataPath = path.join(__dirname, '../../data');
        this.initialized = false;
        
        // Setup tools and resources
        this.setupTools();
        this.setupResources();
        
        // Bind methods
        this.handleMessage = this.handleMessage.bind(this);
        this.sendResponse = this.sendResponse.bind(this);
        this.sendError = this.sendError.bind(this);
    }

    setupTools() {
        // URL Fetching Tool
        this.tools.set('fetch_url', {
            name: 'fetch_url',
            description: 'Fetch content from a URL and optionally save to data files',
            inputSchema: {
                type: 'object',
                properties: {
                    url: {
                        type: 'string',
                        description: 'The URL to fetch'
                    },
                    saveToFile: {
                        type: 'string',
                        description: 'Optional: data file to save to (comments, creators, links, votes)',
                        enum: ['comments', 'creators', 'links', 'votes']
                    },
                    extractData: {
                        type: 'boolean',
                        description: 'Whether to extract structured data from the response',
                        default: false
                    }
                },
                required: ['url']
            }
        });

        // Data File Read Tool
        this.tools.set('read_data_file', {
            name: 'read_data_file',
            description: 'Read data from a JSON data file',
            inputSchema: {
                type: 'object',
                properties: {
                    fileName: {
                        type: 'string',
                        description: 'The data file to read',
                        enum: ['comments', 'creators', 'links', 'votes']
                    },
                    filter: {
                        type: 'object',
                        description: 'Optional filter criteria'
                    }
                },
                required: ['fileName']
            }
        });

        // Data File Write Tool
        this.tools.set('write_data_file', {
            name: 'write_data_file',
            description: 'Write data to a JSON data file',
            inputSchema: {
                type: 'object',
                properties: {
                    fileName: {
                        type: 'string',
                        description: 'The data file to write to',
                        enum: ['comments', 'creators', 'links', 'votes']
                    },
                    data: {
                        type: 'object',
                        description: 'The data to write'
                    },
                    operation: {
                        type: 'string',
                        description: 'Write operation type',
                        enum: ['append', 'replace', 'update'],
                        default: 'append'
                    }
                },
                required: ['fileName', 'data']
            }
        });

        // Process URL Content Tool
        this.tools.set('process_url_content', {
            name: 'process_url_content',
            description: 'Process fetched URL content and extract relevant data',
            inputSchema: {
                type: 'object',
                properties: {
                    content: {
                        type: 'string',
                        description: 'The content to process'
                    },
                    url: {
                        type: 'string',
                        description: 'The source URL'
                    },
                    extractType: {
                        type: 'string',
                        description: 'Type of data to extract',
                        enum: ['link', 'creator', 'metadata', 'comments']
                    }
                },
                required: ['content', 'url']
            }
        });
    }

    setupResources() {
        // Data file resources
        const dataFiles = ['comments', 'creators', 'links', 'votes'];
        dataFiles.forEach(file => {
            this.resources.set(`data://${file}`, {
                uri: `data://${file}`,
                name: `${file} data`,
                description: `Access to ${file}.json data file`,
                mimeType: 'application/json'
            });
        });
    }

    async start() {
        console.error('Standalone MCP Server starting...');
        
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', this.handleMessage);
        
        // Keep the process alive
        process.stdin.resume();
    }

    handleMessage(data) {
        const lines = data.trim().split('\n');
        
        for (const line of lines) {
            if (line.trim()) {
                try {
                    const message = JSON.parse(line);
                    this.processMessage(message);
                } catch (error) {
                    this.sendError(null, -32700, 'Parse error', error.message);
                }
            }
        }
    }

    async processMessage(message) {
        const { id, method, params } = message;

        try {
            switch (method) {
                case 'initialize':
                    await this.handleInitialize(id, params);
                    break;
                case 'tools/list':
                    await this.handleListTools(id);
                    break;
                case 'tools/call':
                    await this.handleCallTool(id, params);
                    break;
                case 'resources/list':
                    await this.handleListResources(id);
                    break;
                case 'resources/read':
                    await this.handleReadResource(id, params);
                    break;
                default:
                    this.sendError(id, -32601, 'Method not found', `Unknown method: ${method}`);
            }
        } catch (error) {
            this.sendError(id, -32603, 'Internal error', error.message);
        }
    }

    async handleInitialize(id, params) {
        this.initialized = true;
        this.sendResponse(id, {
            protocolVersion: '2024-11-05',
            capabilities: {
                tools: {},
                resources: {}
            },
            serverInfo: {
                name: 'bambi-sleep-mcp-server',
                version: '1.0.0'
            }
        });
    }

    async handleListTools(id) {
        const tools = Array.from(this.tools.values());
        this.sendResponse(id, { tools });
    }

    async handleCallTool(id, params) {
        const { name, arguments: args } = params;
        
        if (!this.tools.has(name)) {
            this.sendError(id, -32602, 'Invalid params', `Unknown tool: ${name}`);
            return;
        }

        try {
            let result;
            switch (name) {
                case 'fetch_url':
                    result = await this.fetchUrl(args);
                    break;
                case 'read_data_file':
                    result = await this.readDataFile(args);
                    break;
                case 'write_data_file':
                    result = await this.writeDataFile(args);
                    break;
                case 'process_url_content':
                    result = await this.processUrlContent(args);
                    break;
                default:
                    throw new Error(`Tool not implemented: ${name}`);
            }

            this.sendResponse(id, {
                content: [
                    {
                        type: 'text',
                        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                    }
                ]
            });
        } catch (error) {
            this.sendError(id, -32603, 'Tool execution failed', error.message);
        }
    }

    async handleListResources(id) {
        const resources = Array.from(this.resources.values());
        this.sendResponse(id, { resources });
    }

    async handleReadResource(id, params) {
        const { uri } = params;
        
        if (!this.resources.has(uri)) {
            this.sendError(id, -32602, 'Invalid params', `Unknown resource: ${uri}`);
            return;
        }

        try {
            const fileName = uri.replace('data://', '');
            const data = await this.readDataFile({ fileName });
            
            this.sendResponse(id, {
                contents: [
                    {
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify(data, null, 2)
                    }
                ]
            });
        } catch (error) {
            this.sendError(id, -32603, 'Resource read failed', error.message);
        }
    }

    // Tool implementations
    async fetchUrl(args) {
        const { url, saveToFile, extractData } = args;
        
        return new Promise((resolve, reject) => {            const client = url.startsWith('https:') ? https : http;
            
            const request = client.get(url, {
                headers: {
                    'User-Agent': 'BambiSleep-MCP-Agent/1.0',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Connection': 'keep-alive'
                },
                timeout: 30000
            }, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', async () => {
                    try {
                        const result = {
                            url,
                            statusCode: res.statusCode,
                            headers: res.headers,
                            content: data,
                            length: data.length
                        };

                        if (extractData) {
                            result.extractedData = await this.extractDataFromContent(data, url);
                        }

                        if (saveToFile) {
                            await this.saveUrlDataToFile(result, saveToFile);
                        }

                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }                });
            });
            
            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    async readDataFile(args) {
        const { fileName, filter } = args;
        const filePath = path.join(this.dataPath, `${fileName}.json`);
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            let jsonData = JSON.parse(data);

            if (filter) {
                jsonData = this.applyFilter(jsonData, filter);
            }

            return {
                fileName,
                data: jsonData,
                count: Array.isArray(jsonData) ? jsonData.length : Object.keys(jsonData).length
            };
        } catch (error) {
            if (error.code === 'ENOENT') {
                return { fileName, data: [], count: 0 };
            }
            throw error;
        }
    }

    async writeDataFile(args) {
        const { fileName, data, operation = 'append' } = args;
        const filePath = path.join(this.dataPath, `${fileName}.json`);
        
        let existingData = [];
        try {
            const existing = await fs.readFile(filePath, 'utf8');
            existingData = JSON.parse(existing);
        } catch (error) {
            // File doesn't exist, start with empty array
        }

        let newData;
        switch (operation) {
            case 'append':
                newData = Array.isArray(existingData) ? [...existingData, data] : [existingData, data];
                break;
            case 'replace':
                newData = data;
                break;
            case 'update':
                if (Array.isArray(existingData) && data.id) {
                    const index = existingData.findIndex(item => item.id === data.id);
                    if (index >= 0) {
                        existingData[index] = { ...existingData[index], ...data };
                    } else {
                        existingData.push(data);
                    }
                    newData = existingData;
                } else {
                    newData = { ...existingData, ...data };
                }
                break;
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }

        await fs.writeFile(filePath, JSON.stringify(newData, null, 2));
        
        return {
            fileName,
            operation,
            success: true,
            count: Array.isArray(newData) ? newData.length : Object.keys(newData).length
        };
    }

    async processUrlContent(args) {
        const { content, url, extractType } = args;
        
        const result = {
            url,
            extractType,
            extractedData: {}
        };

        // Basic content extraction
        if (extractType === 'metadata') {
            result.extractedData = this.extractMetadata(content, url);
        } else if (extractType === 'link') {
            result.extractedData = this.extractLinkData(content, url);
        } else {
            result.extractedData = this.extractGeneralData(content, url);
        }

        return result;
    }

    // Helper methods
    async extractDataFromContent(content, url) {
        // Basic data extraction logic
        const data = {
            url,
            title: this.extractTitle(content),
            description: this.extractDescription(content),
            type: this.detectContentType(content, url),
            timestamp: new Date().toISOString()
        };

        return data;
    }

    extractTitle(content) {
        const titleMatch = content.match(/<title[^>]*>([^<]+)</i);
        return titleMatch ? titleMatch[1].trim() : 'Untitled';
    }

    extractDescription(content) {
        const descMatch = content.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
        return descMatch ? descMatch[1].trim() : '';
    }

    detectContentType(content, url) {
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
        if (url.includes('soundcloud.com')) return 'soundcloud';
        if (url.includes('vimeo.com')) return 'vimeo';
        if (url.includes('patreon.com')) return 'patreon';
        if (content.includes('<video')) return 'video';
        if (content.includes('<audio')) return 'audio';
        return 'website';
    }

    extractMetadata(content, url) {
        return {
            title: this.extractTitle(content),
            description: this.extractDescription(content),
            type: this.detectContentType(content, url),
            url
        };
    }

    extractLinkData(content, url) {
        return {
            ...this.extractMetadata(content, url),
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            votes: { up: 0, down: 0 }
        };
    }

    extractGeneralData(content, url) {
        return this.extractMetadata(content, url);
    }

    async saveUrlDataToFile(urlResult, fileName) {
        const extractedData = urlResult.extractedData || this.extractLinkData(urlResult.content, urlResult.url);
        await this.writeDataFile({ fileName, data: extractedData, operation: 'append' });
    }

    applyFilter(data, filter) {
        if (!Array.isArray(data)) return data;

        return data.filter(item => {
            for (const [key, value] of Object.entries(filter)) {
                if (item[key] !== value) return false;
            }
            return true;
        });
    }

    sendResponse(id, result) {
        const response = {
            jsonrpc: '2.0',
            id,
            result
        };
        process.stdout.write(JSON.stringify(response) + '\n');
    }

    sendError(id, code, message, data) {
        const response = {
            jsonrpc: '2.0',
            id,
            error: {
                code,
                message,
                data
            }
        };
        process.stdout.write(JSON.stringify(response) + '\n');
    }
}

// Start the server if this file is run directly
if (require.main === module) {
    const server = new StandaloneMcpServer();
    server.start().catch(error => {
        console.error('Server failed to start:', error);
        process.exit(1);
    });
}

module.exports = StandaloneMcpServer;
