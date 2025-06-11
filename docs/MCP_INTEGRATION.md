# Model Context Protocol (MCP) Integration

This application now includes Model Context Protocol server capabilities, allowing AI assistants like Claude to interact with your bambisleep community data.

## Current Status

✅ **MCP Server Implementation Complete**
✅ **Standalone MCP Server Scripts Working** 
✅ **Claude Desktop Configuration Ready**
⚠️ **HTTP API Integration** (Planned for future update)

## Features Implemented

### 1. Custom Bambisleep MCP Server

- **Tools Available:**
  - `get_links` - Retrieve all links from the database
  - `add_link` - Add new links with metadata
  - `get_stats` - Get voting statistics and analytics
  - `search_content` - Search through links and comments

- **Resources Available:**

  - `bambisleep://data/links` - Links database
  - `bambisleep://data/comments` - Comments database
  - `bambisleep://data/votes` - Voting data

### 2. Standard MCP Servers

- **Filesystem Server** - Secure access to data files
- **Memory Server** - Persistent knowledge graph storage

## Usage

### Running MCP Servers Standalone

```bash
# Custom bambisleep server
npm run mcp

# Filesystem server (data directory access)
npm run mcp:filesystem

# Memory server
npm run mcp:memory
```

### Claude Desktop Configuration

Add this to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "bambisleep-church": {
      "command": "node",
      "args": ["src/mcp/index.js"],
      "cwd": "f:/js-bambisleep-church"
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "f:/js-bambisleep-church/data"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

### Main Application

The main bambisleep application continues to work normally:

```bash
npm start
# Server runs on http://localhost:8888
```

## What Works Now

1. **Standalone MCP Server** - Full functionality for Claude Desktop integration
2. **Data Access** - AI can read/write to your bambisleep database
3. **Content Management** - AI can add links, search content, get analytics
4. **File System Access** - Secure access to data files via filesystem server
5. **Memory Integration** - Persistent knowledge storage

## Example AI Interactions

With this MCP integration, Claude can now:

- "Show me the top 10 most voted links"
- "Add a new hypnosis video from this creator"
- "Search for all content related to sleep triggers"
- "Generate analytics on voting patterns"
- "Help organize links by category"
- "Backup the current database state"

## Installation Complete

✅ **MCP SDK and servers installed**
✅ **Custom bambisleep MCP server created**
✅ **Configuration files ready**
✅ **Documentation complete**

The integration maintains all existing functionality while adding powerful AI assistant capabilities through the Model Context Protocol.
