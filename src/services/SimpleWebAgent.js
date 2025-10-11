// Compact Web Agent for BambiSleep Church
import { log } from '../utils/logger.js';
import { mongoService } from './MongoDBService.js';

class SimpleWebAgent {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        try {
            this.isInitialized = true;
            log.info('🤖 SimpleWebAgent initialized');
            return true;
        } catch (error) {
            log.error(`❌ SimpleWebAgent initialization failed: ${error.message}`);
            return false;
        }
    }

    async chat(message) {
        try {
            if (!this.isInitialized) {
                return { success: false, response: 'Agent not initialized', tool: 'system' };
            }

            const lowerMessage = message.toLowerCase();
            let response, tool = 'chat';

            if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('knowledge')) {
                response = await this.searchKnowledge(message);
                tool = 'knowledge-search';
            } else if (lowerMessage.includes('safety')) {
                response = await this.getSafety();
                tool = 'safety-info';
            } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
                response = "Hello! 👋 I can help search the knowledge base or provide safety information.";
                tool = 'greeting';
            } else {
                response = "I can help you search knowledge or get safety info. Try 'search triggers' or 'safety'.";
                tool = 'general';
            }

            return { success: true, response, tool, timestamp: new Date().toISOString() };
        } catch (error) {
            log.error(`❌ Chat error: ${error.message}`);
            return { success: false, response: 'Sorry, I encountered an error.', tool: 'error' };
        }
    }

    async searchKnowledge(message) {
        try {
            const searchTerm = this.extractSearchTerm(message);
            if (!searchTerm) return "Please specify what you're looking for.";

            // Search MongoDB knowledge base
            const results = await mongoService.findMany('bambisleep_knowledge', {
                $or: [
                    { 'analysis.title': { $regex: searchTerm, $options: 'i' } },
                    { 'analysis.summary': { $regex: searchTerm, $options: 'i' } },
                    { 'category.main': { $regex: searchTerm, $options: 'i' } }
                ]
            }, { limit: 3 });

            if (!results.length) return `No resources found for "${searchTerm}".`;

            let response = `Found ${results.length} resource(s):\n\n`;
            results.forEach((item, i) => {
                response += `${i + 1}. **${item.analysis?.title || 'Unknown'}**\n`;
                response += `   ${item.analysis?.summary || 'No description'}\n`;
                response += `   Category: ${item.category?.main || 'unknown'}\n`;
                if (item.url) response += `   Link: ${item.url}\n`;
                response += '\n';
            });

            return response;
        } catch (error) {
            log.error(`❌ Knowledge search error: ${error.message}`);
            return 'Error searching knowledge base.';
        }
    }

    async getSafety() {
        try {
            // Get safety content from MongoDB
            const safetyContent = await mongoService.findMany('bambisleep_knowledge', {
                'category.main': 'safety'
            }, { limit: 5 });

            if (safetyContent.length > 0) {
                let response = "🛡️ **BambiSleep Safety Guidelines**:\n\n";
                safetyContent.forEach((item, i) => {
                    response += `${i + 1}. **${item.analysis?.title || 'Safety Info'}**\n`;
                    response += `   ${item.analysis?.summary || 'Important safety information'}\n\n`;
                });
                return response;
            }

            // Fallback safety info
            return "🛡️ **Key Safety Points**:\n• Never listen while driving\n• Use in safe, private spaces\n• Take regular breaks\n• Know your limits\n• Seek support when needed";
        } catch (error) {
            log.error(`❌ Safety query error: ${error.message}`);
            return "🛡️ Always prioritize your safety and wellbeing with BambiSleep content.";
        }
    }

    extractSearchTerm(message) {
        const quotedMatch = message.match(/["'](.*?)["']/);
        if (quotedMatch) return quotedMatch[1];

        const keywordMatch = message.match(/(?:search|find|about)\s+(.+?)(?:\s|$)/i);
        if (keywordMatch) return keywordMatch[1].trim();

        const words = message.split(' ').filter(w => w.length > 2);
        return words.slice(-2).join(' ');
    }

    async cleanup() {
        this.isInitialized = false;
        log.info('🧹 SimpleWebAgent cleaned up');
    }
}

export const webAgent = new SimpleWebAgent();
export default webAgent;
