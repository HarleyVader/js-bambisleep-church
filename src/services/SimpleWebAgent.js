// SimpleWebAgent - Keyword-based agent for web interface
// Uses MCP tools directly without LM Studio dependency

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class SimpleWebAgent {
    constructor() {
        this.mcpClient = null;
        this.mcpServerProcess = null;
        this.tools = [];
    }

    // Initialize MCP connection
    async initialize() {
        console.log('🔌 SimpleWebAgent: Connecting to MCP server...');

        try {
            // Create transport for MCP server
            const transport = new StdioClientTransport({
                command: 'node',
                args: ['src/mcp/McpServer.js']
            });

            // Create and connect client
            this.mcpClient = new Client({
                name: 'simple-web-agent',
                version: '1.0.0'
            }, {
                capabilities: {}
            });

            await this.mcpClient.connect(transport);
            this.mcpServerProcess = transport;

            // Get available tools
            const toolsList = await this.mcpClient.listTools();
            this.tools = toolsList.tools;

            console.log('✅ SimpleWebAgent: Connected to MCP server');
            console.log(`📚 Available tools: ${this.tools.map(t => t.name).join(', ')}`);

            return true;
        } catch (error) {
            console.error('❌ SimpleWebAgent: Failed to initialize:', error.message);
            return false;
        }
    }

    // Parse user message and detect intent
    parseIntent(message) {
        const lowerMsg = message.toLowerCase();

        // Search intent
        if (lowerMsg.includes('search') || lowerMsg.includes('find') || lowerMsg.includes('look for')) {
            return {
                tool: 'search_knowledge',
                keywords: this.extractSearchKeywords(message)
            };
        }

        // Stats intent
        if (lowerMsg.includes('stats') || lowerMsg.includes('statistics') ||
            lowerMsg.includes('how many') || lowerMsg.includes('count')) {
            return {
                tool: 'get_knowledge_stats',
                keywords: []
            };
        }

        // Fetch intent
        if (lowerMsg.includes('fetch') || lowerMsg.includes('get website') ||
            lowerMsg.includes('scrape') || lowerMsg.match(/https?:\/\//)) {
            return {
                tool: 'fetch_webpage',
                keywords: this.extractUrl(message)
            };
        }

        // Help intent
        if (lowerMsg.includes('help') || lowerMsg === '?') {
            return {
                tool: 'help',
                keywords: []
            };
        }

        // Default: search
        return {
            tool: 'search_knowledge',
            keywords: message
        };
    }

    // Extract search keywords from message
    extractSearchKeywords(message) {
        // Remove common words
        const stopWords = ['search', 'find', 'look', 'for', 'about', 'what', 'is', 'are', 'the', 'a', 'an'];
        const words = message.toLowerCase().split(/\s+/);
        const keywords = words.filter(w => !stopWords.includes(w) && w.length > 2);
        return keywords.join(' ') || message;
    }

    // Extract URL from message
    extractUrl(message) {
        const urlMatch = message.match(/(https?:\/\/[^\s]+)/);
        return urlMatch ? urlMatch[1] : null;
    }

    // Execute tool via MCP
    async executeTool(toolName, args) {
        try {
            console.log(`🔧 Executing tool: ${toolName}`, args);

            const result = await this.mcpClient.callTool({
                name: toolName,
                arguments: args
            });

            // Extract content from result
            if (result.content && Array.isArray(result.content)) {
                return result.content
                    .filter(item => item.type === 'text')
                    .map(item => item.text)
                    .join('\n');
            }

            return JSON.stringify(result, null, 2);
        } catch (error) {
            console.error(`❌ Tool execution failed:`, error.message);
            throw error;
        }
    }

    // Main chat method
    async chat(userMessage) {
        try {
            // Parse user intent
            const intent = this.parseIntent(userMessage);

            // Handle help
            if (intent.tool === 'help') {
                return {
                    response: this.getHelpMessage(),
                    tool: 'help',
                    success: true
                };
            }

            // Execute appropriate tool
            let toolResult;
            let toolArgs = {};

            switch (intent.tool) {
                case 'search_knowledge':
                    toolArgs = {
                        query: intent.keywords || userMessage,
                        limit: 5
                    };
                    toolResult = await this.executeTool('search_knowledge', toolArgs);
                    break;

                case 'get_knowledge_stats':
                    toolResult = await this.executeTool('get_knowledge_stats', {});
                    break;

                case 'fetch_webpage':
                    if (!intent.keywords) {
                        return {
                            response: '❌ Please provide a valid URL to fetch.',
                            tool: 'fetch_webpage',
                            success: false
                        };
                    }
                    toolArgs = {
                        url: intent.keywords
                    };
                    toolResult = await this.executeTool('fetch_webpage', toolArgs);
                    break;

                default:
                    toolResult = 'Unknown tool';
            }

            // Format response
            const formattedResponse = this.formatResponse(intent.tool, toolResult);

            return {
                response: formattedResponse,
                tool: intent.tool,
                toolArgs: toolArgs,
                success: true
            };

        } catch (error) {
            console.error('❌ Chat error:', error.message);
            return {
                response: `❌ Error: ${error.message}`,
                tool: null,
                success: false
            };
        }
    }

    // Format tool response for display
    formatResponse(tool, result) {
        try {
            // Try parsing if JSON
            const parsed = JSON.parse(result);

            switch (tool) {
                case 'search_knowledge':
                    if (parsed.results && Array.isArray(parsed.results)) {
                        if (parsed.results.length === 0) {
                            return '🔍 No results found. Try different keywords.';
                        }
                        let response = `🔍 Found ${parsed.results.length} result(s):\n\n`;
                        parsed.results.forEach((item, i) => {
                            response += `${i + 1}. **${item.title}**\n`;
                            response += `   ${item.description}\n`;
                            response += `   🔗 ${item.url}\n`;
                            response += `   📁 ${item.category} | ⭐ ${item.relevance}/10\n\n`;
                        });
                        return response;
                    }
                    break;

                case 'get_knowledge_stats':
                    let stats = '📊 **Knowledge Base Statistics:**\n\n';
                    stats += `📚 **Total Entries:** ${parsed.totalEntries || 0}\n\n`;

                    if (parsed.byCategory) {
                        stats += '📂 **By Category:**\n';
                        Object.entries(parsed.byCategory).forEach(([cat, count]) => {
                            stats += `   • ${cat}: ${count}\n`;
                        });
                        stats += '\n';
                    }

                    if (parsed.byPlatform) {
                        stats += '🌐 **By Platform:**\n';
                        Object.entries(parsed.byPlatform).forEach(([plat, count]) => {
                            stats += `   • ${plat}: ${count}\n`;
                        });
                        stats += '\n';
                    }

                    if (parsed.averageRelevance) {
                        stats += `⭐ **Average Relevance:** ${parsed.averageRelevance.toFixed(2)}/10\n`;
                    }

                    return stats;

                case 'fetch_webpage':
                    if (parsed.content) {
                        return `🌐 **Content from ${parsed.url}:**\n\n${parsed.content.substring(0, 500)}...\n\n📏 Total length: ${parsed.content.length} characters`;
                    }
                    break;
            }

            // Default: return formatted JSON
            return result;

        } catch (e) {
            // Not JSON, return as-is
            return result;
        }
    }

    // Get help message
    getHelpMessage() {
        return `🤖 **SimpleWebAgent Help**

I can help you with these commands:

🔍 **Search Knowledge Base:**
   • "search triggers"
   • "find uniform files"
   • "look for beginners"

📊 **Get Statistics:**
   • "show stats"
   • "how many entries"
   • "knowledge base statistics"

🌐 **Fetch Websites:**
   • "fetch https://bambisleep.info"
   • "get website example.com"

❓ **Help:**
   • "help" or "?"

Just type naturally and I'll understand!`;
    }

    // Cleanup
    async cleanup() {
        try {
            if (this.mcpClient) {
                await this.mcpClient.close();
            }
            console.log('✅ SimpleWebAgent: Cleaned up');
        } catch (error) {
            console.error('❌ Cleanup error:', error.message);
        }
    }
}

// Export singleton instance
export const webAgent = new SimpleWebAgent();
