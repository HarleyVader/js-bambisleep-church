/**
 * Consolidated MCP Server for Bambisleep
 * Combines Framework + Orchestrator + Standalone Server + Knowledge Agent
 * Single file solution for Model Context Protocol with LMStudio integration
 */

const path = require('path');
const fs = require('fs').promises;

// Lazy load axios to avoid import issues
let axios = null;
const getAxios = async () => {
    if (!axios) {
        try {
            axios = require('axios');
        } catch (error) {
            console.warn('⚠️ Axios not available, HTTP requests will fail');
            axios = null;
        }
    }
    return axios;
};

class BambisleepMcpServer {
    constructor(config = {}) {
        this.config = {
            model: 'llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0',
            baseUrl: 'http://192.168.0.69:7777/v1/chat/completions',
            dataPath: path.join(process.cwd(), 'data'),
            capabilities: {
                tools: true,
                resources: true,
                prompts: true,
                sampling: true
            },
            ...config
        };

        this.tools = new Map();
        this.resources = new Map();
        this.prompts = new Map();
        this.knowledgeBase = new Map();
        this.initialized = false;
        this.requestId = 0;

        // A2A Communication state
        this.a2aChannels = new Map();
        this.agentRegistry = new Map();
        this.messageQueue = [];
        this.a2aEventHandlers = new Map();
        
        // Register default A2A event handlers
        this.setupA2AEventHandlers();
    }

    /**
     * Initialize the complete MCP server
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Bambisleep MCP Server...');

            // Test LMStudio connection
            await this.testLMStudioConnection();

            // Load bambisleep knowledge base
            await this.loadKnowledgeBase();

            // Register all tools
            await this.registerAllTools();

            // Setup protocol handlers
            this.setupProtocolHandlers();

            this.initialized = true;
            console.log('✅ Bambisleep MCP Server initialized successfully');

            return { success: true, message: 'MCP Server initialized' };
        } catch (error) {
            console.error('❌ Failed to initialize MCP Server:', error.message);
            throw error;
        }
    }    /**
     * Test connection to LMStudio
     */
    async testLMStudioConnection() {
        try {
            const axios = await getAxios();
            if (!axios) {
                console.warn('⚠️ LMStudio connection skipped - axios not available');
                return false;
            }

            const response = await axios.post(this.config.baseUrl, {
                model: this.config.model,
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 5,
                temperature: 0
            }, { timeout: 5000 });

            console.log('✅ LMStudio connection successful');
            return true;
        } catch (error) {
            console.warn('⚠️ LMStudio connection failed, continuing in offline mode');
            return false;
        }
    }

    /**
     * Load bambisleep knowledge base from data files
     */
    async loadKnowledgeBase() {
        const dataTypes = ['links', 'creators', 'comments', 'votes'];

        for (const type of dataTypes) {
            try {
                const filePath = path.join(this.config.dataPath, `${type}.json`);
                const data = await fs.readFile(filePath, 'utf8');
                this.knowledgeBase.set(type, JSON.parse(data));

                // Register as resource
                this.resources.set(`bambisleep://data/${type}`, {
                    data: JSON.parse(data),
                    metadata: { type: 'knowledge', category: type },
                    lastUpdated: new Date()
                });

                console.log(`📚 Loaded ${type}: ${JSON.parse(data).length} items`);
            } catch (error) {
                console.warn(`⚠️ Could not load ${type}.json:`, error.message);
                this.knowledgeBase.set(type, []);
            }
        }
    }

