// BambiSleep Church MCP Server
// Model Context Protocol server implementation with BambiSleep-specific tools

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { log } from '../utils/logger.js';

// Import BambiSleep tools
import { bambiTools } from './tools/bambi-tools.js';
import { mongodbTools } from './tools/mongodb/mongodbTools.js';
import { lmstudioTools } from './tools/lmstudio/lmstudioTools.js';
import { crawlerTools } from './tools/crawler/crawlerTools.js';
import { mongoService } from '../services/MongoDBService.js';
import { lmStudioService } from '../services/LMStudioService.js';
import { webCrawlerService } from '../services/WebCrawlerService.js';

class BambiMcpServer {
    constructor() {
        this.server = new Server(
            {
                name: "bambisleep-church-server",
                version: "1.0.0",
                description: "BambiSleep Church MCP server with community tools and MongoDB database"
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        );

        this.knowledgeData = [];
        this.isInitialized = false;

        // Combine all tools
        this.allTools = {
            ...bambiTools,
            ...Object.fromEntries(mongodbTools.map(tool => [tool.name, tool])),
            ...Object.fromEntries(lmstudioTools.map(tool => [tool.name, tool])),
            ...Object.fromEntries(crawlerTools.map(tool => [tool.name, tool]))
        };

        this.setupHandlers();
    }

    /**
     * Set up MCP request handlers
     */
    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            const tools = Object.values(this.allTools).map(tool => ({
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
            const tool = Object.values(this.allTools).find(t => t.name === name);
            if (!tool) {
                throw new Error(`Unknown tool: ${name}`);
            }

            try {
                // For MongoDB tools, use their direct handler format
                if (name.startsWith('mongodb-')) {
                    const result = await tool.handler(args || {});
                    return result;
                }

                // For LMStudio tools, use their direct handler format
                if (name.startsWith('lmstudio-')) {
                    const result = await tool.handler(args || {});
                    return result;
                }

                // For Bambi tools, validate arguments using Zod schema
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
     * Initialize the MCP server with knowledge data and MongoDB connection
     */
    async initialize(knowledgeData = []) {
        try {
            this.knowledgeData = knowledgeData;

            // Initialize MongoDB connection
            if (process.env.MONGODB_URL) {
                log.info('Initializing MongoDB connection...');
                const mongoConnected = await mongoService.connect();
                if (mongoConnected) {
                    log.success('✅ MongoDB connected successfully');
                } else {
                    log.warn('⚠️ MongoDB connection failed, MongoDB tools may not work');
                }
            } else {
                log.warn('⚠️ MONGODB_URL not configured, MongoDB tools will not be available');
            }

            // Initialize LMStudio connection
            if (process.env.LMSTUDIO_URL) {
                log.info('Initializing LMStudio connection...');
                const lmstudioHealthy = await lmStudioService.isHealthy();
                if (lmstudioHealthy) {
                    log.success('✅ LMStudio server connected successfully');
                } else {
                    log.warn('⚠️ LMStudio server connection failed, LMStudio tools may not work');
                }
            } else {
                log.warn('⚠️ LMSTUDIO_URL not configured, using default localhost:1234');
            }

            // Initialize Web Crawler service
            log.info('Initializing Web Crawler service...');
            webCrawlerService.configure({
                userAgent: 'BambiSleep-Church-Crawler/1.0 (+https://github.com/HarleyVader/js-bambisleep-church)',
                timeout: 10000,
                maxRetries: 3,
                crawlDelay: 1000
            });
            log.success('✅ Web Crawler service initialized');

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
                    const tools = Object.values(this.allTools).map(tool => ({
                        name: tool.name,
                        description: tool.description,
                        inputSchema: tool.inputSchema
                    }));
                    response = { tools };
                } else if (method === 'tools/call') {
                    const { name, arguments: args } = params;
                    const tool = Object.values(this.allTools).find(t => t.name === name);

                    if (!tool) {
                        throw new Error(`Unknown tool: ${name}`);
                    }

                    // For MongoDB tools, use their direct handler format
                    if (name.startsWith('mongodb-')) {
                        response = await tool.handler(args || {});
                    } else if (name.startsWith('lmstudio-')) {
                        // For LMStudio tools, use their direct handler format
                        response = await tool.handler(args || {});
                    } else if (name.startsWith('crawler-')) {
                        // For Crawler tools, use their direct handler format
                        response = await tool.handler(args || {});
                    } else {
                        // For Bambi tools, validate arguments using Zod schema
                        const validatedArgs = tool.inputSchema.parse(args || {});
                        const result = await tool.handler(validatedArgs, {
                            knowledgeData: this.knowledgeData,
                            server: this
                        });

                        response = {
                            content: [{ type: "text", text: result }]
                        };
                    }
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
    async getInfo() {
        const lmstudioHealthy = await lmStudioService.isHealthy().catch(() => false);

        return {
            name: "bambisleep-church-server",
            version: "1.0.0",
            description: "BambiSleep Church MCP server with MongoDB, LMStudio, and Web Crawler",
            toolCount: Object.keys(this.allTools).length,
            bambiToolCount: Object.keys(bambiTools).length,
            mongodbToolCount: mongodbTools.length,
            lmstudioToolCount: lmstudioTools.length,
            crawlerToolCount: crawlerTools.length,
            isInitialized: this.isInitialized,
            knowledgeEntries: this.knowledgeData.length,
            mongodbConnected: mongoService.isConnected,
            lmstudioHealthy: lmstudioHealthy,
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

            // Close MongoDB connection
            if (mongoService.isConnected) {
                await mongoService.disconnect();
            }

            this.isInitialized = false;
            log.info('MCP Server cleaned up');
        } catch (error) {
            log.error(`MCP Server cleanup error: ${error.message}`);
        }
    }
}

export default BambiMcpServer;
