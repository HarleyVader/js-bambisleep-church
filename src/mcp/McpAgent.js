// Agentic Workflow for MCP Tools using LMStudio
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { log } from '../utils/logger.js';
import { LMStudioManager } from '../utils/lmstudio-manager.js';
import { config } from '../utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class McpAgent {
    constructor(userConfig = {}) {
        this.lmstudioUrl = userConfig.lmstudioUrl || config.lmstudio.url;
        this.model = userConfig.model || config.lmstudio.model;
        this.maxIterations = userConfig.maxIterations || config.agent.maxIterations;
        this.temperature = userConfig.temperature || config.lmstudio.temperature;
        this.conversationHistory = [];
        this.knowledgeData = [];
        this.lmstudioManager = new LMStudioManager();

        // Load knowledge base
        this.loadKnowledge();

        // Initialize worker system
        this.initializeWorker();
    }

    async initializeWorker() {
        await this.lmstudioManager.initialize();
    }

    loadKnowledge() {
        try {
            this.knowledgeData = JSON.parse(fs.readFileSync(config.paths.knowledge, 'utf-8'));
        } catch (error) {
            log.error(`Knowledge loading failed: ${error.message}`);
        }
    }

    // Check if LMStudio has a model loaded
    async checkModel() {
        return await this.lmstudioManager.checkModel();
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

    // Call LMStudio via worker (simplified - no tools support for now)
    async callLMStudio(messages, tools = null) {
        try {
            // For tool-enabled conversations, we'll use a simple approach
            // Convert messages to a single prompt for the worker
            const prompt = this.messagesToPrompt(messages, tools);

            // Use worker to get response
            const response = await this.lmstudioManager.sendChat(prompt, 'agent', 'system');

            // Convert back to OpenAI format
            return {
                role: 'assistant',
                content: response.response,
                // For now, no tool calls in simplified mode
                tool_calls: null
            };

        } catch (error) {
            if (error.message.includes('timeout')) {
                throw new Error('LMStudio request timeout. Please try again.');
            }
            throw new Error(`LMStudio call failed: ${error.message}`);
        }
    }

    // Convert OpenAI messages format to simple prompt for worker
    messagesToPrompt(messages, tools = null) {
        let prompt = '';

        for (const message of messages) {
            switch (message.role) {
                case 'system':
                    prompt += `System: ${message.content}\n\n`;
                    break;
                case 'user':
                    prompt += `User: ${message.content}\n\n`;
                    break;
                case 'assistant':
                    prompt += `Assistant: ${message.content}\n\n`;
                    break;
                case 'tool':
                    prompt += `Tool Result (${message.name}): ${message.content}\n\n`;
                    break;
            }
        }

        // Add tool information if available
        if (tools && tools.length > 0) {
            prompt += 'Available Tools:\n';
            tools.forEach(tool => {
                prompt += `- ${tool.function.name}: ${tool.function.description}\n`;
            });
            prompt += '\nPlease respond conversationally. Tool calling is not supported in this mode.\n\n';
        }

        return prompt.trim();
    }

    // Main agentic workflow loop
    async chat(userMessage) {
        // Validate LMStudio connection and auto-load model if needed
        const modelLoaded = await this.lmstudioManager.checkModel();
        if (!modelLoaded) {
            throw new Error('No model loaded in LMStudio. Please load a model and try again.');
        }

        // Add user message to history
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        let iteration = 0;
        let finalResponse = null;

        while (iteration < this.maxIterations) {
            iteration++;


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



                    const toolResult = await this.executeTool(toolName, toolArgs);

                    // Add tool result to history
                    this.conversationHistory.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: toolName,
                        content: JSON.stringify(toolResult, null, 2)
                    });


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
