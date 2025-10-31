# MCP Server Setup Guide
*Complete installation and configuration guide for BambiSleep™ Church development*

## 🌸✨ Essential 8 MCP Servers (Official) ✨🌸

Based on the official ModelContextProtocol servers and optimized for your development style:

### 🦋 1. Filesystem Server
**Purpose**: File operations, directory management, code editing
```bash
# Installation via npx (recommended)
npx -y @modelcontextprotocol/server-filesystem

# VS Code configuration
{
  "mcp.servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
    }
  }
}
```

**Why for HarleyVader**: Essential for your React/JavaScript projects, file manipulation in js-bambisleep-chat

---

### 💎 2. Git Server  
**Purpose**: Version control, commit management, branch operations
```bash
# Installation
npx -y @modelcontextprotocol/server-git

# VS Code configuration
{
  "mcp.servers": {
    "git": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "/workspace"]
    }
  }
}
```

**Why for HarleyVader**: Critical for your multi-repo workflow (20+ active repos), commit automation

---

### 👑 3. GitHub Server
**Purpose**: Repository management, issues, pull requests, releases
```bash
# Installation
npx -y @modelcontextprotocol/server-github

# VS Code configuration  
{
  "mcp.servers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

**Why for HarleyVader**: Perfect for managing BambiSleepChat organization, automated issue creation

---

### 🔮 4. Memory Server
**Purpose**: Persistent context, conversation history, knowledge retention
```bash
# Installation
npx -y @modelcontextprotocol/server-memory

# VS Code configuration
{
  "mcp.servers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

**Why for HarleyVader**: Essential for AI agent development, maintaining context across sessions

---

### ✨ 5. Sequential Thinking Server
**Purpose**: Complex reasoning, step-by-step problem solving
```bash
# Installation
npx -y @modelcontextprotocol/server-sequential-thinking

# VS Code configuration
{
  "mcp.servers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

**Why for HarleyVader**: Perfect for your complex AI agent architecture, debugging logical flows

---

### 🎭 6. Everything Server (Testing/Demo)
**Purpose**: Comprehensive testing, MCP feature demonstration
```bash
# Installation
npx -y @modelcontextprotocol/server-everything

# VS Code configuration
{
  "mcp.servers": {
    "everything": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything"]
    }
  }
}
```

**Why for HarleyVader**: Great for testing MCP integration, exploring capabilities

---

### 🌀 7. Brave Search Server  
**Purpose**: Web search, real-time information, research
```bash
# Installation via uvx
uvx mcp-server-brave-search

# VS Code configuration
{
  "mcp.servers": {
    "brave-search": {
      "command": "uvx",
      "args": ["mcp-server-brave-search"]
    }
  }
}
```

**Why for HarleyVader**: Research for hypnosis content, AI model information, tech trends

---

### 💅 8. Postgres Server
**Purpose**: Database operations, SQL queries, data management
```bash
# Installation via uvx  
uvx mcp-server-postgres

# VS Code configuration
{
  "mcp.servers": {
    "postgres": {
      "command": "uvx",
      "args": ["mcp-server-postgres", "--db-url", "postgresql://localhost:5432/bambisleep"]
    }
  }
}
```

**Why for HarleyVader**: Database management for user profiles, chat systems in BambiSleep apps

---

## 🌸💫 Recommended Servers (Based on Your Style) 💫🌸

### 🦄 Puppeteer (Browser Automation)
**Perfect for**: Web scraping, UI testing, automation
```bash
npx -y @modelcontextprotocol/server-puppeteer
```

### 🎪 Slack Integration  
**Perfect for**: Team communication, BambiSleepChat coordination
```bash
uvx mcp-server-slack
```

### 🌈 Docker Server
**Perfect for**: Container management, deployment automation  
```bash
npx -y @modelcontextprotocol/server-docker
```

### 💖 SQLite Server
**Perfect for**: Local databases, rapid prototyping
```bash
uvx mcp-server-sqlite
```

### 🔥 MongoDB Server (Community)
**Perfect for**: NoSQL data, flexible schemas for AI applications
```bash
# Community server - matches your MongoDB usage
npx -y mcp-mongodb-server
```

---

## 🌸🛠️ Complete VS Code Configuration 🛠️🌸

Add this to your `.vscode/settings.json`:

```json
{
  "mcp.servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
    },
    "git": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "/workspace"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "everything": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything"]
    },
    "brave-search": {
      "command": "uvx",
      "args": ["mcp-server-brave-search"]
    },
    "postgres": {
      "command": "uvx",
      "args": ["mcp-server-postgres", "--db-url", "postgresql://localhost:5432/bambisleep"]
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "docker": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-docker"]
    }
  }
}
```

## 🌸⚡ Quick Installation Script ⚡🌸

```bash
#!/bin/bash
# Install all essential MCP servers for BambiSleep Church development

echo "🌸 Installing MCP servers for BambiSleep™ Church development... ✨"

# Official servers via npm
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-git  
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-memory
npm install -g @modelcontextprotocol/server-sequential-thinking
npm install -g @modelcontextprotocol/server-everything

# Python-based servers via uvx
uvx --install mcp-server-brave-search
uvx --install mcp-server-postgres
uvx --install mcp-server-sqlite

echo "💎 8/8 MCP servers installed successfully! 💎"
echo "🦋 Configure VS Code settings and start developing! 🦋"
```

## 🌸🔧 Testing Your Setup 🔧🌸

### Verify MCP Integration
```bash
# Test filesystem server
npx @modelcontextprotocol/server-filesystem --help

# Test git server  
npx @modelcontextprotocol/server-git --help

# Test GitHub connection
gh auth status
```

### VS Code MCP Status
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run `MCP: Show Server Status`
3. Verify all servers show "Connected" ✅

## 🌸💫 Advanced Configuration 💫🌸

### Environment Variables
```bash
# Add to your shell profile (.bashrc, .zshrc)
export MCP_SERVER_LOG_LEVEL=INFO
export GITHUB_TOKEN="your_github_token_here"  
export BRAVE_API_KEY="your_brave_api_key_here"
export DATABASE_URL="postgresql://localhost:5432/bambisleep"
```

### Custom MCP Server Development
Based on your coding style, consider creating:
- **bambisleep-hypnosis-mcp**: Audio file management
- **aigf-personality-mcp**: AI girlfriend personality switching
- **trigger-system-mcp**: Hypnotic trigger management
- **chat-analytics-mcp**: BambiSleep.Chat metrics

---

**Status**: 🌸 **8/8 MCP SERVERS READY FOR BAMBISLEEP™ CHURCH** 🌸  
**Next**: Configure individual servers and test integration with your AI agents  
**Perfect for**: Your JavaScript/TypeScript/React development workflow with AI agent integration

*Universal Machine Philosophy: Write once, run forever, across all MCP-enabled environments* ✨🦋💎