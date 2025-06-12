# Bambi Sleep Church 🌙

A sophisticated AI-powered community platform for bambisleep content discovery, curation, and management. Built with autonomous agent architecture following the **3-Step Agent Methodology** for optimal development efficiency.

## 🚀 Quick Start

### Installation

```powershell
git clone https://github.com/HarleyVader/js-bambisleep-church.git
cd js-bambisleep-church
npm install
```

### Running the Application

```powershell
# Start full application with MCP server
npm start

# Start MCP server only  
npm run mcp

# Run agentic crawler
npm run agentic

# Run cleanup agent
npm run cleanup
```

The application will be available at `http://localhost:8888`

## 🤖 AI Agent System

### Core Agent Methodology: **3-STEP AGENT LOOP | MK-XII**

#### 1. IMAGINE (Planning & Solutions) - **DO 3 TIMES**

**First IMAGINE Round:**
- Fetch `.tasks/<build_name.task>.md` tasks [IF] <doesnt_exist> ignore
- What's the absolute minimum I need to write?
- What's the minimal viable code approach?
- What must I avoid touching entirely?
- Can I solve this with existing code or tools?

**Second IMAGINE Round:**
- Fetch required `.github/codebase-inventory.md` files
- What code structure will I use with the least words?
- What files do I need to touch to keep coding to a minimum?
- What configurations do I need to know to successfully implement this?
- What is the least amount of work I can do to get this done correctly?
- Create a `.tasks/<build_name.task>.md` file with the task description and requirements, add [0%]

**Third IMAGINE Round:**
### RULE: Think More, Code Less
- Always try to do the LEAST possible amount of work, even if it means thinking longer
- Final sanity check: Is this the laziest yet correct possible solution?
- Can I reuse something that already exists?
- Update `.tasks/<build_name.task>.md` with [%COMPLETION%] percentages for each item

#### 2. CREATION (Single Implementation) - **LOOP UNTIL 100% BUILT ACHIEVED**
- Implement ONLY the solution from the 3x IMAGINE phase
- Write the absolute minimum code required
- One function, one purpose, done
- Check percentage of completion every iteration
- Update `.github/codebase-inventory.md` with any new or modified files with [%COMPLETION%] percentages for each
- If not 100% complete, go back to **Third IMAGINE Round:**

#### 3. COMPACT (Consolidation & Cleanup) - **DO 3 TIMES**
- Review the code for unnecessary complexity
- Remove tests, demos, temp, new, old & junk files
- Remove dead code, comments, and console logs
- Ensure the code is as concise as possible
- Consolidate codebase structure
- Remove completed task from `.tasks/<build_name.task>.md`

### Agent Commands

```powershell
# Access Agent UI (Web Interface)
# Navigate to: http://localhost:8888/agent-ui

# Run Discovery Agent directly
npm run agentic

# Check Agent Status
# Visit: http://localhost:8888/stats
```

## 🔗 MCP Integration

**Model Context Protocol (MCP)** enables autonomous agent coordination:

- **JSON-RPC 2.0**: 100% compliant implementation
- **LMStudio Integration**: AI-powered reasoning and tool orchestration  
- **Agent-to-Agent (A2A)**: Real-time communication between agents
- **12 Registered Tools**: Content analysis, crawling, insights generation

**AI Model**: `llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0`
**Endpoint**: `http://192.168.0.69:7777/v1/chat/completions`

### Agent Communication

Agents communicate via MCP protocol:

```javascript
// Register agent capability
await mcp.callTool('a2a_register_agent', {
    agentId: 'discovery-agent',
    capabilities: ['content_detection', 'pattern_matching']
});

// Send inter-agent message  
await mcp.callTool('a2a_send_message', {
    targetAgentId: 'feed-agent',
    messageType: 'content_found',
    data: { url, confidence, contentType }
});
```

## 📁 Project Structure

