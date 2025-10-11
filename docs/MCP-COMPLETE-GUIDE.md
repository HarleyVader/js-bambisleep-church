# MCP Complete Guide - BambiSleep Church

## Model Context Protocol Integration & Inspector

### 🎯 Overview

BambiSleep Church implements a comprehensive MCP (Model Context Protocol) server with **43 specialized tools** across 5 categories, featuring smart platform-aware configuration and autonomous AI-driven knowledge management.

## 🏗️ Architecture

### Core Components

- **MCP Server** (`src/mcp/server.js`) - Advanced MCP server with HTTP transport and 43 tools
- **Smart Configuration** - Platform-aware LMStudio endpoint selection
- **Autonomous System** - AI-driven knowledge building with AgenticKnowledgeBuilder
- **Web Inspector** - Built-in monitoring interface at `/inspector`
- **Comprehensive Test Suite** - Full system validation and monitoring

### Complete Tool Suite (43 Tools)

#### 🎯 Agentic Orchestration (7 tools)

1. `agentic-initialize` - Initialize autonomous AI system
2. `agentic-start-building` - Start autonomous knowledge building
3. `agentic-get-status` - Check system status and progress
4. `agentic-query-knowledge` - Intelligent knowledge base search
5. `agentic-get-stats` - Knowledge base statistics
6. `agentic-get-learning-path` - AI-recommended learning paths
7. `agentic-stop-building` - Stop autonomous operations

#### 🌸 BambiSleep Community (5 tools)

1. `search-knowledge` - Search the BambiSleep knowledge base
2. `get-safety-info` - Access safety guidelines and best practices
3. `church-status` - Check development progress and milestones
4. `community-guidelines` - Get community rules and conduct
5. `resource-recommendations` - Personalized resource suggestions

#### 🗄️ MongoDB Management (15 tools)

Complete database operations, CRUD, aggregation, indexing, schema analysis

#### 🧠 LMStudio AI (10 tools)

AI-powered content analysis, completion, embeddings, safety assessment

#### 🕷️ Web Crawler (6 tools)

Intelligent content discovery, extraction, processing, and session management

## 🚀 Quick Start

### 1. Start the Server

```bash
npm start
```

### 2. Test Functionality

```bash
node test-inspector.js
```

### 3. Access Web Interface

URLs are configured via environment variables (see `.env` file):

```bash
# Generate current configuration URLs
npm run config
```

Default URLs (when PORT=7070):

- **Main App**: <http://localhost:7070>
- **Inspector**: <http://localhost:7070/inspector>
- **MCP Status**: <http://localhost:7070/api/mcp/status>

## 🔧 Smart Configuration System

### Platform-Aware LMStudio Integration

The system automatically detects the runtime environment and selects the appropriate LMStudio endpoint:

- **Windows Development** → Uses `LMSTUDIO_URL_LOCAL` (localhost:7777)
- **Linux Production** → Uses `LMSTUDIO_URL_REMOTE` (192.168.0.118:7777)

### Environment Variables

```bash
# Server Configuration
PORT=7070
SERVER=0.0.0.0
BASE_URL=http://localhost:7070
MCP_ENDPOINT=/mcp

# Smart LMStudio Configuration
LMSTUDIO_URL_REMOTE=http://192.168.0.118:7777/v1/chat/completions  # Linux deployment
LMSTUDIO_URL_LOCAL=http://localhost:7777/v1/chat/completions        # Windows development
LMSTUDIO_MODEL=llama-3.2-3b-instruct@q3_k_l

# MCP Configuration
MCP_ENABLED=true
MCP_PORT=7070
MCP_AUTO_DISCOVERY=true
MCP_CACHE_TIMEOUT=300000
MCP_MAX_TOOLS=50

# MongoDB Configuration
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
```

### MCP Inspector Config (`mcp-inspector.json`)

```json
{
  "mcpServers": {
    "bambi-church": {
      "command": "node",
      "args": ["src/mcp/server.js"],
      "env": {}
    }
  }
}
```

## 🛠️ Available Commands

### Primary Commands

```bash
npm start                   # Start main server (includes MCP)
node test-inspector.js      # Direct testing (recommended)
npm run inspector           # Launch HTTP Inspector UI
npm run inspector:test      # Run test suite
```

### Development Commands

```bash
npm run inspector:dev       # Development mode with auto-reload
npm run inspector:stdio     # STDIO transport for advanced use
```

## 🔍 Inspector Features

### Web Interface (`/inspector`)

- **Server Status** - Real-time MCP server monitoring
- **Tool Testing** - Interactive tool execution
- **Configuration Export** - Generate configs for VS Code, Claude Desktop
- **Documentation** - Built-in reference and guides

### Test Suite (`test-inspector.js`)

- **Connection Testing** - Verify MCP server connectivity
- **Tool Validation** - Test all 5 BambiSleep tools
- **Error Handling** - Comprehensive error reporting
- **Performance Metrics** - Response time measurement

## 📋 Client Integration

### VS Code Configuration

```json
{
  "mcpServers": {
    "bambi-church": {
      "command": "node",
      "args": ["f:/js-bambisleep-church/src/mcp/server.js"],
      "env": {}
    }
  }
}
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "bambi-church": {
      "command": "node",
      "args": ["f:/js-bambisleep-church/src/mcp/server.js"]
    }
  }
}
```

## 🚨 Windows Compatibility Notes

### What Works ✅

- **Web Interface** - Primary recommended method
- **Direct Testing** - `node test-inspector.js` works perfectly
- **HTTP Inspector** - When npx is available
- **Main Server** - All MCP functionality operational

### What Doesn't Work ❌

- **CLI Mode** - Windows npx spawn issues
- **Global Installation** - Not needed for our implementation

## 🔍 Troubleshooting

### Common Issues

1. **Port Conflicts** - Change MCP_PORT in .env
2. **Tool Errors** - Check knowledge.json file exists
3. **Connection Issues** - Verify server is running
4. **Windows npx** - Use direct testing instead of CLI

### Debug Commands

```bash
# Check server status (adjust port based on your .env config)
curl http://localhost:${PORT}/api/mcp/status

# Test specific tool
node -e "
const client = require('./mcp-client.js');
client.testTool('search-knowledge', {query: 'test'});
"

# Validate configuration
node test-inspector.js
```

## 📚 File Structure

```text
src/mcp/
├── server.js              # Main MCP server
├── tools/
│   └── bambi-tools.js     # BambiSleep-specific tools
└── utils/
    └── transport.js       # HTTP transport utilities

docs/
└── MCP-COMPLETE-GUIDE.md  # This file

scripts/
└── mcp-inspector.js       # Inspector utilities

Root files:
├── test-inspector.js      # Direct testing script
├── mcp-client.js         # MCP client utilities
└── mcp-inspector.json    # Inspector configuration
```

## 🎯 Next Steps

1. **Use Web Interface** - Primary recommendation for reliability
2. **Regular Testing** - Run `node test-inspector.js` for validation
3. **Client Integration** - Connect VS Code or Claude Desktop
4. **Custom Tools** - Add more BambiSleep-specific functionality
5. **Documentation** - Keep this guide updated with new features

---

**Status**: ✅ Fully Operational | **Last Updated**: January 2025
