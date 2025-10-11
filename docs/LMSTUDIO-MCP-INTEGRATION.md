# LM Studio MCP Integration Guide

## Overview

The BambiSleep Church application now includes full MCP (Model Context Protocol) server integration with LM Studio, providing seamless access to the knowledge base and tools directly within LM Studio's chat interface.

## Quick Setup for LM Studio

### 1. Install MCP Server Configuration

Copy the `mcp.json` file to your LM Studio configuration:

**Option A: Automatic Installation**

1. Open LM Studio (version 0.3.17+)
2. Go to "Program" tab → "Install" → "Edit mcp.json"
3. Copy the contents from our `mcp.json` file

**Option B: Manual Configuration**

```json
{
  "mcpServers": {
    "bambisleep-church": {
      "command": "node",
      "args": ["src/mcp/McpServer.js"],
      "cwd": "/path/to/js-bambisleep-church"
    }
  }
}
```

### 2. Start the MCP Server

**Local Development:**

```bash
npm run mcp:start
# or
node src/mcp/McpServer.js
```

**HTTP Mode (for remote access):**

```bash
node src/mcp/McpServer.js --http
# Server runs on http://localhost:9999
```

### 3. Available Tools in LM Studio

Once configured, you'll have access to these tools in LM Studio:

#### 🔍 **search_knowledge**

Search the BambiSleep knowledge base

- **Usage**: "Search for information about sleep triggers"
- **Parameters**: `query` (string), `category` (optional), `limit` (optional)

#### 📊 **get_knowledge_stats**

Get statistics about the knowledge base

- **Usage**: "Show me knowledge base statistics"
- **Returns**: Total entries, categories, recent additions

#### 🌐 **fetch_webpage**

Fetch and analyze webpage content

- **Usage**: "Fetch content from <https://example.com>"
- **Parameters**: `url` (string)

## Integration Features

### LM Studio Compatibility

- ✅ **Stdio Transport**: Local MCP server integration
- ✅ **HTTP Transport**: Remote server access
- ✅ **Health Checks**: `/health` endpoint for monitoring
- ✅ **Metadata**: `/mcp/info` endpoint with server information
- ✅ **Error Handling**: Graceful error responses
- ✅ **CORS Support**: Cross-origin requests enabled

### Advanced Configuration

**Environment Variables:**

```bash
# Enable HTTP transport
MCP_TRANSPORT=http

# Set custom HTTP port (default: 9999)
MCP_HTTP_PORT=9999

# Enable remote access
MCP_ALLOW_REMOTE=true
```

**Package.json Scripts:**

```json
{
  "scripts": {
    "mcp:start": "node src/mcp/McpServer.js",
    "mcp:http": "node src/mcp/McpServer.js --http",
    "mcp:dev": "nodemon src/mcp/McpServer.js"
  }
}
```

## Usage Examples in LM Studio

### Basic Knowledge Search

```
User: Search the knowledge base for "sleep induction"
LM Studio: [Uses search_knowledge tool automatically]
Result: Returns relevant BambiSleep knowledge entries about sleep induction techniques
```

### Web Content Analysis

```
User: Analyze the content at https://example.com/sleep-research
LM Studio: [Uses fetch_webpage tool automatically]
Result: Fetches and summarizes the webpage content
```

### Knowledge Statistics

```
User: What information is available in the knowledge base?
LM Studio: [Uses get_knowledge_stats tool automatically]
Result: Shows total entries, categories, and recent updates
```

## Troubleshooting

### Common Issues

**LM Studio can't find the MCP server:**

1. Ensure the path in `mcp.json` is correct
2. Verify Node.js is in your system PATH
3. Check that the MCP server starts without errors

**Tools not appearing in LM Studio:**

1. Restart LM Studio after editing `mcp.json`
2. Check the LM Studio console for MCP connection errors
3. Verify the MCP server is running (`npm run mcp:start`)

**Connection errors:**

1. For HTTP mode, check if port 9999 is available
2. Verify firewall settings allow local connections
3. Check server logs for detailed error messages

### Debug Commands

**Test MCP server locally:**

```bash
# Test stdio mode
node src/mcp/McpServer.js

# Test HTTP mode
node src/mcp/McpServer.js --http
curl http://localhost:9999/health
```

**Check LM Studio integration:**

```bash
# Verify tools are available
curl http://localhost:9999/mcp/info

# Test knowledge search
curl -X POST http://localhost:9999/mcp \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/call","params":{"name":"search_knowledge","arguments":{"query":"test"}}}'
```

## Security Considerations

### Safe Practices

- ✅ **Local by default**: Stdio transport for local-only access
- ✅ **Explicit HTTP**: HTTP mode requires `--http` flag
- ✅ **Input validation**: All tool parameters are validated
- ✅ **Error handling**: No sensitive information in error messages

### Production Deployment

- Use environment variables for configuration
- Enable HTTPS for remote deployments
- Implement authentication for HTTP endpoints
- Monitor server logs for unusual activity

## Benefits of LM Studio Integration

### Enhanced User Experience

- **Seamless Integration**: Tools appear naturally in LM Studio chat
- **Context Awareness**: Models can use knowledge base in responses
- **Real-time Data**: Live web scraping and content analysis
- **Knowledge Discovery**: Easy exploration of BambiSleep content

### Developer Benefits

- **Standard Protocol**: Uses official MCP specification
- **Dual Transport**: Both local and remote access options
- **Easy Deployment**: Simple setup with existing infrastructure
- **Extensible**: Easy to add new tools and capabilities

## Future Enhancements

### Planned Features

1. **Advanced Search**: Vector embeddings for semantic search
2. **Content Generation**: AI-powered content creation tools
3. **User Personalization**: Adaptive responses based on preferences
4. **Multi-modal Support**: Image and audio content analysis
5. **Real-time Sync**: Live updates from remote knowledge sources

The BambiSleep Church MCP integration transforms LM Studio into a powerful knowledge exploration and content analysis platform, providing seamless access to curated BambiSleep resources and web content analysis capabilities.
