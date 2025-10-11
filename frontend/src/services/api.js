import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    timeout: 30000, // Increased to 30 seconds for MCP operations
    headers: {
        'Content-Type': 'application/json',
    },
});

// Create a separate instance for long-running operations like crawling
const apiLongRunning = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    timeout: 120000, // 2 minutes for crawling operations
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptors for long-running API
apiLongRunning.interceptors.request.use(
    (config) => {
        console.log(`Long-running API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('Long-running API Request Error:', error);
        return Promise.reject(error);
    }
);

apiLongRunning.interceptors.response.use(
    (response) => {
        console.log(`Long-running API Response: ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('Long-running API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// Request interceptor
api.interceptors.request.use(
    (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// MCP Service
export const mcpService = {
    // Get MCP server status
    async getStatus() {
        try {
            const response = await api.get('/api/mcp/status');
            return response.data;
        } catch (error) {
            console.warn('MCP status check failed:', error.message);
            return {
                status: 'unavailable',
                message: 'MCP server is not responding'
            };
        }
    },

    // Get list of MCP tools
    async getTools() {
        try {
            const response = await api.get('/api/mcp/tools');
            return response.data;
        } catch (error) {
            console.warn('MCP tools fetch failed:', error.message);
            return {
                tools: [],
                count: 0,
                error: 'MCP tools unavailable'
            };
        }
    },

    // Call MCP tool via JSON-RPC with appropriate timeout
    async callTool(toolName, args = {}) {
        try {
            // Use long-running API for crawler and agentic operations
            const isLongRunning = toolName.startsWith('crawler-') ||
                toolName.startsWith('agentic-') ||
                toolName.includes('build');

            const apiInstance = isLongRunning ? apiLongRunning : api;

            const response = await apiInstance.post('/mcp', {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: args
                }
            });
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            console.warn(`MCP tool call failed for ${toolName}:`, errorMessage);

            // Return more detailed error information
            return {
                jsonrpc: '2.0',
                id: Date.now(),
                error: {
                    code: error.response?.status || -32603,
                    message: `Tool ${toolName}: ${errorMessage}`,
                    details: error.response?.data
                }
            };
        }
    },

    // List all available tools via JSON-RPC
    async listTools() {
        try {
            const response = await api.post('/mcp', {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/list'
            });
            return response.data;
        } catch (error) {
            console.warn('MCP tools list failed:', error.message);
            return {
                jsonrpc: '2.0',
                id: Date.now(),
                result: { tools: [] }
            };
        }
    }
};

// Knowledge Service
export const knowledgeService = {
    // Get all knowledge entries
    async getAll() {
        const response = await api.get('/api/knowledge');
        return response.data;
    },

    // Search knowledge entries
    async search(query, category = null) {
        const params = { q: query };
        if (category) params.category = category;

        const response = await api.get('/api/knowledge', { params });
        return response.data;
    },

    // Get knowledge entry by ID
    async getById(id) {
        const response = await api.get(`/api/knowledge/${id}`);
        return response.data;
    }
};

// Agentic Service
export const agenticService = {
    // Get agentic system status
    async getStatus() {
        const response = await api.get('/api/agentic/status');
        return response.data;
    },

    // Initialize agentic system
    async initialize() {
        const response = await mcpService.callTool('agentic-initialize');
        return response;
    },

    // Start autonomous building
    async startBuilding(options = {}) {
        const response = await mcpService.callTool('agentic-start-building', options);
        return response;
    },

    // Stop autonomous building
    async stopBuilding() {
        const response = await mcpService.callTool('agentic-stop-building');
        return response;
    },

    // Get system statistics
    async getStats() {
        const response = await mcpService.callTool('agentic-get-stats');
        return response;
    },

    // Query knowledge with AI
    async queryKnowledge(query, category = null) {
        const response = await mcpService.callTool('agentic-query-knowledge', {
            query,
            category
        });
        return response;
    },

    // Get learning path recommendations
    async getLearningPath(userType = 'beginner', interests = []) {
        const response = await mcpService.callTool('agentic-get-learning-path', {
            userType,
            interests
        });
        return response;
    }
};

// Health Service
export const healthService = {
    // Get overall system health
    async getHealth() {
        const response = await api.get('/api/health');
        return response.data;
    },

    // Check specific service health
    async checkService(service) {
        const response = await api.get(`/api/health/${service}`);
        return response.data;
    }
};

// Knowledge Base Service - Comprehensive MCP tool integration
export const knowledgeBaseService = {
    // Retry mechanism for failed operations
    async retryOperation(operation, maxRetries = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();
                if (result.result || (result.error && result.error.code !== -32603)) {
                    return result; // Success or non-retryable error
                }

                if (attempt === maxRetries) {
                    return result; // Final attempt, return whatever we got
                }

                console.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                console.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
        }
    },
    // Crawler operations
    async crawlSingleUrl(url, options = {}) {
        return await this.retryOperation(() =>
            mcpService.callTool('crawler-single-url', {
                url,
                storeResults: options.storeResults !== false,
                collection: options.collection || 'crawl_results',
                timeout: options.timeout || 60000
            }), 2 // Only retry twice for crawling
        );
    },

    async crawlMultipleUrls(urls, options = {}) {
        return await mcpService.callTool('crawler-multiple-urls', {
            urls,
            maxDepth: options.maxDepth || 2,
            maxPages: options.maxPages || 50,
            storeResults: options.storeResults !== false,
            collection: options.collection || 'crawl_results'
        });
    },

    async batchCrawl(urls, options = {}) {
        return await mcpService.callTool('crawler-batch-crawl', {
            urls,
            batchSize: options.batchSize || 5,
            delayMs: options.delayMs || 1000,
            storeResults: options.storeResults !== false
        });
    },

    async getCrawlStats() {
        return await mcpService.callTool('crawler-get-stats');
    },

    // Agentic system operations
    async initializeAgentic() {
        return await mcpService.callTool('agentic-initialize');
    },

    async startAgenticBuilding(options = {}) {
        return await mcpService.callTool('agentic-start-building', {
            sources: options.sources || ['crawl_results'],
            autoOrganize: options.autoOrganize !== false,
            maxItems: options.maxItems || 100
        });
    },

    async stopAgenticBuilding() {
        return await mcpService.callTool('agentic-stop-building');
    },

    async getAgenticStats() {
        return await mcpService.callTool('agentic-get-stats');
    },

    async generateLearningPath(topic, options = {}) {
        return await mcpService.callTool('agentic-get-learning-path', {
            topic,
            maxItems: options.maxItems || 10,
            difficulty: options.difficulty || 'beginner'
        });
    },

    // MongoDB operations
    async listDatabases() {
        return await mcpService.callTool('mongodb-list-databases');
    },

    async listCollections(database = 'bambisleep-church') {
        return await mcpService.callTool('mongodb-list-collections', { database });
    },

    async findDocuments(collection, query = {}, options = {}) {
        return await mcpService.callTool('mongodb-find-documents', {
            collection,
            query,
            limit: options.limit || 20,
            sort: options.sort || {}
        });
    },

    async getCollectionStats(collection) {
        return await mcpService.callTool('mongodb-collection-stats', { collection });
    },

    async aggregateData(collection, pipeline) {
        return await mcpService.callTool('mongodb-aggregate-data', {
            collection,
            pipeline
        });
    },

    // LMStudio operations
    async getLMStudioStatus() {
        return await mcpService.callTool('lmstudio-get-status');
    },

    async generateText(prompt, options = {}) {
        return await mcpService.callTool('lmstudio-generate-text', {
            prompt,
            maxTokens: options.maxTokens || 500,
            temperature: options.temperature || 0.7
        });
    },

    async analyzeContent(content, analysisType = 'general') {
        return await mcpService.callTool('lmstudio-analyze-content', {
            content,
            analysisType
        });
    },

    async categorizeContent(content) {
        return await mcpService.callTool('lmstudio-categorize-content', {
            content,
            categories: ['official', 'community', 'scripts', 'safety', 'guides', 'resources']
        });
    },

    // Bambi-specific knowledge operations
    async searchKnowledge(query, options = {}) {
        return await this.retryOperation(() =>
            mcpService.callTool('search-knowledge', {
                query,
                category: options.category,
                limit: Math.min(options.limit || 10, 20) // Ensure limit doesn't exceed 20
            })
        );
    },

    async getSafetyInfo() {
        return await mcpService.callTool('get-safety-info');
    },

    async getChurchStatus() {
        return await mcpService.callTool('get-church-status');
    },

    async getCommunityGuidelines() {
        return await mcpService.callTool('get-community-guidelines');
    },

    async getResourceRecommendations(topic) {
        return await mcpService.callTool('get-resource-recommendations', { topic });
    },

    // Comprehensive system operations
    async getSystemOverview() {
        try {
            const [mcpStatus, crawlerStats, agenticStats, dbStats] = await Promise.allSettled([
                this.getMcpStatus(),
                this.getCrawlStats(),
                this.getAgenticStats(),
                this.listDatabases()
            ]);

            return {
                mcp: mcpStatus.status === 'fulfilled' ? mcpStatus.value : null,
                crawler: crawlerStats.status === 'fulfilled' ? crawlerStats.value : null,
                agentic: agenticStats.status === 'fulfilled' ? agenticStats.value : null,
                database: dbStats.status === 'fulfilled' ? dbStats.value : null
            };
        } catch (error) {
            console.error('System overview failed:', error);
            return null;
        }
    },

    async getMcpStatus() {
        return await mcpService.getStatus();
    },

    // Test connection to all services
    async testConnections() {
        const tests = {
            mcp: null,
            mongodb: null,
            lmstudio: null,
            crawler: null,
            agentic: null
        };

        try {
            // Test MCP connection
            tests.mcp = await mcpService.getStatus();

            // Test MongoDB
            tests.mongodb = await mcpService.callTool('mongodb-list-databases');

            // Test LMStudio
            tests.lmstudio = await mcpService.callTool('lmstudio-get-status');

            // Test Crawler
            tests.crawler = await mcpService.callTool('crawler-get-stats');

            // Test Agentic
            tests.agentic = await mcpService.callTool('agentic-get-stats');

        } catch (error) {
            console.error('Connection test failed:', error);
        }

        return tests;
    }
};

// WebSocket/Socket.IO Service (for real-time features)
export const socketService = {
    socket: null,

    // Initialize socket connection
    connect() {
        if (typeof window !== 'undefined' && !this.socket) {
            import('socket.io-client').then(({ io }) => {
                this.socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin);

                this.socket.on('connect', () => {
                    console.log('Socket connected:', this.socket.id);
                });

                this.socket.on('disconnect', () => {
                    console.log('Socket disconnected');
                });
            });
        }
        return this.socket;
    },

    // Disconnect socket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    },

    // Emit event
    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    },

    // Listen to event
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    },

    // Remove event listener
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
};

export default api;
