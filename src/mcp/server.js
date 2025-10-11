// BambiSleep Church MCP Server
// Model Context Protocol server implementation with BambiSleep-specific tools

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { log } from '../utils/logger.js';

// Import BambiSleep tools
import { bambiTools } from './tools/bambi-tools.js';

class BambiMcpServer {
    constructor() {
        this.server = new Server(
            {
                name: "bambisleep-church-server",
                version: "1.0.0",
                description: "BambiSleep Church MCP server with community tools and resources"
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        );

        this.knowledgeData = [];
        this.isInitialized = false;
        this.setupHandlers();
    }

    /**
     * Set up MCP request handlers
     */
    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            const tools = Object.values(bambiTools).map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
            }));

            return { tools };
        });

        // Handle tool execution
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            // Find the tool
            const tool = Object.values(bambiTools).find(t => t.name === name);
            if (!tool) {
                throw new Error(`Unknown tool: ${name}`);
            }

            try {
                // Validate arguments using the tool's schema
                const validatedArgs = tool.inputSchema.parse(args || {});

                // Call the tool handler with validated arguments
                const result = await tool.handler(validatedArgs, {
                    knowledgeData: this.knowledgeData,
                    server: this
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: result
                        }
                    ]
                };
            } catch (error) {
                log.error(`Tool execution error for ${name}: ${error.message}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error executing ${name}: ${error.message}`
                        }
                    ]
                };
            }
        });
    }

    /**
     * Initialize the MCP server with knowledge data
     */
    async initialize(knowledgeData = []) {
        try {
            this.knowledgeData = knowledgeData;
            this.isInitialized = true;
            log.success('BambiMcpServer initialized successfully');
            return true;
        } catch (error) {
            log.error(`MCP Server initialization failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Create HTTP handler for Express integration
     */
    createHttpHandler() {
        return async (req, res) => {
            try {
                const { method, params, id } = req.body;

                // Handle JSON-RPC 2.0 requests
                let response;
                if (method === 'tools/list') {
                    const tools = Object.values(bambiTools).map(tool => ({
                        name: tool.name,
                        description: tool.description,
                        inputSchema: tool.inputSchema
                    }));
                    response = { tools };
                } else if (method === 'tools/call') {
                    const { name, arguments: args } = params;
                    const tool = Object.values(bambiTools).find(t => t.name === name);

                    if (!tool) {
                        throw new Error(`Unknown tool: ${name}`);
                    }

                    const validatedArgs = tool.inputSchema.parse(args || {});
                    const result = await tool.handler(validatedArgs, {
                        knowledgeData: this.knowledgeData,
                        server: this
                    });

                    response = {
                        content: [{ type: "text", text: result }]
                    };
                } else {
                    throw new Error(`Unknown method: ${method}`);
                }

                res.json({
                    jsonrpc: "2.0",
                    id: id,
                    result: response
                });
            } catch (error) {
                log.error(`HTTP handler error: ${error.message}`);
                res.status(500).json({
                    jsonrpc: "2.0",
                    id: req.body?.id || null,
                    error: {
                        code: -32603,
                        message: "Internal error",
                        data: error.message
                    }
                });
            }
        };
    }

    /**
     * Get server information
     */
    getInfo() {
        return {
            name: "bambisleep-church-server",
            version: "1.0.0",
            description: "BambiSleep Church MCP server",
            toolCount: Object.keys(bambiTools).length,
            isInitialized: this.isInitialized,
            knowledgeEntries: this.knowledgeData.length,
            capabilities: ["tools"],
            transport: ["stdio", "http"]
        };
    }

    /**
     * Run the server with STDIO transport (for CLI clients)
     */
    async run() {
        try {
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            log.success('MCP Server running with STDIO transport');
        } catch (error) {
            log.error(`Failed to start MCP server: ${error.message}`);
            throw error;
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            if (this.server) {
                await this.server.close();
            }
            this.isInitialized = false;
            log.info('MCP Server cleaned up');
        } catch (error) {
            log.error(`MCP Server cleanup error: ${error.message}`);
        }
    }
}

export default BambiMcpServer;
