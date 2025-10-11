// MCP Server for BambiSleep Church
// Implements Model Context Protocol with automatic tool discovery
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { log } from '../utils/logger.js';
import { config } from '../utils/config.js';
import { ToolboxLoader } from './toolbox.js';
// Note: Individual tools are now loaded dynamically from tools directory

export class BambiMcpServer {
    constructor() {
        this.server = new McpServer({
            name: 'bambisleep-church-server',
            version: '1.0.0'
        });

        this.toolboxLoader = new ToolboxLoader();
        this.knowledgeData = [];
        this.isInitialized = false;
    }

    /**
     * Initialize the MCP server with tools and resources
     */
    async initialize(knowledgeData = []) {
        if (this.isInitialized) {
            return true;
        }

        try {
            this.knowledgeData = knowledgeData;

            // Register core BambiSleep Church tools
            await this.registerCoreTools();

            // Auto-discover and load external tools if enabled
            if (config.mcp.autoDiscovery) {
                await this.discoverAndLoadTools();
            }

            // Register resources
            await this.registerResources();

            // Register prompts
            await this.registerPrompts();

            this.isInitialized = true;
            log.success('MCP Server initialized successfully');
            return true;

        } catch (error) {
            log.error(`MCP Server initialization failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Register core BambiSleep Church tools
     */
    async registerCoreTools() {
        try {
            // Load local tools from the tools directory
            const localTools = await this.toolboxLoader.loadLocalTools();

            for (const tool of localTools) {
                try {
                    // Create handler with context (knowledgeData)
                    const contextualHandler = async (params) => {
                        return await tool.handler(params, { knowledgeData: this.knowledgeData });
                    };

                    this.server.registerTool(
                        tool.name,
                        tool.config,
                        contextualHandler
                    );
                    log.info(`Registered local tool: ${tool.name} from ${tool.metadata.source}`);
                } catch (error) {
                    log.error(`Failed to register tool ${tool.name}: ${error.message}`);
                }
            }

            // Set up file watching for hot reloading in development
            if (config.development?.hotReload) {
                this.setupToolWatching();
            }

        } catch (error) {
            log.error(`Core tool registration failed: ${error.message}`);
        }
    }

    /**
     * Set up file watching for tool hot reloading
     */
    setupToolWatching() {
        const watcher = this.toolboxLoader.watchToolsDirectory(async (eventType, filename) => {
            if (eventType === 'change') {
                try {
                    log.info(`Tool file changed: ${filename}, attempting hot reload...`);
                    const reloadedTool = await this.toolboxLoader.reloadLocalTool(filename);

                    if (reloadedTool) {
                        // Re-register the tool with updated code
                        const contextualHandler = async (params) => {
                            return await reloadedTool.handler(params, { knowledgeData: this.knowledgeData });
                        };

                        this.server.registerTool(
                            reloadedTool.name,
                            reloadedTool.config,
                            contextualHandler
                        );

                        log.success(`Hot reloaded tool: ${reloadedTool.name}`);
                    }
                } catch (error) {
                    log.error(`Hot reload failed for ${filename}: ${error.message}`);
                }
            }
        });

        if (watcher) {
            log.info('Tool file watching enabled for hot reloading');
        }
    }

    /**
     * Auto-discover and load tools from external toolboxes (excluding local tools)
     */
    async discoverAndLoadTools() {
        try {
            // Get external sources only (filter out local tools since they're already loaded)
            const externalSources = config.mcp.toolboxSources.filter(source => source.type !== 'local');
            const externalTools = await this.toolboxLoader.loadToolboxes(externalSources);

            for (const tool of externalTools) {
                try {
                    this.server.registerTool(
                        tool.name,
                        tool.config,
                        tool.handler
                    );
                    log.info(`Loaded external tool: ${tool.name}`);
                } catch (error) {
                    log.error(`Failed to register tool ${tool.name}: ${error.message}`);
                }
            }

        } catch (error) {
            log.error(`Tool discovery failed: ${error.message}`);
        }
    }

    /**
     * Register MCP resources
     */
    async registerResources() {
        // Knowledge base resource
        this.server.registerResource(
            'knowledge',
            'bambisleep://knowledge',
            {
                title: 'BambiSleep Knowledge Base',
                description: 'Complete knowledge base of BambiSleep resources',
                mimeType: 'application/json'
            },
            async (uri) => ({
                contents: [{
                    uri: uri.href,
                    text: JSON.stringify(this.knowledgeData, null, 2)
                }]
            })
        );

        // Church information resource
        this.server.registerResource(
            'church-info',
            'bambisleep://church/info',
            {
                title: 'Church Information',
                description: 'Information about BambiSleep Church mission and status',
                mimeType: 'application/json'
            },
            async (uri) => ({
                contents: [{
                    uri: uri.href,
                    text: JSON.stringify({
                        name: 'BambiSleep Church',
                        status: 'In Development',
                        phase: 'Foundation',
                        mission: 'Establishing as legal Austrian religious community',
                        targetMembers: 300,
                        timeline: '2-3 years',
                        knowledgeEntries: this.knowledgeData.length
                    }, null, 2)
                }]
            })
        );

        log.info('Registered MCP resources');
    }

    /**
     * Register MCP prompts
     */
    async registerPrompts() {
        // BambiSleep guidance prompt
        this.server.registerPrompt(
            'bambi-guidance',
            {
                title: 'BambiSleep Guidance',
                description: 'Get guidance about BambiSleep practices and safety',
                argsSchema: {
                    topic: z.string().describe('Topic you need guidance on'),
                    level: z.enum(['beginner', 'intermediate', 'advanced']).describe('Your experience level')
                }
            },
            ({ topic, level }) => ({
                messages: [{
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `I'm a ${level} practitioner seeking guidance about: ${topic}. Please provide safe, informed advice based on the BambiSleep knowledge base, emphasizing safety and consent.`
                    }
                }]
            })
        );

        // Church community prompt
        this.server.registerPrompt(
            'church-community',
            {
                title: 'Church Community Info',
                description: 'Learn about joining the BambiSleep Church community',
                argsSchema: {
                    interest: z.string().describe('What interests you about the church community')
                }
            },
            ({ interest }) => ({
                messages: [{
                    role: 'assistant',
                    content: {
                        type: 'text',
                        text: `Welcome to BambiSleep Church! You're interested in: ${interest}. Our church is developing as a legal Austrian religious community focused on safe, consensual hypnosis practices. We're building a supportive community that values safety, consent, and spiritual growth through BambiSleep practices.`
                    }
                }]
            })
        );

        log.info('Registered MCP prompts');
    }

    /**
     * Create HTTP transport handler for Express integration
     */
    createHttpHandler() {
        return async (req, res) => {
            try {
                // Create a new transport for each request to prevent ID collisions
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: undefined,
                    enableJsonResponse: true
                });

                res.on('close', () => {
                    transport.close();
                });

                await this.server.connect(transport);
                await transport.handleRequest(req, res, req.body);

            } catch (error) {
                log.error(`MCP request error: ${error.message}`);
                if (!res.headersSent) {
                    res.status(500).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32603,
                            message: 'Internal server error'
                        },
                        id: null
                    });
                }
            }
        };
    }

    /**
     * Get server information
     */
    getInfo() {
        return {
            name: 'BambiSleep Church MCP Server',
            version: '1.0.0',
            initialized: this.isInitialized,
            toolCount: Object.keys(this.server._tools || {}).length,
            resourceCount: Object.keys(this.server._resources || {}).length,
            promptCount: Object.keys(this.server._prompts || {}).length,
            knowledgeEntries: this.knowledgeData.length
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            if (this.toolboxLoader) {
                await this.toolboxLoader.cleanup();
            }
            log.info('MCP Server cleaned up');
        } catch (error) {
            log.error(`MCP cleanup error: ${error.message}`);
        }
    }
}

export default BambiMcpServer;
