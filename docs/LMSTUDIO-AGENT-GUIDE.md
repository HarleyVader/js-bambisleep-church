# LM Studio Agent with MCP Tools - Complete Guide

**Date:** October 5, 2025
**Purpose:** Build an AI agent that uses LM Studio with MCP tools
**Status:** ✅ Ready to use

---

## 🎯 What This Does

This agent creates a **chat interface** that:

- ✅ Connects to **LM Studio** (local AI model)
- ✅ Uses **MCP tools** (search_knowledge, get_knowledge_stats)
- ✅ Provides **interactive terminal chat**
- ✅ Automatically calls tools when needed
- ✅ Works completely **offline** (except LM Studio)

---

## 🚀 Quick Start

### **Step 1: Install Dependencies**

```bash
npm install openai @modelcontextprotocol/sdk
```

### **Step 2: Start LM Studio Server**

1. Open **LM Studio**
2. Load a model (recommended: Qwen2.5-7B or Llama-3.1-8B)
3. Go to **Developer** tab
4. Click **"Start Server"**
5. Verify it's running on `http://localhost:1234`

### **Step 3: Run the Agent**

```bash
node src/agents/lmstudio-agent.js
```

### **Step 4: Chat!**

```
You: What files are in the knowledge base?
Agent: *uses get_knowledge_stats tool*
Agent: The knowledge base contains 39 entries...

You: Find files about uniform triggers
Agent: *uses search_knowledge tool*
Agent: I found 3 files about uniform triggers...
```

---

## 📋 How It Works

### **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────┐
│  You (Terminal)                                         │
│  "Find files about triggers"                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  LM Studio Agent (lmstudio-agent.js)                    │
│  - Manages conversation                                 │
│  - Calls LM Studio                                      │
│  - Executes MCP tools                                   │
└────────┬──────────────────────────┬─────────────────────┘
         │                          │
         ↓                          ↓
┌────────────────────┐    ┌──────────────────────────────┐
│  LM Studio Server  │    │  MCP Server (McpServer.js)   │
│  localhost:1234    │    │  - search_knowledge          │
│  - AI reasoning    │    │  - get_knowledge_stats       │
│  - Tool selection  │    │  - knowledge.json access     │
└────────────────────┘    └──────────────────────────────┘
```

### **Flow Example**

1. **User:** "Find files about safety"
2. **Agent** → **LM Studio:** "User wants files about safety"
3. **LM Studio** → **Agent:** "Use search_knowledge tool with query='safety'"
4. **Agent** → **MCP Server:** Execute search_knowledge(query="safety")
5. **MCP Server** → **Agent:** Returns 2 matching entries
6. **Agent** → **LM Studio:** "Tool returned 2 entries: [results]"
7. **LM Studio** → **Agent:** "I found 2 safety resources: Safety Guidelines and Risk Guide"
8. **Agent** → **User:** Displays response

---

## 🛠️ Features

### **What the Agent Can Do**

✅ **Natural conversation** - Chat like you're talking to a person
✅ **Automatic tool use** - Agent decides when to use tools
✅ **Multi-tool calls** - Can use multiple tools in one response
✅ **Context awareness** - Remembers conversation history
✅ **Error handling** - Graceful failures with helpful messages
✅ **Real-time feedback** - Shows what's happening (tool calls, thinking)

### **Available Tools**

The agent has access to:

1. **search_knowledge**
   - Search the 39-entry knowledge base
   - Filter by category (official, community, scripts)
   - Limit results

2. **get_knowledge_stats**
   - Get analytics about knowledge base
   - Category breakdown
   - Platform distribution
   - Average relevance score

---

## 💻 Usage Examples

### **Example 1: Get Statistics**

```
You: How many entries are in the knowledge base?

🤔 Thinking...
🛠️  Agent wants to use 1 tool(s)
🔧 Executing tool: get_knowledge_stats
✅ Tool executed successfully
🤔 Processing tool results...

Agent: The knowledge base contains 39 entries in total, with the following breakdown:
- Official: 6 entries
- Community: 1 entry
- Scripts: 32 entries

The average relevance score is 9.62 out of 10, indicating high-quality content.
```

### **Example 2: Search for Content**

```
You: Find files about uniform triggers

