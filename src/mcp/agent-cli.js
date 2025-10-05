// CLI Interface for MCP Agent
import { McpAgent } from './McpAgent.js';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const agent = new McpAgent({
    lmstudioUrl: process.env.LMSTUDIO_URL || 'http://localhost:1234/v1/chat/completions',
    model: 'llama-3.2-8x3b-moe-dark-champion-instruct-uncensored-abliterated-18.4b',
    maxIterations: 10,
    temperature: 0.7
});

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          🌟 BambiSleep Church MCP Agent                      ║
║          Powered by LMStudio                                  ║
╚═══════════════════════════════════════════════════════════════╝

Available Commands:
  - Type your question or request
  - /reset - Clear conversation history
  - /stats - Show conversation statistics
  - /tools - List available tools
  - /exit - Exit the agent

Tools Available:
  ✓ search_knowledge - Search BambiSleep knowledge base
  ✓ get_knowledge_stats - Get knowledge base statistics
  ✓ fetch_webpage - Fetch content from any webpage

Model: ${agent.model}
Max Iterations: ${agent.maxIterations}

Ready! Ask me anything about BambiSleep...
`);

async function promptUser() {
    rl.question('\n💬 You: ', async (input) => {
        const message = input.trim();

        if (!message) {
            promptUser();
            return;
        }

        // Handle commands
        if (message === '/exit') {
            console.log('\n👋 Goodbye!');
            rl.close();
            process.exit(0);
        }

        if (message === '/reset') {
            agent.reset();
            console.log('✅ Conversation history cleared');
            promptUser();
            return;
        }

        if (message === '/stats') {
            const summary = agent.getSummary();
            console.log('\n📊 Conversation Statistics:');
            console.log(`   Total Messages: ${summary.totalMessages}`);
            console.log(`   User Messages: ${summary.userMessages}`);
            console.log(`   Assistant Messages: ${summary.assistantMessages}`);
            console.log(`   Tool Calls: ${summary.toolCalls}`);
            promptUser();
            return;
        }

        if (message === '/tools') {
            const tools = agent.getTools();
            console.log('\n🔧 Available Tools:');
            tools.forEach(tool => {
                console.log(`\n   ${tool.function.name}`);
                console.log(`   └─ ${tool.function.description}`);
            });
            promptUser();
            return;
        }

        // Process user message
        try {
            const result = await agent.chat(message);
            console.log(`\n📊 Used ${result.toolsUsed} tool(s) in ${result.iterations} iteration(s)`);
        } catch (error) {
            console.error(`\n❌ Error: ${error.message}`);
        }

        promptUser();
    });
}

// Start the conversation
promptUser();

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n👋 Goodbye!');
    rl.close();
    process.exit(0);
});
