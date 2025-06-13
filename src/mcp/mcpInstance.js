/**
 * MCP Instance Manager
 * Manages the global MCP Core instance
 */

let mcpInstance = null;

class McpInstanceManager {
    static async getMcpInstance() {
        if (!mcpInstance) {
            const McpCore = require('./McpServer');
            mcpInstance = new McpCore();
            await mcpInstance.initialize();
        }
        return mcpInstance;
    }    static getMcpStatus() {
        if (!mcpInstance) {
            return { 
                status: 'not_initialized', 
                initialized: false, 
                timestamp: new Date().toISOString() 
            };
        }
        return { ...mcpInstance.getStatus(), initialized: true };
    }

    static async callTool(toolName, params) {
        const instance = await this.getMcpInstance();
        return await instance.callTool(toolName, params);
    }

    static async getToolList() {
        const instance = await this.getMcpInstance();
        return instance.getToolList();
    }

    static async getMetrics() {
        const instance = await this.getMcpInstance();
        return instance.getMetrics();
    }
}

module.exports = {
    getMcpInstance: McpInstanceManager.getMcpInstance,
    getMcpStatus: McpInstanceManager.getMcpStatus,
    callTool: McpInstanceManager.callTool,
    getToolList: McpInstanceManager.getToolList,
    getMetrics: McpInstanceManager.getMetrics
};
