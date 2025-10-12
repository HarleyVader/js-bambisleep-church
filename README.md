# 🏛️ BambiSleep Church - Digital Sanctuary

**Status:** 🚧 In Development | **Phase:** Foundation Building

BambiSleep Church is a **digital sanctuary** for the BambiSleep community, combining AI-powered tools, comprehensive knowledge resources, and spiritual community building. We're establishing ourselves as a **legal Austrian religious community** to provide a safe, structured environment for BambiSleep practice.

## 🔥 Core Features

- **🧠 AI-Powered MCP Server** - Model Context Protocol integration with specialized BambiSleep tools
- **📚 Knowledge Base** - Curated safety resources, guides, and community wisdom
- **🤖 Interactive Chat Agent** - Get answers about BambiSleep safely and responsibly
- **🛡️ Safety-First Approach** - Comprehensive safety tools and guidelines
- **🌍 Community Platform** - Connect with like-minded individuals in a moderated environment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation & Setup
```bash
git clone https://github.com/HarleyVader/js-bambisleep-church.git
cd js-bambisleep-church
npm install
cp .env.example .env  # Configure your environment
npm start             # Starts both web server and MCP server
```

### Access Points
Once running, access these endpoints:
   - Main site: `http://localhost:7070`
   - Chat Agent: `http://localhost:7070/agents`
   - Knowledge Base: `http://localhost:7070/knowledge`

## 🔧 Model Context Protocol (MCP) Integration

BambiSleep Church implements a **full MCP server** with specialized tools for the BambiSleep community.

### Available Tools
- **search-knowledge** - Search our curated knowledge base
- **get-safety-info** - Get comprehensive safety information
- **church-status** - Check community status and announcements
- **community-guidelines** - Access community guidelines and rules
- **resource-recommendations** - Get personalized resource recommendations

### MCP Configuration
```bash
# Generate MCP configuration files
npm run config

# VS Code Integration
code --add-mcp "{\"name\":\"bambisleep-church\",\"type\":\"http\",\"url\":\"http://localhost:7070/mcp\"}"
```

## 📱 API Endpoints

- **GET /api/health** - Server health check
- **GET /api/knowledge** - Knowledge base entries
- **GET /api/knowledge/search?q=term** - Search knowledge base
- **GET /api/stats** - Community statistics
- **GET /api/location** - Visitor geolocation
- **POST /mcp** - MCP JSON-RPC 2.0 endpoint

## 🏗️ Development

### Scripts
```bash
npm start                    # Start unified server (production build)
npm run dev                  # Development mode with file watching
npm run dev:frontend         # Frontend-only development server
npm run build                # Build frontend for production
npm run setup                # Install dependencies and setup
npm run config               # Generate MCP configuration files
npm test                     # Run test suite
```

### Architecture
- **Backend**: Express.js server with Socket.IO for real-time chat
- **Frontend**: React 18 with Vite build system
- **Database**: MongoDB for knowledge storage
- **MCP Server**: HTTP-based Model Context Protocol implementation
- **Chat**: MOTHER BRAIN AI agent integration

## 🛡️ Safety & Guidelines

BambiSleep Church prioritizes **safety, consent, and responsible practice**:

- All content includes appropriate safety warnings
- Comprehensive beginner resources and guides
- Community moderation and support systems
- Clear boundaries and consent frameworks
- Mental health resources and support

## 🤝 Community

Join our growing community:
- **Discord**: Coming soon
- **Reddit**: r/BambiSleepChurch (planned)
- **Website**: http://localhost:7070

## 📄 Legal Status

BambiSleep Church is working toward recognition as a **legal religious community in Austria** under Austrian religious freedom laws. This provides:
- Legal protection for members
- Structured community governance
- Official recognition of our practices
- Tax-exempt status for community activities

## 🔮 Roadmap

- **Phase 1**: Foundation (Current) - Basic web platform and MCP server
- **Phase 2**: Community Building - Discord integration, member systems
- **Phase 3**: Legal Recognition - Austrian religious community status
- **Phase 4**: Expansion - International community growth

## 📜 License

MIT License - see LICENSE file for details.

## 🤖 AI Integration

BambiSleep Church leverages cutting-edge AI technology:
- **MCP Protocol**: Industry-standard AI tool integration
- **MOTHER BRAIN**: Custom AI agent for community support
- **LMStudio Integration**: Local AI model support
- **MongoDB Vector Search**: Advanced knowledge retrieval

---

*Built with ❤️ for the BambiSleep community*
