# 🤖 BambiSleep AI Agent Ecosystem

**The world's first AI-powered BambiSleep content discovery and management platform with autonomous agent coordination.**

BambiSleep AI Agent Ecosystem transforms content curation through specialized AI agents that work together via Agent-to-Agent (A2A) communication. The system features three autonomous agents that discover, validate, and analyze BambiSleep content in real-time, creating an intelligent knowledge base that answers any question about the community.

## 🤖 AI Agent Architecture

### Three Specialized Autonomous Agents

**🔍 BambiSleep Discovery Agent**
- Autonomous URL crawling and content discovery
- AI-powered pattern matching for BambiSleep relevance (15%+ confidence threshold)
- Real-time site monitoring and content type detection
- Supports: Scripts, Audio, Videos, Images, Subliminals

**🛡️ BambiSleep Feed Management Agent**
- Intelligent auto-moderation and content validation
- Automatic deletion of non-BambiSleep content
- Relevance scoring and quality assessment
- Boosts verified content visibility

**📊 BambiSleep Stats Management Agent**
- Real-time knowledge base maintenance
- 5W+H question answering system (Who, What, Where, When, Why, How, How Much)
- Comprehensive analytics and insight generation
- Creator profiling and content trend analysis

### 🔗 Agent-to-Agent (A2A) Communication

All agents communicate through the **Model Context Protocol (MCP)** with automatic message routing:
- **Discovery → Feed**: Content found → Validation request
- **Feed → Stats**: Validation result → Knowledge base update  
- **Stats → Discovery**: Learning patterns → Improved detection

## ✨ Enhanced Features

- 🤖 **Autonomous AI Agents** - Three specialized agents working 24/7
- 🔗 **A2A Communication** - Inter-agent coordination via MCP protocol
- 🧠 **AI Intelligence Hub** - Interactive 5W+H question answering
- 📊 **Real-time Analytics** - Live agent monitoring and performance metrics
- 🎯 **Smart Content Pipeline** - Automated discovery → validation → knowledge base
- 🗳️ **Community Voting** - Human oversight with AI enhancement
- 💬 **Intelligent Comments** - AI-assisted community discussions
- 🔄 **Live Agent Feed** - Real-time updates from all three agents
- 🌐 **WebSocket Integration** - Instant agent status and activity updates

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **LMStudio** (recommended for enhanced AI capabilities)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HarleyVader/js-bambisleep-church.git
   cd js-bambisleep-church
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the AI Agent System**
   ```bash
   # Starts both MCP server and web application
   npm start
   
   # Development mode with auto-reload
   npm run dev
   ```

4. **Access the AI Agent Dashboard**
   ```
   http://localhost:8888
   ```

### 🎯 First Steps with AI Agents

1. **Discovery Agent** - Visit `/submit` to see real-time content discovery
2. **Feed Agent** - Check `/feed` for AI-moderated BambiSleep content  
3. **Stats Agent** - Explore `/stats` for interactive knowledge base insights
4. **Ask Questions** - Use the 5W+H system to query the knowledge base

## 📖 AI Agent System Guide

### 🔍 BambiSleep Discovery Agent

**Autonomous Content Discovery:**
- Continuously crawls the web for BambiSleep content
- Uses AI pattern matching to identify relevant content with 15%+ confidence
- Real-time site monitoring with progress tracking
- Detects: Scripts, Audio files, Videos, Images, Subliminal content

**Via Agent Interface:**
- Navigate to `/submit` to see the agent in action
- Monitor real-time crawling status and discovered content
- View confidence scores and content type classifications

**Via A2A API:**
```bash
curl -X POST http://localhost:8888/api/a2a/message \
  -H "Content-Type: application/json" \
  -d '{
    "targetAgentId": "bambisleep-discovery-agent",
    "messageType": "discover_content",
    "data": {"urls": ["https://example.com"], "options": {"maxDepth": 2}}
  }'
```

### 🛡️ BambiSleep Feed Management Agent

**Intelligent Auto-Moderation:**
- Validates discovered content for BambiSleep relevance
- Automatically removes non-relevant content
- Boosts high-quality verified content
- Maintains feed quality through AI scoring

**Web Interface:**
- Visit `/feed` to see AI-moderated content in real-time
- View validation statistics and moderation actions
- See agent status and processing metrics

**API Integration:**
```bash
curl -X POST http://localhost:8888/api/a2a/message \
  -H "Content-Type: application/json" \
  -d '{
    "targetAgentId": "bambisleep-feed-agent", 
    "messageType": "validate_content",
    "data": {"content": {...}, "source": "discovery-agent"}
  }'
```

