// Agentic Workflow for MCP Tools using LMStudio
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class McpAgent {
    constructor(config = {}) {
        this.lmstudioUrl = config.lmstudioUrl || 'http://localhost:1234/v1/chat/completions';
        this.model = config.model || 'llama-3.2-8x3b-moe-dark-champion-instruct-uncensored-abliterated-18.4b';
        this.maxIterations = config.maxIterations || 10;
        this.temperature = config.temperature || 0.7;
        this.conversationHistory = [];
        this.knowledgeData = [];
        this.modelCheckInterval = null;

        // Load knowledge base
        this.loadKnowledge();
        
        // Check model on initialization
        this.checkModel();
    }

    loadKnowledge() {
        try {
            const knowledgePath = path.join(__dirname, '../knowledge/knowledge.json');
            this.knowledgeData = JSON.parse(fs.readFileSync(knowledgePath, 'utf-8'));
            console.log(`✅ Agent: Loaded ${this.knowledgeData.length} knowledge entries`);
        } catch (error) {
            console.error('❌ Agent: Error loading knowledge:', error.message);
        }
    }

    // Check if LMStudio has a model loaded
    async checkModel() {
        try {
            const baseUrl = this.lmstudioUrl.replace('/v1/chat/completions', '');
            const response = await axios.get(`${baseUrl}/v1/models`, { timeout: 5000 });
            const models = response.data.data;

            if (models.length === 0) {
                console.log('\n⚠️  WARNING: LMStudio has NO MODELS LOADED!');
                console.log('   Server:', baseUrl);
                console.log('   📝 Action needed: Load model in LMStudio');
                console.log(`   Model required: ${this.model}`);
                console.log('   ℹ️  Agent will retry automatically...\n');
                
                // Set up auto-retry every 30 seconds
                if (!this.modelCheckInterval) {
                    this.modelCheckInterval = setInterval(() => this.checkModel(), 30000);
                }
            } else {
                console.log('✅ Agent: LMStudio model check passed');
                console.log(`   Loaded models: ${models.map(m => m.id).join(', ')}`);
                
                // Stop checking if model is found
                if (this.modelCheckInterval) {
                    clearInterval(this.modelCheckInterval);
                    this.modelCheckInterval = null;
                }
            }
        } catch (error) {
            console.error('❌ Agent: Cannot reach LMStudio server');
            console.error(`   Error: ${error.message}`);
            console.error(`   URL: ${this.lmstudioUrl}`);
        }
    }

    // Define available MCP tools
    getTools() {
        return [
            {
                type: 'function',
                function: {
                    name: 'search_knowledge',
                    description: 'Search the BambiSleep knowledge base for information about files, videos, community content, and scripts',
                    parameters: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'Search query for knowledge base'
                            },
                            category: {
                                type: 'string',
                                enum: ['official', 'community', 'scripts'],
                                description: 'Optional: Filter by category'
                            },
                            limit: {
                                type: 'number',
                                description: 'Maximum number of results (default: 10)'
                            }
                        },
                        required: ['query']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'get_knowledge_stats',
                    description: 'Get comprehensive statistics about the BambiSleep knowledge base including categories, platforms, and relevance scores',
                    parameters: {
                        type: 'object',
                        properties: {}
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'fetch_webpage',
                    description: 'Fetch and extract clean text content from any webpage. Perfect for gathering information from external sources.',
                    parameters: {
                        type: 'object',
                        properties: {
                            url: {
                                type: 'string',
                                description: 'The URL of the webpage to fetch (must start with http:// or https://)'
                            },
                            selector: {
                                type: 'string',
                                description: 'Optional: CSS selector to extract specific content (e.g., "article", "#content", ".main")'
                            }
                        },
                        required: ['url']
                    }
                }
            }
        ];
    }

    // Execute MCP tool
    async executeTool(toolName, args) {
        console.log(`🔧 Executing tool: ${toolName}`, args);

        try {
            switch (toolName) {
                case 'search_knowledge':
                    return await this.searchKnowledge(args);

                case 'get_knowledge_stats':
                    return await this.getKnowledgeStats();

                case 'fetch_webpage':
                    return await this.fetchWebpage(args);

                default:
                    return { error: `Unknown tool: ${toolName}` };
            }
        } catch (error) {
            console.error(`❌ Tool execution error:`, error.message);
            return { error: error.message };
        }
    }

    // Tool: Search Knowledge Base
    async searchKnowledge({ query, category, limit = 10 }) {
        const searchQuery = query.toLowerCase();

        let results = this.knowledgeData.filter(item => {
            const matchesQuery =
                item.title?.toLowerCase().includes(searchQuery) ||
                item.description?.toLowerCase().includes(searchQuery) ||
                item.url?.toLowerCase().includes(searchQuery);

            const matchesCategory = !category || item.category === category;

            return matchesQuery && matchesCategory;
        });

        results = results.slice(0, limit);

        return {
            query,
            resultsFound: results.length,
            results: results.map(r => ({
                title: r.title,
                description: r.description,
                url: r.url,
                category: r.category,
                platform: r.platform,
                relevance: r.relevance
            }))
        };
    }

    // Tool: Get Knowledge Stats
    async getKnowledgeStats() {
        const stats = {
            totalEntries: this.knowledgeData.length,
            categories: {},
            platforms: {},
            avgRelevance: 0
        };

        this.knowledgeData.forEach(item => {
            stats.categories[item.category] = (stats.categories[item.category] || 0) + 1;
            stats.platforms[item.platform] = (stats.platforms[item.platform] || 0) + 1;
            stats.avgRelevance += item.relevance || 0;
        });

        stats.avgRelevance = (stats.avgRelevance / this.knowledgeData.length).toFixed(2);

        return stats;
    }

    // Tool: Fetch Webpage
    async fetchWebpage({ url, selector }) {
        if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
            throw new Error('Invalid URL. Must start with http:// or https://');
        }

        try {
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'BambiSleep-Church-Agent/1.0'
                },
                maxRedirects: 5
            });

            const $ = cheerio.load(response.data);
            $('script, style, nav, footer, header, aside, .advertisement, .ad').remove();

            let textContent;
            if (selector) {
                textContent = $(selector).text();
                if (!textContent) {
                    throw new Error(`No content found with selector: ${selector}`);
                }
            } else {
                const contentSelectors = ['main', 'article', '#content', '#main', '.content', '.main', 'body'];
                for (const sel of contentSelectors) {
                    const content = $(sel).text();
                    if (content && content.length > 100) {
                        textContent = content;
                        break;
                    }
                }
                if (!textContent) {
                    textContent = $('body').text();
                }
            }

            textContent = textContent.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
            const title = $('title').text().trim();

            const maxLength = 10000;
            if (textContent.length > maxLength) {
                textContent = textContent.substring(0, maxLength) + '\n\n... (content truncated)';
            }

            return {
                url,
                title,
                contentLength: textContent.length,
                content: textContent,
                status: 'success'
            };

        } catch (error) {
            return {
                url,
                status: 'error',
                error: error.message,
                errorType: error.code || 'UNKNOWN'
            };
        }
    }

    // Call LMStudio API
    async callLMStudio(messages, tools = null) {
        try {
            const payload = {
                model: this.model,
                messages: messages,
                temperature: this.temperature,
                max_tokens: 2000,
                stream: false
            };

            if (tools && tools.length > 0) {
                payload.tools = tools;
                payload.tool_choice = 'auto';
            }

            const response = await axios.post(this.lmstudioUrl, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 60000
            });

            return response.data.choices[0].message;

        } catch (error) {
            console.error('❌ LMStudio API error:', error.message);
            
            // Better error messages
            if (error.response?.data?.error) {
                const lmsError = error.response.data.error;
                if (lmsError.code === 'model_not_found') {
                    throw new Error('No model loaded in LMStudio. Please load a model and try again.');
                }
                throw new Error(`LMStudio error: ${lmsError.message}`);
            }
            
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Cannot connect to LMStudio server. Is it running?');
            }
            
            throw new Error(`LMStudio call failed: ${error.message}`);
        }
    }

    // Main agentic workflow loop
    async chat(userMessage) {
        console.log(`\n💬 User: ${userMessage}`);

        // Add user message to history
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        let iteration = 0;
        let finalResponse = null;

        while (iteration < this.maxIterations) {
            iteration++;
            console.log(`\n🔄 Iteration ${iteration}/${this.maxIterations}`);

            // Call LMStudio with tools
            const assistantMessage = await this.callLMStudio(
                this.conversationHistory,
                this.getTools()
            );

            // Check if assistant wants to call a tool
            if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                // Add assistant's tool call to history
                this.conversationHistory.push({
                    role: 'assistant',
                    content: assistantMessage.content || null,
                    tool_calls: assistantMessage.tool_calls
                });

                // Execute each tool call
                for (const toolCall of assistantMessage.tool_calls) {
                    const toolName = toolCall.function.name;
                    const toolArgs = JSON.parse(toolCall.function.arguments);

                    console.log(`🔧 Tool Call: ${toolName}`);

                    const toolResult = await this.executeTool(toolName, toolArgs);

                    // Add tool result to history
                    this.conversationHistory.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: toolName,
                        content: JSON.stringify(toolResult, null, 2)
                    });

                    console.log(`✅ Tool Result: ${JSON.stringify(toolResult).substring(0, 200)}...`);
                }

                // Continue loop to get assistant's response with tool results
                continue;

            } else {
                // No more tool calls - this is the final response
                this.conversationHistory.push({
                    role: 'assistant',
                    content: assistantMessage.content
                });

                finalResponse = assistantMessage.content;
                console.log(`\n🤖 Assistant: ${finalResponse}`);
                break;
            }
        }

        if (iteration >= this.maxIterations) {
            finalResponse = "I've reached my maximum iteration limit. Let me know if you need me to continue.";
        }

        return {
            response: finalResponse,
            iterations: iteration,
            toolsUsed: this.conversationHistory.filter(m => m.role === 'tool').length,
            conversationHistory: this.conversationHistory
        };
    }

    // Reset conversation
    reset() {
        this.conversationHistory = [];
        console.log('🔄 Conversation reset');
    }

    // Get conversation summary
    getSummary() {
        return {
            totalMessages: this.conversationHistory.length,
            userMessages: this.conversationHistory.filter(m => m.role === 'user').length,
            assistantMessages: this.conversationHistory.filter(m => m.role === 'assistant').length,
            toolCalls: this.conversationHistory.filter(m => m.role === 'tool').length,
            history: this.conversationHistory
        };
    }
}

export { McpAgent };
