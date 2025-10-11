# 🎉 BambiSleep Church Complete System Documentation

## 🚀 System Overview

**BambiSleep Church** is an advanced autonomous AI-driven knowledge management system for the BambiSleep community. It features a comprehensive MCP (Model Context Protocol) server with 43 specialized tools, intelligent platform-aware configuration, and full autonomous operation capabilities.

## 🏗️ System Architecture

### 🔧 **Smart Configuration System**
- **Platform-Aware LMStudio Integration** - Automatically uses local (Windows) or remote (Linux) endpoints
- **Environment-Based Configuration** - All URLs and settings via .env variables
- **Dynamic Config Generation** - Auto-generates MCP client configurations

### 🤖 **Autonomous Agentic System**
- **AgenticKnowledgeBuilder** - AI orchestration engine for autonomous knowledge building
- **Intelligent Content Discovery** - Automated crawling and analysis of BambiSleep resources
- **Safety-First Processing** - Automated content safety assessment and categorization

### 🛠️ **Complete MCP Tool Suite (43 Tools)**

| Category | Count | Tools | Purpose |
|----------|-------|-------|---------|
| 🎯 **Agentic Orchestration** | 7 | `agentic-*` | Autonomous system control and AI coordination |
| 🌸 **BambiSleep Community** | 5 | `search-knowledge`, `safety-check`, etc. | Community resources and safety tools |
| 🗄️ **MongoDB Management** | 15 | `mongodb-*` | Complete database operations and analysis |
| 🧠 **LMStudio AI** | 10 | `lmstudio-*` | AI-powered content analysis and generation |
| 🕷️ **Web Crawler** | 6 | `crawler-*` | Intelligent content discovery and extraction |
| **TOTAL** | **43** | **Complete System** | **Full autonomous knowledge management** |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas connection
- LMStudio running on port 7777 (Windows) or accessible remotely (Linux)

### Installation & Setup
```bash
git clone https://github.com/HarleyVader/js-bambisleep-church.git
cd js-bambisleep-church
npm install
cp .env.example .env  # Configure your environment
npm start             # Starts both web server and MCP server
```

### Environment Configuration
```bash
# Server Configuration
PORT=7070
SERVER=0.0.0.0
BASE_URL=http://localhost:7070
MCP_ENDPOINT=/mcp

# LMStudio Configuration (Smart Platform Detection)
LMSTUDIO_URL_REMOTE=http://192.168.0.118:7777/v1/chat/completions  # For Linux deployment
LMSTUDIO_URL_LOCAL=http://localhost:7777/v1/chat/completions        # For Windows development
LMSTUDIO_MODEL=llama-3.2-3b-instruct@q3_k_l

# MongoDB Configuration
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/

# MCP Configuration
MCP_ENABLED=true
MCP_PORT=7070
MCP_AUTO_DISCOVERY=true
MCP_MAX_TOOLS=50
```

## 🔧 Smart Configuration Features

### Platform-Aware LMStudio Selection
The system automatically detects the runtime environment and selects the appropriate LMStudio endpoint:

- **Windows Development** → Uses `LMSTUDIO_URL_LOCAL` (localhost:7777)
- **Linux Production** → Uses `LMSTUDIO_URL_REMOTE` (192.168.0.118:7777)

### Dynamic Configuration Generation
```bash
npm run config          # Generate all MCP client configurations
npm run config:readme   # Update README with current URLs
```

Generated configurations:
- `mcp-inspector.json` - MCP Inspector configuration
- `configs/vscode-mcp.json` - VS Code integration
- `configs/claude-mcp.json` - Claude Desktop integration

## 🤖 Autonomous Agentic System

### Core Components

#### 🧠 AgenticKnowledgeBuilder
Autonomous AI orchestration engine that:
- Discovers and prioritizes BambiSleep content
- Coordinates all system services intelligently
- Builds structured knowledge base automatically
- Provides personalized learning recommendations

#### 🛠️ Agentic MCP Tools (7 tools)
- `agentic-initialize` - Initialize autonomous system
- `agentic-start-building` - Start autonomous knowledge building
- `agentic-get-status` - Check system status and progress
- `agentic-query-knowledge` - Intelligent knowledge base search
- `agentic-get-stats` - Knowledge base statistics
- `agentic-get-learning-path` - AI-recommended learning paths
- `agentic-stop-building` - Stop autonomous operations

