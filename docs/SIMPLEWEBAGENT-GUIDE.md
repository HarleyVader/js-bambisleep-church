# SimpleWebAgent - Web-Based AI Agent

## Overview

SimpleWebAgent is a browser-based AI agent that provides real-time chat interface for interacting with BambiSleep Church knowledge base through MCP tools. **No LM Studio required.**

## Features

- 🌐 **Browser-Based**: Full chat interface at `/agents`
- 🔍 **Keyword Detection**: Understands natural language commands
- ⚡ **Real-Time**: Socket.io for instant responses
- 🛠️ **3 MCP Tools**: Search, Stats, Fetch Webpage
- 📱 **Mobile-Friendly**: Responsive design
- 💬 **Rich UI**: Typing indicators, tool badges, markdown formatting

## Quick Start

### 1. Start Server

```bash
npm run start:web
```

Server starts on: `http://localhost:7070`

### 2. Open Chat Interface

Navigate to: `http://localhost:7070/agents`

### 3. Try Commands

```
"search triggers"       → Search knowledge base
"show stats"            → Get knowledge statistics
"fetch bambisleep.info" → Fetch website content
"help"                  → Show available commands
```

## Architecture

```
User Browser
    ↓
Socket.io Client (agent-chat.js)
    ↓
Socket.io Server (server.js)
    ↓
SimpleWebAgent (SimpleWebAgent.js)
    ↓
MCP Tools (McpServer.js)
    ↓
Knowledge Base (knowledge.json)
```

## Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/services/SimpleWebAgent.js` | 310 | Agent service with MCP integration |
| `public/js/agent-chat.js` | 220 | Client-side chat UI |
| `views/pages/agents.ejs` | ~700 | Agent dashboard page |
| `src/server.js` | ~240 | Express + Socket.io server |

## How It Works

### Intent Detection

The agent analyzes user messages for keywords:

- **Search**: "search", "find", "look for" → `search_knowledge`
- **Stats**: "stats", "statistics", "how many" → `get_knowledge_stats`
- **Fetch**: "fetch", "get website", URLs → `fetch_webpage`
- **Help**: "help", "?" → Show help message

### Tool Execution

1. User sends message via Socket.io
2. Agent detects intent from keywords
3. Executes appropriate MCP tool
4. Formats response with markdown
5. Streams back to client in real-time

### Response Formatting

- **Search Results**: Formatted list with titles, descriptions, URLs, relevance
- **Statistics**: Category breakdown, platform distribution, averages
- **Webpage Content**: First 500 chars with total length indicator
- **Help**: Command examples and usage guide

## API

### Socket.io Events

#### Client → Server

**`agent:message`**

```javascript
socket.emit('agent:message', {
  message: 'search triggers'
});
```

#### Server → Client

**`agent:typing`**

```javascript
{
  isTyping: true|false
}
```

**`agent:response`**

```javascript
{
  message: 'Formatted response text',
  tool: 'search_knowledge',
  success: true,
  timestamp: '2025-10-05T...'
}
```

**`agent:error`**

```javascript
{
  error: 'Error message',
  timestamp: '2025-10-05T...'
}
```

## UI Components

### Chat Messages

- **User Messages**: Purple gradient, right-aligned
- **Agent Messages**: White background, left-aligned, tool badges
- **System Messages**: Blue background, centered
- **Error Messages**: Red background

### Features

- **Typing Indicator**: Animated dots while agent processes
- **Tool Badges**: Show which tool was used (🛠️ tool_name)
- **Timestamps**: 12-hour format for each message
- **Auto-Scroll**: Scrolls to latest message automatically
- **Clear Button**: Reset conversation

## Extending

### Add New Intent

Edit `SimpleWebAgent.js`:

```javascript
parseIntent(message) {
  const lowerMsg = message.toLowerCase();

  // Your new intent
  if (lowerMsg.includes('your_keyword')) {
    return {
      tool: 'your_tool_name',
      keywords: this.extractYourData(message)
    };
  }

  // ... existing intents
}
```

### Customize UI

Edit CSS in `agents.ejs`:

```css
.chat-message { /* Your styles */ }
.message-text { /* Your styles */ }
```

### Add New Tool

1. Add tool to `McpServer.js`
2. Add case in `SimpleWebAgent.chat()` method
3. Add formatting in `formatResponse()` method

## Comparison: SimpleWebAgent vs LM Studio Agent

| Feature | SimpleWebAgent | LM Studio Agent |
|---------|----------------|-----------------|
| Interface | Browser | Terminal |
| Dependency | None | LM Studio |
| Intelligence | Keyword-based | AI-powered |
| Setup | Instant | Requires LM Studio |
| Use Case | Quick queries | Complex conversations |
| Mobile Support | ✅ Yes | ❌ No |

## Troubleshooting

**Chat not connecting?**

- Check server is running: `http://localhost:7070`
- Check browser console for Socket.io errors

**Agent not responding?**

- Check MCP server is running (auto-starts with web server)
- Check server logs for agent initialization

**Tools not working?**

- Verify knowledge.json exists (16 entries)
- Check MCP server logs for tool execution errors

## Future Enhancements

- [ ] Conversation history persistence
- [ ] Multi-user chat rooms
- [ ] Voice input/output
- [ ] File upload support
- [ ] Advanced NLP for intent detection
- [ ] Integration with LM Studio as backend option

## See Also

- **LM Studio Agent Guide**: `docs/LMSTUDIO-AGENT-GUIDE.md`
- **MCP Tools Reference**: `docs/HOW-TO-USE-MCP-TOOLS.md`
- **fetch_webpage Tool**: `docs/FETCH-WEBPAGE-TOOL.md`

---

**Built**: October 5, 2025
**Status**: ✅ Production Ready
**Live Demo**: <http://localhost:7070/agents>
