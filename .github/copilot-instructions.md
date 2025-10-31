# BambiSleep™ Church - AI Agent Instructions

_🌸 MCP Control Tower & Unity Avatar Development Environment 🌸_

## Project Overview

This is a **dual-platform development environment** managing Model Context Protocol (MCP) servers:

1. **MCP Control Tower** (Node.js) - Enterprise-grade orchestration platform managing 8 MCP servers for AI tooling integration
2. **Unity CatGirl Avatar System** (C#) - XR avatar framework (separate project, specs in `public/docs/CATGIRL.md`)

**Critical Understanding**: This project follows the "Universal Machine Philosophy" with emoji-driven development workflows and **100% test coverage enforcement** via Jest.

**Current State - FULLY OPERATIONAL**:

- ✅ **8/8 MCP servers configured** in `.vscode/settings.json` (filesystem, git, github, mongodb, stripe, huggingface, azure-quantum, clarity)
- ✅ **Source code implemented**: `src/mcp/orchestrator.js` (472 lines, 29 functions), `src/utils/logger.js` (237 lines), `src/index.js` (228 lines)
- ✅ **100% test coverage achieved**: `src/tests/mcp/orchestrator.test.js` (605 lines, comprehensive mocking), `src/tests/utils/logger.test.js`
- ✅ **All npm scripts functional**: Use directly (`npm test`, `npm run dev`) or via VS Code tasks (`Ctrl+Shift+P` → "Run Task")
- 🚧 **UI dashboard pending**: `src/ui/` directory empty, ready for MCP status dashboard implementation

_Complete philosophy in `public/docs/RELIGULOUS_MANTRA.md`, Unity specs in `public/docs/CATGIRL.md`_

## Critical Architecture Patterns

### MCP Server Infrastructure (8/8 Active)

**Location**: `.vscode/settings.json` → `"mcp.servers"` object (lines 116-169)
**All 8 Servers Configured**: `filesystem`, `git`, `github`, `mongodb`, `stripe`, `huggingface`, `azure-quantum`, `clarity`

**Pattern**: All use `npx -y @modelcontextprotocol/server-{name}` with workspace path context for zero-install deployment.

```jsonc
// Example MCP server configuration pattern
"servername": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-name", "/mnt/f/bambisleep-church"]
}
```

**Environment Variables Required** (see `.env.example`):

- GitHub: `GITHUB_TOKEN` (required for github server)
- Stripe: `STRIPE_SECRET_KEY` (conditionally loaded in `src/index.js` line 49)
- HuggingFace: `HUGGINGFACE_HUB_TOKEN` (conditionally loaded in `src/index.js` line 56)
- Azure Quantum: `AZURE_QUANTUM_WORKSPACE_ID` (conditionally loaded in `src/index.js` line 63)
- Clarity: `CLARITY_PROJECT_ID` (conditionally loaded in `src/index.js` line 70)
- MongoDB: `MONGODB_CONNECTION_STRING` (default: `mongodb://localhost:27017`, conditionally loaded in `src/index.js` line 46)

**Critical Pattern**: `src/index.js` conditionally registers MCP servers based on environment variables (lines 46-77), allowing flexible deployment without all API keys.

### MCP Orchestrator Architecture (29 Public Methods)

**Location**: `src/mcp/orchestrator.js` (472 lines)
**Design**: EventEmitter-based class managing child processes via `child_process.spawn()`

**Key Lifecycle Methods**:

- `registerServer(name, config)` - Register MCP server configuration
- `startServer(name)` - Spawn server process, capture stdout/stderr, emit `server:started`
- `stopServer(name)` - Send SIGTERM, wait for graceful exit, force SIGKILL after timeout
- `restartServer(name)` - Stop then start with restart attempt tracking
- `startAll()` / `stopAll()` - Bulk operations returning Promise.all() results

**Health Monitoring** (lines 283-348):

- `startHealthChecks()` - Starts interval-based health monitoring (default: 30s)
- `checkServerHealth(name)` - Pings server, updates healthStatus, emits `server:unhealthy` on failure
- Auto-restart logic: If `autoRestart: true` and restartAttempts < maxRestartAttempts, automatically restarts failed servers

**Events Emitted** (11 total):

```javascript
// Lifecycle events
'server:registered', 'server:unregistered'
'server:starting', 'server:started', 'server:stopping', 'server:stopped'
'server:error', 'server:restarting', 'server:unhealthy'
'server:output'  // Emits {name, type: 'stdout'|'stderr', data}
'orchestrator:started', 'orchestrator:stopped'
```

**State Management**: 6 states tracked per server (lines 17-24): `STOPPED`, `STARTING`, `RUNNING`, `STOPPING`, `ERROR`, `UNREACHABLE`

### Logger Utility (Multi-Level Structured Logging)

**Location**: `src/utils/logger.js` (237 lines)
**Design**: Custom logger with 5 levels, dual output (console + file), JSON/text formats

**Log Levels** (lines 11-18): `ERROR` (0), `WARN` (1), `INFO` (2), `DEBUG` (3), `TRACE` (4)

**Key Features**:

- **Conditional Output**: Only logs messages at or below current level (`shouldLog()` method)
- **Dual Output**: Console (with ANSI colors) + file output (optional, requires `LOG_FILE` env var)
- **Context Enrichment**: Merge constructor context with per-call metadata
- **Format Options**: JSON (`jsonFormat: true`) or human-readable text with util.inspect()

**Configuration** (constructor options):

```javascript
new Logger({
  level: 'INFO',           // or process.env.LOG_LEVEL
  logFile: '/path/to/log', // or process.env.LOG_FILE
  enableConsole: true,     // default
  enableFile: true,        // requires logFile
  jsonFormat: false,       // default: human-readable
  includeTimestamp: true,  // ISO 8601 timestamps
  includeContext: true,    // merge context objects
  context: { component: 'MCPOrchestrator' } // persistent context
});
```

**Usage Pattern in codebase**:

```javascript
const Logger = require('./utils/logger');
const logger = new Logger({ context: { component: 'MCPOrchestrator' } });
logger.info('Server started', { pid: 12345, name: 'github' });
```

### Development Workflow

**Package Scripts** (all functional, `package.json` lines 6-17):

```bash
npm run dev          # Start with nodemon auto-reload
npm test             # Jest with 100% coverage enforcement
npm run test:watch   # Jest watch mode
npm start            # Production mode (node src/index.js)
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier formatting
npm run mcp:status   # Check MCP server operational status (requires scripts/mcp-status.js)
npm run docs         # Serve docs on port 4000 (requires scripts/serve-docs.js)
```

**VS Code Tasks** (alternative, `.vscode/tasks.json`):

- `Ctrl+Shift+P` → "Run Task" → Select emoji-prefixed task (9 tasks defined)
- Example: "🌸 Start Control Tower (Dev)" = `npm run dev`
- Tasks include problem matchers for ESLint (`$eslint-stylish`)

### Test Infrastructure (100% Coverage Enforced)

**Jest Configuration** (`package.json` lines 53-74):

```json
"coverageThreshold": {
  "global": {
    "branches": 100,
    "functions": 100,
    "lines": 100,
    "statements": 100
  }
}
```

**Test Patterns** (`src/tests/mcp/orchestrator.test.js`, 605 lines):

- **Mocking**: `jest.mock('child_process')` to mock spawn() and child process events
- **EventEmitter Testing**: Create mock process with stdout/stderr streams
- **Async Testing**: Use `done()` callback or async/await for event-driven code
- **Timers**: `jest.useFakeTimers()` for health check intervals
- **Coverage**: 100% branches achieved by testing all error paths, timeouts, edge cases

**Example Mock Pattern**:

```javascript
jest.mock('child_process');
const { spawn } = require('child_process');

beforeEach(() => {
  mockProcess = new EventEmitter();
  mockProcess.pid = 12345;
  mockProcess.kill = jest.fn();
  mockProcess.stdout = new EventEmitter();
  mockProcess.stderr = new EventEmitter();
  spawn.mockReturnValue(mockProcess);
});
```

## Essential Development Knowledge

### Emoji-Driven Development System

This project uses emoji prefixes for **machine-readable commit patterns** (defined in `RELIGULOUS_MANTRA.md`):

```javascript
// CI/CD automation patterns from Universal Machine Philosophy
"🌸"; // CHERRY_BLOSSOM (\u{1F338}) - Package management, npm operations
"👑"; // CROWN (\u{1F451}) - Architecture decisions, major refactors
"💎"; // GEM (\u{1F48E}) - Quality metrics, test coverage enforcement
"🦋"; // BUTTERFLY (\u{1F98B}) - Transformation processes, migrations
"✨"; // SPARKLES (\u{2728}) - Server operations, MCP management
"🎭"; // PERFORMING_ARTS (\u{1F3AD}) - Development lifecycle, deployment
"🌀"; // CYCLONE (\u{1F300}) - System management
"💅"; // NAIL_POLISH (\u{1F485}) - Code formatting, linting
"🔮"; // CRYSTAL_BALL (\u{1F52E}) - AI/ML operations
```

**Commit Pattern Examples**:

```bash
git commit -m "🌸 Add missing dependencies for MCP server integration"
git commit -m "👑 Restructure MCP server configuration for scalability"
git commit -m "💎 Implement Jest tests to achieve 100% coverage"
git commit -m "🌸👑 Update package.json and refactor MCP orchestrator architecture"
```

### Critical File Locations

```
public/docs/
├── RELIGULOUS_MANTRA.md    # Development philosophy & emoji mappings (113 lines)
├── MCP_SETUP_GUIDE.md      # Complete 8-server setup instructions (320 lines)
├── CATGIRL.md              # Unity avatar specs (683 lines)
├── CATGIRL_SERVER.md       # Unity server implementation details
└── UNITY_SETUP_GUIDE.md    # Unity 6.2 installation on Linux

.vscode/
├── settings.json           # MCP server registry (line 116-139) + GitHub Copilot config
├── tasks.json              # Emoji-prefixed task definitions (9 tasks defined)
├── launch.json             # Edge browser debugging setup
└── extensions.json         # Recommended VS Code extensions

.env.example                # Template for required API keys (MongoDB, Stripe, HuggingFace, Azure, Clarity)
BUILD.md                    # Complete build process documentation (408 lines)
TODO.md                     # Development roadmap with checkboxes (143 lines)
coverage/                   # Jest reports with lcov.info (286 lines) - no actual src/ files exist
cspell.json                 # Custom dictionary with 109 technical terms (bambisleepchat, npx, etc.)
```

### Organization Requirements

- **Always** use "BambiSleep™" trademark symbol in documentation
- Reference **BambiSleepChat** organization in GitHub operations (configured in `.vscode/settings.json` line 18)
- Repository: `github.com/BambiSleepChat/bambisleep-church`
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

### Adding New MCP Servers

**Pattern**: All servers conditionally loaded in `src/index.js` based on environment variables:

```javascript
// Add to MCP_SERVERS object (lines 46-77 in src/index.js)
if (process.env.NEW_SERVER_API_KEY) {
  MCP_SERVERS['new-server'] = {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-new-server']
  };
}

// Then register in main initialization (lines 90-92)
for (const [name, config] of Object.entries(MCP_SERVERS)) {
  orchestrator.registerServer(name, config);
}
```

**Add to `.vscode/settings.json`** for VS Code MCP integration (auto-register in AI assistant):

```jsonc
"mcp.servers": {
  "new-server": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-new-server"]
  }
}
```

### Testing & Coverage (Priority: Maintain 100%)

**Run Tests**:

```bash
npm test                 # Full suite with coverage report
npm run test:watch       # Watch mode for development
```

**Coverage Reports**: Generated in `/coverage/` directory with HTML reports in `/coverage/lcov-report/`

**Writing Tests** (follow `orchestrator.test.js` pattern):

1. **Mock child_process**: `jest.mock('child_process')` at top of file
2. **Create mock EventEmitter**: Mock process with pid, kill(), stdout, stderr streams
3. **Test all branches**: Success paths, error paths, timeouts, edge cases
4. **Use fake timers**: `jest.useFakeTimers()` for health check intervals
5. **Test events**: Use `done()` callback or promises to test emitted events

**Critical**: Jest enforces 100% coverage on branches, functions, lines, statements. Pull requests failing coverage checks will not merge.

### Formatter Configuration (Zero-Config Approach)

- **Prettier**: Pre-installed but **no default formatter set** (`.vscode/settings.json` line 28 explicitly `null`)
- **ESLint**: Problem matcher configured for `$eslint-stylish` in tasks.json
- **JSON**: Uses built-in `vscode.json-language-features` formatter
- **Tailwind**: CSS validation disabled (`css.validate: false` line 66) to prevent conflicts
- **Spell Check**: Code Spell Checker with `cspell.json` (109 technical terms including "bambisleepchat", "modelcontextprotocol")

### Git Workflow (Emoji-Driven Commits)

**Standard Development Workflow**:

```bash
git add .
git commit -m "🌸💎 <commit_message>"
git push
```

**Emoji Commit Patterns** (from RELIGULOUS_MANTRA.md):

```bash
# Package management, npm operations
git commit -m "🌸 Add missing dependencies for MCP server integration"

# Architecture decisions, major refactors
git commit -m "👑 Restructure MCP server configuration for scalability"

# Quality metrics, test coverage enforcement
git commit -m "💎 Implement Jest tests to achieve 100% coverage"

# Transformation processes, migrations
git commit -m "🦋 Migrate documentation to public/docs/ structure"

# Server operations, MCP management
git commit -m "✨ Configure MongoDB and Stripe MCP servers"

# Development lifecycle, deployment
git commit -m "🎭 Set up production deployment pipeline"

# Combined patterns for complex changes
git commit -m "🌸👑 Update package.json and refactor MCP orchestrator architecture"
git commit -m "💎🦋 Add comprehensive tests and migrate legacy code patterns"
```

## Critical Patterns for AI Agents

### Organization Compliance

- **Always** use "BambiSleep™" trademark symbol in documentation
- Reference **BambiSleepChat** organization (configured in `.vscode/settings.json`)
- Repository: `github.com/BambiSleepChat/bambisleep-church`

### MCP Server Integration Patterns

**Server Lifecycle Management** (`src/mcp/orchestrator.js`):

```javascript
// MCP servers auto-start with VS Code via npx -y pattern
// No local installation conflicts - each server runs independently
// Workspace-specific configuration in .vscode/settings.json
// Conditional loading based on environment variables in src/index.js
```

**VS Code Integration Hooks**:

- **Auto-registration**: MCP servers appear in VS Code AI assistant when added to `.vscode/settings.json`
- **Context Awareness**: All servers receive workspace path (`/mnt/f/bambisleep-church`)
- **Error Diagnostics**: Check VS Code Output panel → MCP extension logs
- **Environment Variables**: Must be set before VS Code starts (reload window after adding to `.env`)

**Server Communication Patterns**:

- **Filesystem/Git**: Direct operations, no authentication required
- **GitHub**: Requires `GITHUB_TOKEN` environment variable
- **External APIs**: MongoDB, Stripe, HuggingFace, Azure, Clarity need credentials in `.env`
- **Concurrent Access**: Multiple servers operate simultaneously without conflicts

### Critical File Locations

```
src/
├── mcp/orchestrator.js      # 472 lines, 29 methods, EventEmitter-based lifecycle management
├── utils/logger.js          # 237 lines, 5-level logging with dual output
├── tests/                   # 100% coverage enforced via Jest
└── index.js                 # 228 lines, main entry with conditional MCP registration

public/docs/
├── RELIGULOUS_MANTRA.md     # Development philosophy & emoji mappings
├── MCP_SETUP_GUIDE.md       # Complete 8-server setup instructions
└── CATGIRL.md               # Unity avatar specs (separate project)

.vscode/settings.json        # Lines 116-169: MCP server registry (8/8 configured)
package.json                 # Lines 53-74: Jest config with 100% coverage thresholds
```

### Unity CatGirl Avatar System (Separate Project)

**Specifications**: Complete 683-line spec in `public/docs/CATGIRL.md`

- Unity 6.2 LTS with XR Interaction Toolkit
- Eye/hand tracking, RPG inventory, multi-currency economy
- Setup guide: `public/docs/UNITY_SETUP_GUIDE.md`
- **Important**: Separate Unity project, not in this Node.js codebase

