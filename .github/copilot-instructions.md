# BambiSleep™ Church - AI Agent Instructions

## Project Architecture

**Dual-platform system** managing 8 MCP (Model Context Protocol) servers + Unity renderer:

- **MCP Control Tower** (Node.js) - EventEmitter-based orchestration (`src/mcp/orchestrator.js`, 472 lines, 29 methods)
- **Unity Cathedral Renderer** (C#) - Procedural visualization via JSON IPC (`unity-projects/cathedral-renderer/`)
- **100% Test Coverage Enforced** - Jest fails CI/CD if any metric drops below 100% (branches/functions/lines/statements)
- **Organization**: BambiSleepChat - Always use "BambiSleep™" with trademark symbol

## ⚠️ WSL2 CRITICAL: Use --no-bin-links

**All npm install commands MUST use `--no-bin-links` flag on WSL2:**

```bash
npm install --no-bin-links
```

**Why**: WSL2 cannot create symlinks on Windows filesystem mounts (/mnt/c, /mnt/f) without special permissions. All npm scripts in `package.json` are configured to use direct `node node_modules/[tool]/bin/[tool].js` paths to bypass symlink requirements.

## Critical Workflows

### Running Code

```bash
npm run dev          # Development with nodemon auto-reload (port 3000)
npm test             # Jest with 100% coverage enforcement (blocks if <100%)
npm run mcp:status   # Check operational status of 8/8 MCP servers
npm run docs         # Start documentation server (port 4000)
```

**Use VS Code Tasks Instead of npm**: `Ctrl+Shift+P` → "Tasks: Run Task" → Select emoji-prefixed task. 9 tasks defined in `.vscode/tasks.json` with ESLint problem matchers for automatic error detection in Problems panel.

**Task shortcuts**:

- `Ctrl+Shift+B` → Default build task (🌸 Start Control Tower Dev)
- `Ctrl+Shift+T` → Default test task (💎 Run Tests 100% Coverage)

### Testing Patterns (MANDATORY 100% Coverage)

**Mock child_process for process testing**:

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

**Test ALL branches** - Every if/else, try/catch needs success AND failure test cases. Use `jest.useFakeTimers()` for interval-based code (health checks). See `src/tests/mcp/orchestrator.test.js` (605 lines, 50+ test cases) for complete patterns.

**Jest Configuration**:

- Global timeout: 10 seconds (`jest.setup.js`)
- Forces exit after completion (`--forceExit` flag)
- Auto-cleanup with `afterEach()` clearing all timers
- Run single test file: `npm test -- src/tests/path/to/file.test.js`

## MCP Server Management

**8/8 Servers Configured**: filesystem, git, github, mongodb, stripe, huggingface, azure-quantum, clarity

**Conditional Loading Pattern** (`src/index.js` lines 46-77):

```javascript
// Core servers (no auth required)
const MCP_SERVERS = { filesystem, git, github };

// Optional servers load only if env vars exist
if (process.env.STRIPE_SECRET_KEY) {
  MCP_SERVERS.stripe = { command: 'npx', args: [...] };
}
```

**Server Capabilities Overview**:

- **filesystem** - File operations, read/write/search across workspace
- **git** - Version control, commits, branches, diffs
- **github** - Issues, PRs, releases, repository management
- **mongodb** - Database queries, aggregations, schema inspection (requires `MONGODB_CONNECTION_STRING`)
- **stripe** - Payment processing, customer management, subscriptions (requires `STRIPE_SECRET_KEY`)
- **huggingface** - ML models, datasets, paper search (requires `HUGGINGFACE_HUB_TOKEN`)
- **azure-quantum** - Quantum computing workloads (requires `AZURE_QUANTUM_WORKSPACE_ID`)
- **clarity** - Analytics, session recordings, heatmaps (requires `CLARITY_PROJECT_ID`)

**Adding New Servers**:

1. Add to `.vscode/settings.json` (lines 116-169) for VS Code AI integration
2. Add conditional loading to `src/index.js` (follow existing pattern)
3. Register in main loop (`src/index.js` lines 90-92)
4. Document env vars in `.env.example`

**Environment Variables** (`.env.example`):

- `GITHUB_TOKEN` - Required for github server
- `MONGODB_CONNECTION_STRING` - Default: `mongodb://localhost:27017`
- `STRIPE_SECRET_KEY`, `HUGGINGFACE_HUB_TOKEN`, `AZURE_QUANTUM_WORKSPACE_ID`, `CLARITY_PROJECT_ID` - Required for respective servers
- **VS Code reload required** after editing `.env` (Ctrl+Shift+P → "Reload Window")

## Unity IPC Architecture

**Bidirectional JSON protocol** via stdin/stdout (`public/docs/UNITY_IPC_PROTOCOL.md`, 432 lines):

**Node.js → Unity** (Commands):

```javascript
unityBridge.sendMessage({
  type: "updateStyle",
  data: { pinkIntensity: 0.95, eldritchLevel: 777 },
});
```

**Unity → Node.js** (Status):

```javascript
// Unity stdout → Node.js parses JSON
this.rendererProcess.stdout.on("data", (data) => {
  const parsed = JSON.parse(data.toString());
  this.emit(`unity:${parsed.type}`, parsed.data);
});
```

**Unity Lifecycle**: Spawned as child process in `src/unity/unity-bridge.js` (409 lines), not separate service. Graceful shutdown via SIGTERM required before kill.

**Message Types**: Node.js → Unity commands include `initialize`, `update`, `render`, `shutdown`. Unity → Node.js responses include `ready`, `status`, `error`, `rendered`. See `public/docs/UNITY_IPC_PROTOCOL.md` (432 lines) for complete specification.

### Unity C# Patterns (Cathedral Renderer)

**Serializable Configuration Classes** (`CathedralRenderer.cs`, 1071 lines):

```csharp
[System.Serializable]
public class CathedralStyle
{
  [Header("🌸 Neon Cyber Goth Configuration")]
  [Range(0f, 1f)] public float pinkIntensity = 0.8f;
  [Range(0, 1000)] public int eldritchLevel = 666;
  // Use Unity attributes for Inspector integration
}
```

**Command Listener Pattern** - Use coroutines for stdin/stdout IPC:

```csharp
IEnumerator CommandListener() {
  while (true) {
    string line = Console.ReadLine();
    if (line != null) {
      var message = JsonUtility.FromJson<IPCMessage>(line);
      ProcessCommand(message);
    }
    yield return null;
  }
}
```

**Procedural Generation** - Create GameObjects under root parent with `transform.parent` for cleanup. Use `GameObject.Destroy()` in cleanup methods. Always implement batch mode check: `Application.isBatchMode`.

## Project Conventions

### Emoji-Driven Commits (Machine-Readable)

```bash
git commit -m "🌸 Add dependencies"        # Package management (CHERRY_BLOSSOM)
git commit -m "👑 Refactor architecture"   # Architecture decisions (CROWN)
git commit -m "💎 Add tests"               # Quality/coverage (GEM)
git commit -m "✨ Configure servers"       # Server operations (SPARKLES)
git commit -m "🌸👑 Update deps + refactor" # Combined patterns
```

Full emoji mappings in `public/docs/RELIGULOUS_MANTRA.md` (113 lines).

### Documentation Structure

- **Core Docs**: `docs/` - Development guides, build instructions, contributing, changelog, todos
- **Public Docs**: `public/docs/` - Unity, MCP setup, IPC protocol, development philosophy
- **AI Instructions**: `.github/copilot-instructions.md` - This file
- **Main README**: `README.md` - Project overview and quick start

### Zero-Config Formatter Approach

- **Prettier installed but NO default formatter** (`.vscode/settings.json` line 28 explicitly `null`)
- Use `npm run format` or task "💅 Format Code (Prettier)" for manual formatting
- ESLint via `npm run lint:fix` or task "🧹 Lint & Fix Code"

### Logger Usage (Multi-Level Structured Logging)

```javascript
const Logger = require("./utils/logger");
const logger = new Logger({
  level: "INFO", // ERROR|WARN|INFO|DEBUG|TRACE
  context: { component: "MCPOrchestrator" }, // Persistent context
});
logger.info("Server started", { pid: 12345 }); // Merge metadata
```

`src/utils/logger.js` (237 lines) - Dual output (console + file), JSON/text formats, conditional output based on level.

## Error Handling Patterns

**Event-Driven Error Handling** - Orchestrator emits errors instead of throwing:

```javascript
serverProcess.on("error", (error) => {
  server.state = SERVER_STATES.ERROR;
  server.lastError = error.message;
  this.emit("server:error", { name, server, error });
});
```

**Graceful Degradation** - File logging failures don't crash the app:

```javascript
try {
  fs.mkdirSync(logDir, { recursive: true });
} catch (error) {
  this.enableFile = false; // Disable file logging, continue with console
  console.warn(`[Logger] Failed to create log directory: ${error.message}`);
}
```

**Promise Chain Error Propagation** - Always catch at top level:

```javascript
// src/index.js pattern
initialize().catch((error) => {
  logger.error("Failed to initialize Control Tower", { error: error.message });
  process.exit(1);
});
```

**Process Error Handlers** - Prevent unhandled crashes:

```javascript
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
```

## Critical File Locations

```
Root Documentation:
├── README.md                    # Project overview and quick start
├── docs/                        # Core documentation (new organized structure)
│   ├── DEVELOPMENT.md          # Consolidated development guide
│   ├── BUILD.md                # Build instructions and workflows
│   ├── CONTRIBUTING.md         # Contribution guidelines
│   ├── CHANGELOG.md            # Version history
│   ├── TODO.md                 # Planned features and improvements
│   └── UNITY_IPC_IMPLEMENTATION_SUMMARY.md

Source Code:
├── src/
│   ├── mcp/orchestrator.js          # 29 methods, EventEmitter lifecycle management
│   ├── unity/unity-bridge.js        # Unity process + JSON IPC protocol
│   ├── utils/logger.js              # 5-level logging with dual output
│   ├── index.js                     # Main entry, conditional MCP registration
│   └── tests/                       # 100% coverage enforced

Configuration:
├── .vscode/settings.json            # Lines 116-169: MCP server registry (8/8)
├── .github/copilot-instructions.md  # AI agent instructions (this file)
├── package.json                     # Lines 53-74: Jest 100% coverage thresholds
├── jest.setup.js                    # Global test configuration

Public Documentation:
└── public/docs/                     # User-facing technical documentation
    ├── UNITY_IPC_PROTOCOL.md       # Complete IPC specification (432 lines)
    ├── UNITY_SETUP_GUIDE.md        # Unity installation guide
    ├── MCP_SETUP_GUIDE.md          # MCP server setup (351 lines)
    ├── RELIGULOUS_MANTRA.md        # Development philosophy (113 lines)
    ├── CATGIRL.md                  # Unity avatar specs (683 lines)
    └── CATGIRL_SERVER.md           # Unity server implementation

Unity Project:
└── unity-projects/cathedral-renderer/  # Separate Unity project (C# codebase)
    └── Assets/Scripts/CathedralRenderer.cs  # Main renderer (1071 lines)
```

## Performance & Timeouts

**Health Check Intervals**:

- Default: 30 seconds (`HEALTH_CHECK_INTERVAL=30000`)
- Configurable via environment variable
- Uses `setInterval()` cleared on shutdown

**Process Timeouts**:

- Unity shutdown grace period: 10 seconds before SIGKILL
- Server restart delay: 5 seconds (configurable via `restartDelay`)
- Jest global timeout: 10 seconds (all tests must complete within)

**Auto-Restart Behavior**:

- Max attempts: 3 (configurable via `MAX_RESTART_ATTEMPTS`)
- Backoff strategy: Fixed delay (no exponential backoff currently)
- Resets on successful startup

**Memory Considerations**:

- Child processes captured stdout/stderr accumulates in memory
- Clear event listeners on shutdown to prevent leaks
- Use `removeAllListeners()` in test cleanup

## Deployment Patterns

**No CI/CD Pipeline Currently** - Manual deployment workflow:

1. **Local Testing**: `npm test` enforces 100% coverage before commit
2. **Version Control**: Use emoji-driven commits (see `RELIGULOUS_MANTRA.md`)
3. **Environment Setup**: Copy `.env.example` to `.env` on target server
4. **Dependency Install**: `npm install --no-bin-links` (WSL2/mounted filesystems)
5. **Service Management**: Manual `npm start` or systemd service (not implemented yet)

**Future CI/CD Considerations**:

- ESLint already configured with `npm run lint`
- Coverage reports in `coverage/lcov-report/`
- Could integrate GitHub Actions for automated testing
- VS Code tasks provide local development workflow

**Production Readiness Checklist**:

- ✅ 100% test coverage enforced
- ✅ Graceful shutdown handlers (SIGTERM/SIGINT)
- ✅ Structured logging with file output
- ✅ Environment-based configuration
- ❌ No Docker containerization yet
- ❌ No systemd service files yet
- ❌ No health check endpoints yet (only internal monitoring)

## Organization Requirements

- **Always use "BambiSleep™"** with trademark symbol in documentation
- Repository: `github.com/BambiSleepChat/bambisleep-church`
- Organization context in `.vscode/settings.json` line 18
- MIT license with proper attribution

## Debugging

**MCP Server Issues**:

- Check VS Code Output panel → Select "MCP" extension logs
- Run `npm run mcp:status` to verify 8/8 operational
- Verify env vars loaded: `node -e "console.log(process.env.GITHUB_TOKEN ? 'Loaded' : 'Missing')"`

**Test Failures**:

- Coverage report: `coverage/lcov-report/index.html`
- Run watch mode: `npm run test:watch`
- Check all branches tested (success + failure paths)

**Unity IPC**:

- Unity logs: `unity-projects/cathedral-renderer/Logs/unity-renderer.log`
- Debug IPC in `src/unity/unity-bridge.js` stdout/stdin handlers
- Protocol docs: `public/docs/UNITY_IPC_PROTOCOL.md`
