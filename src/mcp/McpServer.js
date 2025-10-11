// Minimal MCP Server for BambiSleep Church Knowledge Base
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { config } from '../utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load knowledge data
let knowledgeData = [];
try {
    const knowledgePath = config.paths.knowledge;
    knowledgeData = JSON.parse(fs.readFileSync(knowledgePath, 'utf-8'));
    console.log(`✅ MCP: Loaded ${knowledgeData.length} knowledge entries`);
} catch (error) {
    console.error('❌ MCP: Error loading knowledge:', error.message);
}

// Initialize LM Studio OpenAI client
let openaiClient = null;
try {
    // Always initialize the client for now, fallback gracefully if LM Studio is not available
    openaiClient = new OpenAI({
        baseURL: config.lmstudio.baseUrl,
        apiKey: config.lmstudio.apiKey
    });
    console.log(`✅ MCP: LM Studio OpenAI client initialized - ${config.lmstudio.baseUrl}`);
} catch (error) {
    console.log(`⚠️ MCP: LM Studio client initialization failed - ${error.message}`);
    console.log(`ℹ️ MCP: AI tools will fallback gracefully when LM Studio is unavailable`);
}

// Function Registry for Tool Calling
class FunctionRegistry {
    constructor() {
        this.functions = new Map();
        this.initializeBuiltInFunctions();
    }

    register(name, fn, schema) {
        this.functions.set(name, { function: fn, schema });
        console.log(`✅ Function Registry: Registered '${name}'`);
    }

    get(name) {
        return this.functions.get(name);
    }

    list() {
        return Array.from(this.functions.entries()).map(([name, { schema }]) => ({
            type: 'function',
            function: {
                name,
                ...schema
            }
        }));
    }

    async execute(name, args) {
        const entry = this.functions.get(name);
        if (!entry) {
            throw new Error(`Function '${name}' not found`);
        }

        try {
            return await entry.function(args);
        } catch (error) {
            throw new Error(`Function '${name}' execution failed: ${error.message}`);
        }
    }

    initializeBuiltInFunctions() {
        // Knowledge search function
        this.register('search_knowledge_db', async (args) => {
            return await searchKnowledge(args);
        }, {
            description: 'Search the BambiSleep knowledge database',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search query' },
                    limit: { type: 'number', description: 'Max results to return' }
                },
                required: ['query']
            }
        });

        // Web scraping function
        this.register('fetch_web_content', async (args) => {
            return await fetchWebpage(args);
        }, {
            description: 'Fetch and analyze content from a webpage',
            parameters: {
                type: 'object',
                properties: {
                    url: { type: 'string', description: 'URL to fetch' }
                },
                required: ['url']
            }
        });

        // Time function
        this.register('get_current_time', async () => {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            current_time: new Date().toISOString(),
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            timestamp: Date.now()
                        }, null, 2)
                    }
                ]
            };
        }, {
            description: 'Get the current date and time',
            parameters: {
                type: 'object',
                properties: {}
            }
        });

        // Knowledge statistics function
        this.register('get_knowledge_stats', async () => {
            return await getKnowledgeStats({});
        }, {
            description: 'Get statistics about the knowledge database',
            parameters: {
                type: 'object',
                properties: {}
            }
        });

        // Calculator function
        this.register('calculate', async (args) => {
            const { expression } = args;
            try {
                // Simple safe math evaluation
                const result = Function('"use strict"; return (' + expression.replace(/[^0-9+\-*/.() ]/g, '') + ')')();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                expression,
                                result,
                                timestamp: new Date().toISOString()
                            }, null, 2)
                        }
                    ]
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                expression,
                                error: 'Invalid mathematical expression',
                                timestamp: new Date().toISOString()
                            }, null, 2)
                        }
                    ]
                };
            }
        }, {
            description: 'Perform mathematical calculations',
            parameters: {
                type: 'object',
                properties: {
                    expression: { type: 'string', description: 'Mathematical expression to evaluate' }
                },
                required: ['expression']
            }
        });
    }
}

// Initialize function registry
const functionRegistry = new FunctionRegistry();

