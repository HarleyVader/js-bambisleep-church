# BambiSleep™ Church - Development Guide

**Consolidated development documentation for the MCP Control Tower project**

## Current Implementation Status

### ✅ Core Infrastructure Complete (100% Test Coverage)

**MCP Orchestrator** (`src/mcp/orchestrator.js`, 472 lines, 29 methods):
- Server lifecycle management (register, start, stop, restart)
- Health monitoring with configurable intervals
- Auto-restart on failure (max 3 attempts)
- Event-driven architecture (EventEmitter-based)
- Graceful shutdown handling
- Real-time statistics and status reporting

**Logger Utility** (`src/utils/logger.js`, 245 lines):
- Multiple log levels (ERROR, WARN, INFO, DEBUG, TRACE)
- Dual output (console + file)
- Color-coded console output with ANSI codes
- JSON format support for structured logging
- Child loggers with inherited context

**Unity Bridge** (`src/unity/unity-bridge.js`, 409 lines):
- Unity process spawning and management
- Bidirectional JSON IPC via stdin/stdout
- Message protocol implementation
- Graceful shutdown with SIGTERM/SIGKILL

### ✅ Test Suite (100% Coverage Enforced)

**Test Files**:
- `src/tests/mcp/orchestrator.test.js` (605 lines, 50+ test cases)
- `src/tests/utils/logger.test.js` (30+ test cases)
- `src/tests/unity/unity-bridge.test.js`
- `src/tests/unity/unity-ipc-protocol.test.js`
- `src/tests/ui/dashboard-server.test.js`
- `src/tests/index.test.js`

**Jest Configuration**:
- Global timeout: 10 seconds
- Forces exit after completion (`--forceExit`)
- Auto-cleanup with `afterEach()` clearing all timers
- Coverage thresholds: 100% branches/functions/lines/statements

### ✅ Configuration & Tooling

**VS Code Integration**:
- 9 emoji-prefixed tasks in `.vscode/tasks.json`
- 8/8 MCP servers configured in `.vscode/settings.json`
- ESLint problem matchers for automatic error detection
- GitHub Copilot configured for BambiSleepChat organization

**npm Scripts**:
- All scripts bypass symlinks using direct `node node_modules/[tool]/bin/[tool].js` paths
- Development, testing, linting, formatting, and documentation serving

## Architecture Overview

### Dual-Platform System

1. **MCP Control Tower** (Node.js)
   - Orchestrates 8 Model Context Protocol servers
   - EventEmitter-based lifecycle management
   - Health monitoring and auto-restart capabilities

