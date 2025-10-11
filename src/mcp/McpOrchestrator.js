import { config } from '../utils/config.js';
import { log } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

/**
 * MCP Server Orchestration Manager
 * Manages multiple MCP servers, load balancing, and capability routing
 */
export class McpOrchestrator {
    constructor() {
        this.servers = new Map();
        this.serverHealth = new Map();
        this.capabilityMap = new Map();
        this.loadConfig();
        this.startHealthChecking();
    }

    /**
     * Load MCP configuration from VS Code settings
     */
    loadConfig() {
        try {
            const mcpConfigPath = path.join(process.cwd(), '.vscode', 'copilot-mcp.json');
            if (fs.existsSync(mcpConfigPath)) {
                const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
                this.initializeServers(mcpConfig.mcpServers);
                this.orchestrationConfig = mcpConfig.orchestration;
                log.info(`🔗 MCP Orchestrator loaded with ${mcpConfig.mcpServers.length} servers`);
            } else {
                log.info('MCP orchestration running with default configuration');
            }
        } catch (error) {
            log.info('MCP orchestration using basic configuration');
        }
    }

    /**
     * Initialize MCP servers from configuration
     */
    initializeServers(serverConfigs) {
        for (const serverConfig of serverConfigs) {
            this.servers.set(serverConfig.name, {
                config: serverConfig,
                status: 'inactive',
                lastHealthCheck: null,
                capabilities: serverConfig.capabilities || {},
                tools: serverConfig.tools || []
            });

            // Map capabilities to servers
            for (const capability in serverConfig.capabilities) {
                if (!this.capabilityMap.has(capability)) {
                    this.capabilityMap.set(capability, []);
                }
                this.capabilityMap.get(capability).push(serverConfig.name);
            }
        }
    }

    /**
     * Route tool request to appropriate MCP server based on capabilities
     */
    async routeToolRequest(toolName, parameters = {}) {
        try {
            // Find servers that have this tool
            const candidateServers = this.findServersWithTool(toolName);

            if (candidateServers.length === 0) {
                throw new Error(`No MCP server available for tool: ${toolName}`);
            }

            // Select best server based on priority and health
            const selectedServer = this.selectBestServer(candidateServers);

            // Execute tool on selected server
            return await this.executeToolOnServer(selectedServer, toolName, parameters);

        } catch (error) {
            log.error(`MCP tool routing failed for ${toolName}:`, error);
            throw error;
        }
    }

    /**
     * Find servers that have the requested tool
     */
    findServersWithTool(toolName) {
        const candidates = [];

        for (const [serverName, serverInfo] of this.servers) {
            if (serverInfo.tools.includes(toolName) && this.isServerHealthy(serverName)) {
                candidates.push(serverName);
            }
        }

        return candidates;
    }

    /**
     * Select best server based on priority, health, and load
     */
    selectBestServer(candidates) {
        if (!this.orchestrationConfig?.serverPriority) {
            return candidates[0]; // Fallback to first available
        }

        // Sort by priority order
        const priorityOrder = this.orchestrationConfig.serverPriority;
        candidates.sort((a, b) => {
            const aPriority = priorityOrder.indexOf(a);
            const bPriority = priorityOrder.indexOf(b);
            return (aPriority === -1 ? 999 : aPriority) - (bPriority === -1 ? 999 : bPriority);
        });

        return candidates[0];
    }

    /**
     * Execute tool on specified MCP server
     */
    async executeToolOnServer(serverName, toolName, parameters) {
        const serverInfo = this.servers.get(serverName);

        if (!serverInfo) {
            throw new Error(`Server ${serverName} not found`);
        }

        log.info(`Executing ${toolName} on MCP server: ${serverName}`);

        // Route to appropriate server type
        switch (serverName) {
            case 'bambisleep-church':
                return await this.executeBambiSleepTool(toolName, parameters);
            case 'vscode-mcp-server':
                return await this.executeVSCodeTool(toolName, parameters);
            case 'agent-smith-mcp':
                return await this.executeAgentSmithTool(toolName, parameters);
            default:
                return await this.executeGenericMcpTool(serverName, toolName, parameters);
        }
    }

