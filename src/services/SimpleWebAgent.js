/**
 * Simple Web Agent for BambiSleep Church
 * Provides web chat capabilities using the MCP system
 */

import { McpAgent } from '../mcp/McpAgent.js';
import { log } from '../utils/logger.js';
import { config } from '../utils/config.js';

class SimpleWebAgent {
    constructor() {
        this.mcpAgent = new McpAgent();
        this.isInitialized = false;
    }

    async initialize() {
        try {
            log.info('🤖 Initializing SimpleWebAgent...');

            // Initialize MCP Agent worker system
            await this.mcpAgent.initializeWorker();

            this.isInitialized = true;
            log.success('SimpleWebAgent initialized successfully');
            return true;
        } catch (error) {
            log.error(`SimpleWebAgent initialization failed: ${error.message}`);
            return false;
        }
    } async chat(message) {
        if (!this.isInitialized) {
            throw new Error('SimpleWebAgent not initialized');
        }

        try {
            log.info(`Processing chat message: ${message.substring(0, 100)}...`);

            // Use MCP Agent for chat
            const response = await this.mcpAgent.chat(message);

            const result = {
                response: response.response || 'I apologize, but I couldn\'t generate a response.',
                iterations: response.iterations || 0,
                tools_used: response.toolsUsed || 0,
                timestamp: new Date().toISOString()
            };

            log.success(`Chat response generated (${result.response.length} chars)`);
            return result;

        } catch (error) {
            log.error(`Chat error: ${error.message}`);
            return {
                response: 'I apologize, but I encountered an error while processing your message. Please try again.',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async cleanup() {
        try {
            log.info('Cleaning up SimpleWebAgent...');

            if (this.mcpAgent) {
                await this.mcpAgent.cleanup();
            }

            this.isInitialized = false;
            log.success('SimpleWebAgent cleanup completed');
        } catch (error) {
            log.error(`SimpleWebAgent cleanup error: ${error.message}`);
        }
    }
}

// Create and export singleton instance
export const webAgent = new SimpleWebAgent();
