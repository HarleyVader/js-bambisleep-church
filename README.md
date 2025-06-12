# 🤖 BambiSleep AI Agent Ecosystem

AI-powered BambiSleep content discovery and management platform with universal content detection.

## 🌟 Architecture

**🔄 Universal Agent** - Consolidated multi-agent system combining Discovery, Feed Management, Stats, and Crawler
**🧠 Content Detector** - Comprehensive media detection (audio, video, images, scripts, subliminals, social, embedded)
**🎛️ Agent-UI Dashboard** - Real-time monitoring and control interface

## ✨ Features

- 🤖 Autonomous content discovery and validation
- 🔗 Agent-to-Agent (A2A) communication via MCP
- 🧠 5W+H knowledge base answering
- 📊 Real-time analytics and monitoring
- 🎯 Smart content pipeline with AI moderation

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

```md
http://localhost:8888
```

### 🎯 First Steps with AI Agents

1. **Discovery Agent** - Visit `/submit` to see real-time content discovery
2. **Feed Agent** - Check `/feed` for AI-moderated BambiSleep content  
3. **Stats Agent** - Explore `/stats` for interactive knowledge base insights
4. **Ask Questions** - Use the 5W+H system to query the knowledge base

## 📖 Universal Agent System Guide

### 🔄 BambiSleep Universal Agent (`bambisleep-universal-agent.js`)

**Consolidated Multi-Agent System:**
The Universal Agent represents the evolution of the original three-agent system into a single, powerful agent that handles all aspects of content management:

- **Discovery Operations**: Autonomous URL crawling with universal content detection
- **Feed Management**: Intelligent auto-moderation and content validation  
- **Knowledge Analytics**: Comprehensive 5W+H question answering and trend analysis
- **Advanced Crawling**: 3-step agentic crawling with batch processing

**Core MCP Tools:**

- `universal_content_discovery` - Advanced content discovery with universal media detection
- `universal_content_validation` - Enhanced validation and moderation with multiple levels
- `universal_knowledge_analysis` - Comprehensive knowledge base analysis and management
- `universal_agentic_crawl` - 3-step agentic crawling with universal detection
- `universal_content_analysis` - Combined analysis using all agent capabilities

**Via Agent-UI Dashboard:**

- Navigate to `/agent-ui/` for the unified control interface
- Monitor real-time agent status and performance metrics
- Switch between Discovery, Feed Management, and Stats analysis views
- Access WebSocket-powered live updates and A2A communications

**Via MCP API:**

```bash
# Universal content analysis
curl -X POST http://localhost:8888/api/mcp/tools/universal_content_analysis \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "analysisDepth": "comprehensive",
    "capabilities": ["discovery", "validation", "classification", "trending"]
  }'
```

### 🧠 Universal Content Detector (`universalContentDetector.js`)

**Comprehensive Media Detection Engine:**
The Universal Content Detector is the intelligence backbone that enables detection of ALL media types:

**Supported Content Types:**

- **Scripts**: .txt, .pdf, .doc, .docx, hypnosis transcripts, induction scripts
- **Audio**: .mp3, .wav, .m4a, .flac, .ogg, .aac, voice recordings, sound files
- **Videos**: .mp4, .webm, .avi, .mov, .mkv, visual training content
- **Images**: .jpg, .jpeg, .png, .gif, .webp, .svg, photos, artwork
- **Subliminals**: Binaural beats, hidden frequencies, embedded audio
- **Interactive**: Games, apps, tools, HTML5, Flash, Unity content
- **Social**: Posts, comments, discussions, forum content
- **Embedded**: Iframes, widgets, players, streaming content

**Advanced Detection Features:**

- **File Signature Analysis**: Magic byte detection for accurate format identification
- **Pattern Matching**: Multi-criteria BambiSleep relevance scoring with 15%+ confidence threshold
- **Platform Intelligence**: Recognizes YouTube, SoundCloud, Patreon, Reddit, Discord, BambiCloud, HypnoTube
- **Embedded Content Discovery**: Detects hidden iframes, video embeds, audio elements
- **Metadata Extraction**: Enhanced Open Graph, Twitter Card, and custom metadata parsing