    /**
     * Execute BambiSleep Church specific tools
     */
    async executeBambiSleepTool(toolName, parameters) {
        const { McpAgent } = await import('./McpAgent.js');
        const mcpAgent = new McpAgent();
        return await mcpAgent.executeTool(toolName, parameters);
    }

    /**
     * Execute VS Code MCP server tools
     */
    async executeVSCodeTool(toolName, parameters) {
        // Implement VS Code MCP integration
        log.info(`VS Code MCP tool ${toolName} requested with:`, parameters);

        switch (toolName) {
            case 'read_file':
                return { success: true, data: 'File reading via VS Code MCP not yet implemented' };
            case 'write_file':
                return { success: true, data: 'File writing via VS Code MCP not yet implemented' };
            default:
                return { success: false, error: `VS Code MCP tool ${toolName} not implemented` };
        }
    }

    /**
     * Execute Agent Smith MCP tools
     */
    async executeAgentSmithTool(toolName, parameters) {
        log.info(`Agent Smith MCP tool ${toolName} requested with:`, parameters);

        switch (toolName) {
            case 'create_workflow':
                return { success: true, data: 'Workflow creation via Agent Smith not yet implemented' };
            case 'execute_workflow':
                return { success: true, data: 'Workflow execution via Agent Smith not yet implemented' };
            default:
                return { success: false, error: `Agent Smith tool ${toolName} not implemented` };
        }
    }

    /**
     * Execute generic MCP server tools
     */
    async executeGenericMcpTool(serverName, toolName, parameters) {
        log.info(`Generic MCP tool ${toolName} on ${serverName} with:`, parameters);
        return { success: false, error: `Generic MCP execution not yet implemented for ${serverName}` };
    }

    /**
     * Check if server is healthy
     */
    isServerHealthy(serverName) {
        const health = this.serverHealth.get(serverName);
        return health === 'healthy' || health === undefined; // Assume healthy if unknown
    }

    /**
     * Start periodic health checking for all servers
     */
    startHealthChecking() {
        if (!this.orchestrationConfig?.healthChecking?.enabled) {
            return;
        }

        const interval = this.orchestrationConfig.healthChecking.intervalMs || 30000;

        setInterval(async () => {
            await this.performHealthChecks();
        }, interval);

        log.info('MCP server health checking started');
    }

    /**
     * Perform health checks on all servers
     */
    async performHealthChecks() {
        for (const serverName of this.servers.keys()) {
            try {
                const isHealthy = await this.checkServerHealth(serverName);
                this.serverHealth.set(serverName, isHealthy ? 'healthy' : 'unhealthy');
            } catch (error) {
                this.serverHealth.set(serverName, 'unhealthy');
                log.warn(`Health check failed for ${serverName}:`, error.message);
            }
        }
    }

    /**
     * Check individual server health
     */
    async checkServerHealth(serverName) {
        const serverInfo = this.servers.get(serverName);

        if (!serverInfo) {
            return false;
        }

        // Basic health check - try to ping or get status
        try {
            switch (serverName) {
                case 'bambisleep-church':
                    // Check if our local MCP server is responsive
                    return true; // Assume healthy for local server
                case 'bambisleep-church-remote':
                    // Check remote server
                    const response = await fetch(serverInfo.config.endpoint + '/health', {
                        timeout: 5000
                    }).catch(() => null);
                    return response?.ok || false;
                default:
                    // For stdio servers, assume healthy if process exists
                    return true;
            }
        } catch (error) {
            return false;
        }
    }

    /**
     * Get server status and capabilities
     */
    getServerStatus() {
        const status = {};

        for (const [serverName, serverInfo] of this.servers) {
            status[serverName] = {
                health: this.serverHealth.get(serverName) || 'unknown',
                capabilities: serverInfo.capabilities,
                tools: serverInfo.tools,
                config: serverInfo.config
            };
        }

        return status;
    }

    /**
     * Get available capabilities across all servers
     */
    getAvailableCapabilities() {
        const capabilities = {};

        for (const [capability, serverNames] of this.capabilityMap) {
            const healthyServers = serverNames.filter(name => this.isServerHealthy(name));
            if (healthyServers.length > 0) {
                capabilities[capability] = healthyServers;
            }
        }

        return capabilities;
    }
}
