# MCP Control Tower - AI Agent Instructions
*🌸 BambiSleep™ Church Development Environment 🌸*

## Project Overview

This is an MCP (Model Context Protocol) Control Tower for managing and orchestrating multiple MCP servers for the **BambiSleepChat** organization. The project embodies the **Universal Machine Philosophy** from HarleyVader - achieving enterprise-grade infrastructure with "religulous" devotion to code quality.

**🦋 Sacred Mission**: Build AIGF platforms that reprogram reality through elegant code  
**💎 Core Law**: 100% test coverage or suffer in callback hell eternal (Jest coverage reports exist in `/coverage/`)  
**🌀 Divine Goal**: 8/8 MCP server operational status (3/8 currently configured: filesystem, git, github)

*See `RELIGULOUS_MANTRA.md` for the complete philosophical framework and emoji-encoded development patterns.*

## Current Architecture State

### Implementation Status (Early Development)
- **Package.json**: Configured but all npm scripts are placeholders (`echo 'not yet implemented'`)
- **Source Code**: `src/ui/` directory exists but is empty - no actual implementation yet
- **Test Infrastructure**: Jest coverage reports exist showing previous MCP orchestrator and logger implementations
- **Container Setup**: Fully configured devcontainer with proper BambiSleepChat organization labels
- **VS Code Integration**: Complete configuration for MCP servers, tasks, and AI assistant integration

## Architecture & Current State

### MCP Server Configuration (3/8 Active)
- **Location**: `.vscode/settings.json` - MCP server registry with proper workspace paths
- **Active Servers**: `filesystem`, `git`, `github` (configured for `/workspace`)
- **Missing Servers**: MongoDB, Stripe, HuggingFace, Azure Quantum, Microsoft Clarity (per RELIGULOUS_MANTRA.md)
- **Pattern**: All servers use `npx -y @modelcontextprotocol/server-*` to avoid version conflicts

### Container Architecture 
- **Base**: `mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye` with BambiSleepChat labels
- **Organization Labels**: Full trademark compliance via `org.bambi.*` labels (see CONTAINER_ORGANIZATION.md)  
- **Workspace**: Bind mount `/workspace` for live development
- **Ports**: 3000 (Control Tower), 4000 (Docs), 8080 (secondary), forwarded in devcontainer.json
- **Extensions**: JSON, Tailwind CSS, Prettier, Code Spell Checker auto-installed
- **Features**: Git and GitHub CLI included via devcontainer features

### Test Infrastructure (Evidence Exists)
- **Coverage Reports**: Jest coverage in `/coverage/` shows ~79% for MCP orchestrator
- **Test Evidence**: `src/mcp/orchestrator.js` and `src/utils/logger.js` have coverage data
- **Missing**: Source files appear to be moved/cleaned, but coverage infrastructure remains functional

## Essential Development Patterns

### Task-Based Workflows (Use VS Code Tasks)
**Critical**: Always use VS Code Tasks (Ctrl+Shift+P → "Run Task"), not direct npm commands

All npm scripts are currently placeholders that echo 'not yet implemented':
```bash
# Primary development commands (all use emoji prefixes)
🌸 Start Control Tower (Dev)     # npm run dev - placeholder
💎 Run Tests (100% Coverage)     # npm run test - placeholder  
🌀 Check MCP Server Status       # npm run mcp:status - needs implementation
📚 Start Documentation Server    # npm run docs - placeholder (port 4000)
🧹 Lint & Fix Code              # npm run lint:fix - needs ESLint setup
💅 Format Code (Prettier)       # npm run format - needs Prettier setup
🔍 Test Watch Mode              # npm run test:watch - placeholder
🚀 Start Production Server       # npm run start - placeholder (port 3000)
🏗️ Build Production             # npm run build - placeholder
```

**Implementation Priority**: Set up actual npm scripts to replace placeholder echo commands

