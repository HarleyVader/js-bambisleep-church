# MCP Agent - Agentic Workflow for BambiSleep Church

Intelligent agent powered by LMStudio using the `llama-3.2-8x3b-moe-dark-champion-instruct-uncensored-abliterated-18.4b` model with full MCP tool integration.

## Features

✅ **Agentic Tool Calling** - Automatically decides which tools to use
✅ **Multi-Iteration Workflow** - Chains multiple tool calls intelligently
✅ **Knowledge Base Integration** - Full access to BambiSleep knowledge
✅ **Web Scraping** - Can fetch and analyze any webpage
✅ **Conversation Memory** - Maintains context throughout conversation
✅ **Multiple Interfaces** - CLI, Web Socket, and REST API

## Available Tools

### 1. search_knowledge

Search the BambiSleep knowledge base for files, videos, community content, and scripts.

**Parameters:**

- `query` (string, required) - Search query
- `category` (string, optional) - Filter by: 'official', 'community', 'scripts'
- `limit` (number, optional) - Max results (default: 10)

### 2. get_knowledge_stats

Get comprehensive statistics about the knowledge base.

**Returns:**

- Total entries
- Category breakdown
- Platform distribution
- Average relevance scores

### 3. fetch_webpage

Fetch and extract clean text content from any webpage.

**Parameters:**

- `url` (string, required) - URL to fetch
- `selector` (string, optional) - CSS selector for specific content

## Usage

### 1. CLI Interface

```powershell
node src/mcp/agent-cli.js
```

**Commands:**

- Type your question naturally
- `/reset` - Clear conversation history
- `/stats` - Show conversation statistics
- `/tools` - List available tools
- `/exit` - Exit the agent

**Example Session:**

```
💬 You: What BambiSleep files are available?

🔧 Tool Call: search_knowledge
✅ Tool Result: Found 15 results...

🤖 Assistant: I found 15 BambiSleep files in our knowledge base. Here are the main categories:
- Original BambiSleep series (20 files)
- Reinforcement files (10 files)
- Community modifications...
```

### 2. Web Socket Interface

Connect from your web application:

```javascript
const socket = io();

// Send message to MCP Agent
socket.emit('mcp:message', { message: 'Tell me about BambiSleep' });

// Receive response
socket.on('mcp:response', (data) => {
    console.log(data.message);
    console.log(`Used ${data.toolsUsed} tools in ${data.iterations} iterations`);
});

// Typing indicator
socket.on('mcp:typing', (data) => {
    console.log('Agent is typing:', data.isTyping);
});

// Error handling
socket.on('mcp:error', (data) => {
    console.error('Error:', data.error);
});
```

### 3. REST API Interface

#### Chat with Agent

```powershell
curl -X POST http://localhost:7070/api/mcp/chat `
  -H "Content-Type: application/json" `
  -d '{"message": "What are the most popular BambiSleep files?"}'
```

**Response:**

```json
{
  "success": true,
  "response": "Based on the knowledge base...",
  "iterations": 2,
  "toolsUsed": 1,
  "timestamp": "2025-10-05T12:00:00.000Z"
}
```

#### Reset Conversation

```powershell
curl -X POST http://localhost:7070/api/mcp/reset
```

#### Get Statistics

```powershell
curl http://localhost:7070/api/mcp/stats
```

#### List Available Tools

```powershell
curl http://localhost:7070/api/mcp/tools
```

## Configuration

Set environment variables or modify defaults in `McpAgent.js`:

```javascript
const mcpAgent = new McpAgent({
    lmstudioUrl: 'http://localhost:1234/v1/chat/completions',
    model: 'llama-3.2-8x3b-moe-dark-champion-instruct-uncensored-abliterated-18.4b',
    maxIterations: 10,      // Max tool calling loops
    temperature: 0.7        // Model creativity (0-1)
});
```

## LMStudio Setup

1. **Install LMStudio** - Download from <https://lmstudio.ai/>
2. **Load Model** - Download and load `llama-3.2-8x3b-moe-dark-champion-instruct-uncensored-abliterated-18.4b`
3. **Start Server** - Enable local server on port 1234
4. **Verify** - Test at <http://localhost:1234/v1/models>