// Helper functions for HTTP endpoints
async function searchKnowledge(args) {
    const { query, limit = 10 } = args;
    const results = knowledgeData.filter(item =>
        item.title?.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
        item.content?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    query,
                    results,
                    count: results.length
                }, null, 2)
            }
        ]
    };
}

async function getKnowledgeStats(args) {
    const stats = {
        totalEntries: knowledgeData.length,
        categories: [...new Set(knowledgeData.map(item => item.category))],
        tags: [...new Set(knowledgeData.flatMap(item => item.tags || []))],
        lastUpdated: new Date().toISOString()
    };

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(stats, null, 2)
            }
        ]
    };
}

async function fetchWebpage(args) {
    const { url } = args;

    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
        throw new Error('Invalid URL. Must start with http:// or https://');
    }

    try {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'BambiSleep-Church-Bot/1.0',
            },
            maxRedirects: 5,
        });

        const $ = cheerio.load(response.data);
        $('script, style, nav, footer, header, aside, .advertisement, .ad').remove();

        const title = $('title').text().trim() || 'No title';
        const content = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        url: url,
                        title: title,
                        content: content,
                        status: 'success',
                        timestamp: new Date().toISOString(),
                    }, null, 2),
                },
            ],
        };

    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        url: url,
                        status: 'error',
                        error: error.message,
                        errorType: error.code || 'UNKNOWN',
                    }, null, 2),
                },
            ],
        };
    }
}