### Autonomous Operation Phases

1. **📋 Content Discovery** - Finds relevant BambiSleep content from bambisleep.info
2. **🧠 AI Prioritization** - LMStudio brain analyzes and prioritizes content
3. **🕷️ Intelligent Crawling** - Selective extraction based on AI recommendations
4. **🗂️ Smart Organization** - Automatic categorization and quality assessment
5. **📊 Knowledge Base Building** - Structured database with searchable content

## 🌸 BambiSleep Community Tools (5 Tools)

Safety-focused tools designed specifically for the BambiSleep community:

- `search-knowledge` - Search curated BambiSleep knowledge base
- `get-safety-info` - Access comprehensive safety information and guidelines
- `church-status` - Get Austrian religious community establishment progress
- `community-guidelines` - Access community rules and conduct standards
- `resource-recommendations` - Personalized content recommendations by experience level

## 🗄️ MongoDB Integration (15 Tools)

Complete database management suite:
- **CRUD Operations** - Create, read, update, delete documents
- **Aggregation Pipeline** - Complex data analysis and transformations
- **Index Management** - Performance optimization
- **Schema Analysis** - Database structure insights
- **Collection Management** - Database organization

## 🧠 LMStudio AI Integration (10 Tools)

Advanced AI capabilities:
- **Chat Completion** - Conversational AI responses
- **Content Analysis** - Automated safety and quality assessment
- **Embeddings** - Semantic content understanding
- **Structured Output** - Formatted AI responses
- **Configuration Management** - Dynamic AI parameter tuning

## 🕷️ Web Crawler System (6 Tools)

Intelligent content discovery:
- **Content Extraction** - Respectful bambisleep.info crawling
- **Link Analysis** - Relationship mapping between resources
- **Batch Processing** - Efficient bulk content processing
- **Session Management** - Persistent crawling sessions

## 🚀 Deployment

### Windows Development
```bash
# LMStudio runs locally on port 7777
npm start  # Uses LMSTUDIO_URL_LOCAL automatically
```

### Linux Production
```bash
# Deploy to remote server, connects to Windows LMStudio
git clone https://github.com/HarleyVader/js-bambisleep-church.git
cd js-bambisleep-church
npm install
# Configure .env with LMSTUDIO_URL_REMOTE
npm start  # Uses LMSTUDIO_URL_REMOTE automatically
```

## 🔍 Testing & Monitoring

### MCP Testing
```bash
node test-inspector.js     # Test MCP server functionality
node test-agentic-system.js # Test autonomous system
```

### Web Interface Access
- **Main Application** - `http://localhost:7070`
- **Agentic Control Panel** - `http://localhost:7070/agents`
- **Knowledge Base** - `http://localhost:7070/knowledge`
- **MCP Inspector** - `http://localhost:7070/inspector`
- **MCP Status API** - `http://localhost:7070/api/mcp/status`

## 🏛️ Austrian Religious Community Progress

**Current Phase**: Foundation Building (Phase 1 of 4)

### Legal Framework
- **Target**: Austrian religious community recognition (§ 7 BekGG)
- **Requirements**: 300+ committed members, established doctrine, safety protocols
- **Progress**: Digital sanctuary infrastructure complete

## 🛡️ Safety & Ethics

### Safety-First Design
- **Content Safety Assessment** - Automated safety level classification
- **Age-Appropriate Filtering** - Built-in protection mechanisms
- **Trigger Warning Generation** - Automatic content warnings
- **Ethics Enforcement** - Community guideline compliance
- **Consent Verification** - Safety-first approach to all content

### Community Guidelines
- **Respectful Interaction** - Supportive community environment
- **Safety Priority** - Personal wellbeing over experience intensity
- **Educational Focus** - Learning and growth emphasis
- **Privacy Protection** - Data security and anonymity

## 📈 Future Development

### Planned Enhancements
- **Mobile Application** - Native iOS/Android apps
- **Advanced AI Models** - Enhanced content analysis capabilities
- **Multi-language Support** - International community expansion
- **Advanced Analytics** - Community insights and progress tracking

---

**BambiSleep Church** - A digital sanctuary for safe, intelligent, and autonomous BambiSleep community knowledge management.

*Repository*: [js-bambisleep-church](https://github.com/HarleyVader/js-bambisleep-church)