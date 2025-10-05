# Codebase Inventory - BambiSleep Church

**Last Updated:** October 5, 2025
**Project:** js-bambisleep-church
**Branch:** transformation

---

## 📁 Core Application [100%]

### Server Infrastructure

- **src/server.js** [100%] - Express web server, 6 routes, geolocation middleware, port 8888
- **package.json** [100%] - Dependencies, scripts, metadata

### Web Pages (EJS Templates)

- **views/pages/index.ejs** [100%] - Homepage with location display
- **views/pages/knowledge.ejs** [100%] - Knowledge base viewer
- **views/pages/mission.ejs** [100%] - Mission statement
- **views/pages/roadmap.ejs** [100%] - Project roadmap
- **views/pages/agents.ejs** [100%] - Agent management dashboard
- **views/partials/header.ejs** [100%] - Shared header component
- **views/partials/footer.ejs** [100%] - Shared footer with location

---

## 🤖 MCP System [100%]

### MCP Server

- **src/mcp/McpServer.js** [100%] - 290+ lines, stdio/HTTP transport, 3 tools
  - Tool: `search_knowledge` - Search 39-entry knowledge base
  - Tool: `get_knowledge_stats` - Get analytics about entries
  - Tool: `fetch_webpage` - Fetch and extract content from websites [NEW - Oct 5, 2025]

### MCP Tools & Utilities

- **src/mcp/tools/urlFetcher.js** [100%] - 191 lines, URL fetching with caching
- **src/mcp/agentKnowledge.js** [100%] - 1,900+ lines, comprehensive web crawler
  - Functions: crawlAndAnalyze, crawlAndExtractLinks, initializeBambiSleepKnowledge
  - Features: validation, metadata extraction, deduplication, rate limiting

### Knowledge Base

- **src/knowledge/knowledge.json** [100%] - 39 entries (6 official, 1 community, 32 scripts)

---

## 🧠 AI Agents [100%]

### LM Studio Agent

- **src/agents/lmstudio-agent.js** [100%] - 280 lines, NEW (Oct 5, 2025)
  - Connects to LM Studio API (localhost:1234)
  - Spawns MCP server as subprocess
  - Converts MCP tools → OpenAI function calling format
  - Interactive readline chat interface
  - Tool call detection and execution
  - Multi-turn conversation support
  - Error handling (ECONNREFUSED, SIGINT, SIGTERM)
  - Graceful cleanup on exit

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
5. ✅ LM Studio agent (280 lines, full implementation)
6. ✅ Agent documentation (450+ lines)
7. ✅ Installed openai package
8. ✅ Added `npm run agent` script
9. ✅ fetch_webpage tool (Oct 5, 2025) - Agent can now fetch websites!

### Pending

- ⏳ Test LM Studio agent with actual LM Studio instance
- ⏳ Create video/GIF demo of agent usage
- ⏳ Add agent web interface (optional)

---

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| Total Files | 30+ |
| Lines of Code | ~4,800+ |
| MCP Tools | 3 |
| AI Agents | 1 |
| Web Pages | 5 |
| Documentation | 8 files |
| Knowledge Entries | 39 |
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
