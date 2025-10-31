# BambiSleep™ Church - AI Agent Instructions

## Architecture

**MCP Control Tower** orchestrating 8 Model Context Protocol servers + optional Unity 3D renderer. EventEmitter-based lifecycle management with 100% test coverage enforcement.

**Core components**: MCP Orchestrator (`src/mcp/orchestrator.js`), Unity Bridge (`src/unity/unity-bridge.js`), Cathedral MCP Server (`src/mcp/cathedral-server.js`), Logger (`src/utils/logger.js`).

**Organization**: BambiSleepChat - always use "BambiSleep™" with trademark symbol in user-facing text

## Critical Project-Specific Patterns

### WSL2 Installation (NON-STANDARD)

```bash
npm install --no-bin-links  # REQUIRED - WSL2 can't symlink on /mnt/*
```

All npm scripts bypass symlinks: `node node_modules/[tool]/bin/[tool].js` direct paths

### 100% Test Coverage ENFORCED

Jest thresholds (`package.json` lines 53-74) fail build if <100% branches/functions/lines/statements. Testing child processes requires specific mock pattern:

```javascript
jest.mock("child_process");
const { spawn } = require("child_process");
beforeEach(() => {
  mockProcess = new EventEmitter();
  mockProcess.pid = 12345;
  mockProcess.stdout = new EventEmitter();
  mockProcess.stderr = new EventEmitter();
  spawn.mockReturnValue(mockProcess);
});
```

Every branch (if/else, try/catch) needs success AND failure test cases. Use `jest.useFakeTimers()` for intervals.

### MCP Server Conditional Loading

Core servers (filesystem, git, github) always load. Optional servers (mongodb, stripe, huggingface, azure-quantum, clarity, cathedral) only load if env vars present (`src/index.js` lines 46-83). After `.env` edits: `Ctrl+Shift+P` → "Reload Window" required.

### STDIO Protocol Critical Rule

Cathedral MCP server uses JSON-RPC 2.0 over STDIO. **NEVER** `console.log()` in `src/mcp/cathedral-server.js` - corrupts protocol. Only stderr logging:

```javascript
process.stderr.write(JSON.stringify({ level: "info", message: "..." }) + "\n");
```

### Unity IPC Protocol

Bidirectional JSON messages via stdin/stdout. Node.js sends `{type: "updateStyle", data: {...}}`, Unity responds `{type: "ready", data: {...}}`. See `public/docs/UNITY_IPC_PROTOCOL.md` for message types.

## Development Workflows

### Essential Commands

```bash
npm run dev          # Auto-reload dev server (prefer VS Code task: Ctrl+Shift+B)
npm test             # FAILS if <100% coverage
npm run mcp:status   # Check 8/8 servers operational
```

### VS Code Tasks

9 emoji-prefixed tasks in `.vscode/tasks.json`. Use `Ctrl+Shift+P` → "Tasks: Run Task" instead of terminal commands.

### Emoji Commit Convention

```bash
git commit -m "🌸 Add dependencies"       # Package management
git commit -m "👑 Refactor architecture"  # Architecture
git commit -m "💎 Add tests"              # Quality/coverage
git commit -m "✨ Configure servers"      # Server ops
```

See `public/docs/RELIGULOUS_MANTRA.md` for complete mappings.

### Logger Pattern

```javascript
const Logger = require("./utils/logger");
const logger = new Logger({
  level: "INFO", // ERROR|WARN|INFO|DEBUG|TRACE
  context: { component: "MCPOrchestrator" },
});
logger.info("Server started", { pid: 12345 }); // Merges metadata
```

### Event-Driven Architecture

Orchestrator uses EventEmitter pattern. All state changes emit events:

```javascript
orchestrator.on("server:started", ({ name, server }) => { ... });
orchestrator.on("server:error", ({ name, error }) => { ... });
```

## Key Files

- `src/index.js` (288L) - Main entry, MCP server registration
- `src/mcp/orchestrator.js` (472L) - 29 methods, lifecycle management
- `src/mcp/cathedral-server.js` (~350L) - JSON-RPC 2.0 MCP implementation
- `src/tests/mcp/orchestrator.test.js` (605L) - Complete test patterns reference
- `.vscode/settings.json` (lines 116-169) - MCP server registry for AI agents
- `package.json` (lines 53-74) - Jest coverage thresholds
- `jest.setup.js` - Global 10s timeout, timer cleanup

## References

- Architecture: `docs/DEVELOPMENT.md`
- Unity setup: `public/docs/UNITY_SETUP_GUIDE.md`
- MCP protocol: `docs/CATHEDRAL_MCP_SERVER_REGISTRATION.md`
- IPC spec: `public/docs/UNITY_IPC_PROTOCOL.md`