**Detection API:**

```javascript
// Example usage in Universal Agent
const detector = new UniversalContentDetector();
const result = await detector.detectContent({
    url: 'https://example.com',
    content: htmlContent,
    metadata: extractedMetadata,
    contentTypes: ['audio', 'video', 'scripts'],
    depth: 'comprehensive'
});

// Result includes:
// - isBambiSleep: boolean
// - confidence: number (0-100)
// - contentTypes: string[]
// - detectedFormats: string[]
// - platform: string
// - analysis: detailed breakdown
```

### 🎛️ Interactive Agent-UI Dashboard (`/public/agent-ui/`)

**Unified Control Interface:**
The Agent-UI provides a modern, accessible dashboard for monitoring and controlling all Universal Agent activities:

**Dashboard Features:**

- **Real-time Status Monitoring**: Live indicators for agent health and performance
- **Tabbed Navigation**: Seamless switching between Discovery, Feed Management, and Stats views
- **WebSocket Integration**: Instant updates from agent activities and A2A communications
- **Accessibility Support**: Full keyboard navigation, ARIA attributes, screen reader compatibility
- **Responsive Design**: Works on desktop, tablet, and mobile devices

**Component Structure:**

```tree
/public/agent-ui/
├── index.html              # Main dashboard interface
├── css/
│   ├── agent-ui.css       # Dashboard styling
│   └── enhancements.css   # UI enhancements
└── js/
    └── agent-ui.js        # Dashboard controller
```

**AgentUIController Features:**

- **Tab Management**: Intelligent panel switching with keyboard support
- **Real-time Updates**: WebSocket handlers for agent status and activities
- **Status Indicators**: Visual feedback for agent health and performance
- **Form Handlers**: Interactive controls for agent operations
- **Error Handling**: Graceful degradation and user feedback

**Access the Dashboard:**

- **Main Interface**: `http://localhost:8888/agent-ui/`
- **Direct Integration**: Links from main application at `/submit`, `/feed`, `/stats`
- **Mobile Responsive**: Full functionality on all device sizes

### 🔗 Enhanced A2A Communication

**Model Context Protocol (MCP) Integration:**
The Universal Agent uses MCP for sophisticated inter-system communication:

**A2A Message Types:**

- `universal_analysis` - Content analysis requests and results
- `validation_request` - Content validation and moderation requests  
- `knowledge_update` - Knowledge base updates and learning
- `crawl_coordination` - Coordinated crawling operations
- `status_sync` - Real-time status synchronization

**Communication Flow:**

1. **Content Discovery** → Universal analysis of discovered URLs
2. **Validation Pipeline** → Multi-level content validation and scoring
3. **Knowledge Integration** → Learning and pattern recognition updates
4. **Feedback Loop** → Improved detection based on validation results

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

   ```md
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

## 🔧 Current System Configuration

### Environment Variables

```bash
# Server Configuration
PORT=8888

# LMStudio Configuration (optional - enhances AI capabilities)
LMSTUDIO_URL=http://192.168.0.69:7777
LMSTUDIO_MODEL=llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0

