# Codebase Inventory - BambiSleep Church

**Last Updated:** October 5, 2025
**Project:** js-bambisleep-church
**Branch:** transformation

---

## 📁 Core Application [100%]

### Server Infrastructure

- **src/server.js** [100%] - Express web server, Socket.io integration, 6 routes, geolocation middleware, port 7070
  - Socket.io real-time chat for SimpleWebAgent
  - Agent initialization on startup
  - Graceful cleanup on exit
- **package.json** [100%] - Dependencies, scripts, metadata

### Web Pages (EJS Templates)

- **views/pages/index.ejs** [100%] - Homepage with location display
- **views/pages/knowledge.ejs** [100%] - Knowledge base viewer
- **views/pages/mission.ejs** [100%] - Mission statement
- **views/pages/roadmap.ejs** [100%] - Project roadmap
- **views/pages/agents.ejs** [100%] - Agent dashboard with live chat interface ⭐ UPGRADED
- **views/partials/header.ejs** [100%] - Shared header component
- **views/partials/footer.ejs** [100%] - Shared footer with location

### Static Assets

- **public/js/agent-chat.js** [100%] - 220 lines, Socket.io chat client ⭐ NEW
- **public/css/** [100%] - Stylesheets
- **public/favicon.ico** [100%] - Website icon + PWA assets

---

## 🤖 MCP System [100%]

### MCP Server

- **src/mcp/McpServer.js** [100%] - 290+ lines, stdio/HTTP transport, 3 tools
  - Tool: `search_knowledge` - Search knowledge base with filters
  - Tool: `get_knowledge_stats` - Get analytics about entries
  - Tool: `fetch_webpage` - Fetch and extract content from websites

### MCP Tools & Utilities

- **src/mcp/tools/urlFetcher.js** [100%] - 191 lines, URL fetching with caching
- **src/mcp/agentKnowledge.js** [100%] - 1,900+ lines, comprehensive web crawler
  - Functions: crawlAndAnalyze, crawlAndExtractLinks, initializeBambiSleepKnowledge
  - Features: validation, metadata extraction, deduplication, rate limiting

### Knowledge Base

- **src/knowledge/knowledge.json** [100%] - 16 entries (BambiSleep wiki content)

---

## 🧠 AI Agents [100%]

### LM Studio Agent (Terminal-Based)

- **src/agents/lmstudio-agent.js** [100%] - 280 lines, CLI agent
  - Connects to LM Studio API (localhost:1234)
  - Spawns MCP server as subprocess
  - Converts MCP tools → OpenAI function calling format
  - Interactive readline chat interface
  - Tool call detection and execution
  - Multi-turn conversation support
  - Error handling (ECONNREFUSED, SIGINT, SIGTERM)
  - Graceful cleanup on exit

### SimpleWebAgent (Browser-Based) ⭐ NEW

- **src/services/SimpleWebAgent.js** [100%] - 310 lines, web agent service
  - Keyword-based intent detection (NO LM Studio dependency)
  - MCP tools integration (search, stats, fetch)
  - Socket.io real-time communication
  - Help system with command examples
  - Formatted response rendering (JSON → Markdown)
  - Error handling and cleanup
- **public/js/agent-chat.js** [100%] - 220 lines, client-side chat UI
  - Socket.io client integration
  - Real-time message streaming
  - Typing indicators
  - Tool execution badges
  - Markdown formatting support
  - Auto-scroll and timestamp display
  - Clear chat functionality

---

## 📚 Documentation [100%]

### Guides

- **docs/LMSTUDIO-AGENT-GUIDE.md** [100%] - 450+ lines, comprehensive agent guide
  - Quick start, architecture, usage examples
  - Troubleshooting, extension guides
- **docs/FETCH-WEBPAGE-TOOL.md** [100%] - NEW (Oct 5, 2025) - fetch_webpage tool documentation
- **docs/HOW-TO-USE-MCP-TOOLS.md** [100%] - 616 lines, MCP tools reference
  - 5 usage methods (Claude, CLI, SDK, LM Studio, JSON-RPC)
- **docs/SITE-FETCHER-GUIDE.md** [100%] - 450+ lines, site fetcher documentation
  - Web interface, API endpoints, code usage
- **docs/BambiSleepChurch.md** [100%] - Project overview
- **docs/explained.md** [100%] - MCP architecture explanation
- **docs/tools-reference.md** [100%] - MCP tools API reference
- **docs/fetch-webpage-analysis.md** [100%] - Website fetcher analysis

---

## 🎨 Static Assets [100%]

### Public Files

- **public/css/** [100%] - Stylesheets
- **public/favicon.ico** [100%] - Website icon
- **public/android-chrome-*.png** [100%] - Android icons
- **public/apple-touch-icon.png** [100%] - iOS icon
- **public/site.webmanifest** [100%] - PWA manifest

---

## 🧪 Testing [50%]

### Test Files

- **test/lmstudio-integration.test.js** [100%] - LM Studio integration tests
- **LM Studio Agent** [0%] - Not yet tested (requires LM Studio running)

---

## ⚙️ Configuration [100%]

### Build Scripts (package.json)

- `npm start` - Start MCP server (HTTP) + web server
- `npm run start:stdio` - Start MCP server (stdio) + web server
- `npm run start:mcp` - Start MCP server only (HTTP)
- `npm run start:web` - Start web server only
- `npm run agent` - Start LM Studio agent [NEW]
- `npm test` - Run Jest tests
- `npm run test:lmstudio` - Run LM Studio integration tests

---

## 📦 Dependencies [100%]

### Core

- **express** v5.1.0 - Web server
- **ejs** v3.1.10 - Template engine
- **@modelcontextprotocol/sdk** v0.5.0 - MCP protocol
- **openai** - LM Studio API integration [NEW]

### Features

- **geoip-lite** v1.4.10 - IP geolocation
- **axios** v1.9.0 - HTTP client
- **cheerio** v1.1.0 - HTML parsing
- **cors** v2.8.5 - CORS middleware
- **marked** v12.0.0 - Markdown parsing
- **node-cron** v4.1.0 - Task scheduling
- **socket.io** v4.8.1 - WebSocket support
- **p-limit** v6.2.0 - Concurrency control

### Dev Tools

- **jest** v30.0.0 - Testing framework
- **concurrently** v9.1.2 - Run multiple commands

---

## 🚀 Recent Changes (Oct 5, 2025)

### Completed

1. ✅ Geolocation feature (geoip-lite, middleware, APIs)
2. ✅ MCP documentation (3 comprehensive docs)
3. ✅ Site fetcher documentation
4. ✅ MCP tools usage guide (616 lines)
5. ✅ LM Studio agent (280 lines, CLI terminal agent)
6. ✅ Agent documentation (450+ lines)
7. ✅ Installed openai package
8. ✅ Added `npm run agent` script
9. ✅ fetch_webpage tool (Oct 5, 2025)
10. ✅ **SimpleWebAgent (310 lines, web-based chat agent)** ⭐ NEW
11. ✅ **Socket.io integration for real-time chat** ⭐ NEW
12. ✅ **Agent chat interface in agents.ejs** ⭐ NEW
13. ✅ **Client-side chat UI (agent-chat.js, 220 lines)** ⭐ NEW
14. ✅ **Port changed from 8888 to 7070**
15. ✅ **Removed gradient animations from mission/roadmap**

### Implementation Notes

- **SimpleWebAgent**: No LM Studio dependency, keyword-based, works in browser
- **Features**: Search knowledge, get stats, fetch webpages, help system
- **Real-time**: Socket.io for instant responses
- **UI**: Professional chat interface with typing indicators, tool badges, markdown formatting
- **Mobile-friendly**: Responsive design, touch-optimized

---

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| Total Files | 35+ |
| Lines of Code | ~5,800+ |
| MCP Tools | 3 |
| AI Agents | 2 (LM Studio + SimpleWebAgent) |
| Web Pages | 5 |
| Documentation | 8 files |
| Knowledge Entries | 16 |
| Dependencies | 15 |
| Dev Dependencies | 3 |

---

## 🎯 Status Summary

- **Core Application:** ✅ Production Ready
- **MCP System:** ✅ Production Ready
- **LM Studio Agent:** ✅ Code Complete, Testing Pending
- **Documentation:** ✅ Comprehensive
- **Testing:** 🔄 In Progress

**Overall Status:** 95% Complete - Agent ready for testing