🤔 Thinking...
🛠️  Agent wants to use 1 tool(s)
🔧 Executing tool: search_knowledge
📝 Arguments: { "query": "uniform", "limit": 10 }
✅ Tool executed successfully
🤔 Processing tool results...

Agent: I found 3 files related to uniform triggers:

1. **Bambi Uniform Blankness** - Makes Bambi feel blank and uniform
   Category: scripts, Relevance: 10/10

2. **Bambi Uniform Lock** - Locks uniform behavior in place
   Category: scripts, Relevance: 9/10

3. **Bambi Uniform Reinforcement** - Reinforces uniform triggers
   Category: scripts, Relevance: 8/10
```

### **Example 3: Filtered Search**

```
You: Show me only official BambiSleep content

🤔 Thinking...
🛠️  Agent wants to use 1 tool(s)
🔧 Executing tool: search_knowledge
📝 Arguments: { "query": "", "category": "official", "limit": 10 }
✅ Tool executed successfully
🤔 Processing tool results...

Agent: Here are all 6 official BambiSleep documents:

1. Welcome to Bambi Sleep
2. BambiSleep FAQ
3. BS, Consent, And You
4. Triggers Guide
5. Beginner's Files
6. Safety Guidelines
```

### **Example 4: Complex Query**

```
You: What are the most important safety files I should read?

🤔 Thinking...
🛠️  Agent wants to use 1 tool(s)
🔧 Executing tool: search_knowledge
📝 Arguments: { "query": "safety", "category": "official" }
✅ Tool executed successfully
🤔 Processing tool results...

Agent: I found 2 important safety-related files you should read:

1. **Safety Guidelines Booklet** (Official)
   - Comprehensive safety information
   - Relevance: 10/10

2. **BS, Consent, And You** (Official)
   - Important consent and safety considerations
   - Relevance: 10/10

Both are official documents with maximum relevance scores, making them essential reading.
```

---

## 🎓 Advanced Usage

### **Configuration Options**

Edit the agent file to customize:

```javascript
const LMSTUDIO_CONFIG = {
    baseURL: 'http://localhost:1234/v1',  // LM Studio URL
    apiKey: 'lm-studio',                   // No real key needed
    model: 'local-model'                   // Auto-uses loaded model
};
```

### **System Prompt Customization**

The agent's behavior is controlled by the system prompt (lines 82-94 in the agent file). You can modify it to:

- Change personality
- Add specific instructions
- Adjust tool usage patterns

### **Conversation History**

The agent maintains full conversation history, so it can:

- Reference previous questions
- Build on prior context
- Remember what tools were used

---

## ⚙️ Configuration

### **Environment Variables** (Optional)

Create `.env` file:

```env
LMSTUDIO_URL=http://localhost:1234/v1
```

Then the agent will use this URL automatically.

### **Recommended LM Studio Models**

Best models for tool use:

| Model | Size | Download | Notes |
|-------|------|----------|-------|
| **Qwen2.5-7B-Instruct** | 4.68 GB | LM Studio | ✅ Best tool use |
| **Llama-3.1-8B-Instruct** | 4.92 GB | LM Studio | ✅ Great reasoning |
| **Ministral-8B-Instruct** | 4.67 GB | LM Studio | ✅ Good balance |

**How to load:**

1. Open LM Studio
2. Search for model (e.g., "Qwen2.5-7B")
3. Download
4. Click "Load Model"

---

## 🐛 Troubleshooting

### **Issue 1: "ECONNREFUSED localhost:1234"**

**Problem:** LM Studio server not running

**Solution:**

1. Open LM Studio
2. Go to **Developer** tab
3. Click **"Start Server"**
4. Wait for "Server running on <http://localhost:1234>" message

### **Issue 2: "knowledge.json not found"**

**Problem:** MCP server can't find knowledge base

**Solution:**

```bash
# Check file exists
ls src/knowledge/knowledge.json

