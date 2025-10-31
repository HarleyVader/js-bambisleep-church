# BambiSleep™ Church - AI Agent Instructions
*🌸 MCP Control Tower & Unity Avatar Development Environment 🌸*

## Project Overview

This is a **dual-platform development environment** with a unique architecture:

1. **MCP Control Tower** (Node.js) - Managing 8 Model Context Protocol servers for AI tooling integration
2. **Unity CatGirl Avatar System** (C#) - XR avatar framework with RPG mechanics and enterprise monetization

**Critical Understanding**: This project follows the "Universal Machine Philosophy" with emoji-driven development workflows and 100% test coverage enforcement.

**Current State**: 
- MCP infrastructure: 3/8 servers configured, coverage reports exist (~79%) but source files missing
- All npm scripts are placeholders (`echo 'not yet implemented'`) - use VS Code tasks instead
- Unity specs complete (683 lines in `CATGIRL.md`) but implementation separate from Node.js codebase

*Complete philosophy in `public/docs/RELIGULOUS_MANTRA.md`, Unity specs in `public/docs/CATGIRL.md`*

## Critical Architecture Patterns

### MCP Server Infrastructure (3/8 Active)
**Location**: `.vscode/settings.json` contains MCP server registry
**Active**: `filesystem`, `git`, `github` (all use `npx -y` pattern)
**Missing**: `mongodb`, `stripe`, `huggingface`, `azure-quantum`, `clarity`

```jsonc
// Pattern for adding new MCP servers to .vscode/settings.json
"mcp.servers": {
  "servername": {
    "command": "npx", 
    "args": ["-y", "@modelcontextprotocol/server-name", "/mnt/f/bambisleep-church"]
  }
}
```

### Development Workflow (CRITICAL: Use Tasks, Not npm)
**All npm scripts echo placeholders** - use VS Code tasks instead:
- `Ctrl+Shift+P` → "Run Task" → Select emoji-prefixed task
- Tasks defined in `.vscode/tasks.json` with proper problem matchers
- Example: "🌸 Start Control Tower (Dev)" instead of `npm run dev`

### Test Infrastructure State
**Evidence**: Jest coverage reports exist in `/coverage/` (~79.28% statements, 52.54% branches)
**Missing**: Actual source files (`src/mcp/orchestrator.js`, `src/utils/logger.js`) 
**Goal**: 100% coverage enforcement via Jest configuration

## Essential Development Knowledge

### Emoji-Driven Development System
This project uses emoji prefixes for **machine-readable commit patterns**:
```javascript
// From RELIGULOUS_MANTRA.md - CI/CD automation patterns
'🌸' // CHERRY_BLOSSOM - Package management, npm operations  
'👑' // CROWN - Architecture decisions, major refactors
'💎' // GEM - Quality metrics, test coverage enforcement
'🦋' // BUTTERFLY - Transformation processes, migrations
'✨' // SPARKLES - Server operations, MCP management
'🎭' // PERFORMING_ARTS - Development lifecycle, deployment
```

### Critical File Locations
```
public/docs/
├── RELIGULOUS_MANTRA.md    # Development philosophy & emoji mappings
├── MCP_SETUP_GUIDE.md      # Complete 8-server setup instructions  
├── CATGIRL.md             # Unity avatar specs (683 lines)
└── UNITY_SETUP_GUIDE.md   # Unity 6.2 installation on Linux

.vscode/
├── settings.json          # MCP server registry + GitHub Copilot config
├── tasks.json            # Emoji-prefixed task definitions
└── launch.json           # Edge browser debugging setup

coverage/                  # Jest reports (79% current, 100% target)
src/ui/                   # Empty - needs MCP Control Tower implementation
```

### Organization Requirements
- **Always** use "BambiSleep™" trademark symbol
- Reference BambiSleepChat organization in GitHub operations
- Follow MIT license with proper attribution

## Dual-Platform Architecture

### Node.js MCP Control Tower
**Current State**: Package structure ready but implementation missing
- `src/ui/` directory is empty - needs MCP dashboard implementation  
- All npm scripts are placeholders - use VS Code tasks instead
- Jest infrastructure exists with 79% coverage from previous implementation
- Missing source files: `src/mcp/orchestrator.js`, `src/utils/logger.js`

### Unity CatGirl Avatar System  
**Specifications**: Complete 683-line spec in `public/docs/CATGIRL.md`
- Unity 6.2 LTS with XR Interaction Toolkit
- Eye/hand tracking, RPG inventory, universal banking system
- Separate project from Node.js MCP codebase
- Setup guide: `public/docs/UNITY_SETUP_GUIDE.md`

### VS Code Integration Patterns
**MCP Servers**: Auto-register in AI assistant when added to `.vscode/settings.json`
**Tasks**: Use emoji-prefixed tasks (🌸, 💎, 🌀) instead of npm scripts
**Problem Matchers**: ESLint integration via `$eslint-stylish`
**Zero-Config**: No default formatter set (intentional design choice)

## MCP Server Configuration Guide

### Adding Missing Servers (5/8 Need Setup)
To add the remaining MCP servers to `.vscode/settings.json`:

```jsonc
// MongoDB - requires connection string
"mongodb": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-mongodb", "--connection-string", "mongodb://localhost:27017"]
},

// Stripe - requires API keys (set STRIPE_SECRET_KEY env var)  
"stripe": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-stripe"]
},

// HuggingFace - requires token (set HUGGINGFACE_HUB_TOKEN env var)
"huggingface": {
  "command": "npx", 
  "args": ["-y", "@modelcontextprotocol/server-huggingface"]
},

// Azure Quantum - requires workspace config
"azure-quantum": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-azure-quantum"]
},

// Microsoft Clarity - requires project ID  
"clarity": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-microsoft-clarity"]
}
```

### Unity Development Patterns
**Architecture**: Component-based XR system with Unity 6.2
**Key Systems**: Eye/hand tracking, RPG inventory, multi-currency economy
**Implementation**: Separate Unity project following `CATGIRL.md` specifications

## Development Workflows

### Testing & Coverage (Priority: Reach 100%)
- **Current**: `coverage/` shows 79.28% statements, 52.54% branches
- **Command**: Use "💎 Run Tests (100% Coverage)" task (currently placeholder)
- **Philosophy**: "100% test coverage or suffer in callback hell eternal"

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
     "args": ["-y", "@modelcontextprotocol/server-{name}", "/mnt/f/bambisleep-church"]
   }
   ```
3. Test via VS Code MCP integration

### MCP Server Integration Patterns
**Server Lifecycle Management**:
```javascript
// MCP servers auto-start with VS Code via npx -y pattern
// No local installation conflicts - each server runs independently
// Workspace-specific configuration in .vscode/settings.json
// Error handling via VS Code MCP extension logs
```

**VS Code Integration Hooks**:
- **Auto-registration**: MCP servers appear in VS Code AI assistant tools
- **Context Awareness**: All servers have workspace path context (`/mnt/f/bambisleep-church`)
- **Error Diagnostics**: Use VS Code MCP extension for debugging server issues
- **Environment Variables**: Set required API keys/tokens before server activation

**Server Communication Patterns**:
- **Filesystem Server**: Direct file operations, no authentication required
- **Git Server**: Repository operations using local Git config and SSH keys
- **GitHub Server**: Requires `GITHUB_TOKEN` environment variable
- **External APIs**: MongoDB, Stripe, HuggingFace, Azure, Clarity need credentials
- **Concurrent Access**: Multiple servers can operate simultaneously without conflicts

## Critical Patterns for AI Agents

### Organization Compliance Requirements
- **Always** include BambiSleep™ trademark symbol in documentation
- **GitHub operations** should reference BambiSleepChat organization context

### Dual Platform Development Workflow
**Node.js MCP Stack**:
1. Use VS Code tasks (Ctrl+Shift+P → "Run Task") for all npm operations
2. All scripts currently echo placeholders - need real implementations
3. Test coverage infrastructure exists but source code is missing
4. MCP server configuration via `.vscode/settings.json`

**Unity Avatar Development**:
1. Follow `UNITY_SETUP_GUIDE.md` for Unity 6.2 installation
2. CatGirl avatar specs in `CATGIRL.md` (683 lines of detailed requirements)
3. XR Interaction Toolkit for eye/hand tracking
4. Separate Unity project structure from Node.js MCP codebase

### Development Priority Order
1. **Complete MCP server configuration** (5 missing servers: mongodb, stripe, huggingface, azure-quantum, clarity)
2. **Achieve 100% test coverage** (coverage infrastructure exists but needs source code)
3. **Implement actual src/ code** (UI directory empty, but package.json structure ready)
4. **Set up proper npm scripts** (currently all echo placeholders - replace with real implementations)
5. **Unity CatGirl avatar system** (follow CATGIRL.md specifications for implementation)

### VS Code Integration Patterns
- Use **emoji-prefixed tasks** for all operations (matches RELIGULOUS_MANTRA.md)
- **MCP servers** auto-register in VS Code for AI assistant integration
- **Problem matchers** configured for ESLint integration
- **Zero-config approach**: No default formatter set (intentional design choice)
- **GitHub Copilot** configured for BambiSleepChat organization context