2. **Unity Cathedral Renderer** (C#)
   - Procedural gothic cathedral visualization
   - Neon cyber goth aesthetic
   - JSON IPC communication with Node.js

### MCP Servers (8/8 Configured)

**Core Servers** (no auth required):
- filesystem - File operations, read/write/search
- git - Version control, commits, branches, diffs
- github - Issues, PRs, releases, repository management

**Optional Servers** (require env vars):
- mongodb - Database queries, aggregations, schema inspection
- stripe - Payment processing, customer management, subscriptions
- huggingface - ML models, datasets, paper search
- azure-quantum - Quantum computing workloads
- clarity - Analytics, session recordings, heatmaps

## Development Workflows

### Setup

```bash
# Clone and install (WSL2 requires --no-bin-links)
git clone https://github.com/BambiSleepChat/bambisleep-church.git
cd bambisleep-church
npm install --no-bin-links

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### Development Commands

```bash
# Development with auto-reload
npm run dev

# Run tests with 100% coverage enforcement
npm test

# Run tests in watch mode
npm run test:watch

# Check MCP server status
npm run mcp:status

# Lint and fix code
npm run lint:fix

# Format code (manual)
npm run format

# Start documentation server
npm run docs
```

### VS Code Tasks (Recommended)

Use `Ctrl+Shift+P` → "Tasks: Run Task" → Select emoji-prefixed task:

- 🌸 Start Control Tower (Dev) - `Ctrl+Shift+B`
- 💎 Run Tests (100% Coverage) - `Ctrl+Shift+T`
- 🌀 Check MCP Server Status
- 📚 Start Documentation Server
- 🚀 Start Production Server
- 🧹 Lint & Fix Code
- 💅 Format Code (Prettier)
- 🔍 Test Watch Mode
- 🏗️ Build Production

## Testing Guidelines

### Mandatory 100% Coverage

Every if/else, try/catch must have success AND failure test cases.

### Mock child_process Pattern

```javascript
jest.mock("child_process");
const { spawn } = require("child_process");

beforeEach(() => {
  mockProcess = new EventEmitter();
  mockProcess.pid = 12345;
  mockProcess.kill = jest.fn();
  mockProcess.stdout = new EventEmitter();
  mockProcess.stderr = new EventEmitter();
  spawn.mockReturnValue(mockProcess);
});
```

### Timer-Based Testing

Use `jest.useFakeTimers()` for interval-based code (health checks).

### Cleanup Pattern

```javascript
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  if (orchestrator) {
    orchestrator.removeAllListeners();
  }
});
```

## Project Conventions

### Emoji-Driven Commits

```bash
git commit -m "🌸 Add dependencies"        # Package management
git commit -m "👑 Refactor architecture"   # Architecture decisions
git commit -m "💎 Add tests"               # Quality/coverage
git commit -m "✨ Configure servers"       # Server operations
git commit -m "🌸👑 Update deps + refactor" # Combined patterns
```

See `public/docs/RELIGULOUS_MANTRA.md` for complete emoji mappings.

### Code Formatting

- **NO default formatter** (`.vscode/settings.json` explicitly `null`)
- Use `npm run format` for manual Prettier formatting
- ESLint via `npm run lint:fix` for automatic fixes

### Logging Standards

```javascript
const Logger = require("./utils/logger");
const logger = new Logger({
  level: "INFO", // ERROR|WARN|INFO|DEBUG|TRACE
  context: { component: "MCPOrchestrator" }
});
logger.info("Server started", { pid: 12345 });
```

## Performance Considerations

### Timeouts & Intervals

- Health check interval: 30 seconds (configurable via `HEALTH_CHECK_INTERVAL`)
- Unity shutdown grace period: 10 seconds before SIGKILL
- Server restart delay: 5 seconds (configurable via `restartDelay`)
- Jest global timeout: 10 seconds

### Auto-Restart Behavior

- Max attempts: 3 (configurable via `MAX_RESTART_ATTEMPTS`)
- Backoff strategy: Fixed delay (no exponential backoff)
- Resets on successful startup

### Memory Management

- Child process stdout/stderr accumulates in memory
- Clear event listeners on shutdown to prevent leaks
- Use `removeAllListeners()` in test cleanup

## Deployment

### Current: Manual Deployment

1. **Local Testing**: `npm test` enforces 100% coverage
2. **Version Control**: Use emoji-driven commits
3. **Environment Setup**: Copy `.env.example` to `.env` on target server
4. **Dependency Install**: `npm install --no-bin-links` (WSL2)
5. **Service Management**: Manual `npm start`

### Production Readiness Status

- ✅ 100% test coverage enforced
- ✅ Graceful shutdown handlers (SIGTERM/SIGINT)
- ✅ Structured logging with file output
- ✅ Environment-based configuration
- ❌ No Docker containerization yet
- ❌ No systemd service files yet
- ❌ No health check endpoints yet (only internal monitoring)
- ❌ No CI/CD pipeline (GitHub Actions planned)

## Troubleshooting

### MCP Server Issues

```bash
# Check server status
npm run mcp:status

# Verify environment variables
node -e "console.log(process.env.GITHUB_TOKEN ? 'Loaded' : 'Missing')"

# Check VS Code Output panel → Select "MCP" extension logs
```

### Test Failures

```bash
# View coverage report
open coverage/lcov-report/index.html

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- src/tests/path/to/file.test.js
```

### Unity IPC

```bash
# Check Unity logs
cat unity-projects/cathedral-renderer/Logs/unity-renderer.log

# Debug IPC in unity-bridge.js stdout/stdin handlers
# See public/docs/UNITY_IPC_PROTOCOL.md for protocol specification
```

## Next Steps

See `docs/TODO.md` for planned features and improvements.

## Additional Documentation

- **Architecture Details**: See `README.md`
- **Build Instructions**: See `docs/BUILD.md`
- **Contributing Guidelines**: See `docs/CONTRIBUTING.md`
- **Changelog**: See `docs/CHANGELOG.md`
- **Unity Setup**: See `public/docs/UNITY_SETUP_GUIDE.md`
- **MCP Setup**: See `public/docs/MCP_SETUP_GUIDE.md`
- **Unity IPC Protocol**: See `public/docs/UNITY_IPC_PROTOCOL.md`
- **Development Philosophy**: See `public/docs/RELIGULOUS_MANTRA.md`
