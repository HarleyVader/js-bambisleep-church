// Global singleton MCP server instance for the application

const BambisleepMcpServer = require('./McpServer');

let mcpServerInstance = null;
let initializationPromise = null;

/**
 * Get or create the global MCP server instance
 */
async function getMcpInstance() {
    if (mcpServerInstance && mcpServerInstance.initialized) {
        return mcpServerInstance;
    }

    if (initializationPromise) {
        // If initialization is already in progress, wait for it
        await initializationPromise;
        return mcpServerInstance;
    }

    // Start initialization
    initializationPromise = initializeMcpServer();
    await initializationPromise;
    
    return mcpServerInstance;
}

/**
 * Initialize the MCP server instance
 */
async function initializeMcpServer() {
    try {
        console.log('🚀 Initializing global MCP server instance...');
        
        mcpServerInstance = new BambisleepMcpServer();
        await mcpServerInstance.initialize();
        
        console.log('✅ Global MCP server instance ready');
        return mcpServerInstance;
    } catch (error) {
        console.error('❌ Failed to initialize global MCP server:', error.message);
        mcpServerInstance = null;
        initializationPromise = null;
        throw error;
    }
}

/**
 * Check if MCP server is ready
 */
function isMcpReady() {
    return mcpServerInstance && mcpServerInstance.initialized;
}

/**
 * Get MCP server status
 */
function getMcpStatus() {
    if (!mcpServerInstance) {
        return { status: 'not_initialized', ready: false };
    }

    return {
        status: mcpServerInstance.initialized ? 'ready' : 'initializing',
        ready: mcpServerInstance.initialized,
        tools: mcpServerInstance.tools ? mcpServerInstance.tools.size : 0,
        agents: mcpServerInstance.agentRegistry ? mcpServerInstance.agentRegistry.size : 0
    };
}

module.exports = {
    getMcpInstance,
    isMcpReady,
    getMcpStatus
};
