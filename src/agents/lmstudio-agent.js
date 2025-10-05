// LM Studio Agent - Uses MCP Tools via LM Studio
// This agent connects to LM Studio and can use the MCP tools

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import OpenAI from 'openai';
import readline from 'readline';

// LM Studio Configuration
const LMSTUDIO_CONFIG = {
    baseURL: process.env.LMSTUDIO_URL || 'http://localhost:1234/v1',
    apiKey: 'lm-studio', // LM Studio doesn't require a real key
    model: 'local-model' // Will use whatever model is loaded in LM Studio
};

// Initialize OpenAI client for LM Studio
const openai = new OpenAI({
    baseURL: LMSTUDIO_CONFIG.baseURL,
    apiKey: LMSTUDIO_CONFIG.apiKey
});

// MCP Client
let mcpClient = null;
let mcpServerProcess = null;

// Initialize MCP Connection
async function initializeMCP() {
    console.log('🔌 Connecting to MCP server...');

    // Create client transport (this will spawn the server automatically)
    const transport = new StdioClientTransport({
        command: 'node',
        args: ['src/mcp/McpServer.js']
    });

    // Create and connect client
    mcpClient = new Client({
        name: 'lmstudio-agent',
        version: '1.0.0'
    }, {
        capabilities: {}
    });

    await mcpClient.connect(transport);

    // Store the transport so we can close it later
    mcpServerProcess = transport;

    // Get available tools using the proper SDK method
    const toolsList = await mcpClient.listTools();

    console.log('✅ Connected to MCP server');
    console.log(`📚 Available tools: ${toolsList.tools.map(t => t.name).join(', ')}`);

    return toolsList.tools;
}

// Convert MCP tools to OpenAI function format
function convertMcpToolsToOpenAIFunctions(mcpTools) {
    return mcpTools.map(tool => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema
        }
    }));
}

// Execute MCP tool
async function executeMcpTool(toolName, args) {
    console.log(`🔧 Executing tool: ${toolName}`);
    console.log(`📝 Arguments:`, JSON.stringify(args, null, 2));

    try {
        const result = await mcpClient.callTool({
            name: toolName,
            arguments: args
        });

        // Extract text content from MCP response
        const content = result.content[0].text;
        console.log(`✅ Tool executed successfully`);

        return content;
    } catch (error) {
        console.error(`❌ Tool execution failed:`, error.message);
        return JSON.stringify({ error: error.message });
    }
}

// Main agent loop
async function runAgent() {
    console.log('\n🤖 LM Studio Agent Starting...\n');

    // Initialize MCP
    const mcpTools = await initializeMCP();
    const openaiTools = convertMcpToolsToOpenAIFunctions(mcpTools);

    // Conversation history
    const messages = [
        {
            role: 'system',
            content: `You are an AI assistant with access to the BambiSleep Church knowledge base. You have two tools available:

1. search_knowledge: Search the knowledge base for information. Takes parameters:
   - query (required): search term
   - category (optional): filter by "official", "community", or "scripts"
   - limit (optional): max results (default 10)

2. get_knowledge_stats: Get statistics about the knowledge base. Takes no parameters.

When users ask about BambiSleep content, use these tools to provide accurate information from the knowledge base.
Always use the tools when relevant to the user's question.`
        }
    ];

    // Setup readline for user input
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('💬 Chat with the agent (type "exit" to quit)\n');

    // Chat loop
    const chat = async () => {
        rl.question('You: ', async (userInput) => {
            if (userInput.toLowerCase() === 'exit') {
                console.log('\n👋 Goodbye!\n');
                await cleanup();
                process.exit(0);
            }

            if (!userInput.trim()) {
                chat();
                return;
            }

            // Add user message
            messages.push({
                role: 'user',
                content: userInput
            });

            try {
                console.log('\n🤔 Thinking...\n');

                // Call LM Studio
                let response = await openai.chat.completions.create({
                    model: LMSTUDIO_CONFIG.model,
                    messages: messages,
                    tools: openaiTools,
                    tool_choice: 'auto',
                    temperature: 0.7,
                    max_tokens: 2000
                });

                let assistantMessage = response.choices[0].message;

                // Handle tool calls
                while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                    console.log(`🛠️  Agent wants to use ${assistantMessage.tool_calls.length} tool(s)\n`);

                    // Add assistant message with tool calls
                    messages.push(assistantMessage);

                    // Execute each tool call
                    for (const toolCall of assistantMessage.tool_calls) {
                        const toolName = toolCall.function.name;
                        const toolArgs = JSON.parse(toolCall.function.arguments);

                        // Execute the tool via MCP
                        const toolResult = await executeMcpTool(toolName, toolArgs);

                        // Add tool result to messages
                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            name: toolName,
                            content: toolResult
                        });
                    }

                    // Call LM Studio again with tool results
                    console.log('\n🤔 Processing tool results...\n');
                    response = await openai.chat.completions.create({
                        model: LMSTUDIO_CONFIG.model,
                        messages: messages,
                        tools: openaiTools,
                        tool_choice: 'auto',
                        temperature: 0.7,
                        max_tokens: 2000
                    });

                    assistantMessage = response.choices[0].message;
                }

                // Add final assistant message
                messages.push(assistantMessage);

                // Display response
                console.log(`Agent: ${assistantMessage.content}\n`);

            } catch (error) {
                console.error('❌ Error:', error.message);

                if (error.message.includes('ECONNREFUSED')) {
                    console.error('💡 Tip: Make sure LM Studio server is running on http://localhost:1234');
                    console.error('   Open LM Studio → Developer tab → Start Server\n');
                }
            }

            // Continue chat
            chat();
        });
    };

    // Start chat
    chat();
}

// Cleanup function
async function cleanup() {
    console.log('🧹 Cleaning up...');

    if (mcpClient) {
        try {
            await mcpClient.close();
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    if (mcpServerProcess && typeof mcpServerProcess.close === 'function') {
        try {
            await mcpServerProcess.close();
        } catch (error) {
            // Ignore cleanup errors
        }
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n\n⚠️  Received SIGINT, shutting down...\n');
    await cleanup();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\n⚠️  Received SIGTERM, shutting down...\n');
    await cleanup();
    process.exit(0);
});

// Start the agent
console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║      🤖 LM Studio Agent with MCP Tools                    ║
║                                                            ║
║  This agent connects to LM Studio and can use the         ║
║  BambiSleep Church knowledge base tools.                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

runAgent().catch(async (error) => {
    console.error('❌ Fatal error:', error);
    await cleanup();
    process.exit(1);
});
