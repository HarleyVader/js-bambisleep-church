# MCP Complete Guide - BambiSleep Church
## Model Context Protocol Integration & Inspector

### 🎯 Overview
BambiSleep Church successfully integrates the Model Context Protocol (MCP) with a comprehensive inspector system for monitoring, testing, and configuration management.

## 🏗️ Architecture

### Core Components
- **MCP Server** (`src/mcp/server.js`) - Main MCP server with HTTP transport
- **BambiSleep Tools** - 5 specialized tools for community resources
- **Web Inspector** - Built-in monitoring interface at `/inspector`
- **Test Suite** - Comprehensive validation system

### BambiSleep Tools
1. 🔍 **search-knowledge** - Search the BambiSleep knowledge base
2. 🛡️ **get-safety-info** - Access safety guidelines and best practices
3. 🏛️ **church-status** - Check development progress and milestones
4. 📋 **community-guidelines** - Get community rules and conduct
5. 📚 **resource-recommendations** - Personalized resource suggestions

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
- **Main App**: http://localhost:7070
- **Inspector**: http://localhost:7070/inspector
- **MCP Status**: http://localhost:7070/api/mcp/status

## 🔧 Configuration

### Environment Variables
```bash
# MCP Configuration
MCP_ENABLED=true
MCP_PORT=3001
MCP_AUTO_DISCOVERY=true
MCP_CACHE_TIMEOUT=300000
MCP_MAX_TOOLS=50

# Server Configuration
PORT=7070
NODE_ENV=development
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
# Check server status
curl http://localhost:7070/api/mcp/status

# Test specific tool
node -e "
const client = require('./mcp-client.js');
client.testTool('search-knowledge', {query: 'test'});
"

# Validate configuration
node test-inspector.js
```

## 📚 File Structure
```
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