## Architecture

```
User Input
    ↓
McpAgent.chat()
    ↓
LMStudio API (with tools)
    ↓
Tool Calls? → Yes → Execute Tools → Loop back
    ↓ No
Final Response
```

## Agentic Workflow Loop

1. **User sends message** → Added to conversation history
2. **Agent analyzes message** → Decides if tools are needed
3. **Tool execution** → Calls MCP tools (search, stats, fetch)
4. **Result integration** → Tool results added to history
5. **Loop continues** → Until final answer or max iterations
6. **Response delivered** → With full context from all tools

## Example Workflows

### Example 1: Knowledge Search

```
User: "Find files about sleep triggers"
  → Agent calls: search_knowledge("sleep triggers")
  → Returns: 8 relevant files
  → Agent responds with formatted list
```

### Example 2: Multi-Tool Chain

```
User: "Compare the official wiki with community resources"
  → Agent calls: get_knowledge_stats()
  → Agent calls: search_knowledge("official")
  → Agent calls: search_knowledge("community")
  → Agent synthesizes comparison
```

### Example 3: Web Research

```
User: "What does the official BambiSleep site say about safety?"
  → Agent calls: fetch_webpage("https://bambisleep.info/")
  → Extracts safety information
  → Agent calls: search_knowledge("safety")
  → Cross-references with knowledge base
  → Provides comprehensive answer
```

## Advanced Features

### Conversation Management

```javascript
// Get full conversation history
const summary = mcpAgent.getSummary();

// Reset for new topic
mcpAgent.reset();

// Check how many tools were used
console.log(summary.toolCalls);
```

### Custom Tool Development

Add new tools to `McpAgent.js`:

```javascript
// In getTools()
{
    type: 'function',
    function: {
        name: 'your_tool',
        description: 'What it does',
        parameters: { /* schema */ }
    }
}

// In executeTool()
case 'your_tool':
    return await this.yourToolMethod(args);
```

## Performance

- **Average Response Time**: 2-5 seconds
- **Tool Execution**: <1 second per tool
- **Max Iterations**: 10 (configurable)
- **Context Window**: Full conversation history maintained
- **Concurrent Users**: Supports multiple simultaneous chats

## Troubleshooting

### LMStudio Not Responding

```powershell
# Check if LMStudio server is running
curl http://localhost:1234/v1/models

# Set custom URL
$env:LMSTUDIO_URL="http://localhost:1234/v1/chat/completions"
```

### Tool Execution Fails

- Check knowledge.json exists and is valid
- Verify network access for fetch_webpage
- Review console logs for detailed errors

### Max Iterations Reached

- Increase `maxIterations` in configuration
- Simplify user queries
- Check if LMStudio is responding slowly

## Integration Examples

### Add to Existing Express App

```javascript
import { McpAgent } from './mcp/McpAgent.js';

const agent = new McpAgent();

app.post('/chat', async (req, res) => {
    const result = await agent.chat(req.body.message);
    res.json(result);
});
```

### Discord Bot Integration

```javascript
client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!bambi')) {
        const query = message.content.slice(7);
        const result = await mcpAgent.chat(query);
        message.reply(result.response);
    }
});
```

## Security Considerations

- ⚠️ Agent can fetch any public webpage
- ⚠️ Rate limiting recommended for production
- ⚠️ Validate user input before processing
- ⚠️ Monitor LMStudio API usage
- ✅ No data leaves local network (LMStudio is local)

## Future Enhancements

- [ ] Add more MCP tools (audio playback control, user preferences)
- [ ] Implement RAG with vector embeddings
- [ ] Add streaming responses
- [ ] Multi-agent collaboration
- [ ] Tool execution caching
- [ ] Response quality scoring

## Credits

- **Model**: llama-3.2-8x3b-moe-dark-champion-instruct-uncensored-abliterated-18.4b
- **Framework**: Model Context Protocol (MCP)
- **LLM Server**: LMStudio
- **Project**: BambiSleep Church

---

**Ready to chat with an intelligent agent that knows everything about BambiSleep!** 🌟