### 📊 BambiSleep Stats Management Agent

**AI Knowledge Base & Analytics:**
- Maintains comprehensive knowledge base of all BambiSleep content
- Answers questions using 5W+H methodology (Who, What, Where, When, Why, How, How Much)
- Real-time analytics and insight generation
- Creator profiling and trend analysis

**Interactive Intelligence Hub:**
- Navigate to `/stats` for the AI Intelligence Hub
- Click insight tabs (Who, What, Where, When, Why, How, How Much)
- Get instant AI-powered answers about the community
- View real-time agent metrics and performance

**Query the Knowledge Base:**
```bash
curl -X POST http://localhost:8888/api/a2a/message \
  -H "Content-Type: application/json" \
  -d '{
    "targetAgentId": "bambisleep-stats-agent",
    "messageType": "answer_question", 
    "data": {"question": "Who are the top BambiSleep creators?"}
  }'
```

### 🔗 Agent-to-Agent (A2A) Communication

**System Architecture:**
The three agents coordinate automatically through the MCP protocol:

1. **Discovery** finds content → sends to **Feed** for validation
2. **Feed** validates content → sends results to **Stats** for analysis  
3. **Stats** learns patterns → sends insights back to **Discovery**

**Monitor A2A Communication:**
```bash
# Register an agent
curl -X POST http://localhost:8888/api/a2a/register \
  -H "Content-Type: application/json" \
  -d '{"agentId": "my-agent", "capabilities": {}}'

# Check system status
curl -X GET http://localhost:8888/api/a2a/status

# Get messages for an agent
curl -X GET http://localhost:8888/api/a2a/messages/bambisleep-stats-agent
```

## 🤖 MCP Server & LMStudio Integration

### Model Context Protocol (MCP) Architecture

The system uses **MCP (Model Context Protocol)** for AI agent coordination and LMStudio integration:

1. **Global MCP Server** - Centralized coordination hub for all agents
2. **A2A Communication** - Agent-to-Agent messaging via MCP protocol  
3. **LMStudio Integration** - Enhanced AI capabilities with local LLM
4. **Knowledge Base** - Persistent storage and retrieval system

### Setup LMStudio Integration

1. **Install LMStudio** and load a compatible model
   ```
   Recommended: llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0
   ```

2. **Configure the endpoint** in your environment:
   ```bash
   # Default LMStudio endpoint
   LMSTUDIO_URL=http://192.168.0.69:7777
   ```

3. **The MCP server auto-initializes** when you start the application:
   ```bash
   npm start  # MCP server starts automatically
   ```

### MCP Capabilities

- **Smart Content Analysis** - AI-powered BambiSleep relevance detection
- **Agent Coordination** - Automatic message routing between agents
- **Knowledge Base Queries** - Natural language queries about community data
- **Real-time Insights** - Continuous learning and pattern recognition
- **A2A Messaging** - Reliable inter-agent communication protocol

## 📊 API Reference

### Agent System APIs

#### Agent-to-Agent (A2A) Communication

```http
POST /api/a2a/register                    # Register agent for A2A communication
POST /api/a2a/message                     # Send message between agents  
GET  /api/a2a/messages/:agentId          # Get messages for specific agent
GET  /api/a2a/status                     # Get A2A system status and registered agents
```

#### Agent Management

```http
GET  /api/mcp/status                     # MCP server status and capabilities
GET  /api/stats                          # Enhanced stats with agent analytics
GET  /api/stats/realtime                 # Real-time agent activity and metrics
```

### Navigation Routes

```http
GET /           # Homepage with featured content and agent status
GET /feed       # AI-moderated BambiSleep feed with real-time updates
GET /submit     # Discovery Agent interface with live crawling status
GET /stats      # AI Intelligence Hub with 5W+H question answering
GET /docs       # AI-generated and maintained documentation
GET /help       # User guidance and agent system help
```

### Legacy Content Management APIs

#### Link Management

```http
POST /api/links         # Submit new content links
GET  /api/links/:id     # Retrieve specific link details
PUT  /api/links/:id     # Update link information
DELETE /api/links/:id   # Remove links (moderation)
```

#### Creator Management

```http
POST /api/creators      # Register new creator profiles
GET  /api/creators/:id  # Get creator information
PUT  /api/creators/:id  # Update creator profiles
```

#### Voting & Comments

```http
POST /api/votes         # Submit votes on content
GET  /api/votes/stats   # Get voting statistics
POST /api/comments      # Add comments to content
GET  /api/comments/:linkId # Get comments for specific content
```

