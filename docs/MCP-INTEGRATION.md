# MCP Integration Documentation
## BambiSleep Church - Model Context Protocol Implementation

### Overview
Successfully integrated the Model Context Protocol (MCP) TypeScript SDK into the BambiSleep Church web application, creating an automatic tool discovery and loading system.

### 🎯 What Was Implemented

#### 1. **MCP Server Architecture** (`src/mcp/`)
- **`server.js`** - Main MCP server with BambiSleep Church tools
- **`toolbox.js`** - Automatic tool discovery and loading system  
- **`tools/bambi-tools.js`** - Custom BambiSleep-specific tools

#### 2. **Core BambiSleep Tools**
- 🔍 **Knowledge Search** - Search the BambiSleep knowledge base
- 🛡️ **Safety Information** - Get safety guidelines and best practices
- 🏛️ **Church Status** - Check development progress and milestones
- 📋 **Community Guidelines** - Access community rules and conduct
- 📚 **Resource Recommendations** - Get personalized resource suggestions

#### 3. **Automatic Tool Discovery System**
- **GitHub Repository Integration** - Load tools from GitHub repos
- **NPM Package Support** - Framework for NPM-based toolboxes
- **Direct URL Loading** - Fetch tools from any HTTP endpoint
- **Builtin Toolboxes** - Pre-configured tool collections
- **Security Validation** - Code safety checks before evaluation
- **Caching System** - 5-minute cache for external tool discovery

#### 4. **Express Server Integration**
- **HTTP Transport** - MCP endpoint at `/mcp`
- **Status API** - Server status at `/api/mcp/status`
- **Tools API** - Tool listing at `/api/mcp/tools`
- **Web Interface** - Interactive tool testing at `/mcp-tools`

### 🔧 Configuration

#### Environment Variables (`.env`)
```bash
# MCP Configuration
MCP_ENABLED=true
MCP_PORT=3001
MCP_AUTO_DISCOVERY=true
MCP_CACHE_TIMEOUT=300000
MCP_MAX_TOOLS=50
```

#### Toolbox Sources (`src/utils/config.js`)
```javascript
toolboxSources: [
    {
        type: 'builtin',
        name: 'common-web-tools',
        enabled: true
    },
    {
        type: 'github',
        name: 'external-toolbox',
        owner: 'example',
        repo: 'mcp-tools',
        path: 'tools',
        enabled: false
    }
]
```

### 🚀 Usage Examples

#### 1. **MCP Client Connection**
Connect any MCP client to: `http://localhost:7070/mcp`

#### 2. **VS Code Integration**
```bash
code --add-mcp "{\"name\":\"bambisleep-church\",\"type\":\"http\",\"url\":\"http://localhost:7070/mcp\"}"
```

#### 3. **Claude Integration**
```bash
claude mcp add --transport http bambisleep-church http://localhost:7070/mcp
```

#### 4. **MCP Inspector**
```bash
npx @modelcontextprotocol/inspector
# Connect to: http://localhost:7070/mcp
```

### 📊 Available Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `search-knowledge` | Search BambiSleep knowledge base | query, category, limit |
| `get-safety-info` | Get safety guidelines | topic |
| `church-status` | Check church development status | detailed |
| `community-guidelines` | View community rules | section |
| `resource-recommendations` | Get personalized recommendations | experience, interests, safetyFocus |

### 🔗 API Endpoints

- **Main MCP**: `POST /mcp` - JSON-RPC 2.0 endpoint
- **Status**: `GET /api/mcp/status` - Server status and statistics  
- **Tools**: `GET /api/mcp/tools` - Available tools listing
- **Web UI**: `GET /mcp-tools` - Interactive tool testing interface

### 🛡️ Security Features

#### Tool Loading Security
- Code pattern validation before evaluation
- Blocked dangerous operations (fs, child_process, eval)
- Sandboxed execution environment
- URL validation for external sources

#### Input Validation
- Zod schema validation for all tool parameters
- Type checking and sanitization
- Rate limiting ready (can be added)
- CORS support for browser clients

### 🏗️ Architecture Highlights

#### Modular Design
```
src/mcp/
├── server.js           # Main MCP server
├── toolbox.js         # Tool discovery engine
└── tools/
    └── bambi-tools.js  # BambiSleep-specific tools
```

#### Automatic Discovery Flow
1. **Initialization** - Load configuration and builtin tools
2. **External Discovery** - Fetch from configured sources  
3. **Validation** - Security and format checks
4. **Registration** - Add to MCP server with proper schemas
5. **Caching** - Store results for performance

#### Integration Points
- **Express Server** - HTTP transport integration
- **SimpleWebAgent** - Chat integration with MCP tools
- **Knowledge Base** - Direct access to BambiSleep resources
- **Configuration** - Environment-driven setup

### 🎨 Web Interface Features

The `/mcp-tools` page provides:
- **Real-time Status** - Live MCP server status checking
- **Interactive Forms** - User-friendly tool parameter input
- **Result Display** - Formatted tool output with syntax highlighting
- **Error Handling** - Clear error messages and troubleshooting
- **Cyberpunk Styling** - Consistent with BambiSleep Church theme

### 📈 Extensibility

#### Adding New Tools
1. Create tool definition in `bambi-tools.js`
2. Add Zod schema validation
3. Implement handler function
4. Tool automatically appears in MCP and web interface

#### External Toolbox Integration
1. Add source to config `toolboxSources`
2. Implement required format (name, description, handler)
3. Tools auto-discovered and loaded on server start

### 🔍 Testing Commands

```bash
# Check server status
curl http://localhost:7070/api/mcp/status

# List available tools  
curl http://localhost:7070/api/mcp/tools

# Web interface
open http://localhost:7070/mcp-tools

# MCP Inspector
npx @modelcontextprotocol/inspector
```

### 📝 Next Steps

1. **Enhanced Security** - Add authentication and rate limiting
2. **Tool Marketplace** - Public toolbox repository
3. **WebSocket Transport** - Real-time MCP communication  
4. **Plugin System** - Dynamic tool loading and unloading
5. **Monitoring** - Tool usage analytics and performance metrics
6. **Documentation** - Auto-generated tool documentation

---

## 🎉 Success Summary

✅ **MCP TypeScript SDK** integrated successfully  
✅ **Automatic Tool Discovery** system implemented  
✅ **5 Custom BambiSleep Tools** created and tested  
✅ **HTTP Transport** working with Express server  
✅ **Web Interface** for interactive tool testing  
✅ **Security Validation** for external tool loading  
✅ **Builtin Tool Collections** for common functionality  
✅ **Configuration System** for flexible deployment  

The BambiSleep Church now has a fully functional MCP server that can:
- Automatically discover and load tools from various sources
- Provide BambiSleep-specific functionality through standardized tools
- Integrate with any MCP-compatible client or AI system
- Scale with additional external toolboxes as the community grows

**Test it now**: Visit `http://localhost:7070/mcp-tools` to interact with the tools!