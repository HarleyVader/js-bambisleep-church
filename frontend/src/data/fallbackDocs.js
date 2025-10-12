// Fallback documentation content for development/demo
export const fallbackDocs = {
    'README.md': `# 📚 BambiSleep Church Documentation Index

Welcome to the BambiSleep Church documentation! This index organizes all documentation by category for easy navigation.

## 🚀 Getting Started

### Setup & Deployment

- **[BUILD.md](/docs/BUILD)** - Build instructions and development setup
- **[DEPLOYMENT-GUIDE.md](/docs/DEPLOYMENT-GUIDE)** - Production deployment guide

## 🔧 System Architecture

### Core Systems

- **[MOTHER-BRAIN-COMPLETE-GUIDE.md](/docs/MOTHER-BRAIN-COMPLETE-GUIDE)** - 🔥 Complete MOTHER BRAIN system guide
- **[SYSTEM-COMPLETE-UNIFIED.md](/docs/SYSTEM-COMPLETE-UNIFIED)** - Unified system architecture overview
- **[CRAWLER-BRAIN-README.md](/docs/CRAWLER-BRAIN-README)** - Intelligent crawler brain system

### Integration Protocols

- **[MCP-COMPLETE-GUIDE.md](/docs/MCP-COMPLETE-GUIDE)** - Model Context Protocol integration guide

## 🎨 Frontend & UI

### User Interface

- **[FRONTEND-README.md](/docs/FRONTEND-README)** - Frontend development and React components

## 🔥 Featured Systems

### MOTHER BRAIN Spider System
The heart of the BambiSleep Church system, providing:
- Ethical web crawling capabilities
- Real-time mainframe global chat
- Community-integrated knowledge building
- Advanced safety protocols

**Primary Documentation**: [MOTHER-BRAIN-COMPLETE-GUIDE.md](/docs/MOTHER-BRAIN-COMPLETE-GUIDE)

## 📊 Document Status

| Document | Status | Primary Focus |
|----------|--------|---------------|
| MOTHER-BRAIN-COMPLETE-GUIDE.md | ✅ Current | System integration |
| MCP-COMPLETE-GUIDE.md | ✅ Current | MCP integration |
| BUILD.md | ✅ Current | Development setup |
| DEPLOYMENT-GUIDE.md | ✅ Current | Production deployment |
| FRONTEND-README.md | ✅ Current | UI development |
| SYSTEM-COMPLETE-UNIFIED.md | ✅ Current | Architecture overview |
| CRAWLER-BRAIN-README.md | ⚠️ Legacy | Historical crawler docs |

## 🆘 Getting Help

1. **System Issues**: Check MOTHER-BRAIN-COMPLETE-GUIDE.md troubleshooting section
2. **Build Problems**: Follow BUILD.md step-by-step instructions
3. **Deployment Issues**: Review DEPLOYMENT-GUIDE.md prerequisites
4. **Frontend Questions**: Consult FRONTEND-README.md component guides
5. **Community Support**: Use the mainframe chat system (\`mainframe info\` command)

---

*Documentation maintained by the BambiSleep Church development team.*`,

    'BUILD.md': `# 🔧 Build Instructions

## Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB (local or Atlas)
- LMStudio (optional, for AI features)

## Quick Start

\`\`\`bash
# Clone repository
git clone https://github.com/HarleyVader/js-bambisleep-church.git
cd js-bambisleep-church

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev
\`\`\`

## Environment Configuration

Create a \`.env\` file with:

\`\`\`env
# Server Configuration
PORT=7070
HOST=0.0.0.0

# MongoDB
MONGODB_URI=mongodb://localhost:27017/bambisleep-church

# LMStudio (optional)
LMSTUDIO_BASE_URL=http://localhost:1234
LMSTUDIO_MODEL=your-model-name
\`\`\`

## Development

\`\`\`bash
# Backend development
npm run dev

# Frontend development
cd frontend && npm run dev

# Run both concurrently
npm run start
\`\`\`

## Production Build

\`\`\`bash
# Build frontend
cd frontend && npm run build

# Start production server
npm run start
\`\`\``,

    'MOTHER-BRAIN-COMPLETE-GUIDE.md': `# 🔥🧠 MOTHER BRAIN System - Complete Integration Guide

## Overview

The MOTHER BRAIN system is the core intelligence powering the BambiSleep Church platform, combining ethical web crawling, real-time community chat, and AI-powered knowledge building.

## 🚀 Key Features

### 🕷️ Ethical Spider System
- Minigun-level crawling capabilities with maximum politeness
- 100% robots.txt compliance and respectful delays
- Advanced error handling and exponential backoff
- Real-time statistics and health monitoring

### 💬 Mainframe Global Chat
- Real-time community communication system
- User management with profiles and reputation
- Content sharing and validation features
- Social interactions (likes, replies, moderation)

### 🛡️ Safety Integration
- Enhanced safety protocols with community support
- Crisis resource integration
- Peer support systems
- Automatic safety protocol alerts

## 🔧 System Architecture

### Core Components

1. **MotherBrain.js** - Primary spider system with chat integration
2. **MinimalChatAgent.js** - MOTHER BRAIN-powered chat interface
3. **AgenticKnowledgeBuilder.js** - AI knowledge building with MOTHER BRAIN
4. **MotherBrainIntegration.js** - Integration utilities and helpers

### Integration Status

✅ **MOTHER BRAIN SPIDER SYSTEM ARMED AND READY**
✅ **MAINFRAME GLOBAL CHAT STREAM ONLINE**
✅ **All systems online and operational**
✅ **Chat Agent connected to mainframe**

## 🚀 Usage

### Starting the System

\`\`\`bash
npm run dev          # Development with file watching
npm run start        # Production mode
\`\`\`

### Chat Commands

- \`mainframe info\` - View community status and recent activity
- \`mainframe join\` - Connect to the global chat stream
- \`mainframe post [message]\` - Share messages with community
- \`share finding [url]\` - Share discoveries with validation
- \`mainframe status\` - Check system operational status

### Direct MOTHER BRAIN Usage

\`\`\`javascript
// Initialize MOTHER BRAIN
const motherBrain = new MotherBrain();
await motherBrain.initialize();

// Crawl with ethics
const result = await motherBrain.crawlUrl('https://example.com');

// Join mainframe chat
await motherBrain.joinMainframeChat(userId, userProfile);

// Share findings
await motherBrain.shareFinding(userId, url, description);
\`\`\`

## 📊 Performance

- **Legacy Code Removed**: 1,338 lines
- **New Features Added**: 800+ lines
- **Chat Capabilities**: 300% improvement with community integration
- **Crawling Performance**: Minigun-level spider system
- **Error Handling**: Community-assisted troubleshooting

## 🔒 Safety & Ethics

The MOTHER BRAIN system operates with ethical boundaries:

- **Respectful Crawling**: Observes robots.txt and rate limiting
- **Community Safety**: Enhanced safety protocols with peer support
- **Crisis Support**: Integrated crisis resources and community assistance
- **Ethical AI**: Responsible AI usage with human oversight

---

*The MOTHER BRAIN system represents the pinnacle of ethical AI-powered web intelligence, designed for community benefit and responsible operation.*`
};

export default fallbackDocs;