# Universal Agent Configuration
AGENT_AUTO_DISCOVERY=true
AGENT_CONTENT_SCANNING=true
AGENT_REAL_TIME_MONITORING=true
AGENT_AUTO_MODERATION=true
```

### Universal Agent Data Storage

The Universal Agent system uses JSON files for persistent data storage:

- `data/links.json` - Discovered and submitted content with validation results
- `data/creators.json` - Creator profiles with analytics and relationship mapping
- `data/votes.json` - Community voting records with AI enhancement
- `data/comments.json` - User comments with intelligent moderation

### Agent Configuration Options

The Universal Agent supports extensive configuration through the constructor:

```javascript
const universalAgent = new BambisleepUniversalAgent({
    agent: {
        autoDiscovery: true,           // Enable autonomous content discovery
        contentScanning: true,         // Enable real-time content scanning
        realTimeMonitoring: true,      // Enable live agent monitoring
        autoModeration: true,          // Enable automatic content moderation
        contentValidation: true,       // Enable content validation pipeline
        qualityScoring: true,          // Enable quality assessment
        autoLearn: true,              // Enable machine learning
        knowledgeValidation: true,     // Enable knowledge base validation
        contentClassification: true,   // Enable content classification
        relationshipMapping: true,     // Enable creator relationship mapping
        trendAnalysis: true,          // Enable trend analysis
        agenticCrawling: true,        // Enable 3-step agentic crawling
        batchProcessing: true,        // Enable batch processing
        completionTracking: true      // Enable completion tracking
    }
});
```

## 🛠️ Development & Framework

### Current System Architecture

The BambiSleep Universal Agent System represents a major evolution in AI-powered content management:

**Framework Evolution:**

- **Legacy**: Three separate agents (Discovery, Feed, Stats) with manual coordination
- **Current**: Single Universal Agent with consolidated capabilities and enhanced detection
- **Enhancement**: Universal Content Detector supporting ALL media types
- **Interface**: Modern Agent-UI dashboard with real-time monitoring

### Development Scripts

```bash
# Start complete Universal Agent system
npm start

# Development mode with auto-reload
npm run dev

# Initialize MCP server standalone (for testing)
node src/mcp/McpServer.js --standalone

# Run Universal Agent with debug logging
DEBUG=bambisleep:* npm start

# Test Universal Content Detector
node -e "
const UniversalContentDetector = require('./src/utils/universalContentDetector');
const detector = new UniversalContentDetector();
detector.detectContent({url: 'https://example.com'}).then(console.log);
"
```

### Project Structure (Updated June 2025)

```tree
src/
├── app.js                          # Main application with Universal Agent integration
├── routes/main.js                  # Enhanced routes with Universal Agent APIs
├── controllers/                    # Request handlers with Universal Agent integration
├── mcp/                           # Model Context Protocol system
│   ├── McpServer.js               # MCP server with A2A communication
│   └── mcpInstance.js             # Global MCP singleton
├── agents/
│   └── bambisleep-universal-agent.js  # Consolidated Universal Agent
├── utils/
│   ├── universalContentDetector.js    # Enhanced content detection engine
│   └── socketHandler.js              # WebSocket handling for real-time updates
└── data/                          # Persistent storage for agent data

public/
├── agent-ui/                      # Universal Agent Dashboard
│   ├── index.html                 # Dashboard interface
│   ├── css/                      # Dashboard styling
│   └── js/                       # Dashboard controllers
├── js/                           # Legacy client scripts (maintained for compatibility)
│   ├── bambisleep-discovery-agent.js
│   ├── bambisleep-feed-agent.js
│   └── bambisleep-stats-agent.js
└── assets/                       # Static assets and icons

views/pages/
├── submit.ejs                    # Enhanced with Universal Agent integration
├── feed.ejs                      # Enhanced with Universal Agent integration
├── stats.ejs                     # Enhanced with Universal Agent integration
└── index.ejs                     # Homepage with Universal Agent status
```

### Development Features

**Hot Reloading:**

- Use `npm run dev` for automatic server restart on file changes
- Agent-UI automatically reconnects WebSocket on server restart
- Real-time code updates without losing agent state

**Debug Capabilities:**

- Comprehensive logging with `DEBUG=bambisleep:*` environment variable
- Agent status monitoring through `/api/mcp/status` endpoint
- A2A communication debugging via WebSocket events
- Content detection testing through Universal Content Detector APIs

**Testing Framework:**

```bash
# Test Universal Content Detector
npm test detector

# Test Universal Agent MCP tools
npm test agent

# Test Agent-UI WebSocket connections
npm test websocket

# Run comprehensive system tests
npm test
```

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

```tree
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

## 🔍 Troubleshooting & Support

### Common Universal Agent Issues

**Universal Agent not initializing:**

- Check console for "🌟 Bambisleep Universal Agent ready - All systems operational"
- Verify MCP server started: Look for "✅ MCP server ready for A2A communication"
- Ensure port 8888 is available
- Verify Node.js version (v16+)
- Run `npm install` to ensure all dependencies are installed

