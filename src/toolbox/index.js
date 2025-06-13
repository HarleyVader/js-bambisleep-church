/**
 * Toolbox Index - Central registry for all MCP tools
 */

import LinkManager from './linkManager.js';
import Analytics from './analytics.js';
import ContentManager from './contentManager.js';

export class Toolbox {
    constructor() {
        this.tools = new Map();
        this.registerDefaultTools();
    }

    /**
     * Register default tools
     */
    registerDefaultTools() {
        this.register('linkManager', new LinkManager());
        this.register('analytics', new Analytics());
        this.register('contentManager', new ContentManager());
    }

    /**
     * Register a new tool
     */
    register(name, toolInstance) {
        this.tools.set(name, toolInstance);
        return toolInstance;
    }

    /**
     * Get a tool by name
     */
    getTool(name) {
        return this.tools.get(name);
    }

    /**
     * Get all available tools
     */
    getAvailableTools() {
        return Array.from(this.tools.keys());
    }

    /**
     * Execute a tool method
     */
    async execute(toolName, methodName, params = {}) {
        const tool = this.getTool(toolName);
        if (!tool) {
            throw new Error(`Tool '${toolName}' not found`);
        }

        const method = tool[methodName];
        if (!method || typeof method !== 'function') {
            throw new Error(`Method '${methodName}' not found on tool '${toolName}'`);
        }

        try {
            return await method.call(tool, params);
        } catch (error) {
            throw new Error(`Error executing ${toolName}.${methodName}: ${error.message}`);
        }
    }

    /**
     * Get tool documentation
     */
    getToolInfo(toolName) {
        const tool = this.getTool(toolName);
        if (!tool) {
            return null;
        }

        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(tool))
            .filter(name => name !== 'constructor' && typeof tool[name] === 'function');

        return {
            name: toolName,
            type: tool.constructor.name,
            methods: methods,
            description: this.getToolDescription(toolName)
        };
    }

    /**
     * Get tool descriptions
     */
    getToolDescription(toolName) {
        const descriptions = {
            linkManager: 'Manages links, categories, and voting functionality',
            analytics: 'Tracks events, sessions, and provides analytics data',
            contentManager: 'Handles content creation, templates, and management'
        };
        
        return descriptions[toolName] || 'No description available';
    }

    /**
     * Get all tools info
     */
    getAllToolsInfo() {
        return this.getAvailableTools().map(toolName => this.getToolInfo(toolName));
    }
}

// Export singleton instance
export const toolbox = new Toolbox();
export default toolbox;
