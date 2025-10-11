// LMStudio MCP Tools for BambiSleep Church
import { lmStudioService } from '../../../services/LMStudioService.js';
import { log } from '../../../utils/logger.js';

// Tool: LMStudio Health Check
export const lmstudioHealthCheck = {
    name: 'lmstudio-health-check',
    description: 'Check LMStudio server health and availability',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    },
    async handler() {
        try {
            const isHealthy = await lmStudioService.isHealthy();
            const config = lmStudioService.getConfig();

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        isHealthy: isHealthy,
                        status: isHealthy ? 'healthy' : 'unhealthy',
                        serverUrl: config.baseUrl,
                        model: config.model,
                        timestamp: new Date().toISOString()
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`LMStudio health check error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        isHealthy: false,
                        status: 'error'
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: List Available Models
export const lmstudioListModels = {
    name: 'lmstudio-list-models',
    description: 'List all available models in LMStudio',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    },
    async handler() {
        try {
            const result = await lmStudioService.getModels();
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        models: result.models,
                        count: result.models.length
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`LMStudio list models error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Chat Completion
export const lmstudioChatCompletion = {
    name: 'lmstudio-chat-completion',
    description: 'Generate a chat completion using LMStudio',
    inputSchema: {
        type: 'object',
        properties: {
            messages: {
                type: 'array',
                description: 'Array of message objects with role and content',
                items: {
                    type: 'object',
                    properties: {
                        role: {
                            type: 'string',
                            enum: ['system', 'user', 'assistant']
                        },
                        content: {
                            type: 'string'
                        }
                    },
                    required: ['role', 'content']
                }
            },
            model: {
                type: 'string',
                description: 'Model to use (optional, uses default if not specified)'
            },
            temperature: {
                type: 'number',
                description: 'Temperature for randomness (0.0 to 2.0)',
                minimum: 0.0,
                maximum: 2.0
            },
            max_tokens: {
                type: 'number',
                description: 'Maximum tokens to generate',
                minimum: 1,
                maximum: 32768
            },
            top_p: {
                type: 'number',
                description: 'Top-p sampling (0.0 to 1.0)',
                minimum: 0.0,
                maximum: 1.0
            },
            top_k: {
                type: 'number',
                description: 'Top-k sampling',
                minimum: 1
            },
            frequency_penalty: {
                type: 'number',
                description: 'Frequency penalty (-2.0 to 2.0)',
                minimum: -2.0,
                maximum: 2.0
            },
            presence_penalty: {
                type: 'number',
                description: 'Presence penalty (-2.0 to 2.0)',
                minimum: -2.0,
                maximum: 2.0
            },
            repeat_penalty: {
                type: 'number',
                description: 'Repeat penalty (0.0 to 2.0)',
                minimum: 0.0,
                maximum: 2.0
            },
            seed: {
                type: 'number',
                description: 'Random seed for reproducible outputs'
            },
            stop: {
                type: 'array',
                description: 'Stop sequences',
                items: {
                    type: 'string'
                }
            }
        },
        required: ['messages']
    },
    async handler(args) {
        try {
            const result = await lmStudioService.chatCompletion(args.messages, {
                model: args.model,
                temperature: args.temperature,
                max_tokens: args.max_tokens,
                top_p: args.top_p,
                top_k: args.top_k,
                frequency_penalty: args.frequency_penalty,
                presence_penalty: args.presence_penalty,
                repeat_penalty: args.repeat_penalty,
                seed: args.seed,
                stop: args.stop
            });

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        response: result.response.choices[0].message.content,
                        fullResponse: result.response,
                        usage: result.usage,
                        model: result.model
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`LMStudio chat completion error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Chat with Tools
export const lmstudioChatWithTools = {
    name: 'lmstudio-chat-with-tools',
    description: 'Generate a chat completion with tool calling capabilities',
    inputSchema: {
        type: 'object',
        properties: {
            messages: {
                type: 'array',
                description: 'Array of message objects',
                items: {
                    type: 'object',
                    properties: {
                        role: {
                            type: 'string',
                            enum: ['system', 'user', 'assistant', 'tool']
                        },
                        content: {
                            type: 'string'
                        },
                        tool_calls: {
                            type: 'array'
                        },
                        tool_call_id: {
                            type: 'string'
                        }
                    },
                    required: ['role']
                }
            },
            tools: {
                type: 'array',
                description: 'Array of tool definitions',
                items: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['function']
                        },
                        function: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                description: { type: 'string' },
                                parameters: { type: 'object' }
                            },
                            required: ['name', 'description', 'parameters']
                        }
                    },
                    required: ['type', 'function']
                }
            },
            model: {
                type: 'string',
                description: 'Model to use'
            },
            temperature: {
                type: 'number',
                minimum: 0.0,
                maximum: 2.0
            },
            max_tokens: {
                type: 'number',
                minimum: 1
            }
        },
        required: ['messages', 'tools']
    },
    async handler(args) {
        try {
            const result = await lmStudioService.chatWithTools(args.messages, args.tools, {
                model: args.model,
                temperature: args.temperature,
                max_tokens: args.max_tokens
            });

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        response: result.response,
                        hasToolCalls: !!result.response.choices[0].message.tool_calls,
                        toolCalls: result.response.choices[0].message.tool_calls || [],
                        usage: result.usage,
                        model: result.model
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`LMStudio chat with tools error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Structured Output
export const lmstudioStructuredOutput = {
    name: 'lmstudio-structured-output',
    description: 'Generate structured JSON output using a provided schema',
    inputSchema: {
        type: 'object',
        properties: {
            messages: {
                type: 'array',
                description: 'Array of message objects',
                items: {
                    type: 'object',
                    properties: {
                        role: {
                            type: 'string',
                            enum: ['system', 'user', 'assistant']
                        },
                        content: {
                            type: 'string'
                        }
                    },
                    required: ['role', 'content']
                }
            },
            schema: {
                type: 'object',
                description: 'JSON schema for the response format',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Schema name'
                    },
                    strict: {
                        type: 'boolean',
                        description: 'Whether to enforce strict schema compliance'
                    },
                    schema: {
                        type: 'object',
                        description: 'The actual JSON schema definition'
                    }
                },
                required: ['schema']
            },
            model: {
                type: 'string',
                description: 'Model to use'
            },
            temperature: {
                type: 'number',
                minimum: 0.0,
                maximum: 2.0
            },
            max_tokens: {
                type: 'number',
                minimum: 1
            }
        },
        required: ['messages', 'schema']
    },
    async handler(args) {
        try {
            const result = await lmStudioService.structuredCompletion(args.messages, args.schema, {
                model: args.model,
                temperature: args.temperature,
                max_tokens: args.max_tokens
            });

            let parsedContent;
            try {
                parsedContent = JSON.parse(result.response.choices[0].message.content);
            } catch (e) {
                parsedContent = result.response.choices[0].message.content;
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        structuredOutput: parsedContent,
                        rawResponse: result.response.choices[0].message.content,
                        usage: result.usage,
                        model: result.model
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`LMStudio structured output error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Text Completion (Legacy)
export const lmstudioCompletion = {
    name: 'lmstudio-completion',
    description: 'Generate text completion using the legacy completions endpoint',
    inputSchema: {
        type: 'object',
        properties: {
            prompt: {
                type: 'string',
                description: 'The prompt to complete'
            },
            model: {
                type: 'string',
                description: 'Model to use'
            },
            temperature: {
                type: 'number',
                minimum: 0.0,
                maximum: 2.0
            },
            max_tokens: {
                type: 'number',
                minimum: 1
            },
            top_p: {
                type: 'number',
                minimum: 0.0,
                maximum: 1.0
            },
            top_k: {
                type: 'number',
                minimum: 1
            },
            frequency_penalty: {
                type: 'number',
                minimum: -2.0,
                maximum: 2.0
            },
            presence_penalty: {
                type: 'number',
                minimum: -2.0,
                maximum: 2.0
            },
            stop: {
                type: 'array',
                items: {
                    type: 'string'
                }
            }
        },
        required: ['prompt']
    },
    async handler(args) {
        try {
            const result = await lmStudioService.completion(args.prompt, {
                model: args.model,
                temperature: args.temperature,
                max_tokens: args.max_tokens,
                top_p: args.top_p,
                top_k: args.top_k,
                frequency_penalty: args.frequency_penalty,
                presence_penalty: args.presence_penalty,
                stop: args.stop
            });

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        completion: result.response.choices[0].text,
                        fullResponse: result.response,
                        usage: result.usage,
                        model: result.model
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`LMStudio completion error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Get Embeddings
export const lmstudioEmbeddings = {
    name: 'lmstudio-embeddings',
    description: 'Generate text embeddings using LMStudio',
    inputSchema: {
        type: 'object',
        properties: {
            input: {
                oneOf: [
                    {
                        type: 'string',
                        description: 'Text to embed'
                    },
                    {
                        type: 'array',
                        description: 'Array of texts to embed',
                        items: {
                            type: 'string'
                        }
                    }
                ]
            },
            model: {
                type: 'string',
                description: 'Model to use for embeddings'
            }
        },
        required: ['input']
    },
    async handler(args) {
        try {
            const result = await lmStudioService.getEmbeddings(args.input, {
                model: args.model
            });

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        embeddings: result.embeddings,
                        count: result.embeddings.length,
                        dimensions: result.embeddings[0]?.embedding?.length || 0,
                        usage: result.usage,
                        model: result.model
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`LMStudio embeddings error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Get Configuration
export const lmstudioGetConfig = {
    name: 'lmstudio-get-config',
    description: 'Get current LMStudio service configuration',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    },
    async handler() {
        try {
            const config = lmStudioService.getConfig();
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        config: config
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`LMStudio get config error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Update Configuration
export const lmstudioUpdateConfig = {
    name: 'lmstudio-update-config',
    description: 'Update LMStudio service configuration parameters',
    inputSchema: {
        type: 'object',
        properties: {
            baseUrl: {
                type: 'string',
                description: 'LMStudio server base URL'
            },
            model: {
                type: 'string',
                description: 'Default model identifier'
            },
            temperature: {
                type: 'number',
                minimum: 0.0,
                maximum: 2.0
            },
            maxTokens: {
                type: 'number',
                minimum: 1
            },
            topP: {
                type: 'number',
                minimum: 0.0,
                maximum: 1.0
            },
            topK: {
                type: 'number',
                minimum: 1
            },
            frequencyPenalty: {
                type: 'number',
                minimum: -2.0,
                maximum: 2.0
            },
            presencePenalty: {
                type: 'number',
                minimum: -2.0,
                maximum: 2.0
            },
            repeatPenalty: {
                type: 'number',
                minimum: 0.0,
                maximum: 2.0
            },
            timeout: {
                type: 'number',
                minimum: 1000
            },
            retries: {
                type: 'number',
                minimum: 1,
                maximum: 10
            }
        }
    },
    async handler(args) {
        try {
            const oldConfig = lmStudioService.getConfig();
            lmStudioService.updateConfig(args);
            const newConfig = lmStudioService.getConfig();

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        message: 'Configuration updated successfully',
                        oldConfig: oldConfig,
                        newConfig: newConfig,
                        changes: Object.keys(args)
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`LMStudio update config error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// BambiSleep Agent Helper Class
class BambiSleepAgentHelper {
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
     * Determine if query should use local handling vs AI
     */
    shouldUseLocalHandling(query) {
        const localKeywords = [
            'safety', 'safe', 'safety tips', 'guidelines',
            'church', 'status', 'progress', 'community',
            'hello', 'hi', 'hey', 'greetings',
            'help', 'what can you do', 'how can you help'
        ];

        const lowerQuery = query.toLowerCase();
        return localKeywords.some(keyword => lowerQuery.includes(keyword));
    }

    /**
     * Handle local queries without AI
     */
    async handleLocalQuery(query) {
        const lowerQuery = query.toLowerCase();

        // Safety queries
        if (lowerQuery.includes('safety') || lowerQuery.includes('safe') || lowerQuery.includes('guidelines')) {
            return await this.handleSafetyQuery(query);
        }

        // Church status queries
        if (lowerQuery.includes('church') || lowerQuery.includes('status') || lowerQuery.includes('progress')) {
            return await this.handleChurchQuery(query);
        }

        // Greeting queries
        if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey') || lowerQuery.includes('greetings')) {
            return this.getGreetingResponse();
        }

        // Help queries
        if (lowerQuery.includes('help') || lowerQuery.includes('what can you do') || lowerQuery.includes('how can you help')) {
            return this.getHelpResponse();
        }

        // Default fallback
        return await this.getDefaultResponse(query);
    }
}

// Create instance of helper
const bambiAgentHelper = new BambiSleepAgentHelper();

// Tool: BambiSleep-specific AI Agent
export const lmstudioBambiAgent = {
    name: 'lmstudio-bambi-agent',
    description: 'Specialized BambiSleep community AI agent with context and safety awareness',
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'User query or question for the BambiSleep agent'
            },
            context: {
                type: 'string',
                description: 'Additional context (optional)',
                enum: ['beginner', 'intermediate', 'advanced', 'safety', 'resources', 'community']
            },
            temperature: {
                type: 'number',
                minimum: 0.0,
                maximum: 1.0,
                description: 'Response creativity (0.0-1.0, default: 0.7)'
            },
            max_tokens: {
                type: 'number',
                minimum: 100,
                maximum: 2048
            },
            useLocalHandling: {
                type: 'boolean',
                description: 'Use local handling for common queries instead of AI (default: true)'
            }
        },
        required: ['query']
    },
    async handler(args) {
        try {
            // Check if we should use local handling
            const useLocal = args.useLocalHandling !== false && bambiAgentHelper.shouldUseLocalHandling(args.query);

            if (useLocal) {
                // Handle locally without AI
                const response = await bambiAgentHelper.handleLocalQuery(args.query);
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            response: response,
                            context: args.context || 'general',
                            handledLocally: true,
                            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
                        }, null, 2)
                    }]
                };
            }

            // Use AI for complex queries
            const systemPrompt = {
                role: 'system',
                content: `You are a specialized AI assistant for the BambiSleep community. You have deep knowledge about:

1. BambiSleep hypnosis content and practices
2. Safety guidelines and responsible use
3. Community resources and support
4. Different experience levels (beginner to advanced)
5. Austrian religious community context

Key principles:
- Always prioritize safety and consent
- Provide accurate, helpful information
- Be supportive and non-judgmental
- Redirect harmful requests to safety resources
- Respect individual boundaries and experiences
- Maintain appropriate content boundaries

Context level: ${args.context || 'general'}

Respond helpfully while maintaining safety and community standards.`
            };

            const userMessage = {
                role: 'user',
                content: args.query
            };

            const result = await lmStudioService.chatCompletion([systemPrompt, userMessage], {
                temperature: args.temperature || 0.7,
                max_tokens: args.max_tokens || 1024
            });

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        response: result.response.choices[0].message.content,
                        context: args.context || 'general',
                        handledLocally: false,
                        usage: result.usage,
                        model: result.model
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`LMStudio Bambi agent error: ${error.message}`);

            // Fallback to local handling if AI fails
            try {
                const fallbackResponse = await bambiAgentHelper.getDefaultResponse(args.query);
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            response: fallbackResponse,
                            context: args.context || 'general',
                            handledLocally: true,
                            fallback: true,
                            error: error.message
                        }, null, 2)
                    }]
                };
            } catch (fallbackError) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message,
                            fallbackError: fallbackError.message
                        }, null, 2)
                    }]
                };
            }
        }
    }
};

// Export all tools
export const lmstudioTools = [
    lmstudioHealthCheck,
    lmstudioListModels,
    lmstudioChatCompletion,
    lmstudioChatWithTools,
    lmstudioStructuredOutput,
    lmstudioCompletion,
    lmstudioEmbeddings,
    lmstudioGetConfig,
    lmstudioUpdateConfig,
    lmstudioBambiAgent
];

export default lmstudioTools;
