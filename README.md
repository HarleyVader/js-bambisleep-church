# BambiSleep Church 🏛️

A digital sanctuary for the BambiSleep community, featuring real-time chat, comprehensive knowledge base, and **Model Context Protocol (MCP)** integration.

## ✨ Features

- 🏛️ **Digital Church Community** - Building toward Austrian religious recognition
- 📚 **Knowledge Base** - Curated BambiSleep resources and safety information
- 💬 **Real-time Chat** - Socket.IO powered community chat
- 🔧 **MCP Integration** - Automatic tool discovery and AI agent compatibility
- 🛡️ **Safety Focus** - Comprehensive safety guidelines and best practices
- 🌍 **Geolocation Tracking** - Privacy-conscious visitor analytics

## 🚀 Quick Start

1. **Clone the repository**:

```bash
git clone https://github.com/HarleyVader/js-bambisleep-church.git
cd js-bambisleep-church
```

2. **Install dependencies**:

```bash
npm install
```

3. **Start the server**:

```bash
npm start
```

4. **Visit the application**:
   - Main site: `http://localhost:7070`
   - MCP Tools: `http://localhost:7070/mcp-tools`
   - Chat Agent: `http://localhost:7070/agents`

## 🔧 MCP Integration

This project includes a full **Model Context Protocol** implementation with automatic tool discovery:

### Available Tools

- 🔍 **Knowledge Search** - Search BambiSleep resources
- 🛡️ **Safety Information** - Get safety guidelines
- 🏛️ **Church Status** - Check development progress
- 📋 **Community Guidelines** - Access community rules
- 📚 **Resource Recommendations** - Personalized suggestions

### MCP Endpoints

- **Server**: `POST http://localhost:7070/mcp` (JSON-RPC 2.0)
- **Status**: `GET /api/mcp/status`
- **Tools**: `GET /api/mcp/tools`
- **Web UI**: `GET /mcp-tools`

### Client Connections

**VS Code Integration**:

```bash
code --add-mcp "{\"name\":\"bambisleep-church\",\"type\":\"http\",\"url\":\"http://localhost:7070/mcp\"}"
```

**MCP Inspector**:

```bash
npx @modelcontextprotocol/inspector
# Connect to: http://localhost:7070/mcp
```

**Claude Integration**:

```bash
claude mcp add --transport http bambisleep-church http://localhost:7070/mcp
```

## ⚙️ Configuration

Key environment variables in `.env`:

```bash
# Server
PORT=7070
SERVER=0.0.0.0

# MCP Settings
MCP_ENABLED=true
MCP_AUTO_DISCOVERY=true
MCP_CACHE_TIMEOUT=300000

# LMStudio (optional)
LMSTUDIO_URL=http://localhost:1234/v1/chat/completions
LMSTUDIO_MODEL=local-model

# Database (optional)
MONGODB_URL=mongodb://localhost:27017/bambisleep
```

## 🏗️ Project Structure

```
src/
├── server.js           # Main Express application
├── mcp/               # MCP server implementation
│   ├── server.js      # MCP server with tools
│   ├── toolbox.js     # Automatic tool discovery
│   └── tools/         # Custom BambiSleep tools
├── services/          # Application services
├── utils/             # Utilities and config
└── knowledge/         # Knowledge base data

views/                 # EJS templates
public/               # Static assets
```

## 📚 Documentation

- **[MCP Integration Guide](./MCP-INTEGRATION.md)** - Detailed MCP implementation docs
- **[Mission & Roadmap](./ROADMAP.md)** - Church establishment roadmap
- **Safety Guidelines** - Available in-app at `/knowledge`

## 🛡️ Safety & Community

BambiSleep Church prioritizes:

- **Informed Consent** - All activities require clear, ongoing consent
- **Safety Education** - Comprehensive safety resources and guidelines
- **Community Support** - Supportive, non-judgmental environment
- **Privacy Protection** - Respectful handling of personal information

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

For major changes, please open an issue first to discuss.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- **Live Demo**: Coming soon
- **Community Discord**: Coming soon
- **Austrian Registration**: In progress
- **GitHub Issues**: [Report bugs](https://github.com/HarleyVader/js-bambisleep-church/issues)

---

**Building a digital sanctuary for safe, consensual BambiSleep practice** 💫
