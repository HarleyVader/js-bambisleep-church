# GitHub Copilot Instructions - BambiSleep Church

## Project Overview
BambiSleep Church is an Express.js web application serving as a digital sanctuary for the BambiSleep community. It features:
- Knowledge base with curated BambiSleep resources (`src/knowledge/knowledge.json`)
- Real-time chat interface with Socket.IO
- MCP (Model Context Protocol) integration for AI agents
- Geolocation-based visitor tracking
- EJS templating with cyberpunk-themed UI

## Core Architecture

### Entry Point & Server (`src/server.js`)
- Main Express server with Socket.IO for real-time communication
- Serves EJS views from `views/` with cyberpunk styling
- Loads knowledge data from JSON file
- Handles geolocation middleware for visitor tracking
- References MCP agent system (not yet implemented)

### Configuration Pattern
- **Environment variables in `.env`** - All settings (ports, URLs, API keys)
- **NO hardcoded values** - Use process.env directly or create config utility
- **LMStudio integration** - Configured via LMSTUDIO_* env vars

### Knowledge System
- Structured JSON in `src/knowledge/knowledge.json`
- Categories: official, community, safety resources
- Each entry: title, description, URL, category, platform, relevance score

### Styling & UI (`public/css/style.css`)
- **Cyberpunk theme** with CSS custom properties (--primary, --secondary, etc.)
- **Orbitron + Rajdhani fonts** for futuristic aesthetic
- **Gradient backgrounds** using CSS custom properties
- **Responsive grid layouts** for feature cards

## Development Workflows

### Starting the Application
```bash
npm run start        # Concurrent MCP + web server
npm run start:web    # Web server only
npm run start:mcp    # MCP server only (when implemented)
```

### Key File Structure
```
src/server.js           # Main Express application
src/knowledge/          # JSON knowledge base
src/utils/logger.js     # Simple emoji-based logging
views/pages/            # EJS page templates
views/partials/         # Reusable EJS components
public/css/style.css    # Cyberpunk theme CSS
.env                    # All configuration
mcp.json               # MCP server configuration
```

## Coding Conventions

### Minimalist Approach
- **Function over form** - Working code over perfect code
- **ES6 modules** - Use import/export throughout
- **Simple logging** - Use existing emoji-based logger (`log.info`, `log.error`)

### Missing Components (Implement When Needed)
- `src/utils/config.js` - Configuration utility (referenced but doesn't exist)
- `src/mcp/` directory - MCP agent implementation
- `src/services/` directory - Service layer components

### EJS Template Pattern
- Use `<%- include('../partials/header') %>` for consistent layout
- Pass `location` object for geolocation features
- Structure: pages call partials, not nested deeply

### Socket.IO Integration
- Real-time features in `public/js/agent-chat.js`
- Server-side Socket.IO setup in main server file

## Critical Notes
- **BambiSleep context** - Adult hypnosis content, handle with appropriate safety warnings
- **Austrian religious community goal** - Legal/cultural context for "Church" branding
- **MCP integration planned** - Architecture ready but implementation missing
- **Geolocation tracking** - Privacy-conscious visitor analytics
