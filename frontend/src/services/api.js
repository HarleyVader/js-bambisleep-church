import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

    // Call MCP tool via JSON-RPC
    async callTool(toolName, args = {}) {
        try {
            const response = await api.post('/mcp', {
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
            console.warn(`MCP tool call failed for ${toolName}:`, error.message);
            return {
                jsonrpc: '2.0',
                id: Date.now(),
                error: { code: -32603, message: `Tool ${toolName} unavailable` }
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
