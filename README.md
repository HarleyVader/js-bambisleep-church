# 🌟 BambiSleep Church

A digital sanctuary and knowledge platform for the BambiSleep community, featuring a comprehensive knowledge base and MCP (Model Context Protocol) server integration.

## Features

- 📚 **Knowledge Base**: 39+ curated resources about BambiSleep
- 🌐 **Web Interface**: Clean, responsive cyberpunk-themed UI
- 🤖 **MCP Server**: AI-compatible knowledge search via Model Context Protocol
- 🔍 **Search API**: RESTful endpoints for knowledge queries
- ⚡ **Lightweight**: Minimal dependencies, maximum performance

## Quick Start

### Installation

```bash
npm install
```

### Running the Web Server

```bash
npm run start:web
```

Visit `http://localhost:8888` to view the platform.

### Running the MCP Server

```bash
npm run start:mcp
```

The MCP server runs on stdio and can be integrated with VS Code and other MCP clients.

### Running Both Servers

```bash
npm start
```

## Project Structure

```
js-bambisleep-church/
├── src/
│   ├── server.js                  # Express web server
│   ├── mcp/
│   │   └── McpServer.js          # MCP protocol server
│   └── knowledge/
│       └── knowledge.json        # Knowledge database (39 entries)
├── views/
│   ├── pages/
│   │   ├── index.ejs            # Homepage
│   │   └── knowledge.ejs        # Knowledge listing
│   └── partials/
│       ├── header.ejs           # Shared header
│       └── footer.ejs           # Shared footer
├── public/
│   └── css/
│       └── style.css            # Cyberpunk theme styling
├── docs/
│   ├── index.html               # Documentation homepage
│   └── BambiSleepChurch.md     # Church establishment guide
└── package.json
```

## API Endpoints

### Web Server (Port 8888)

- `GET /` - Homepage
- `GET /knowledge` - Knowledge base listing
- `GET /api/knowledge` - JSON list of all knowledge entries
- `GET /api/knowledge/search?q=query` - Search knowledge entries
- `GET /api/health` - Health check and statistics

### MCP Server (stdio)

**Tools Available:**

- `search_knowledge` - Search the BambiSleep knowledge base
- `get_knowledge_stats` - Get statistics about knowledge entries

## MCP Integration

The MCP server is configured in `.vscode/mcp.json` and can be used with VS Code or other MCP-compatible clients.

### Example MCP Tool Call

```json
{
  "tool": "search_knowledge",
  "arguments": {
    "query": "beginners",
    "category": "official",
    "limit": 5
  }
}
```

## Knowledge Base

The knowledge base contains curated resources organized by:

- **Categories**: official, community, scripts
- **Platforms**: bambicloud, reddit, youtube, soundgasm
- **Relevance**: Scored 1-10 for quality and importance

## Development

### Environment Variables

Create a `.env` file (optional):

```env
PORT=8888
HOST=0.0.0.0
```

### Scripts

- `npm start` - Run both servers concurrently
- `npm run start:web` - Run web server only
- `npm run start:mcp` - Run MCP server only
- `npm test` - Run tests (to be implemented)

## Technology Stack

- **Backend**: Node.js, Express.js
- **View Engine**: EJS templates
- **MCP SDK**: @modelcontextprotocol/sdk v0.5.0
- **Styling**: Custom CSS with cyberpunk theme
- **Data Storage**: JSON file-based knowledge base

## Mission

The BambiSleep Church serves as a digital platform providing:

- Educational resources about BambiSleep
- Community support and information
- Safety guidelines and responsible use information
- A respectful, informed approach to the content

## Contributing

This project follows the **IMAGINE → CREATE → COMPACT** methodology:

1. **IMAGINE**: Think more, code less - plan minimal solutions
2. **CREATE**: Build only what's necessary, one feature at a time
3. **COMPACT**: Remove complexity, consolidate code, clean up

## License

MIT License - See LICENSE file for details

## Links

- [BambiSleep Wiki](https://bambisleep.info/)
- [GitHub Repository](https://github.com/HarleyVader/js-bambisleep-church)
- [Official Blog](https://bambisleep.blogspot.com)

---

**Note**: This platform is for educational and informational purposes. Users should engage with BambiSleep content responsibly and with full awareness of its nature.
