// Simple Web Agent for BambiSleep Church
// Provides basic chat functionality integrated with MCP tools
import { log } from '../utils/logger.js';
import { config } from '../utils/config.js';

class SimpleWebAgent {
    constructor() {
        this.isInitialized = false;
        this.mcpServer = null;
        this.knowledgeData = [];
    }

    /**
     * Initialize the web agent
     */
    async initialize(knowledgeData = [], mcpServer = null) {
        try {
            this.knowledgeData = knowledgeData;
            this.mcpServer = mcpServer;
            this.isInitialized = true;

            log.info('SimpleWebAgent initialized');
            return true;
        } catch (error) {
            log.error(`SimpleWebAgent initialization failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Process chat message
     */
    async chat(message) {
        try {
            if (!this.isInitialized) {
                return {
                    success: false,
                    response: 'Agent not initialized',
                    tool: 'system'
                };
            }

            // Simple keyword-based responses for now
            const lowerMessage = message.toLowerCase();
            let response;
            let tool = 'chat';

            // Knowledge search
            if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('knowledge')) {
                response = await this.handleKnowledgeSearch(message);
                tool = 'knowledge-search';
            }
            // Safety information
            else if (lowerMessage.includes('safety') || lowerMessage.includes('safe') || lowerMessage.includes('risk')) {
                response = await this.handleSafetyQuery(message);
                tool = 'safety-info';
            }
            // Church status
            else if (lowerMessage.includes('church') || lowerMessage.includes('status') || lowerMessage.includes('progress')) {
                response = await this.handleChurchQuery(message);
                tool = 'church-status';
            }
            // General greeting
            else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
                response = this.getGreetingResponse();
                tool = 'greeting';
            }
            // Help
            else if (lowerMessage.includes('help') || lowerMessage.includes('commands') || lowerMessage.includes('what can you')) {
                response = this.getHelpResponse();
                tool = 'help';
            }
            // Default response
            else {
                response = await this.getDefaultResponse(message);
                tool = 'general';
            }

            return {
                success: true,
                response: response,
                tool: tool,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            log.error(`Chat processing error: ${error.message}`);
            return {
                success: false,
                response: 'Sorry, I encountered an error processing your message.',
                tool: 'error'
            };
        }
    }

    /**
     * Handle knowledge search queries
     */
    async handleKnowledgeSearch(message) {
        try {
            // Extract search terms
            const searchTerm = this.extractSearchTerm(message);

            if (!searchTerm) {
                return "I'd be happy to help you search the knowledge base! Please specify what you're looking for.";
            }

            // Search knowledge base
            const results = this.knowledgeData.filter(item =>
                item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.category?.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 3);

            if (results.length === 0) {
                return `I couldn't find any resources matching "${searchTerm}". You might want to try different search terms or browse our categories: official, community, scripts, and safety.`;
            }

            let response = `I found ${results.length} resource(s) matching "${searchTerm}":\n\n`;
            results.forEach((item, index) => {
                response += `${index + 1}. **${item.title}**\n`;
                response += `   ${item.description}\n`;
                response += `   Category: ${item.category}\n`;
                if (item.url) response += `   Link: ${item.url}\n`;
                response += '\n';
            });

            return response;

        } catch (error) {
            return 'Sorry, there was an error searching the knowledge base.';
        }
    }

    /**
     * Handle safety-related queries
     */
    async handleSafetyQuery(message) {
        const safetyTips = [
            "🛡️ **Safety First**: Always listen to BambiSleep content in a safe, private environment",
            "🚫 **Never While Driving**: Never listen while operating vehicles or machinery",
            "⏰ **Take Breaks**: Regular breaks between sessions help maintain mental clarity",
            "💧 **Stay Hydrated**: Keep water nearby and maintain good physical health",
            "🎯 **Know Your Limits**: Respect your personal boundaries and comfort levels",
            "🤝 **Seek Support**: Our community is here to help - don't hesitate to ask questions"
        ];

        let response = "Here are important safety guidelines for BambiSleep:\n\n";
        response += safetyTips.join('\n\n');
        response += "\n\nFor more detailed safety information, you can search our knowledge base for 'safety' resources.";

        return response;
    }