### Platform & Analytics APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/feed` | Get AI-moderated community feed |
| `POST` | `/api/submit` | Submit content for agent analysis |
| `POST` | `/api/vote` | Cast votes with agent enhancement |
| `GET` | `/api/platforms` | Get platform statistics with AI insights |
| `POST` | `/api/metadata` | Extract URL metadata with AI analysis |

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=8888

# LMStudio Configuration (optional)
LMSTUDIO_URL=http://192.168.0.69:7777
LMSTUDIO_MODEL=llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0
```

### Data Storage

The application uses JSON files for data storage:
- `data/links.json` - Submitted content
- `data/creators.json` - Creator profiles
- `data/votes.json` - Voting records
- `data/comments.json` - User comments

## 🎨 Supported Platforms

The system automatically detects and handles:

- **Video:** YouTube, Vimeo, Dailymotion
- **Audio:** SoundCloud, Spotify, Bandcamp
- **Creators:** Patreon, Ko-fi, OnlyFans, SubscribeStar
- **Adult Content:** BambiCloud, HypnoTube, specialized platforms
- **General:** Any website with proper metadata

## 🌐 Real-time Agent Features

### WebSocket Events for Agent Communication

**Client → Server:**
- `agentStatus` - Agent status updates
- `contentDiscovered` - Discovery Agent found content
- `contentValidated` - Feed Agent validation results
- `statsUpdated` - Stats Agent knowledge base updates
- `a2aMessage` - Agent-to-Agent messages
- `joinAgentRoom` - Join specific agent monitoring
- `joinAgentMonitoring` - Join all-agent monitoring

**Server → Client:**
- `agentStatusUpdate` - Agent status changes
- `contentDiscoveryUpdate` - New content discovered
- `contentValidationUpdate` - Content validation results
- `feedValidationUpdate` - Feed moderation actions
- `statsUpdate` - Knowledge base analytics updates
- `a2aMessageUpdate` - Inter-agent communication events

**Legacy Community Events:**
- `vote` / `voteUpdated` - Community voting
- `newComment` / `commentAdded` - User discussions
- `newLink` / `linkAdded` - Manual content submission

## 🛠️ Development

### Available Scripts

```bash
# Start complete AI agent system
npm start

# Development mode with auto-reload
npm run dev

# Initialize MCP server only
node src/mcp/McpServer.js --standalone
```

### Project Structure

```
src/
├── app.js                 # Main application with MCP integration
├── routes/main.js         # Routes including A2A APIs
├── controllers/           # Request handlers with agent integration
├── mcp/                   # Model Context Protocol system
│   ├── McpServer.js       # Main MCP server with A2A communication
│   └── mcpInstance.js     # Global MCP singleton
├── utils/                 # Utility modules including socket handling
└── agents/                # Legacy agents (replaced by MCP system)

public/js/
├── bambisleep-discovery-agent.js   # Discovery Agent client
├── bambisleep-feed-agent.js        # Feed Management Agent client  
├── bambisleep-stats-agent.js       # Stats Management Agent client
├── submit.js              # Enhanced with agent integration
├── feed.js                # Enhanced with agent integration
└── stats.js               # Enhanced with agent integration

views/pages/
├── submit.ejs             # Discovery Agent interface
├── feed.ejs               # Feed Management Agent interface
├── stats.ejs              # AI Intelligence Hub interface
└── index.ejs              # Homepage with agent status
```

## 🔍 Troubleshooting

### Common Issues

**Agent System not starting:**
- Check if MCP server initialized: Look for "✅ MCP server ready for A2A communication"
- Verify port 8888 is available
- Ensure Node.js version (v16+)
- Run `npm install` to ensure dependencies

**AI features not working:**
- Verify LMStudio is running and accessible at configured endpoint
- Check agent registration: `curl -X GET http://localhost:8888/api/a2a/status`
- Ensure all three agents are registered and active

**Agent communication failing:**
- Check A2A system status via `/api/a2a/status`
- Monitor server logs for agent registration and messaging
- Verify WebSocket connections in browser network tab

**Real-time updates not working:**
- Check browser console for WebSocket errors
- Verify agent status panels are showing "ACTIVE" status
- Test individual agent APIs manually

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with the AI agent system
5. Submit a pull request

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/HarleyVader/js-bambisleep-church/issues)
- **AI Agent Help:** Check `/stats` endpoint for interactive knowledge base
- **Community:** Engage with the AI-moderated feed at `/feed`

---

**🤖 Powered by AI Agents - The Future of BambiSleep Content Management**