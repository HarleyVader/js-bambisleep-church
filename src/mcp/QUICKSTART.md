# MCP Agent Quick Start Guide

Get the intelligent BambiSleep agent running in 3 minutes!

## Prerequisites

1. **LMStudio** - Download and install from <https://lmstudio.ai/>
2. **Node.js** - Version 18 or higher
3. **Model** - `llama-3.2-8x3b-moe-dark-champion-instruct-uncensored-abliterated-18.4b`

## Step 1: Setup LMStudio

1. Open LMStudio
2. Go to "Discover" tab
3. Search for `llama-3.2-8x3b-moe-dark-champion-instruct-uncensored-abliterated-18.4b`
4. Download the model
5. Go to "Local Server" tab
6. Load the downloaded model
7. Click "Start Server" (default port: 1234)

## Step 2: Install Dependencies

```powershell
npm install
```

## Step 3: Run the Agent

### Option A: CLI Interface (Recommended for testing)

```powershell
npm run agent:cli
```

You'll see:

```
╔═══════════════════════════════════════════════════════════════╗
║          🌟 BambiSleep Church MCP Agent                      ║
║          Powered by LMStudio                                  ║
╚═══════════════════════════════════════════════════════════════╝

Ready! Ask me anything about BambiSleep...

💬 You: _
```

### Option B: Web Server (Full integration)

```powershell
npm run start:web
```

Then open <http://localhost:7070/agents> in your browser.

## Test Commands

Try these in the CLI:

```
💬 You: What BambiSleep files are available?

💬 You: Show me statistics about the knowledge base

💬 You: Fetch the latest from https://bambisleep.info/

💬 You: Find all sleep trigger files

💬 You: /tools

💬 You: /stats

💬 You: /reset
```

## API Test

```powershell
# Test MCP agent via REST API
curl -X POST http://localhost:7070/api/mcp/chat `
  -H "Content-Type: application/json" `
  -d '{"message": "Tell me about BambiSleep"}'
```

## Troubleshooting

### "Connection refused" error

- Make sure LMStudio server is running
- Check it's on port 1234: <http://localhost:1234/v1/models>
- Try restarting LMStudio server

### Agent not responding

- Check console for errors
- Verify model is loaded in LMStudio
- Check LMStudio console for API calls

### Tool execution fails

- Verify `knowledge.json` exists in `src/knowledge/`
- Check internet connection for webpage fetching
- Review console logs for details

## Configuration

Create `.env` file (optional):

```env
LMSTUDIO_URL=http://localhost:1234/v1/chat/completions
PORT=7070
HOST=0.0.0.0
```

## Next Steps

1. Read full documentation: `src/mcp/README.md`
2. Try complex queries with multiple tools
3. Integrate into your own applications
4. Customize tools for your needs

## Example Session

```
💬 You: I want to learn about BambiSleep. What files should I start with?

🔄 Iteration 1/10
🔧 Tool Call: search_knowledge
✅ Tool Result: Found 20 results...

🔄 Iteration 2/10
🤖 Assistant: Great question! Based on our knowledge base, I recommend starting with these files:

1. **BambiSleep 1: Awakening** - The first introduction file
   - URL: https://example.com/bambi1
   - Category: Official, Basic Level

2. **BambiSleep 2: Bambi Acceptance** - Reinforcement of concepts
   - URL: https://example.com/bambi2
   - Category: Official, Intermediate

3. **Triggers 1** - Understanding your triggers
   - URL: https://example.com/triggers1
   - Category: Official, Essential

Would you like more specific recommendations based on your experience level?

📊 Used 1 tool(s) in 2 iteration(s)
```

## Success Indicators

✅ LMStudio server running on port 1234
✅ Model loaded and responding
✅ Agent connects successfully
✅ Tools execute without errors
✅ Responses include tool usage stats

---

**You're ready to chat with an intelligent BambiSleep agent!** 🌟

For advanced usage, see `src/mcp/README.md`
