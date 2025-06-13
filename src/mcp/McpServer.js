#!/usr/bin/env node

/**
 * MCP Core - Enhanced Model Context Protocol Server
 * Provides core MCP functionality, infrastructure, and logging
 */

const fs = require('fs');
const path = require('path');

class McpCore {
    constructor(config = {}) {
        this.config = {
            toolboxPath: path.join(__dirname, 'toobox'),
            logLevel: 'info',
            enableMetrics: true,
            ...config
        };
        this.initialized = false;
        this.tools = new Map();
        this.toolInstances = new Map();
        this.metrics = {
            toolCalls: 0,
            errors: 0,
            startTime: Date.now()
        };
        this.logger = this.createLogger();
    }

    createLogger() {
        const levels = { error: 0, warn: 1, info: 2, debug: 3 };
        const currentLevel = levels[this.config.logLevel] || 2;

        return {
            error: (msg, ...args) => currentLevel >= 0 && console.error(`❌ [MCP-CORE ERROR] ${msg}`, ...args),
            warn: (msg, ...args) => currentLevel >= 1 && console.warn(`⚠️  [MCP-CORE WARN] ${msg}`, ...args),
            info: (msg, ...args) => currentLevel >= 2 && console.log(`ℹ️  [MCP-CORE] ${msg}`, ...args),
            debug: (msg, ...args) => currentLevel >= 3 && console.log(`🔍 [MCP-CORE DEBUG] ${msg}`, ...args)
        };
    }

    async initialize() {
        this.logger.info('Initializing MCP Core...');
        
        try {
            await this.loadToolInventory();
            await this.initializeTools();
            this.initialized = true;
            
            this.logger.info(`MCP Core ready with ${this.tools.size} tools`);
            return this;
        } catch (error) {
            this.logger.error('Initialization failed:', error.message);
            throw error;
        }
    }

    async loadToolInventory() {
        const inventoryPath = path.join(this.config.toolboxPath, 'inventory.json');
        
        if (!fs.existsSync(inventoryPath)) {
            this.logger.warn('No tool inventory found');
            return;
        }

        try {
            const inventoryData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
            this.toolInventory = inventoryData;
            this.logger.debug(`Loaded inventory with ${Object.keys(inventoryData.tools || {}).length} tools`);
        } catch (error) {
            this.logger.error('Failed to load tool inventory:', error.message);
            throw error;
        }
    }

    async initializeTools() {
        if (!this.toolInventory?.tools) {
            this.logger.warn('No tools found in inventory');
            return;
        }

        for (const [toolName, toolConfig] of Object.entries(this.toolInventory.tools)) {
            try {
                await this.loadTool(toolName, toolConfig);
            } catch (error) {
                this.logger.error(`Failed to load tool ${toolName}:`, error.message);
            }
        }
    }

    async loadTool(toolName, toolConfig) {
        const toolPath = path.join(this.config.toolboxPath, toolConfig.module);
        
        if (!fs.existsSync(toolPath)) {
            throw new Error(`Tool module not found: ${toolPath}`);
        }

        const ToolClass = require(toolPath);
        const toolInstance = new ToolClass();
        
        this.toolInstances.set(toolName, toolInstance);
        this.tools.set(toolName, {
            config: toolConfig,
            instance: toolInstance,
            lastUsed: null,
            callCount: 0
        });

        this.logger.debug(`Loaded tool: ${toolName}`);
    }

    registerTool(name, config, handler) {
        this.tools.set(name, { 
            config, 
            handler,
            instance: null,
            lastUsed: null,
            callCount: 0
        });
        this.logger.debug(`Registered tool: ${name}`);
    }

    async callTool(name, params = {}) {
        const startTime = Date.now();
        this.metrics.toolCalls++;

        const tool = this.tools.get(name);
        if (!tool) {
            this.metrics.errors++;
            this.logger.error(`Tool not found: ${name}`);
            return { success: false, error: `Tool '${name}' not found` };
        }
        
        try {
            this.logger.debug(`Calling tool: ${name}`, params);
            
            let result;
            if (tool.instance) {
                result = await tool.instance.execute(params);
            } else if (tool.handler) {
                result = await tool.handler(params);
            } else {
                throw new Error('Tool has no executable handler');
            }

            // Update metrics
            tool.lastUsed = new Date().toISOString();
            tool.callCount++;

            const duration = Date.now() - startTime;
            this.logger.debug(`Tool ${name} completed in ${duration}ms`);

            return result;
        } catch (error) {
            this.metrics.errors++;
            this.logger.error(`Tool ${name} execution failed:`, error.message);
            return { success: false, error: error.message };
        }
    }

    getToolList() {
        return Array.from(this.tools.keys()).map(name => {
            const tool = this.tools.get(name);
            return {
                name,
                description: tool.config?.description || 'No description',
                category: tool.config?.category || 'general',
                lastUsed: tool.lastUsed,
                callCount: tool.callCount
            };
        });
    }

    getMetrics() {
        return {
            ...this.metrics,
            uptime: Date.now() - this.metrics.startTime,
            toolCount: this.tools.size,
            errorRate: this.metrics.toolCalls > 0 ? this.metrics.errors / this.metrics.toolCalls : 0
        };
    }

    getStatus() {
        return {
            status: this.initialized ? 'ready' : 'initializing',
            toolCount: this.tools.size,
            metrics: this.getMetrics(),
            timestamp: new Date().toISOString()
        };
    }
}

// If run directly, start the server
if (require.main === module) {
    const server = new McpCore();
    server.initialize().then(() => {
        console.log('🌟 MCP Core running in standalone mode');
        // Keep process alive
        setInterval(() => {}, 1000);
    }).catch(console.error);
}

module.exports = McpCore;
