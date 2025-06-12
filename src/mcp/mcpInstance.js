/**
 * MCP Instance Manager
 * Manages the global MCP server instance
 */

let mcpInstance = null;

class McpInstanceManager {
    static async getMcpInstance() {
        if (!mcpInstance) {
            const McpServer = require('./McpServer');
            mcpInstance = new McpServer();
            await mcpInstance.initialize();
        }
        return mcpInstance;
    }

    static getMcpStatus() {
        if (!mcpInstance) {
            return { status: 'not_initialized', initialized: false };
        }
        return { ...mcpInstance.getStatus(), initialized: true };
    }
}

module.exports = {
    getMcpInstance: McpInstanceManager.getMcpInstance,
    getMcpStatus: McpInstanceManager.getMcpStatus
};