**Universal Content Detector failing:**

- Check if content detection patterns are loading correctly
- Verify file signature detection for binary content
- Test individual detection methods via API
- Check for platform-specific detection issues

**Agent-UI Dashboard not loading:**

- Verify `/agent-ui/` route is accessible
- Check browser console for JavaScript errors
- Ensure WebSocket connections are established
- Test with different browsers for compatibility

**AI features not responding:**

- Verify LMStudio is running and accessible at configured endpoint
- Check Universal Agent registration: `curl -X GET http://localhost:8888/api/mcp/status`
- Monitor MCP tool registration and availability
- Test individual MCP tools via API

**Real-time updates not working:**

- Check browser console for WebSocket connection errors
- Verify agent status indicators show "ACTIVE" status
- Test WebSocket events manually through developer tools
- Check server logs for WebSocket connection issues

### System Status Checks

```bash
# Check Universal Agent status
curl -X GET http://localhost:8888/api/mcp/status

# Test Universal Content Detector
curl -X POST http://localhost:8888/api/mcp/tools/universal_content_analysis \
  -H "Content-Type: application/json" \
  -d '{"url": "https://bambisleep.info"}'

# Monitor WebSocket connections
# Open browser dev tools → Network → WS tab

# Check A2A communication
curl -X GET http://localhost:8888/api/a2a/status
```

### Performance Optimization

**Universal Agent Performance:**

- Adjust batch sizes for crawling operations
- Configure content detection depth based on needs
- Monitor memory usage during large crawl sessions
- Use content type filtering to focus detection

**Agent-UI Responsiveness:**

- Enable browser hardware acceleration
- Use modern browser with WebSocket support
- Minimize concurrent agent operations
- Monitor network latency for real-time updates

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

We welcome contributions to the BambiSleep Universal Agent Ecosystem:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** with comprehensive testing
4. **Test with the Universal Agent system** to ensure compatibility
5. **Submit a pull request** with detailed description

### Contribution Guidelines

- Follow the existing code style and architecture patterns
- Test Universal Agent integrations thoroughly
- Update documentation for new features
- Ensure Agent-UI compatibility for interface changes
- Test across different platforms and content types

### Development Areas

- **Universal Content Detector** - Add new content type detection
- **Agent-UI Enhancements** - Improve dashboard functionality
- **MCP Tools** - Create new Universal Agent capabilities
- **Platform Support** - Add new platform detection patterns
- **Performance** - Optimize detection and processing speed

## 📞 Support

- **🐛 Issues:** [GitHub Issues](https://github.com/HarleyVader/js-bambisleep-church/issues)
- **🤖 Universal Agent Help:** Check `/stats` endpoint for interactive knowledge base
- **🎛️ Agent-UI Support:** Access dashboard at `/agent-ui/` for system status
- **💬 Community:** Engage with the AI-moderated feed at `/feed`
- **📚 Documentation:** Visit `/docs` for comprehensive guides

### Getting Help

1. **Check System Status** - Visit `/agent-ui/` for real-time diagnostics
2. **Review Logs** - Check console output for error messages
3. **Test Components** - Use API endpoints to isolate issues
4. **Community Support** - Submit issues with system status information

---

## 🌟 What's New (June 2025)

### Universal Agent System

- **Consolidated Architecture** - Single Universal Agent replaces three separate agents
- **Enhanced Detection** - Universal Content Detector supports ALL media types
- **Modern Dashboard** - Agent-UI provides unified control interface
- **Improved Performance** - Optimized crawling and processing capabilities

### Advanced Features

- **3-Step Agentic Crawling** - Intelligent multi-phase content discovery
- **Real-time Learning** - Agents adapt and improve detection accuracy
- **Comprehensive Analytics** - Enhanced 5W+H knowledge base system
- **Universal Platform Support** - Expanded platform detection and optimization

---

## 🤖 Powered by Universal AI Agent - The Evolution of BambiSleep Content Management