    /**
     * Register all MCP tools
     */
    async registerAllTools() {
        // Core knowledge tools
        this.registerTool('query_knowledge', {
            description: 'Query the bambisleep knowledge base with AI reasoning',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search query or question' },
                    dataTypes: { type: 'array', items: { type: 'string' }, description: 'Data types to search (links, creators, comments, votes)' },
                    analysisDepth: { type: 'string', enum: ['basic', 'detailed', 'comprehensive'], default: 'basic' }
                },
                required: ['query']
            }
        }, this.handleQueryKnowledge.bind(this));

        // Smart content analysis
        this.registerTool('analyze_content', {
            description: 'Analyze bambisleep content with LMStudio AI',
            parameters: {
                type: 'object',
                properties: {
                    content: { type: 'string', description: 'Content to analyze' },
                    analysisType: { type: 'string', enum: ['categorize', 'extract_entities', 'sentiment', 'trends'] },
                    context: { type: 'object', description: 'Additional context' }
                },
                required: ['content', 'analysisType']
            }
        }, this.handleAnalyzeContent.bind(this));

        // Data management
        this.registerTool('manage_data', {
            description: 'Manage bambisleep data with CRUD operations',
            parameters: {
                type: 'object',
                properties: {
                    action: { type: 'string', enum: ['create', 'read', 'update', 'delete', 'search'] },
                    dataType: { type: 'string', enum: ['links', 'creators', 'comments', 'votes'] },
                    data: { type: 'object', description: 'Data payload' },
                    query: { type: 'object', description: 'Search/filter criteria' }
                },
                required: ['action', 'dataType']
            }
        }, this.handleManageData.bind(this));

        // URL crawling and analysis
        this.registerTool('crawl_and_analyze', {
            description: 'Crawl URLs and extract bambisleep-relevant information',
            parameters: {
                type: 'object',
                properties: {
                    url: { type: 'string', description: 'URL to crawl' },
                    extractType: { type: 'string', enum: ['metadata', 'content', 'links', 'all'], default: 'all' },
                    saveToKnowledge: { type: 'boolean', default: true }
                },
                required: ['url']
            }
        }, this.handleCrawlAndAnalyze.bind(this));        // Generate insights
        this.registerTool('generate_insights', {
            description: 'Generate AI-powered insights about bambisleep community',
            parameters: {
                type: 'object',
                properties: {
                    insightType: { type: 'string', enum: ['trends', 'popular_content', 'creator_analysis', 'community_health'] },
                    timeframe: { type: 'string', description: 'Time period for analysis' },
                    outputFormat: { type: 'string', enum: ['summary', 'detailed', 'json'], default: 'summary' }
                },
                required: ['insightType']
            }
        }, this.handleGenerateInsights.bind(this));

        // Generate documentation
        this.registerTool('generate_documentation', {
            description: 'Generate comprehensive markdown documentation for bambisleep knowledgebase',
            parameters: {
                type: 'object',
                properties: {
                    sections: { type: 'array', items: { type: 'string' }, description: 'Sections to include (overview, creators, links, community, api, faq)' },
                    style: { type: 'string', enum: ['comprehensive', 'summary', 'technical'], default: 'comprehensive' },
                    updateExisting: { type: 'boolean', default: true, description: 'Update existing documentation file' }
                }
            }
        }, this.handleGenerateDocumentation.bind(this));

        // A2A Communication Tools
        this.registerTool('a2a_register_agent', {
            description: 'Register an agent for A2A communication',
            parameters: {
                type: 'object',
                properties: {
                    agentId: { type: 'string', description: 'Unique agent identifier' },
                    capabilities: { type: 'object', description: 'Agent capabilities and features' }
                },
                required: ['agentId']
            }
        }, this.handleA2ARegisterAgent.bind(this));

        this.registerTool('a2a_send_message', {
            description: 'Send A2A message between agents',
            parameters: {
                type: 'object',
                properties: {
                    targetAgentId: { type: 'string', description: 'Target agent ID' },
                    messageType: { type: 'string', description: 'Type of message' },
                    data: { type: 'object', description: 'Message payload' }
                },
                required: ['targetAgentId', 'messageType', 'data']
            }
        }, this.handleA2ASendMessage.bind(this));

        this.registerTool('a2a_get_messages', {
            description: 'Get A2A messages for an agent',
            parameters: {
                type: 'object',
                properties: {
                    agentId: { type: 'string', description: 'Agent ID to get messages for' },
                    since: { type: 'string', description: 'ISO timestamp to get messages since' }
                },
                required: ['agentId']
            }
        }, this.handleA2AGetMessages.bind(this));

        this.registerTool('a2a_get_status', {
            description: 'Get A2A communication system status',
            parameters: {
                type: 'object',
                properties: {}
            }
        }, this.handleA2AGetStatus.bind(this));

        console.log('📋 All MCP tools registered');
    }

    /**
     * Register a tool
     */
    registerTool(name, schema, handler) {
        this.tools.set(name, { schema, handler });
        console.log(`🔧 Tool registered: ${name}`);
    }

    /**
     * Handle knowledge queries with AI reasoning
     */
    async handleQueryKnowledge(params) {
        const { query, dataTypes = ['links', 'creators', 'comments', 'votes'], analysisDepth = 'basic' } = params;

        try {
            // Gather relevant data
            const relevantData = {};
            for (const type of dataTypes) {
                relevantData[type] = this.knowledgeBase.get(type) || [];
            }

            // Use AI to analyze and respond
            const aiPrompt = `Analyze the bambisleep community data and answer this query: "${query}"

Available data:
${dataTypes.map(type => `${type}: ${relevantData[type].length} items`).join('\n')}

Analysis depth: ${analysisDepth}

Please provide insights based on the available data. If specific data is needed but not available, mention what would be helpful to collect.`;

            const aiResponse = await this.callLMStudio([
                { role: 'system', content: 'You are an expert analyst of the bambisleep hypnosis community. Provide helpful, accurate insights based on available data.' },
                { role: 'user', content: aiPrompt }
            ]);

            return {
                success: true,
                query,
                dataAnalyzed: dataTypes,
                totalItems: Object.values(relevantData).reduce((sum, arr) => sum + arr.length, 0),
                insights: aiResponse,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle content analysis
     */
    async handleAnalyzeContent(params) {
        const { content, analysisType, context = {} } = params;

        try {
            let aiPrompt = '';

            switch (analysisType) {
                case 'categorize':
                    aiPrompt = `Categorize this bambisleep content: "${content}"
                    
Categories to consider: audio, video, script, discussion, creator profile, community post
Please provide the most appropriate category and confidence level.`;
                    break;

                case 'extract_entities':
                    aiPrompt = `Extract entities from this bambisleep content: "${content}"
                    
Look for: creator names, content titles, platforms (YouTube, SoundCloud, etc.), tags, themes
Return as structured data.`;
                    break;

                case 'sentiment':
                    aiPrompt = `Analyze the sentiment of this bambisleep content: "${content}"
                    
Consider: community reception, content quality, user engagement
Provide sentiment score and reasoning.`;
                    break;

                case 'trends':
                    aiPrompt = `Analyze trends in this bambisleep content: "${content}"
                    
Look for: emerging themes, popular formats, creator patterns, community interests
Provide trend analysis and predictions.`;
                    break;
            }

            const aiResponse = await this.callLMStudio([
                { role: 'system', content: 'You are an expert analyzer of bambisleep hypnosis community content. Provide structured, actionable insights.' },
                { role: 'user', content: aiPrompt }
            ]);

            return {
                success: true,
                analysisType,
                content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                analysis: aiResponse,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle data management operations
     */
    async handleManageData(params) {
        const { action, dataType, data, query } = params;

        try {
            const currentData = this.knowledgeBase.get(dataType) || [];
            let result;

            switch (action) {
                case 'read':
                    result = query ? this.searchData(currentData, query) : currentData;
                    break;

                case 'create':
                    if (data) {
                        const newItem = { id: Date.now(), timestamp: new Date().toISOString(), ...data };
                        currentData.push(newItem);
                        await this.saveKnowledgeType(dataType, currentData);
                        result = newItem;
                    }
                    break;

                case 'update':
                    if (data && data.id) {
                        const index = currentData.findIndex(item => item.id === data.id);
                        if (index !== -1) {
                            currentData[index] = { ...currentData[index], ...data, updated: new Date().toISOString() };
                            await this.saveKnowledgeType(dataType, currentData);
                            result = currentData[index];
                        }
                    }
                    break;

                case 'delete':
                    if (query && query.id) {
                        const index = currentData.findIndex(item => item.id === query.id);
                        if (index !== -1) {
                            const deleted = currentData.splice(index, 1)[0];
                            await this.saveKnowledgeType(dataType, currentData);
                            result = deleted;
                        }
                    }
                    break;

                case 'search':
                    result = this.searchData(currentData, query);
                    break;
            }

            return { success: true, action, dataType, result, count: Array.isArray(result) ? result.length : 1 };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle URL crawling and analysis
     */
    async handleCrawlAndAnalyze(params) {
        const { url, extractType = 'all', saveToKnowledge = true } = params;

        try {
            // Basic URL analysis (would need actual crawling implementation)
            const analysisResult = {
                url,
                extractType,
                timestamp: new Date().toISOString(),
                metadata: {
                    platform: this.detectPlatform(url),
                    contentType: 'unknown'
                },
                content: 'Content extraction would require actual crawling implementation',
                analysis: 'AI analysis would be performed on extracted content'
            };

            // Use AI to analyze the URL and predict content
            const aiPrompt = `Analyze this URL for bambisleep content: ${url}
            
Based on the URL structure, what type of content is this likely to be?
What platform is it from? What should we expect to find?
Provide recommendations for data extraction and categorization.`;

            const aiResponse = await this.callLMStudio([
                { role: 'system', content: 'You are an expert at analyzing URLs for bambisleep hypnosis content. Provide detailed predictions and recommendations.' },
                { role: 'user', content: aiPrompt }
            ]);

            analysisResult.aiAnalysis = aiResponse;

            if (saveToKnowledge) {
                // Save to links knowledge base
                const linksData = this.knowledgeBase.get('links') || [];
                linksData.push(analysisResult);
                await this.saveKnowledgeType('links', linksData);
            }

            return { success: true, ...analysisResult };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }    /**
     * Handle insights generation
     */
    async handleGenerateInsights(params) {
        const { insightType, timeframe = 'all time', outputFormat = 'summary' } = params;

        try {
            // Gather all relevant data
            const allData = {};
            for (const [type, data] of this.knowledgeBase.entries()) {
                allData[type] = data;
            }

            const totalItems = Object.values(allData).reduce((sum, arr) => sum + arr.length, 0);

            let aiPrompt = `Generate ${insightType} insights for the bambisleep community:

Available data summary:
${Object.entries(allData).map(([type, data]) => `- ${type}: ${data.length} items`).join('\n')}

Timeframe: ${timeframe}
Output format: ${outputFormat}

Please provide detailed insights based on the available data.`;

            const aiResponse = await this.callLMStudio([
                { role: 'system', content: 'You are a bambisleep community data analyst. Provide actionable insights and recommendations.' },
                { role: 'user', content: aiPrompt }
            ]);

            return {
                success: true,
                insightType,
                timeframe,
                dataAnalyzed: totalItems,
                insights: aiResponse,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle documentation generation
     */
    async handleGenerateDocumentation(params) {
        const { sections = ['overview', 'creators', 'links', 'community', 'api', 'faq'], style = 'comprehensive', updateExisting = true } = params;

        try {
            // Gather all data for documentation
            const allData = {};
            for (const [type, data] of this.knowledgeBase.entries()) {
                allData[type] = data;
            }

            const stats = {
                totalCreators: allData.creators?.length || 0,
                totalLinks: allData.links?.length || 0,
                totalComments: allData.comments?.length || 0,
                totalVotes: allData.votes?.length || 0,
                topCreators: (allData.creators || []).slice(0, 10),
                topLinks: (allData.links || []).sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 10)
            };

            const aiPrompt = `Generate comprehensive markdown documentation for the Bambisleep community knowledgebase.

Style: ${style}
Sections to include: ${sections.join(', ')}

Available data:
- Creators: ${stats.totalCreators} profiles
- Links: ${stats.totalLinks} submitted links  
- Comments: ${stats.totalComments} community comments
- Votes: ${stats.totalVotes} total votes cast

Please create well-structured markdown documentation that includes:
1. A professional overview of the bambisleep community
2. Statistics and metrics
3. Documentation of available data and APIs
4. Community guidelines and information
5. FAQ section addressing common questions
6. Technical details about the platform

Make it comprehensive, professional, and useful for both community members and developers. Use proper markdown formatting with headers, lists, code blocks, and emphasis where appropriate.

Focus on creating documentation that would help newcomers understand the bambisleep community and developers understand how to interact with the platform.`;

            const aiResponse = await this.callLMStudio([
                { role: 'system', content: 'You are a technical documentation expert specializing in community platforms. Create comprehensive, well-structured markdown documentation.' },
                { role: 'user', content: aiPrompt }
            ]);

            // Generate the markdown documentation
            const documentation = aiResponse;

            // Save to file if requested
            if (updateExisting) {
                const docPath = path.join(process.cwd(), 'src/mcp/bambisleep-info.md');
                await fs.writeFile(docPath, documentation);
                console.log('📝 Documentation updated at bambisleep-info.md');
            }

            return {
                success: true,
                sections,
                style,
                documentation,
                stats,
                generatedAt: new Date().toISOString(),
                savedToFile: updateExisting
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle A2A agent registration
     */
    async handleA2ARegisterAgent(params) {
        const { agentId, capabilities } = params;
        try {
            const result = this.registerAgent(agentId, capabilities);
            return { success: result, agentId, capabilities };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle A2A message sending
     */
    async handleA2ASendMessage(params) {
        const { targetAgentId, messageType, data } = params;
        try {
            const messageId = await this.sendA2AMessage(targetAgentId, { type: messageType, data });
            return { success: true, messageId };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle A2A message retrieval
     */
    async handleA2AGetMessages(params) {
        const { agentId, since } = params;
        try {
            const messages = this.getA2AMessages(agentId, since);
            return { success: true, messages };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle A2A status retrieval
     */
    async handleA2AGetStatus() {
        try {
            const status = this.getA2AStatus();
            return { success: true, status };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Utility: Search data with simple text matching
     */
    searchData(data, query) {
        if (!query || !Array.isArray(data)) return data;

        const searchTerm = query.search?.toLowerCase() || '';
        return data.filter(item =>
            JSON.stringify(item).toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Utility: Detect platform from URL
     */
    detectPlatform(url) {
        const urlLower = url.toLowerCase();
        if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';
        if (urlLower.includes('soundcloud.com')) return 'soundcloud';
        if (urlLower.includes('patreon.com')) return 'patreon';
        if (urlLower.includes('reddit.com')) return 'reddit';
        return 'unknown';
    }

    /**
     * Save knowledge type to file
     */
    async saveKnowledgeType(type, data) {
        try {
            const filePath = path.join(this.config.dataPath, `${type}.json`);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            this.knowledgeBase.set(type, data);

            // Update resource
            this.resources.set(`bambisleep://data/${type}`, {
                data,
                metadata: { type: 'knowledge', category: type },
                lastUpdated: new Date()
            });

            console.log(`💾 Saved ${type}: ${data.length} items`);
        } catch (error) {
            console.error(`❌ Failed to save ${type}:`, error.message);
            throw error;
        }
    }    /**
     * Call LMStudio API
     */
    async callLMStudio(messages, options = {}) {
        try {
            const axios = await getAxios();
            if (!axios) {
                return 'AI analysis unavailable - axios not available. Please install axios with: npm install axios';
            }

            const response = await axios.post(this.config.baseUrl, {
                model: this.config.model,
                messages,
                max_tokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.7,
                ...options
            }, { timeout: 30000 });

            return response.data.choices[0].message.content;
        } catch (error) {
            console.warn('⚠️ LMStudio API call failed, using fallback response');
            return 'AI analysis unavailable - LMStudio connection failed. Please check the service is running on the configured endpoint.';
        }
    }

    /**
     * Call a registered tool
     */
    async callTool(name, parameters) {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}`);
        }

        try {
            return await tool.handler(parameters);
        } catch (error) {
            console.error(`Tool execution failed: ${name}`, error);
            throw error;
        }
    }

    /**
     * Setup protocol handlers for MCP JSON-RPC
     */
    setupProtocolHandlers() {
        // JSON-RPC message handlers
        this.protocolHandlers = {
            'initialize': this.handleInitialize.bind(this),
            'tools/list': this.handleListTools.bind(this),
            'tools/call': this.handleCallTool.bind(this),
            'resources/list': this.handleListResources.bind(this),
            'resources/read': this.handleReadResource.bind(this)
        };
    }

    /**
     * MCP Protocol Handlers
     */
    async handleInitialize(params) {
        return {
            protocolVersion: '2024-11-05',
            capabilities: this.config.capabilities,
            serverInfo: {
                name: 'bambisleep-mcp-server',
                version: '1.0.0'
            }
        };
    }

    async handleListTools() {
        return {
            tools: Array.from(this.tools.entries()).map(([name, tool]) => ({
                name,
                description: tool.schema.description,
                inputSchema: tool.schema.parameters
            }))
        };
    }

    async handleCallTool(params) {
        const { name, arguments: args } = params;
        return await this.callTool(name, args);
    }

    async handleListResources() {
        return {
            resources: Array.from(this.resources.keys()).map(uri => ({
                uri,
                name: uri.split('/').pop(),
                mimeType: 'application/json'
            }))
        };
    }

    async handleReadResource(params) {
        const { uri } = params;
        const resource = this.resources.get(uri);
        if (!resource) {
            throw new Error(`Resource not found: ${uri}`);
        }

        return {
            contents: [{
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(resource.data, null, 2)
            }]
        };
    }

    /**
     * Start the MCP server
     */
    async start() {
        try {
            await this.initialize();

            // Setup stdio for JSON-RPC communication
            this.setupStdioHandler();

            console.log('🎯 Bambisleep MCP Server ready for connections');
            console.log(`📊 Knowledge base loaded: ${Array.from(this.knowledgeBase.values()).reduce((sum, arr) => sum + arr.length, 0)} total items`);
            console.log(`🔧 Tools available: ${this.tools.size}`);
            console.log(`📚 Resources available: ${this.resources.size}`);

        } catch (error) {
            console.error('❌ Failed to start MCP server:', error);
            process.exit(1);
        }
    }

    /**
     * Setup stdio handler for JSON-RPC
     */
    setupStdioHandler() {
        let buffer = '';

        process.stdin.on('data', async (chunk) => {
            buffer += chunk.toString();

            let newlineIndex;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, newlineIndex);
                buffer = buffer.slice(newlineIndex + 1);

                if (line.trim()) {
                    try {
                        const message = JSON.parse(line);
                        await this.processMessage(message);
                    } catch (error) {
                        this.sendError(null, -32700, 'Parse error');
                    }
                }
            }
        });
    }

    /**
     * Process incoming JSON-RPC message
     */
    async processMessage(message) {
        try {
            if (message.method) {
                // Request
                await this.handleRequest(message);
            }
        } catch (error) {
            this.sendError(message.id, -32603, 'Internal error', error.message);
        }
    }

    /**
     * Handle JSON-RPC request
     */
    async handleRequest(request) {
        const { id, method, params } = request;

        try {
            const handler = this.protocolHandlers[method];
            if (!handler) {
                this.sendError(id, -32601, 'Method not found');
                return;
            }

            const result = await handler(params);
            this.sendResponse({ id, result });
        } catch (error) {
            this.sendError(id, -32603, 'Internal error', error.message);
        }
    }

    /**
     * Send JSON-RPC response
     */
    sendResponse(response) {
        const message = {
            jsonrpc: '2.0',
            ...response
        };
        process.stdout.write(JSON.stringify(message) + '\n');
    }

    /**
     * Send JSON-RPC error
     */
    sendError(id, code, message, data = null) {
        const error = { code, message };
        if (data) error.data = data;

        this.sendResponse({ id, error });
    }

    /**
     * Get server status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            toolsRegistered: this.tools.size,
            resourcesAvailable: this.resources.size,
            knowledgeBaseSize: Array.from(this.knowledgeBase.values()).reduce((sum, arr) => sum + arr.length, 0),
            config: {
                model: this.config.model,
                baseUrl: this.config.baseUrl
            }
        };
    }

    /**
     * Start as standalone JSON-RPC server over stdio
     */
    async startStandalone() {
        try {
            await this.initialize();
            this.setupStdioHandler();
            console.log('🚀 Standalone MCP Server started with LMStudio integration');
        } catch (error) {
            console.error('❌ Failed to start standalone MCP server:', error.message);
            process.exit(1);
        }
    }

    /**
     * Setup stdio handler for JSON-RPC protocol
     */
    setupStdioHandler() {
        let buffer = '';

        process.stdin.on('data', (chunk) => {
            buffer += chunk.toString();

            // Process complete JSON-RPC messages
            let lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.trim()) {
                    this.processJsonRpcMessage(line.trim());
                }
            }
        });

        process.stdin.on('end', () => {
            if (buffer.trim()) {
                this.processJsonRpcMessage(buffer.trim());
            }
        });
    }

    /**
     * Process incoming JSON-RPC message
     */
    async processJsonRpcMessage(message) {
        try {
            const request = JSON.parse(message);
            const response = await this.handleJsonRpcRequest(request);

            if (response) {
                this.sendJsonRpcResponse(response);
            }
        } catch (error) {
            this.sendJsonRpcError(null, -32700, 'Parse error', error.message);
        }
    }

    /**
     * Handle JSON-RPC request
     */
    async handleJsonRpcRequest(request) {
        const { id, method, params } = request;

        try {
            switch (method) {
                case 'initialize':
                    return { jsonrpc: '2.0', id, result: { capabilities: this.config.capabilities } };

                case 'initialized':
                    return null; // Notification - no response needed

                case 'tools/list':
                    const toolsList = Array.from(this.tools.entries()).map(([name, tool]) => ({
                        name,
                        description: tool.description,
                        inputSchema: tool.inputSchema
                    }));
                    return { jsonrpc: '2.0', id, result: { tools: toolsList } };

                case 'tools/call':
                    const { name, arguments: args } = params;
                    const tool = this.tools.get(name);
                    if (!tool) {
                        throw new Error(`Tool not found: ${name}`);
                    }
                    const result = await tool.handler(args);
                    return {
                        jsonrpc: '2.0',
                        id,
                        result: {
                            content: [{ type: 'text', text: JSON.stringify(result) }]
                        }
                    };

                case 'resources/list':
                    const resourcesList = Array.from(this.resources.entries()).map(([uri, resource]) => ({
                        uri,
                        name: resource.name || uri,
                        description: resource.description || '',
                        mimeType: resource.mimeType || 'application/json'
                    }));
                    return { jsonrpc: '2.0', id, result: { resources: resourcesList } };

                case 'resources/read':
                    const { uri } = params;
                    const resource = this.resources.get(uri);
                    if (!resource) {
                        throw new Error(`Resource not found: ${uri}`);
                    }
                    return {
                        jsonrpc: '2.0',
                        id,
                        result: {
                            contents: [{
                                uri,
                                mimeType: resource.mimeType || 'application/json',
                                text: JSON.stringify(resource.data)
                            }]
                        }
                    };

                default:
                    throw new Error(`Method not found: ${method}`);
            }
        } catch (error) {
            return {
                jsonrpc: '2.0',
                id,
                error: {
                    code: -32603,
                    message: 'Internal error',
                    data: error.message
                }
            };
        }
    }

    /**
     * Send JSON-RPC response to stdout
     */
    sendJsonRpcResponse(response) {
        console.log(JSON.stringify(response));
    }

    /**
     * Send JSON-RPC error to stdout
     */
    sendJsonRpcError(id, code, message, data = null) {
        const error = {
            jsonrpc: '2.0',
            id,
            error: { code, message }
        };
        if (data) {
            error.error.data = data;
        }
        console.log(JSON.stringify(error));
    }

    /**
     * Agent-to-Agent (A2A) Communication Hub
     * Enables coordinated operations between Discovery, Feed, and Stats agents
     */

    /**
     * Setup default A2A event handlers for inter-agent communication
     */
    setupA2AEventHandlers() {
        // Discovery Agent -> Feed Agent communication
        this.registerA2AHandler('content_discovered', async (message) => {
            const { content, confidence, source } = message.data;
            
            // Forward to Feed Agent for validation and processing
            await this.sendA2AMessage('bambisleep-feed-agent', {
                type: 'validate_content',
                data: { content, confidence, source, discoveredAt: new Date().toISOString() }
            });
            
            console.log(`🔄 A2A: Forwarded discovered content to Feed Agent (confidence: ${confidence}%)`);
        });

        // Feed Agent -> Stats Agent communication
        this.registerA2AHandler('content_validated', async (message) => {
            const { content, action, reason } = message.data;
            
            // Update Stats Agent knowledge base
            await this.sendA2AMessage('bambisleep-stats-agent', {
                type: 'update_content_stats',
                data: { content, action, reason, validatedAt: new Date().toISOString() }
            });
            
            console.log(`📊 A2A: Updated Stats Agent with validation result: ${action}`);
        });

        // Stats Agent -> Discovery Agent communication (learning feedback)
        this.registerA2AHandler('content_insights', async (message) => {
            const { patterns, recommendations } = message.data;
            
            // Send learning insights to Discovery Agent
            await this.sendA2AMessage('bambisleep-discovery-agent', {
                type: 'update_patterns',
                data: { patterns, recommendations, updatedAt: new Date().toISOString() }
            });
            
            console.log(`🧠 A2A: Shared content insights with Discovery Agent`);
        });

        // Cross-agent status updates
        this.registerA2AHandler('agent_status', async (message) => {
            const { agentId, status, metrics } = message.data;
            
            // Broadcast status to all other agents
            for (const [id, agent] of this.agentRegistry) {
                if (id !== agentId) {
                    await this.sendA2AMessage(id, {
                        type: 'peer_status_update',
                        data: { sourceAgent: agentId, status, metrics }
                    });
                }
            }
            
            console.log(`📡 A2A: Broadcasted status from ${agentId} to peer agents`);
        });
    }

    /**
     * Register an agent for A2A communication
     */
    registerAgent(agentId, capabilities = {}) {
        this.agentRegistry.set(agentId, {
            id: agentId,
            capabilities,
            lastSeen: new Date(),
            messageCount: 0,
            isActive: true
        });
        
        console.log(`🤖 A2A: Registered agent ${agentId} with capabilities:`, Object.keys(capabilities));
        return true;
    }

    /**
     * Register an A2A event handler
     */
    registerA2AHandler(eventType, handler) {
        if (!this.a2aEventHandlers.has(eventType)) {
            this.a2aEventHandlers.set(eventType, []);
        }
        this.a2aEventHandlers.get(eventType).push(handler);
        console.log(`🔗 A2A: Registered handler for event type: ${eventType}`);
    }

    /**
     * Send A2A message between agents
     */
    async sendA2AMessage(targetAgentId, message) {
        try {
            const timestamp = new Date().toISOString();
            const a2aMessage = {
                id: `a2a_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp,
                source: 'mcp-server',
                target: targetAgentId,
                ...message
            };

            // Store in message queue for reliability
            this.messageQueue.push(a2aMessage);

            // Update agent last seen
            if (this.agentRegistry.has(targetAgentId)) {
                const agent = this.agentRegistry.get(targetAgentId);
                agent.messageCount++;
                agent.lastSeen = new Date();
            }

            // For now, we'll use in-memory queuing
            // In production, this could use WebSockets, Redis pub/sub, etc.
            console.log(`📨 A2A: Message sent to ${targetAgentId}:`, message.type);
            
            return a2aMessage.id;
        } catch (error) {
            console.error(`❌ A2A: Failed to send message to ${targetAgentId}:`, error.message);
            throw error;
        }
    }

    /**
     * Handle incoming A2A message
     */
    async handleA2AMessage(message) {
        try {
            const { type, source, data } = message;
            
            // Trigger registered handlers
            const handlers = this.a2aEventHandlers.get(type) || [];
            
            for (const handler of handlers) {
                try {
                    await handler(message);
                } catch (error) {
                    console.error(`❌ A2A: Handler failed for ${type}:`, error.message);
                }
            }

            // Update source agent activity
            if (this.agentRegistry.has(source)) {
                const agent = this.agentRegistry.get(source);
                agent.lastSeen = new Date();
                agent.isActive = true;
            }

            console.log(`✅ A2A: Processed message type ${type} from ${source}`);
            return true;
        } catch (error) {
            console.error(`❌ A2A: Failed to handle message:`, error.message);
            return false;
        }
    }

    /**
     * Get A2A messages for a specific agent
     */
    getA2AMessages(agentId, since = null) {
        const sinceTime = since ? new Date(since) : new Date(0);
        
        return this.messageQueue.filter(msg => 
            msg.target === agentId && 
            new Date(msg.timestamp) > sinceTime
        );
    }

    /**
     * Get A2A system status
     */
    getA2AStatus() {
        const activeAgents = Array.from(this.agentRegistry.values())
            .filter(agent => agent.isActive);
            
        return {
            totalAgents: this.agentRegistry.size,
            activeAgents: activeAgents.length,
            messageQueue: this.messageQueue.length,
            eventHandlers: Array.from(this.a2aEventHandlers.keys()),
            agents: activeAgents.map(agent => ({
                id: agent.id,
                lastSeen: agent.lastSeen,
                messageCount: agent.messageCount,
                capabilities: Object.keys(agent.capabilities)
            }))
        };
    }

    /**
     * Clean up old A2A messages (prevent memory leaks)
     */
    cleanupA2AMessages(olderThanHours = 24) {
        const cutoff = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
        const initialLength = this.messageQueue.length;
        
        this.messageQueue = this.messageQueue.filter(msg => 
            new Date(msg.timestamp) > cutoff
        );
        
        const cleaned = initialLength - this.messageQueue.length;
        if (cleaned > 0) {
            console.log(`🧹 A2A: Cleaned up ${cleaned} old messages`);
        }
    }
}

// Start the server if run directly
if (require.main === module) {
    const server = new BambisleepMcpServer();

    // Check for standalone JSON-RPC mode
    if (process.argv.includes('--standalone') || process.argv.includes('--stdio')) {
        server.startStandalone().catch(console.error);
    } else {
        server.start().catch(console.error);
    }
}

module.exports = BambisleepMcpServer;
