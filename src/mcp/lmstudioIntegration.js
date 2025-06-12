/**
 * LMStudio MCP Integration
 * Connects the poetic LMStudio worker to the main MCP server
 */

const LMStudioWorker = require('./lmstudioWorker');

class LMStudioMcpIntegration {
    constructor(mcpServer) {
        this.mcpServer = mcpServer;
        this.worker = new LMStudioWorker({
            model: 'llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0',
            baseUrl: 'http://localhost:1234'
        });
        
        this.setupMcpTools();
    }

    setupMcpTools() {
        // Register LMStudio tools with the main MCP server
        this.worker.tools.forEach((tool, name) => {
            this.mcpServer.tools.set(`lmstudio_${name}`, {
                ...tool,
                name: `lmstudio_${name}`,
                description: `[LMStudio] ${tool.description}`
            });
        });

        // Add tool handlers
        const originalHandleTool = this.mcpServer.handleTool.bind(this.mcpServer);
        this.mcpServer.handleTool = async (name, args) => {
            if (name.startsWith('lmstudio_')) {
                const toolName = name.replace('lmstudio_', '');
                return await this.worker.handleToolCall(toolName, args);
            }
            return originalHandleTool(name, args);
        };
    }

    async initialize() {
        await this.worker.initialize();
        console.log('🎭 LMStudio integration added to MCP server');
        console.log('📚 Available LMStudio tools:', Array.from(this.worker.tools.keys()));
    }

    getWorkerStatus() {
        return this.worker.getStatus();
    }
}

module.exports = LMStudioMcpIntegration;