### BambiSleepChat Organization Compliance
- **Trademark**: Always use "BambiSleep™" with symbol in public materials
- **Container Registry**: `ghcr.io/bambisleepchat/bambisleep-church`
- **Labeling**: All containers must include org.bambi.* labels (see CONTAINER_ORGANIZATION.md)
- **Repository**: Proper GitHub organization attribution required

#### Required Container Labels (CRITICAL)
All Dockerfiles MUST include these labels for trademark compliance:
```dockerfile
LABEL org.opencontainers.image.vendor="BambiSleepChat"
LABEL org.opencontainers.image.source="https://github.com/BambiSleepChat/bambisleep-church"
LABEL org.opencontainers.image.documentation="https://github.com/BambiSleepChat/bambisleep-church"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.title="BambiSleep Church MCP Control Tower"
LABEL org.opencontainers.image.description="Model Context Protocol server management and orchestration for BambiSleep Church"
LABEL org.bambi.trademark="BambiSleep™ is a trademark of BambiSleepChat"
LABEL org.bambi.organization="BambiSleepChat"
```

#### Container Registry Tagging Convention
- `latest` - Latest stable release
- `main` - Latest main branch build  
- `v{major}.{minor}.{patch}` - Semantic version releases
- `dev-{branch}` - Development branches

## Critical Configuration Files

### VS Code MCP Integration (`.vscode/settings.json`)
```jsonc
"mcp.servers": {
  "filesystem": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"] },
  "git": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "/workspace"] },
  "github": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"] }
}
```

### Formatter Configuration (Zero-Config Approach)
- **Prettier**: Pre-installed but no default formatter set (intentional)
- **ESLint**: Problem matcher configured for `$eslint-stylish`
- **JSON**: Uses built-in `vscode.json-language-features`
- **Tailwind**: CSS validation disabled to prevent conflicts
- **Spell Check**: Code Spell Checker with `cspell.json` for technical terms

### Missing MCP Servers (5/8 Need Configuration)
Add these to `.vscode/settings.json` mcp.servers section:
```jsonc
"mongodb": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-mongodb", "--connection-string", "mongodb://localhost:27017"]
},
"stripe": {
  "command": "npx", 
  "args": ["-y", "@modelcontextprotocol/server-stripe"]
},
"huggingface": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-huggingface"]
},
"azure-quantum": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-azure-quantum"]
},
"clarity": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-microsoft-clarity"]
}
```

## File Organization & Current State

### Actual Structure
```
/mnt/f/bambisleep-church/
├── src/ui/                     # Empty UI directory (needs implementation)
├── coverage/                   # Jest coverage reports (~79% current)
│   ├── lcov-report/           # HTML coverage viewer
│   └── mcp/orchestrator.js.html # Evidence of MCP orchestrator implementation
├── .vscode/                   # Complete VS Code configuration
│   ├── settings.json          # MCP server registry + GitHub Copilot config
│   ├── tasks.json             # Emoji-prefixed task definitions
│   └── launch.json            # Edge browser debugging
├── .devcontainer/             # Container with org labels
│   ├── devcontainer.json      # Container config with port forwarding
│   └── Dockerfile             # Custom container with org labels
├── RELIGULOUS_MANTRA.md       # Philosophical framework & emoji mappings
├── CONTAINER_ORGANIZATION.md  # Trademark compliance guide
├── cspell.json                # Spell checker config with technical terms
└── package.json               # Complete project config (scripts are placeholders)
```

### Core Project Patterns

#### MCP Server Management
- **Add New Server**: Update `.vscode/settings.json` mcp.servers section
- **Path Consistency**: All servers use `/workspace` as repository path
- **Version Safety**: `npx -y` prevents local version conflicts
- **Target Goal**: 8/8 servers (filesystem, git, github, mongodb, stripe, huggingface, azure-quantum, clarity)

#### Detailed Server Configuration Patterns

**MongoDB Server Setup**:
```jsonc
// Requires MongoDB connection string configuration
// Default: mongodb://localhost:27017 for local development
// Production: Use environment variables via --connection-string
"mongodb": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-mongodb", "--connection-string", "mongodb://localhost:27017"]
}
```