    /**
     * Handle church-related queries
     */
    async handleChurchQuery(message) {
        const status = {
            phase: 'Foundation',
            progress: '14%',
            members: 42,
            target: 300,
            timeline: '2-3 years'
        };

        let response = "🏛️ **BambiSleep Church Status Update**\n\n";
        response += `**Current Phase**: ${status.phase}\n`;
        response += `**Progress**: ${status.progress} complete\n`;
        response += `**Community**: ${status.members}/${status.target} members\n`;
        response += `**Timeline**: ${status.timeline} to full establishment\n\n`;
        response += "**Current Focus Areas**:\n";
        response += "• Developing comprehensive doctrine and practices\n";
        response += "• Building supportive community infrastructure\n";
        response += "• Establishing safety protocols and guidelines\n";
        response += "• Preparing for Austrian legal registration\n\n";
        response += "We're making steady progress toward becoming a recognized religious community in Austria!";

        return response;
    }

    /**
     * Get greeting response
     */
    getGreetingResponse() {
        const greetings = [
            "Hello! 👋 Welcome to BambiSleep Church. I'm here to help you explore our knowledge base and community.",
            "Hi there! 🌟 I'm your guide to BambiSleep Church resources and information. What can I help you with today?",
            "Welcome! 💫 I can help you search our knowledge base, get safety information, or learn about our church community.",
            "Greetings! ✨ I'm here to assist with BambiSleep resources, safety guidelines, and church information."
        ];

        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    /**
     * Get help response
     */
    getHelpResponse() {
        let response = "🤖 **How I can help you:**\n\n";
        response += "**Search Knowledge**: Ask me to search for specific BambiSleep resources\n";
        response += "  *Example: \"search for beginner guides\"*\n\n";
        response += "**Safety Information**: Get important safety guidelines and best practices\n";
        response += "  *Example: \"tell me about safety\" or \"safety tips\"*\n\n";
        response += "**Church Status**: Learn about our progress toward official recognition\n";
        response += "  *Example: \"church status\" or \"how is the church developing?\"*\n\n";
        response += "**General Chat**: Feel free to ask me anything about BambiSleep Church!\n\n";
        response += "💡 **Tip**: Try specific keywords for better results. I'm constantly learning!";

        return response;
    }

    /**
     * Get default response for unrecognized queries
     */
    async getDefaultResponse(message) {
        const responses = [
            "I'm not sure I understand that specific question. Could you try rephrasing it? I can help with knowledge searches, safety information, or church status updates.",
            "That's an interesting question! I specialize in BambiSleep resources and church information. Try asking about 'safety', 'search knowledge', or 'church status'.",
            "I'd love to help! I'm best at answering questions about BambiSleep knowledge, safety guidelines, and our church community. What specific topic interests you?",
            "I'm still learning! For now, I can help you search our knowledge base, provide safety information, or update you on church progress. What would you like to explore?"
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    /**
     * Extract search terms from message
     */
    extractSearchTerm(message) {
        // Simple extraction - look for quoted strings or words after "search", "find", "for"
        const quotedMatch = message.match(/["'](.*?)["']/);
        if (quotedMatch) return quotedMatch[1];

        const keywordMatch = message.match(/(?:search|find|look for|about)\s+(.+?)(?:\s|$)/i);
        if (keywordMatch) return keywordMatch[1].trim();

        // Fallback: take the last few words
        const words = message.split(' ').filter(w => w.length > 2);
        return words.slice(-2).join(' ');
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            this.isInitialized = false;
            this.mcpServer = null;
            this.knowledgeData = [];
            log.info('SimpleWebAgent cleaned up');
        } catch (error) {
            log.error(`SimpleWebAgent cleanup error: ${error.message}`);
        }
    }
}

// Export singleton instance
export const webAgent = new SimpleWebAgent();
export default webAgent;