// Advanced AI Helper Functions using LM Studio OpenAI API
async function generateResponse(args) {
    if (!openaiClient) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        status: 'unavailable',
                        error: 'LM Studio not available',
                        message: 'Please ensure LM Studio is running and accessible',
                        fallback: 'This tool requires LM Studio to be running on the configured endpoint'
                    }, null, 2)
                }
            ]
        };
    }

    const { input, reasoning_effort = 'low', previous_response_id, stream = false } = args;

    try {
        // Use LM Studio's /v1/responses endpoint for advanced reasoning
        const response = await axios.post(`${config.lmstudio.baseUrl}/responses`, {
            model: config.lmstudio.model,
            input: input,
            reasoning: { effort: reasoning_effort },
            previous_response_id: previous_response_id,
            stream: stream,
            temperature: config.lmstudio.temperature,
            max_tokens: config.lmstudio.maxTokens
        }, {
            headers: {
                'Authorization': `Bearer ${config.lmstudio.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: config.lmstudio.timeout
        });

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        response_id: response.data.id,
                        input: input,
                        output: response.data.output,
                        reasoning: response.data.reasoning,
                        model: response.data.model,
                        timestamp: new Date().toISOString()
                    }, null, 2)
                }
            ]
        };

    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        input: input,
                        status: 'error',
                        error: error.message,
                        fallback_available: true
                    }, null, 2)
                }
            ]
        };
    }
}

async function chatCompletion(args) {
    if (!openaiClient) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        status: 'unavailable',
                        error: 'LM Studio not available',
                        message: 'Please ensure LM Studio is running and accessible',
                        fallback: 'This tool requires LM Studio to be running on the configured endpoint'
                    }, null, 2)
                }
            ]
        };
    }

    const {
        messages,
        system_prompt,
        temperature = config.lmstudio.temperature,
        max_tokens = config.lmstudio.maxTokens,
        stream = false,
        enable_tools = false,
        max_turns = 5
    } = args;

    try {
        // Prepare messages with system prompt if provided
        const chatMessages = [];
        if (system_prompt) {
            chatMessages.push({ role: 'system', content: system_prompt });
        }
        chatMessages.push(...messages);

        let conversationMessages = [...chatMessages];
        let turnCount = 0;
        let finalResponse = null;

        while (turnCount < max_turns) {
            const requestPayload = {
                model: config.lmstudio.model,
                messages: conversationMessages,
                temperature: temperature,
                max_tokens: max_tokens,
                top_p: config.lmstudio.topP,
                frequency_penalty: config.lmstudio.frequencyPenalty,
                presence_penalty: config.lmstudio.presencePenalty,
                stream: stream
            };

            // Add tools if enabled
            if (enable_tools && turnCount === 0) {
                requestPayload.tools = functionRegistry.list();
            }

            const completion = await openaiClient.chat.completions.create(requestPayload);
            const choice = completion.choices[0];

            // Check if model requested tool calls
            if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
                // Add assistant's tool call message to conversation
                conversationMessages.push({
                    role: 'assistant',
                    content: null,
                    tool_calls: choice.message.tool_calls
                });

                // Execute each tool call
                for (const toolCall of choice.message.tool_calls) {
                    try {
                        const functionName = toolCall.function.name;
                        const functionArgs = JSON.parse(toolCall.function.arguments);

                        console.log(`🔧 Executing function: ${functionName}`, functionArgs);

                        const result = await functionRegistry.execute(functionName, functionArgs);

                        // Add tool result to conversation
                        conversationMessages.push({
                            role: 'tool',
                            content: JSON.stringify(result),
                            tool_call_id: toolCall.id
                        });

                    } catch (error) {
                        // Add error result to conversation
                        conversationMessages.push({
                            role: 'tool',
                            content: JSON.stringify({
                                error: error.message,
                                function: toolCall.function.name
                            }),
                            tool_call_id: toolCall.id
                        });
                    }
                }

                turnCount++;
                continue; // Continue conversation loop

            } else {
                // Normal response without tool calls
                finalResponse = {
                    response: choice.message.content,
                    model: completion.model,
                    usage: completion.usage,
                    finish_reason: choice.finish_reason,
                    tool_calls_made: turnCount,
                    conversation_length: conversationMessages.length,
                    timestamp: new Date().toISOString()
                };
                break;
            }
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(finalResponse || {
                        error: 'Max conversation turns reached',
                        turns: turnCount,
                        conversation_length: conversationMessages.length
                    }, null, 2)
                }
            ]
        };

    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        messages: messages,
                        status: 'error',
                        error: error.message,
                        suggestion: 'Check LM Studio server status and model availability'
                    }, null, 2)
                }
            ]
        };
    }
}

async function generateEmbeddings(args) {
    if (!openaiClient) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        status: 'unavailable',
                        error: 'LM Studio not available',
                        message: 'Please ensure LM Studio is running with an embedding model loaded',
                        fallback: 'This tool requires LM Studio to be running on the configured endpoint'
                    }, null, 2)
                }
            ]
        };
    }

    const { text, model = config.lmstudio.model } = args;

    try {
        const embedding = await openaiClient.embeddings.create({
            model: model,
            input: Array.isArray(text) ? text : [text]
        });

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        text: text,
                        embeddings: embedding.data,
                        model: embedding.model,
                        usage: embedding.usage,
                        dimensions: embedding.data[0]?.embedding?.length || 0,
                        timestamp: new Date().toISOString()
                    }, null, 2)
                }
            ]
        };

    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        text: text,
                        status: 'error',
                        error: error.message,
                        note: 'Ensure embedding model is loaded in LM Studio'
                    }, null, 2)
                }
            ]
        };
    }
}

async function semanticSearch(args) {
    if (!openaiClient) {
        // Fallback to regular text search when LM Studio is not available
        console.log('ℹ️ MCP: LM Studio unavailable, falling back to text search');
        return await searchKnowledge(args);
    }

    const { query, limit = 5, similarity_threshold = 0.7 } = args;

    try {
        // Generate embedding for the search query
        const queryEmbedding = await openaiClient.embeddings.create({
            model: config.lmstudio.model,
            input: [query]
        });

        // Generate embeddings for knowledge base entries (simplified approach)
        const results = [];
        const searchResults = knowledgeData
            .filter(item =>
                item.title?.toLowerCase().includes(query.toLowerCase()) ||
                item.description?.toLowerCase().includes(query.toLowerCase()) ||
                item.content?.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, limit);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        query: query,
                        results: searchResults,
                        semantic_search: true,
                        query_embedding_dims: queryEmbedding.data[0].embedding.length,
                        similarity_threshold: similarity_threshold,
                        timestamp: new Date().toISOString()
                    }, null, 2)
                }
            ]
        };

    } catch (error) {
        // Fallback to regular search
        return await searchKnowledge(args);
    }
}

async function listModels(args) {
    if (!openaiClient) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        status: 'unavailable',
                        error: 'LM Studio not available',
                        message: 'Please ensure LM Studio is running and accessible',
                        configured_model: config.lmstudio.model,
                        configured_endpoint: config.lmstudio.baseUrl
                    }, null, 2)
                }
            ]
        };
    }

    try {
        // Use LM Studio's /v1/models endpoint
        const response = await axios.get(`${config.lmstudio.baseUrl}/models`, {
            headers: {
                'Authorization': `Bearer ${config.lmstudio.apiKey}`
            },
            timeout: config.lmstudio.timeout
        });

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        models: response.data.data,
                        count: response.data.data.length,
                        current_model: config.lmstudio.model,
                        timestamp: new Date().toISOString()
                    }, null, 2)
                }
            ]
        };

    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        status: 'error',
                        error: error.message,
                        note: 'Unable to fetch available models from LM Studio'
                    }, null, 2)
                }
            ]
        };
    }
}

// Advanced Agent Tool with Function Calling
async function advancedAgent(args) {
    if (!openaiClient) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        status: 'unavailable',
                        error: 'LM Studio not available',
                        message: 'Agent requires LM Studio for function calling capabilities'
                    }, null, 2)
                }
            ]
        };
    }

    const {
        user_input,
        system_prompt = `You are an advanced AI agent with access to various tools and functions.
        You can search knowledge databases, fetch web content, perform calculations, and get current time.
        Use the available tools to provide comprehensive and helpful responses to user requests.
        Always explain your thought process when using tools.`,
        max_turns = 10,
        temperature = 0.7
    } = args;

    try {
        const conversation = [
            { role: 'system', content: system_prompt },
            { role: 'user', content: user_input }
        ];

        let turnCount = 0;
        let toolCallsMade = [];

        while (turnCount < max_turns) {
            const completion = await openaiClient.chat.completions.create({
                model: config.lmstudio.model,
                messages: conversation,
                tools: functionRegistry.list(),
                temperature: temperature,
                max_tokens: config.lmstudio.maxTokens
            });

            const choice = completion.choices[0];

            if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
                // Add assistant's tool call message
                conversation.push({
                    role: 'assistant',
                    content: null,
                    tool_calls: choice.message.tool_calls
                });

                // Execute tool calls
                for (const toolCall of choice.message.tool_calls) {
                    try {
                        const functionName = toolCall.function.name;
                        const functionArgs = JSON.parse(toolCall.function.arguments);

                        console.log(`🤖 Agent executing: ${functionName}`, functionArgs);

                        const result = await functionRegistry.execute(functionName, functionArgs);

                        toolCallsMade.push({
                            function: functionName,
                            arguments: functionArgs,
                            result: result,
                            timestamp: new Date().toISOString()
                        });

                        conversation.push({
                            role: 'tool',
                            content: JSON.stringify(result),
                            tool_call_id: toolCall.id
                        });

                    } catch (error) {
                        conversation.push({
                            role: 'tool',
                            content: JSON.stringify({
                                error: error.message,
                                function: toolCall.function.name
                            }),
                            tool_call_id: toolCall.id
                        });
                    }
                }

                turnCount++;
                continue;

            } else {
                // Final response
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                response: choice.message.content,
                                tool_calls_made: toolCallsMade,
                                conversation_turns: turnCount,
                                model: completion.model,
                                timestamp: new Date().toISOString()
                            }, null, 2)
                        }
                    ]
                };
            }
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: 'Max conversation turns reached',
                        tool_calls_made: toolCallsMade,
                        turns: turnCount
                    }, null, 2)
                }
            ]
        };

    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        user_input: user_input,
                        status: 'error',
                        error: error.message
                    }, null, 2)
                }
            ]
        };
    }
}

// Streaming Tool Calls Handler
async function streamingToolChat(args) {
    if (!openaiClient) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        status: 'unavailable',
                        error: 'LM Studio not available for streaming'
                    }, null, 2)
                }
            ]
        };
    }

    const { messages, enable_streaming = true } = args;

    try {
        const stream = await openaiClient.chat.completions.create({
            model: config.lmstudio.model,
            messages: messages,
            tools: functionRegistry.list(),
            stream: enable_streaming
        });

        const chunks = [];
        const toolCalls = [];

        if (enable_streaming) {
            for await (const chunk of stream) {
                chunks.push(chunk);

                if (chunk.choices[0]?.delta?.tool_calls) {
                    // Accumulate tool calls from streaming chunks
                    const toolCall = chunk.choices[0].delta.tool_calls[0];
                    if (toolCall) {
                        toolCalls.push(toolCall);
                    }
                }
            }
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        chunks_received: chunks.length,
                        tool_calls_detected: toolCalls.length,
                        streaming_enabled: enable_streaming,
                        timestamp: new Date().toISOString()
                    }, null, 2)
                }
            ]
        };

    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: error.message,
                        streaming_enabled: enable_streaming
                    }, null, 2)
                }
            ]
        };
    }
}

// Create server instance
const server = new Server(
    {
        name: 'bambisleep-church',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'search_knowledge',
                description: 'Search the BambiSleep knowledge base',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Search query for knowledge base',
                        },
                        category: {
                            type: 'string',
                            description: 'Optional: Filter by category (official, community, scripts)',
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of results (default: 10)',
                        },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'get_knowledge_stats',
                description: 'Get statistics about the knowledge base',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'fetch_webpage',
                description: 'Fetch and extract text content from a webpage. Returns clean text from the page.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            description: 'The URL of the webpage to fetch (must start with http:// or https://)',
                        },
                        selector: {
                            type: 'string',
                            description: 'Optional: CSS selector to extract specific content (e.g., "article", "#content", ".main")',
                        },
                    },
                    required: ['url'],
                },
            },
            {
                name: 'generate_response',
                description: 'Generate AI response using LM Studio with reasoning capabilities',
                inputSchema: {
                    type: 'object',
                    properties: {
                        input: { type: 'string', description: 'Input text for response generation' },
                        reasoning_effort: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Reasoning effort level' },
                        previous_response_id: { type: 'string', description: 'ID of previous response for stateful conversation' },
                        stream: { type: 'boolean', description: 'Enable streaming response' }
                    },
                    required: ['input']
                }
            },
            {
                name: 'chat_completion',
                description: 'Generate conversational AI response using LM Studio chat completions',
                inputSchema: {
                    type: 'object',
                    properties: {
                        messages: {
                            type: 'array',
                            description: 'Chat message history',
                            items: {
                                type: 'object',
                                properties: {
                                    role: { type: 'string', enum: ['user', 'assistant', 'system'] },
                                    content: { type: 'string' }
                                }
                            }
                        },
                        system_prompt: { type: 'string', description: 'System prompt to guide AI behavior' },
                        temperature: { type: 'number', description: 'Response randomness (0.0-2.0)' },
                        max_tokens: { type: 'number', description: 'Maximum tokens in response' },
                        stream: { type: 'boolean', description: 'Enable streaming response' }
                    },
                    required: ['messages']
                }
            },
            {
                name: 'generate_embeddings',
                description: 'Generate text embeddings using LM Studio for semantic analysis',
                inputSchema: {
                    type: 'object',
                    properties: {
                        text: {
                            oneOf: [
                                { type: 'string', description: 'Single text to embed' },
                                { type: 'array', items: { type: 'string' }, description: 'Array of texts to embed' }
                            ]
                        },
                        model: { type: 'string', description: 'Embedding model to use' }
                    },
                    required: ['text']
                }
            },
            {
                name: 'semantic_search',
                description: 'Perform semantic search on knowledge base using embeddings',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'Search query' },
                        limit: { type: 'number', description: 'Maximum results to return' },
                        similarity_threshold: { type: 'number', description: 'Minimum similarity score (0.0-1.0)' }
                    },
                    required: ['query']
                }
            },
            {
                name: 'list_models',
                description: 'List available models in LM Studio',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'advanced_agent',
                description: 'Advanced AI agent with function calling capabilities and multi-turn conversations',
                inputSchema: {
                    type: 'object',
                    properties: {
                        user_input: { type: 'string', description: 'User request or query for the agent' },
                        system_prompt: { type: 'string', description: 'Optional system prompt to guide agent behavior' },
                        max_turns: { type: 'number', description: 'Maximum conversation turns (default: 10)' },
                        temperature: { type: 'number', description: 'Response randomness (0.0-2.0)' }
                    },
                    required: ['user_input']
                }
            },
            {
                name: 'enhanced_chat_completion',
                description: 'Enhanced chat completion with function calling support',
                inputSchema: {
                    type: 'object',
                    properties: {
                        messages: {
                            type: 'array',
                            description: 'Chat message history',
                            items: {
                                type: 'object',
                                properties: {
                                    role: { type: 'string', enum: ['user', 'assistant', 'system'] },
                                    content: { type: 'string' }
                                }
                            }
                        },
                        system_prompt: { type: 'string', description: 'System prompt to guide AI behavior' },
                        enable_tools: { type: 'boolean', description: 'Enable function calling capabilities' },
                        max_turns: { type: 'number', description: 'Maximum conversation turns for tool calling' },
                        temperature: { type: 'number', description: 'Response randomness (0.0-2.0)' },
                        stream: { type: 'boolean', description: 'Enable streaming response' }
                    },
                    required: ['messages']
                }
            },
            {
                name: 'streaming_tool_chat',
                description: 'Streaming chat with real-time function calling support',
                inputSchema: {
                    type: 'object',
                    properties: {
                        messages: {
                            type: 'array',
                            description: 'Chat message history',
                            items: {
                                type: 'object',
                                properties: {
                                    role: { type: 'string' },
                                    content: { type: 'string' }
                                }
                            }
                        },
                        enable_streaming: { type: 'boolean', description: 'Enable streaming responses' }
                    },
                    required: ['messages']
                }
            },
            {
                name: 'list_available_functions',
                description: 'List all available functions in the function registry',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'search_knowledge') {
        const query = args.query?.toLowerCase() || '';
        const category = args.category?.toLowerCase();
        const limit = args.limit || 10;

        let results = knowledgeData.filter((item) => {
            const matchesQuery =
                item.title?.toLowerCase().includes(query) ||
                item.description?.toLowerCase().includes(query) ||
                item.url?.toLowerCase().includes(query);
            const matchesCategory = !category || item.category === category;
            return matchesQuery && matchesCategory;
        });

        results = results.slice(0, limit);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            query: args.query,
                            resultsFound: results.length,
                            results: results.map((r) => ({
                                title: r.title,
                                description: r.description,
                                url: r.url,
                                category: r.category,
                                relevance: r.relevance,
                            })),
                        },
                        null,
                        2
                    ),
                },
            ],
        };
    }

    if (name === 'get_knowledge_stats') {
        const stats = {
            totalEntries: knowledgeData.length,
            categories: {},
            platforms: {},
            avgRelevance: 0,
        };

        knowledgeData.forEach((item) => {
            // Count categories
            if (item.category) {
                stats.categories[item.category] =
                    (stats.categories[item.category] || 0) + 1;
            }
            // Count platforms
            if (item.platform) {
                stats.platforms[item.platform] =
                    (stats.platforms[item.platform] || 0) + 1;
            }
            // Sum relevance
            stats.avgRelevance += item.relevance || 0;
        });

        stats.avgRelevance = (stats.avgRelevance / knowledgeData.length).toFixed(2);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(stats, null, 2),
                },
            ],
        };
    }

    if (name === 'fetch_webpage') {
        const url = args.url;
        const selector = args.selector;

        // Validate URL
        if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
            throw new Error('Invalid URL. Must start with http:// or https://');
        }

        try {
            // Fetch the webpage
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'BambiSleep-Church-Bot/1.0',
                },
                maxRedirects: 5,
            });

            // Parse HTML
            const $ = cheerio.load(response.data);

            // Remove script and style elements
            $('script, style, nav, footer, header, aside, .advertisement, .ad').remove();

            // Extract text content
            let textContent;
            if (selector) {
                // Use specific selector if provided
                textContent = $(selector).text();
                if (!textContent) {
                    throw new Error(`No content found with selector: ${selector}`);
                }
            } else {
                // Extract main content (try common content selectors)
                const contentSelectors = [
                    'main',
                    'article',
                    '#content',
                    '#main',
                    '.content',
                    '.main',
                    'body',
                ];

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

            // Clean up whitespace
            textContent = textContent
                .replace(/\s+/g, ' ')
                .replace(/\n\s*\n/g, '\n')
                .trim();

            // Get page title
            const title = $('title').text().trim();

            // Limit content length to avoid overwhelming responses
            const maxLength = 10000;
            if (textContent.length > maxLength) {
                textContent = textContent.substring(0, maxLength) + '\n\n... (content truncated)';
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            url: url,
                            title: title,
                            contentLength: textContent.length,
                            content: textContent,
                            status: 'success',
                        }, null, 2),
                    },
                ],
            };

        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            url: url,
                            status: 'error',
                            error: error.message,
                            errorType: error.code || 'UNKNOWN',
                        }, null, 2),
                    },
                ],
            };
        }
    }

    // AI-powered tools using LM Studio OpenAI API
    if (name === 'generate_response') {
        return await generateResponse(args);
    }

    if (name === 'chat_completion') {
        return await chatCompletion(args);
    }

    if (name === 'generate_embeddings') {
        return await generateEmbeddings(args);
    }

    if (name === 'semantic_search') {
        return await semanticSearch(args);
    }

    if (name === 'list_models') {
        return await listModels(args);
    }

    if (name === 'advanced_agent') {
        return await advancedAgent(args);
    }

    if (name === 'enhanced_chat_completion') {
        return await chatCompletion(args);
    }

    if (name === 'streaming_tool_chat') {
        return await streamingToolChat(args);
    }

    if (name === 'list_available_functions') {
        const functions = await functionRegistry.list();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(functions, null, 2),
                },
            ],
        };
    }

    throw new Error(`Unknown tool: ${name}`);
});

// Start server with support for both stdio and HTTP
async function main() {
    const args = process.argv.slice(2);
    const useHttp = args.includes('--http') || process.env.MCP_TRANSPORT === 'http';

    if (useHttp) {
        // HTTP transport for LM Studio integration
        const express = await import('express');
        const cors = await import('cors');
        const app = express.default();

        app.use(cors.default());
        app.use(express.default.json());

        // Store reference to MCP server instance
        app.locals.mcpServer = this;

        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({ status: 'healthy', server: 'bambisleep-church-mcp', version: '1.0.0' });
        });

        // MCP endpoint for LM Studio
        app.post('/mcp', async (req, res) => {
            try {
                const { method, params } = req.body;

                if (method === 'tools/list') {
                    // Return tools list directly
                    const tools = {
                        tools: [
                            {
                                name: 'search_knowledge',
                                description: 'Search the BambiSleep knowledge base',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        query: { type: 'string', description: 'Search query' },
                                        limit: { type: 'number', description: 'Maximum results to return' }
                                    },
                                    required: ['query']
                                }
                            },
                            {
                                name: 'get_knowledge_stats',
                                description: 'Get statistics about the knowledge base',
                                inputSchema: {
                                    type: 'object',
                                    properties: {}
                                }
                            },
                            {
                                name: 'fetch_webpage',
                                description: 'Fetch and extract content from a webpage',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        url: { type: 'string', description: 'URL to fetch' }
                                    },
                                    required: ['url']
                                }
                            },
                            {
                                name: 'generate_response',
                                description: 'Generate AI response using LM Studio with reasoning capabilities',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        input: { type: 'string', description: 'Input text for response generation' },
                                        reasoning_effort: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Reasoning effort level' },
                                        previous_response_id: { type: 'string', description: 'ID of previous response for stateful conversation' },
                                        stream: { type: 'boolean', description: 'Enable streaming response' }
                                    },
                                    required: ['input']
                                }
                            },
                            {
                                name: 'chat_completion',
                                description: 'Generate conversational AI response using LM Studio chat completions',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        messages: {
                                            type: 'array',
                                            description: 'Chat message history',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    role: { type: 'string', enum: ['user', 'assistant', 'system'] },
                                                    content: { type: 'string' }
                                                }
                                            }
                                        },
                                        system_prompt: { type: 'string', description: 'System prompt to guide AI behavior' },
                                        temperature: { type: 'number', description: 'Response randomness (0.0-2.0)' },
                                        max_tokens: { type: 'number', description: 'Maximum tokens in response' },
                                        stream: { type: 'boolean', description: 'Enable streaming response' }
                                    },
                                    required: ['messages']
                                }
                            },
                            {
                                name: 'generate_embeddings',
                                description: 'Generate text embeddings using LM Studio for semantic analysis',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        text: {
                                            oneOf: [
                                                { type: 'string', description: 'Single text to embed' },
                                                { type: 'array', items: { type: 'string' }, description: 'Array of texts to embed' }
                                            ]
                                        },
                                        model: { type: 'string', description: 'Embedding model to use' }
                                    },
                                    required: ['text']
                                }
                            },
                            {
                                name: 'semantic_search',
                                description: 'Perform semantic search on knowledge base using embeddings',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        query: { type: 'string', description: 'Search query' },
                                        limit: { type: 'number', description: 'Maximum results to return' },
                                        similarity_threshold: { type: 'number', description: 'Minimum similarity score (0.0-1.0)' }
                                    },
                                    required: ['query']
                                }
                            },
                            {
                                name: 'list_models',
                                description: 'List available models in LM Studio',
                                inputSchema: {
                                    type: 'object',
                                    properties: {}
                                }
                            }
                        ]
                    };
                    return res.json(tools);
                }

                if (method === 'tools/call') {
                    const { name, arguments: args } = params;
                    let result;

                    switch (name) {
                        case 'search_knowledge':
                            result = await searchKnowledge(args);
                            break;
                        case 'get_knowledge_stats':
                            result = await getKnowledgeStats(args);
                            break;
                        case 'fetch_webpage':
                            result = await fetchWebpage(args);
                            break;
                        case 'generate_response':
                            result = await generateResponse(args);
                            break;
                        case 'chat_completion':
                            result = await chatCompletion(args);
                            break;
                        case 'generate_embeddings':
                            result = await generateEmbeddings(args);
                            break;
                        case 'semantic_search':
                            result = await semanticSearch(args);
                            break;
                        case 'list_models':
                            result = await listModels(args);
                            break;
                        case 'advanced_agent':
                            result = await advancedAgent(args);
                            break;
                        case 'enhanced_chat_completion':
                            result = await chatCompletion(args);
                            break;
                        case 'streaming_tool_chat':
                            result = await streamingToolChat(args);
                            break;
                        case 'list_available_functions':
                            result = await functionRegistry.list();
                            break;
                        default:
                            return res.status(400).json({ error: 'Unknown tool', name });
                    }

                    return res.json(result);
                }

                res.status(400).json({ error: 'Unknown method', method });
            } catch (error) {
                console.error('❌ HTTP MCP error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // LM Studio specific metadata endpoint
        app.get('/mcp/info', (req, res) => {
            res.json({
                name: 'BambiSleep Church MCP Server',
                description: 'Provides access to BambiSleep knowledge base, web scraping, and LM Studio AI capabilities',
                version: '2.0.0',
                author: 'BambiSleep Church',
                tools: [
                    'search_knowledge',
                    'get_knowledge_stats',
                    'fetch_webpage',
                    'generate_response',
                    'chat_completion',
                    'generate_embeddings',
                    'semantic_search',
                    'list_models',
                    'advanced_agent',
                    'enhanced_chat_completion',
                    'streaming_tool_chat',
                    'list_available_functions'
                ],
                capabilities: [
                    'knowledge_search',
                    'web_scraping',
                    'content_analysis',
                    'ai_generation',
                    'chat_completions',
                    'embeddings',
                    'semantic_search',
                    'model_management',
                    'function_calling',
                    'tool_execution',
                    'multi_turn_conversations',
                    'streaming_responses'
                ],
                lmstudio_compatible: true
            });
        });

        const port = process.env.MCP_HTTP_PORT || 9999;
        app.listen(port, '0.0.0.0', () => {
            console.log(`🚀 BambiSleep Church MCP Server running on HTTP port ${port}`);
            console.log(`📍 Health check: http://localhost:${port}/health`);
            console.log(`🔗 MCP endpoint: http://localhost:${port}/mcp`);
            console.log(`ℹ️  LM Studio info: http://localhost:${port}/mcp/info`);
        });
    } else {
        // Stdio transport for local MCP integration
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error('🚀 BambiSleep Church MCP Server running on stdio');
    }
}

main().catch((error) => {
    console.error('❌ MCP Server fatal error:', error);
    process.exit(1);
});