```text
src/
├── agents/                    # AI agent implementations
│   ├── bambisleep-universal-agent.js    # Consolidated universal agent
│   ├── bambisleep-knowledge-agent.js    # Content discovery & analysis
│   └── bambisleep-knowledge-agent.js    # Knowledge management
├── mcp/                      # Model Context Protocol server
│   ├── McpServer.js         # Core MCP server implementation
│   └── mcpInstance.js       # Singleton instance manager
├── controllers/              # API endpoints and business logic  
│   ├── linkController.js    # Link management
│   ├── voteController.js    # Voting system
│   ├── creatorController.js # Creator profiles
│   ├── feedController.js    # Feed management
│   ├── commentController.js # Comment system
│   └── mainController.js    # Main application logic
├── utils/                    # Content detection and utilities
│   ├── universalContentDetector.js  # Multi-platform content detection
│   ├── metadataService.js   # URL metadata extraction
│   ├── crawlStatusTracker.js # Crawl operation tracking
│   └── socketHandler.js     # WebSocket real-time updates
├── middleware/               # Express middleware
│   └── errorTracking.js     # Error tracking and logging
└── routes/                   # Express.js routing
    └── main.js              # Main application routes

public/
├── agent-ui/                 # Agent management interface
│   ├── index.html           # Agent control panel
│   ├── css/                 # Agent UI styling
│   └── js/                  # Agent frontend logic
└── assets/                   # Static resources
    └── placeholders/         # Platform icons and placeholders

data/
├── links.json               # Community-submitted links
├── creators.json            # Creator profiles  
├── comments.json            # Community discussions
└── votes.json               # Voting records

views/
├── pages/                   # Main application pages
│   ├── index.ejs           # Homepage
│   ├── feed.ejs            # Content feed
│   ├── help.ejs            # Help documentation
│   └── stats.ejs           # Statistics dashboard
├── partials/                # Reusable page components
│   ├── header.ejs          # Site header & navigation
│   └── footer.ejs          # Site footer
└── components/              # Modular UI components
    └── linkCard.ejs         # Link display component
```

## 🌟 Key Features

### Content Management
- **Universal Content Detection**: Supports YouTube, SoundCloud, Patreon, Reddit, and 15+ platforms
- **Real-time Feed**: Live updates via Socket.IO
- **Community Voting**: Upvote/downvote system with bambi name tracking
- **Creator Profiles**: Dedicated creator discovery and organization
- **Smart Categorization**: Automatic content type detection and classification

### AI Agent Capabilities
- **Discovery Agent**: Autonomous content discovery across platforms
- **Feed Management**: Automated content validation and moderation
- **Knowledge Base**: Learning system for content relationships and trends
- **Crawler Agent**: 3-step intelligent crawling with completion tracking
- **Stats Management**: Real-time analytics and performance monitoring

### Technical Features
- **MCP Compliance**: Full Model Context Protocol support
- **Agent-to-Agent Communication**: Real-time inter-agent messaging
- **Error Tracking**: Comprehensive error monitoring and logging
- **Database Health**: JSON-based data storage with health checks
- **Socket.IO Integration**: Real-time updates and notifications

## 🔧 Agent Instructions

### Development Workflow

1. **Follow the 3-Step Methodology**: Always use IMAGINE → CREATION → COMPACT
2. **Task Management**: Create `.tasks/<task_name>.task.md` files for tracking
3. **Completion Tracking**: Update percentage completion in task files
4. **Codebase Inventory**: Maintain `.github/codebase-inventory.md` with file status
5. **Minimal Code**: Write the absolute minimum code required
6. **Function over Form**: Prioritize working code over perfect code

### Core Rules
- **Function over form**
- **Working code over perfect code**
- **Less is more**
- **Think More, Code Less**

### Agent Communication Patterns

```javascript
// MCP Tool Registration
this.registerTool('universal_content_discovery', {
    description: 'Advanced content discovery with universal media type detection',
    parameters: {
        type: 'object',
        properties: {
            sources: { type: 'array', items: { type: 'string' } },
            contentTypes: { type: 'array', items: { type: 'string' } },
            depth: { type: 'string', enum: ['surface', 'deep', 'comprehensive'] }
        }
    }
}, this.handleUniversalDiscovery.bind(this));

// Agent Status Reporting
getAgentStatus() {
    return {
        id: this.agentId,
        status: this.initialized ? 'ready' : 'initializing',
        capabilities: Object.keys(this.tools),
        stats: this.getStats(),
        timestamp: new Date().toISOString()
    };
}
```