**Stripe Server Setup**:
```jsonc
// Requires Stripe API keys via environment variables
// Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY before activation
"stripe": {
  "command": "npx", 
  "args": ["-y", "@modelcontextprotocol/server-stripe"]
}
```

**HuggingFace Server Setup**:
```jsonc
// Requires HuggingFace Hub token for private models
// Set HUGGINGFACE_HUB_TOKEN environment variable
"huggingface": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-huggingface"]
}
```

**Azure Quantum Server Setup**:
```jsonc
// Requires Azure Quantum workspace configuration
// Set AZURE_QUANTUM_WORKSPACE_ID and authentication credentials
"azure-quantum": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-azure-quantum"]
}
```

**Microsoft Clarity Server Setup**:
```jsonc
// Requires Microsoft Clarity project configuration
// Set CLARITY_PROJECT_ID for analytics access
"clarity": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-microsoft-clarity"]
}
```

#### Trademark & Organization Compliance
```dockerfile
# Required in all containers (from .devcontainer/Dockerfile)
LABEL org.bambi.trademark="BambiSleep™ is a trademark of BambiSleepChat"
LABEL org.bambi.organization="BambiSleepChat"
```

#### Emoji-Driven Development (RELIGULOUS_MANTRA.md patterns)
```javascript
// Machine-readable emoji commands for CI/CD
const EMOJI_COMMANDS = {
  'CHERRY_BLOSSOM': '🌸',  // Package management
  'CROWN': '👑',           // Architecture decisions  
  'GEM': '💎',             # Quality metrics
  'BUTTERFLY': '🦋'        // Transformation processes
};
```

## Development Workflows

### Testing & Coverage (Priority: Reach 100%)
- **Current**: `coverage/` shows 79.28% statements, 52.54% branches
- **Command**: Use "💎 Run Tests (100% Coverage)" task (currently placeholder)
- **Philosophy**: "100% test coverage or suffer in callback hell eternal"

### Container Development
```bash
# Container automatically runs npm install on creation
# Use VS Code tasks (not direct npm commands) for consistency
# All task labels use emoji prefixes for visual organization
```

### Formatter Configuration (Zero-Config Approach)
- **Prettier**: Pre-installed but no default formatter set (intentional)
- **ESLint**: Problem matcher configured for `$eslint-stylish`
- **JSON**: Uses built-in `vscode.json-language-features`
- **Tailwind**: CSS validation disabled to prevent conflicts
- **Spell Check**: Code Spell Checker with `cspell.json` for technical terms

### Adding MCP Servers (5 Missing)
1. Install: `npm install @modelcontextprotocol/server-{name}`
2. Configure in `.vscode/settings.json`:
   ```jsonc
   "{name}": {
     "command": "npx",
     "args": ["-y", "@modelcontextprotocol/server-{name}", "/workspace"]
   }
   ```
3. Test via VS Code MCP integration
4. Update port forwards in `devcontainer.json` if needed

## Critical Patterns for AI Agents

### Organization Compliance Requirements
- **Always** include BambiSleep™ trademark symbol in documentation
- **Container images** must have proper org.bambi.* labels
- **GitHub operations** should reference BambiSleepChat organization context

### Development Priority Order
1. **Complete MCP server configuration** (5 missing servers: mongodb, stripe, huggingface, azure-quantum, clarity)
2. **Achieve 100% test coverage** (coverage infrastructure exists but needs source code)
3. **Implement actual src/ code** (UI directory empty, but package.json structure ready)
4. **Set up proper npm scripts** (currently all echo placeholders - replace with real implementations)

### VS Code Integration Patterns
- Use **emoji-prefixed tasks** for all operations (matches RELIGULOUS_MANTRA.md)
- **MCP servers** auto-register in VS Code for AI assistant integration
- **Problem matchers** configured for ESLint integration
- **Container bind mount** enables live development without rebuilds
- **Zero-config approach**: No default formatter set (intentional design choice)
- **GitHub Copilot** configured for BambiSleepChat organization context