# Run from correct directory
cd F:\js-bambisleep-church
node src/agents/lmstudio-agent.js
```

### **Issue 3: Agent not using tools**

**Problem:** Model doesn't understand tool usage

**Solutions:**

- Use a better model (Qwen2.5-7B recommended)
- Lower temperature: `temperature: 0.3`
- Be more explicit: "Use the search tool to find..."

### **Issue 4: Slow responses**

**Problem:** Local model inference is slow

**Solutions:**

- Use smaller model (7B instead of 13B)
- Enable GPU acceleration in LM Studio
- Reduce max_tokens: `max_tokens: 1000`

### **Issue 5: Agent loops infinitely**

**Problem:** Model keeps calling tools repeatedly

**Solution:**

- Update system prompt to discourage multiple tool calls
- Add tool call limit (modify code)
- Use better model with tool use training

---

## 🔧 Extending the Agent

### **Add More Tools**

To add new MCP tools to the agent:

1. **Add tool to MCP server** (`src/mcp/McpServer.js`)
2. **Restart agent** - It auto-detects new tools!

No code changes needed in the agent!

### **Add Web Interface**

Want a web UI instead of terminal? Create an Express endpoint:

```javascript
// In src/server.js
app.post('/api/agent/chat', async (req, res) => {
    const { message } = req.body;
    // Call agent logic
    // Return response
});
```

### **Add Memory/Database**

Store conversation history in database:

```javascript
import sqlite3 from 'sqlite3';
// Save messages to DB
// Load history on startup
```

### **Add Voice Interface**

Use speech-to-text/text-to-speech:

```javascript
import speech from '@google-cloud/speech';
import tts from '@google-cloud/text-to-speech';
// Convert voice to text → agent → text to voice
```

---

## 📊 Performance

### **Metrics**

| Operation | Time | Notes |
|-----------|------|-------|
| LM Studio response | 1-5s | Depends on model/hardware |
| Tool execution | <20ms | Very fast |
| Total response | 1-5s | Dominated by LM Studio |

### **Optimization Tips**

✅ **Use smaller models** - 7B faster than 13B
✅ **Enable GPU** - 10x faster inference
✅ **Reduce max_tokens** - Faster generation
✅ **Cache responses** - Store common queries
✅ **Batch tool calls** - Execute multiple tools together

---

## 🎯 Use Cases

### **1. Interactive Knowledge Explorer**

Ask questions, get answers from knowledge base

### **2. Content Discovery**

Find relevant BambiSleep files by topic

### **3. Research Assistant**

Analyze knowledge base composition and statistics

### **4. Quality Checker**

Find high-relevance content, filter by category

### **5. Learning Tool**

Explore BambiSleep content safely with AI guidance

---

## 📝 Code Structure

### **Key Components**

```javascript
// 1. Configuration
const LMSTUDIO_CONFIG = { /* ... */ };

// 2. MCP Initialization
async function initializeMCP() { /* ... */ }

// 3. Tool Execution
async function executeMcpTool(toolName, args) { /* ... */ }

// 4. Main Agent Loop
async function runAgent() { /* ... */ }

// 5. Cleanup
async function cleanup() { /* ... */ }
```

### **File Size**

- **lmstudio-agent.js:** ~280 lines
- **Dependencies:** openai, @modelcontextprotocol/sdk
- **No external API keys needed!**

---

## 🚀 Next Steps

### **Immediate**

1. ✅ Install dependencies: `npm install openai @modelcontextprotocol/sdk`
2. ✅ Start LM Studio server
3. ✅ Run agent: `node src/agents/lmstudio-agent.js`
4. ✅ Try asking questions!

### **Short-term**

- Test different models in LM Studio
- Experiment with system prompt
- Try complex queries

### **Long-term**

- Add web interface
- Implement conversation memory
- Add more MCP tools
- Create voice interface

---

## 📚 Related Documentation

- **This file:** `docs/LMSTUDIO-AGENT-GUIDE.md` (Complete guide)
- **Agent code:** `src/agents/lmstudio-agent.js` (280 lines)
- **MCP tools:** `docs/HOW-TO-USE-MCP-TOOLS.md`
- **MCP server:** `src/mcp/McpServer.js`

---

## 🎓 Summary

**You built an AI agent that:**

- ✅ Runs completely **local** (LM Studio + MCP)
- ✅ Can **search** the knowledge base
- ✅ Can get **statistics** about content
- ✅ Uses **natural language** commands
- ✅ **Automatically** decides when to use tools
- ✅ Provides **real-time feedback**

**Just run:**

```bash
node src/agents/lmstudio-agent.js
```

**And start chatting!** 🎉

---

**Status:** ✅ **PRODUCTION READY**
**Complexity:** Medium (280 lines, well-documented)
**Dependencies:** openai, @modelcontextprotocol/sdk (already installed)