## 📊 API Endpoints

### Core Routes
- `GET /` - Homepage with featured content
- `GET /feed` - Real-time community feed  
- `GET /submit` - Content submission interface
- `GET /stats` - Community statistics and metrics
- `GET /agent-ui` - AI agent management interface
- `GET /help` - Documentation and help

### API Routes
- `GET /api/feed` - Feed data API
- `POST /api/submit` - Content submission API
- `GET /api/platforms` - Platform content organization
- `POST /api/metadata` - URL metadata extraction
- `GET /api/stats` - Real-time statistics
- `POST /api/votes` - Voting system API
- `POST /api/comments` - Comment system API

### MCP Routes
- `GET /api/mcp/status` - MCP server status
- `POST /api/a2a/register` - Agent registration
- `POST /api/a2a/message` - Inter-agent messaging
- `GET /api/a2a/status` - A2A system status

### Agent Routes
- `POST /api/ai-girlfriend/discover` - Content discovery
- `POST /api/ai-girlfriend/crawl` - Intelligent crawling
- `GET /api/crawl-status/active` - Active crawl monitoring
- `POST /api/bulk-submit` - Bulk content submission

## 🛠️ Development

**System Status**: Production Ready ✅  
**MCP Compliance**: 100% verified  
**Overall Completion**: 100%  
**Last Updated**: June 12, 2025

### Dependencies

- **Node.js**: Express.js web framework
- **AI Integration**: LMStudio for agent reasoning
- **Real-time**: Socket.IO for live updates
- **Content Analysis**: Cheerio, Axios for web scraping
- **Data Storage**: JSON-based file system

### Configuration

The application uses environment-based configuration:

```javascript
// Default configuration
const config = {
    port: process.env.PORT || 8888,
    mcpEndpoint: process.env.MCP_ENDPOINT || 'http://192.168.0.69:7777',
    agentMode: process.env.AGENT_MODE || 'full',
    dataPath: './data',
    logLevel: process.env.LOG_LEVEL || 'info'
};
```

### Agent Development Guidelines

1. **Autonomous Operation**: Agents should operate independently with minimal human intervention
2. **MCP Compliance**: All agent communication must use the MCP protocol
3. **Error Resilience**: Implement robust error handling and recovery
4. **Performance Monitoring**: Track and report agent performance metrics
5. **Content Focus**: Maintain 15%+ bambi sleep content confidence threshold

### Testing

```powershell
cd test
npm test
```

## 🔍 Content Detection

The Universal Content Detector supports:

**Video Platforms**: YouTube, Vimeo, Dailymotion, Twitch
**Audio Platforms**: SoundCloud, Spotify, Bandcamp, Anchor  
**Creator Platforms**: Patreon, Ko-fi, OnlyFans, SubscribeStar
**Social Platforms**: Twitter, Reddit, Discord
**Hypno Platforms**: BambiCloud, HypnoTube
**Storage Platforms**: Google Drive, Dropbox, MEGA

### Content Analysis Pipeline

1. **URL Analysis**: Extract domain and path patterns
2. **Metadata Extraction**: Fetch title, description, thumbnails
3. **Content Classification**: Categorize by type and platform
4. **Confidence Scoring**: Rate bambi sleep relevance (0-100%)
5. **Relationship Mapping**: Link to existing content and creators

## 🤝 Contributing

1. Follow the 3-step agent methodology
2. Ensure MCP compliance for agent communication  
3. Maintain bambi sleep content focus (15%+ confidence)
4. Update knowledge base through agent system
5. Use minimal code approach - function over form

### Development Process

1. **Create Task**: Add `.tasks/<feature>.task.md` with requirements
2. **IMAGINE Phase**: Plan minimal implementation (3 rounds)
3. **CREATION Phase**: Implement with completion tracking
4. **COMPACT Phase**: Cleanup and consolidate code
5. **Agent Integration**: Ensure MCP compliance and A2A communication

## 📄 License

MIT License - See repository for details

---

**Generated by**: BambiSleep MCP Agent System  
**Architecture**: Autonomous AI Agent Ecosystem  
**Status**: Fully Operational 🌙✨
