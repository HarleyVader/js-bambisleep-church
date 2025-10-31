# BambiSleep™ Church - AI Agent Instructions

## Project Architecture

**Unified MCP + Unity ecosystem** spanning two complementary systems:

### js-bambisleep-church - THIS REPO

- **MCP Control Tower** - Node.js - EventEmitter-based orchestration of 8 MCP servers - `src/mcp/orchestrator.js`, 472 lines, 29 methods
- **Unity Cathedral Renderer** - C# - Procedural gothic architecture with neon cyber goth aesthetic - `unity-projects/cathedral-renderer/`, 1071 lines
- **Bidirectional IPC Protocol** - JSON stdin/stdout communication between Node.js and Unity - `src/unity/unity-bridge.js`, 409 lines
- **100% Test Coverage Enforced** - Jest fails if any coverage metric drops below 100% - branches/functions/lines/statements

### bambisleep-chat-catgirl - SIBLING REPO

- **Unity 6.2 LTS CatGirl Avatar** - C# - XR avatar controller with NetworkBehaviour multiplayer - `catgirl-avatar-project/Assets/Scripts/`, 1,950+ lines across 6 systems
- **Unity Gaming Services Integration** - Economy 3.4.2, Authentication 3.3.4, Netcode 2.0.0, Lobby 1.2.2, Relay 1.1.3
- **8 MCP Servers** - filesystem, git, github, memory, sequential-thinking, everything, brave-search, postgres
- **Container Deployment** - GHCR registry with semantic versioning - `ghcr.io/bambisleepchat/bambisleep-church`

**Organization**: BambiSleepChat - Always use "BambiSleep™" with trademark symbol

## ⚠️ WSL2 CRITICAL: Use --no-bin-links

**All npm install commands MUST use `--no-bin-links` flag on WSL2:**

```bash
npm install --no-bin-links
```

**Why**: WSL2 cannot create symlinks on Windows filesystem mounts (/mnt/c, /mnt/f) without special permissions. All npm scripts in `package.json` are configured to use direct `node node_modules/[tool]/bin/[tool].js` paths to bypass symlink requirements.

## Critical Workflows

### Running Code

```bash
# THIS REPO (js-bambisleep-church)
npm run dev          # Development with nodemon auto-reload (port 3000)
npm test             # Jest with 100% coverage enforcement (blocks if <100%)
npm run mcp:status   # Check operational status of 8/8 MCP servers
npm run docs         # Start documentation server (port 4000)

# SIBLING REPO (bambisleep-chat-catgirl)
npm test             # Run test stubs (NO REAL TESTS - see todo.md)
npm run build -- --universal      # Cross-platform build
npm run mcp:validate              # Test all 8 MCP servers
npm run unity:debug               # Setup Unity debugging
```

**Use VS Code Tasks Instead of npm**: `Ctrl+Shift+P` → "Tasks: Run Task" → Select emoji-prefixed task. 9 tasks defined in `.vscode/tasks.json` with ESLint problem matchers for automatic error detection in Problems panel.

**Task shortcuts**:

- `Ctrl+Shift+B` → Default build task (🌸 Start Control Tower Dev)
- `Ctrl+Shift+T` → Default test task (💎 Run Tests 100% Coverage)

### Testing Patterns (MANDATORY 100% Coverage)

**THIS REPO ONLY** - Real tests with 100% enforcement:

**Mock child_process for process testing** (see `src/tests/mcp/orchestrator.test.js`, 605 lines):

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

**SIBLING REPO WARNING**: Tests are STUBS ONLY - `npm test` returns echo statements, no real Jest tests exist yet (see `docs/guides/todo.md`)

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
- **cathedral** - Unity cathedral 3D visualization and interaction (custom MCP server, requires `UNITY_ENABLED=true`)

**Adding New Servers**:

1. Add to `.vscode/settings.json` for VS Code AI integration
2. Add conditional loading to `src/index.js` (follow existing pattern)
3. Register in main loop (`src/index.js`)
4. Document env vars in `.env.example`

**Custom MCP Servers** (Advanced):

The `cathedral` server demonstrates how to create custom MCP servers:

- **JSON-RPC 2.0 protocol** implementation in `src/mcp/cathedral-server.js`
- **STDIO transport** (stdin/stdout for local communication)
- **Capability negotiation** (`initialize` request with `tools/list` support)
- **Tool execution** (`tools/call` with async Unity bridge communication)
- **⚠️ CRITICAL**: Never use `console.log()` in STDIO servers - corrupts JSON-RPC messages. Use stderr only.

See "Cathedral MCP Tools (Formal MCP Server)" section below for implementation details.

**Environment Variables** (`.env.example`):

- `GITHUB_TOKEN` - Required for github server
- `MONGODB_CONNECTION_STRING` - Default: `mongodb://localhost:27017`
- `STRIPE_SECRET_KEY`, `HUGGINGFACE_HUB_TOKEN`, `AZURE_QUANTUM_WORKSPACE_ID`, `CLARITY_PROJECT_ID` - Required for respective servers
- **VS Code reload required** after editing `.env` (Ctrl+Shift+P → "Reload Window")

## Unity IPC Architecture

**Bidirectional JSON protocol** via stdin/stdout (`public/docs/UNITY_IPC_PROTOCOL.md`, 432 lines):

**Node.js → Unity** (Commands):

```javascript
// THIS REPO: src/unity/unity-bridge.js (409 lines)
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

## Cathedral MCP Tools (Formal MCP Server)

**Complete MCP server implementation** exposing Unity cathedral as AI-controllable tools through JSON-RPC 2.0 protocol.

### Architecture

```
AI Agent (Claude/VS Code)
   ↓
MCP Client (automatic)
   ↓
Cathedral MCP Server (src/mcp/cathedral-server.js)
   ↓ JSON-RPC 2.0 over STDIO
UnityBridge (src/unity/unity-bridge.js)
   ↓ JSON IPC
Unity Cathedral (C# MCPToolHandler)
   ↓
3D Scene Manipulation
```

### Key Implementation Files

1. **`src/mcp/cathedral-server.js`** (~350 lines) - JSON-RPC 2.0 server
   - Lifecycle: `initialize` method with capability negotiation
   - Discovery: `tools/list` returns 6 cathedral tools
   - Execution: `tools/call` routes to CathedralMCPTools
   - Transport: STDIO (stdin for requests, stdout for responses, stderr for logs)
   - **CRITICAL**: Never uses `console.log()` - all logging to stderr only

2. **`src/mcp/cathedral-tools.js`** (~290 lines) - Tool wrapper
   - `getToolDefinitions()` - Returns MCP-formatted tool list
   - `executeTool(name, args)` - Async tool execution with 30s timeout
   - Call ID tracking for request/response correlation
   - Event-driven response handling via UnityBridge

3. **`unity-projects/cathedral-renderer/Assets/Scripts/MCPToolHandler.cs`** (~600 lines)
   - Processes `mcpToolCall` messages from Node.js
   - Spawns GameObjects with Rigidbody physics
   - Applies forces (explosion, attraction, repulsion, float)
   - Updates cathedral visual style in real-time

### MCP Server Registration

**In `src/index.js`** (lines 76-83):

```javascript
// Conditional loading based on UNITY_ENABLED env var
if (process.env.UNITY_ENABLED !== "false") {
  MCP_SERVERS.cathedral = {
    command: "node",
    args: [path.join(__dirname, "mcp", "cathedral-server.js")],
    type: "custom",
    description: "Unity Cathedral 3D visualization and interaction tools",
  };
}
```

**In `.vscode/settings.json`** (lines 165-174):

```jsonc
"cathedral": {
  "command": "node",
  "args": ["f:\\js-bambisleep-church\\src\\mcp\\cathedral-server.js"],
  "env": {
    "UNITY_PATH": "C:\\Program Files\\Unity\\Hub\\Editor\\6000.2.11f1\\Editor\\Unity.exe",
    "UNITY_ENABLED": "true"
  }
}
```

### 6 MCP Tools Available

| Tool                 | Input Parameters                                          | Returns                          |
| -------------------- | --------------------------------------------------------- | -------------------------------- |
| `setCathedralStyle`  | pinkIntensity, eldritchLevel, neonIntensity, lightingMode | Visual update confirmation       |
| `spawnObject`        | objectType, x/y/z, scale, color                           | Spawned object details           |
| `applyPhysics`       | action, x/y/z, force, radius                              | Physics result (affected count)  |
| `clearObjects`       | (none)                                                    | Cleanup confirmation             |
| `getCathedralStatus` | (none)                                                    | FPS, object count, uptime, style |
| `setTimeOfDay`       | hour (0-24)                                               | Lighting update confirmation     |

### JSON-RPC 2.0 Protocol Flow

**1. Initialization:**

```json
// Client → Server
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": { "name": "vscode", "version": "1.0.0" }
  }
}

// Server → Client
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": { "listChanged": true } },
    "serverInfo": { "name": "bambisleep-cathedral", "version": "1.0.0" }
  }
}
```

**2. Tool Discovery:**

```json
// Client → Server
{ "jsonrpc": "2.0", "id": 2, "method": "tools/list" }

// Server → Client
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "setCathedralStyle",
        "description": "Update visual style in real-time",
        "inputSchema": { /* JSON Schema */ }
      }
      // ... 5 more tools
    ]
  }
}
```

**3. Tool Execution:**

```json
// Client → Server
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "spawnObject",
    "arguments": {
      "objectType": "angel",
      "x": 0, "y": 20, "z": 0,
      "scale": 3.0,
      "color": "#FF69B4"
    }
  }
}

// Server → Client
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\":true,\"objectId\":\"angel_0\",\"position\":{\"x\":0,\"y\":20,\"z\":0}}"
      }
    ]
  }
}
```

### Usage from AI Agents

**In Claude Desktop** - Tools appear automatically in tools list:

```
🔧 Available MCP Tools:
  → setCathedralStyle
  → spawnObject
  → applyPhysics
  → clearObjects
  → getCathedralStatus
  → setTimeOfDay
```

**In VS Code** - AI agents can discover and call tools:

```typescript
// AI agent workflow
const tools = await mcpClient.listTools();
const result = await mcpClient.callTool("spawnObject", {
  objectType: "cross",
  x: 5,
  y: 10,
  z: 0,
  scale: 2.0,
  color: "#FFB6C1",
});
```

### Testing the MCP Server

```bash
# Start the server standalone
node src/mcp/cathedral-server.js

# Send test request via stdin
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node src/mcp/cathedral-server.js

# Expected response on stdout (JSON-RPC result)
# Logs appear on stderr only
```

### Error Handling

**MCP Error Codes:**

- `-32600` - Invalid Request (not JSON-RPC 2.0)
- `-32601` - Method not found
- `-32700` - Parse error (invalid JSON)
- `-32603` - Internal error (Unity crash, etc.)

**Custom Error Codes:**

- `MCP_DISABLED` - Unity not enabled
- `UNITY_ERROR` - Unity-side error
- `TIMEOUT` - 30s timeout exceeded
- `TOOL_EXECUTION_ERROR` - Tool call failed

### Logging Pattern (CRITICAL)

```javascript
// ❌ NEVER DO THIS in STDIO servers:
console.log("Debug message"); // Corrupts JSON-RPC on stdout

// ✅ ALWAYS DO THIS:
process.stderr.write(
  JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    message: "Debug message",
  }) + "\n"
);
```

### Performance Metrics

- **Initialization**: 2-3 seconds (Unity startup)
- **Tool call latency**: 10-50ms (local IPC)
- **Max objects**: ~100 before FPS drops
- **Timeout**: 30 seconds per tool call
- **Memory**: ~1MB per spawned object

### Debugging

```bash
# Check MCP server status
npm run mcp:status

# View cathedral server logs (stderr)
node src/mcp/cathedral-server.js 2> cathedral-debug.log

# Test Unity bridge separately
npm test -- src/tests/unity/unity-bridge.test.js

# Validate JSON-RPC messages
cat input.jsonrpc | node src/mcp/cathedral-server.js | jq .
```

### Unity C# Patterns (Cathedral Renderer + CatGirl Avatar)

**Serializable Configuration Classes** (`CathedralRenderer.cs`, 1071 lines | `CatgirlController.cs`, 327 lines):

```csharp
// THIS REPO: Cathedral renderer configuration
[System.Serializable]
public class CathedralStyle
{
  [Header("🌸 Neon Cyber Goth Configuration")]
  [Range(0f, 1f)] public float pinkIntensity = 0.8f;
  [Range(0, 1000)] public int eldritchLevel = 666;
}

// SIBLING REPO: CatGirl avatar stats
[System.Serializable]
public class CatgirlStats
{
  [Header("🐱 Catgirl Properties")]
  public float purringFrequency = 2.5f;
  public int cuteness = 9999;
  public bool hasSecretCowPowers = true;
}
```

**Command Listener Pattern** (THIS REPO) - Use coroutines for stdin/stdout IPC:

```csharp
// unity-projects/cathedral-renderer/Assets/Scripts/CathedralRenderer.cs
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

**NetworkBehaviour Lifecycle** (SIBLING REPO) - Multiplayer synchronization:

```csharp
// bambisleep-chat-catgirl: Assets/Scripts/Character/CatgirlController.cs
public override void OnNetworkSpawn()
{
  if (IsOwner)
  {
    InitializeCatgirlSystems();
    UpdateNetworkStatsServerRpc(stats.pinkIntensity, stats.hasSecretCowPowers);
  }
  // Subscribe to NetworkVariable changes
  networkPinkIntensity.OnValueChanged += OnPinkIntensityChanged;
}

public override void OnNetworkDespawn()
{
  networkPinkIntensity.OnValueChanged -= OnPinkIntensityChanged;
}
```

**Unity Gaming Services (Async Pattern)** (SIBLING REPO):

```csharp
// CRITICAL: Initialize in this exact order (common failure point)
private async void Start()
{
  try
  {
    await UnityServices.InitializeAsync();         // 1. Core services first
    await AuthenticationService.Instance.SignInAnonymouslyAsync();  // 2. Auth second
    await EconomyService.Instance.PlayerBalances.GetBalancesAsync(); // 3. Economy last
  }
  catch (System.Exception e)
  {
    Debug.LogError($"Service error: {e.Message}");
    // Graceful fallback
  }
}
```

**Animator Performance Pattern** (SIBLING REPO):

```csharp
// Cache hash IDs (not strings) - see CatgirlController.cs
private static readonly int Speed = Animator.StringToHash("Speed");
private static readonly int IsPurring = Animator.StringToHash("IsPurring");

animator.SetFloat(Speed, currentSpeed); // ✅ Fast hash lookup
// animator.SetFloat("Speed", currentSpeed); // ❌ Slow string lookup every frame
```

**Procedural Generation** (THIS REPO) - Create GameObjects under root parent with `transform.parent` for cleanup. Use `GameObject.Destroy()` in cleanup methods. Always implement batch mode check: `Application.isBatchMode`.

**Key Unity Packages**:

**THIS REPO** (Cathedral Renderer):

- Universal Render Pipeline (URP) with HDR
- Shader Graph for procedural materials
- Post-Processing Stack v2 (bloom 3.0, chromatic aberration 0.3, vignette 0.4)

**SIBLING REPO** (CatGirl Avatar):

- `com.unity.services.economy` 3.4.2 (currency system)
- `com.unity.services.authentication` 3.3.4 (player identity)
- `com.unity.netcode.gameobjects` 2.0.0 (multiplayer networking)
- `com.unity.services.lobby` 1.2.2 (matchmaking)
- `com.unity.services.relay` 1.1.3 (NAT traversal)
- `com.unity.xr.interaction.toolkit` 3.0.5 (XR support)
- `com.unity.addressables` 2.3.1 (asset management)
- `com.unity.visualeffectgraph` 16.0.6 (particle systems)
- `com.unity.ui.toolkit` 2.0.0 (modern UI system)

## Project Conventions

### Emoji-Driven Commits (Machine-Readable)

```bash
git commit -m "🌸 Add dependencies"        # Package management (CHERRY_BLOSSOM)
git commit -m "👑 Refactor architecture"   # Architecture decisions (CROWN)
git commit -m "💎 Add tests"               # Quality/coverage (GEM)
git commit -m "✨ Configure servers"       # Server operations (SPARKLES)
git commit -m "🦋 Add feature"             # Transformations, NetworkBehaviour events (BUTTERFLY)
git commit -m "🐄 Add secret feature"      # Easter eggs, Diablo secret level references (COW)
git commit -m "🌸👑 Update deps + refactor" # Combined patterns
```

Full emoji mappings in `public/docs/RELIGULOUS_MANTRA.md` (113 lines).

### Documentation Structure

**THIS REPO** (js-bambisleep-church):

- **Core Docs**: `docs/` - Development guides, build instructions, contributing, changelog, todos
- **Public Docs**: `public/docs/` - Unity, MCP setup, IPC protocol, development philosophy
- **AI Instructions**: `.github/copilot-instructions.md` - This file
- **Main README**: `README.md` - Project overview and quick start

**SIBLING REPO** (bambisleep-chat-catgirl):

- **Architecture**: `docs/architecture/` - CATGIRL.md (682), UNITY_IPC_PROTOCOL.md (430), RELIGULOUS_MANTRA.md
- **Development**: `docs/development/` - UNITY_SETUP_GUIDE.md (858 - complete C# implementations)
- **Guides**: `docs/guides/` - build.md, todo.md, debugging references
- **Reference**: `docs/reference/` - CHANGELOG.md (415 lines)

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
THIS REPO (js-bambisleep-church):
├── README.md                    # Project overview and quick start
├── docs/                        # Core documentation
│   ├── DEVELOPMENT.md          # Consolidated development guide
│   ├── BUILD.md                # Build instructions and workflows (408 lines)
│   ├── CONTRIBUTING.md         # Contribution guidelines
│   ├── CHANGELOG.md            # Version history
│   ├── TODO.md                 # Planned features and improvements (143 lines)
│   └── UNITY_IPC_IMPLEMENTATION_SUMMARY.md
├── src/
│   ├── mcp/orchestrator.js          # 29 methods, EventEmitter lifecycle management
│   ├── unity/unity-bridge.js        # Unity process + JSON IPC protocol (409 lines)
│   ├── utils/logger.js              # 5-level logging with dual output (237 lines)
│   ├── index.js                     # Main entry, conditional MCP registration (277 lines)
│   └── tests/                       # 100% coverage enforced
│       └── mcp/orchestrator.test.js # 50+ test cases, 605 lines
├── .vscode/settings.json            # Lines 116-169: MCP server registry (8/8)
├── .github/copilot-instructions.md  # AI agent instructions (this file)
├── package.json                     # Lines 53-74: Jest 100% coverage thresholds
├── jest.setup.js                    # Global test configuration
├── public/docs/                     # User-facing technical documentation
│   ├── UNITY_IPC_PROTOCOL.md       # Complete IPC specification (432 lines)
│   ├── UNITY_SETUP_GUIDE.md        # Unity installation guide
│   ├── MCP_SETUP_GUIDE.md          # MCP server setup (351 lines)
│   ├── RELIGULOUS_MANTRA.md        # Development philosophy (113 lines)
│   ├── CATGIRL.md                  # Unity avatar specs (683 lines)
│   └── CATGIRL_SERVER.md           # Unity server implementation
└── unity-projects/cathedral-renderer/  # Separate Unity project (C# codebase)
    └── Assets/Scripts/CathedralRenderer.cs  # Main renderer (1071 lines)

SIBLING REPO (bambisleep-chat-catgirl):
├── catgirl-avatar-project/          # Unity 6.2 LTS (Unity 6000.2.11f1)
│   ├── Assets/Scripts/              # 6 complete C# systems (1,950+ lines)
│   │   ├── Audio/AudioManager.cs    # 342 lines - Singleton audio system
│   │   ├── Character/CatgirlController.cs  # 327 lines - NetworkBehaviour
│   │   ├── Economy/InventorySystem.cs      # 284 lines - UGS Economy
│   │   ├── Economy/UniversalBankingSystem.cs # 363 lines - Multi-currency
│   │   ├── Networking/CatgirlNetworkManager.cs # 324 lines - Relay + Lobby
│   │   └── UI/InventoryUI.cs        # 322 lines - UI Toolkit interface
│   ├── Packages/manifest.json       # 16 Unity packages (UGS, Netcode, XR)
│   └── ProjectSettings/ProjectVersion.txt
├── docs/                            # 4,200+ lines documentation
│   ├── architecture/                # CATGIRL.md (682), UNITY_IPC_PROTOCOL.md (430)
│   ├── development/                 # UNITY_SETUP_GUIDE.md (858 - complete C# implementations)
│   └── guides/                      # build.md, todo.md, debugging references
├── .github/workflows/build.yml      # CI/CD with 7 jobs
├── .vscode/settings.json            # MCP integration + Unity project path
├── Dockerfile                       # GHCR: bambisleepchat/bambisleep-church
├── package.json                     # Node.js 20.19.5 (Volta pinned)
├── setup-mcp.sh                     # MCP server installation
└── mcp-validate.sh                  # Test all 8 MCP servers
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

**No CI/CD Pipeline Currently** (THIS REPO) - Manual deployment workflow:

1. **Local Testing**: `npm test` enforces 100% coverage before commit
2. **Version Control**: Use emoji-driven commits (see `RELIGULOUS_MANTRA.md`)
3. **Environment Setup**: Copy `.env.example` to `.env` on target server
4. **Dependency Install**: `npm install --no-bin-links` (WSL2/mounted filesystems)
5. **Service Management**: Manual `npm start` or systemd service (not implemented yet)

**SIBLING REPO CI/CD** (bambisleep-chat-catgirl):

- **GitHub Actions** - `.github/workflows/build.yml` with 7 jobs
- **Jobs**: validate-mcp → test → build-container → unity-validation → deploy → quality-check → summary
- **Container Registry**: GHCR (`ghcr.io/bambisleepchat/bambisleep-church`)
- **Semantic Versioning**: v{major}.{minor}.{patch}, dev-{branch}, latest tags

**Production Readiness Checklist**:

**THIS REPO**:

- ✅ 100% test coverage enforced
- ✅ Graceful shutdown handlers (SIGTERM/SIGINT)
- ✅ Structured logging with file output
- ✅ Environment-based configuration
- ❌ No Docker containerization yet
- ❌ No systemd service files yet
- ❌ No health check endpoints yet (only internal monitoring)

**SIBLING REPO**:

- ✅ Docker containerization (Dockerfile + GHCR)
- ✅ CI/CD pipeline (7 jobs)
- ✅ Container semantic versioning
- ❌ Test stubs only (no real tests - see todo.md)
- ❌ Test coverage continues on failure (`continue-on-error: true`)

## Unity Project Management

### Unity Version Requirements

**THIS REPO**: Unity 6.2 LTS (6000.2.11f1) - Cathedral Renderer
**SIBLING REPO**: Unity 6.2 LTS (6000.2.11f1) - CatGirl Avatar System

### Unity Project Corruption Recovery

```bash
# THIS REPO
cd unity-projects/cathedral-renderer
rm -rf Library/ Temp/ obj/

# SIBLING REPO
cd catgirl-avatar-project
rm -rf Library/ Temp/ obj/

# Use VS Code Task: "Clean Unity Project" or reopen in Unity Editor to regenerate
```

### Git Tracking & .gitignore Rules

- Unity `Library/`, `Temp/`, `obj/`, `Builds/`, `Logs/`, `UserSettings/` are ignored
- All `.csproj`, `.sln`, `.suo` files ignored (Unity regenerates these)
- `node_modules/` and package lock files ignored
- Docker volumes and container data excluded
- Keep: `Assets/`, `Packages/`, `ProjectSettings/` tracked in git
- **Meta files**: Unity `.meta` files ARE tracked (critical for asset references)

## Real-World Development Scenarios

### Scenario 1: Extending MCP Orchestrator (THIS REPO)

**Task**: Add new MCP server with custom health check

```javascript
// 1. Add to src/index.js conditional loading
if (process.env.CUSTOM_SERVER_TOKEN) {
  MCP_SERVERS.custom = {
    command: 'npx',
    args: ['-y', '@custom/mcp-server']
  };
}

// 2. Register in orchestrator
orchestrator.registerServer('custom', MCP_SERVERS.custom);

// 3. Add to .vscode/settings.json for AI integration
"mcp.servers": {
  "custom": {
    "command": "npx",
    "args": ["-y", "@custom/mcp-server"]
  }
}

// 4. Add tests in src/tests/mcp/orchestrator.test.js
it('should handle custom server lifecycle', async () => {
  orchestrator.registerServer('custom', { command: 'node' });
  await orchestrator.startServer('custom');
  expect(orchestrator.getServerState('custom')).toBe(SERVER_STATES.RUNNING);
});
```

### Scenario 2: Unity IPC Message Extension (THIS REPO + SIBLING REPO)

**Task**: Add new message type for catgirl animation control

**THIS REPO** (Node.js side - `src/unity/unity-bridge.js`):

```javascript
// Add new command sender
sendCatgirlAnimation(animationName, speed) {
  this.sendMessage({
    type: 'catgirl:animate',
    data: { animationName, speed }
  });
}

// Listen for Unity response
this.rendererProcess.stdout.on('data', (data) => {
  const message = JSON.parse(data.toString());
  if (message.type === 'catgirl:animation-started') {
    this.emit('animation:started', message.data);
  }
});
```

**SIBLING REPO** (Unity C# side - `Assets/Scripts/IPC/IPCBridge.cs`):

```csharp
void ProcessMessage(string json) {
  IPCMessage msg = JsonUtility.FromJson<IPCMessage>(json);

  if (msg.type == "catgirl:animate") {
    var data = JsonUtility.FromJson<AnimationData>(msg.data);
    StartCatgirlAnimation(data.animationName, data.speed);
    SendMessage("catgirl:animation-started", new {
      animation = data.animationName
    });
  }
}
```

### Scenario 3: Adding Unity Gaming Services (SIBLING REPO)

**Task**: Integrate new UGS feature (e.g., Cloud Save)

```csharp
// 1. Add package to catgirl-avatar-project/Packages/manifest.json
{
  "dependencies": {
    "com.unity.services.cloudsave": "3.2.0",
    // ... existing packages
  }
}

// 2. Initialize in correct order (CRITICAL)
private async void Start()
{
  await UnityServices.InitializeAsync();
  await AuthenticationService.Instance.SignInAnonymouslyAsync();
  await EconomyService.Instance.PlayerBalances.GetBalancesAsync();

  // NEW: Cloud Save comes AFTER authentication
  await CloudSaveService.Instance.Data.LoadAsync();
}

// 3. Test with UGS Dashboard
// - Verify Project ID matches ProjectSettings/Services/com.unity.services.core
// - Test in "development" environment first
```

### Scenario 4: Debugging MCP Server Failures (BOTH REPOS)

**THIS REPO** - Check orchestrator logs:

```bash
# Check Control Tower logs
tail -f logs/control-tower.log

# Test single server
npm run mcp:status

# Verify env vars loaded
node -e "console.log(process.env.GITHUB_TOKEN ? 'Loaded' : 'Missing')"

# VS Code Output panel → Select "MCP" extension logs
```

**SIBLING REPO** - Validate MCP setup:

```bash
# Run validation script
./mcp-validate.sh

# Check individual server
npx -y @modelcontextprotocol/server-filesystem /mnt/f/bambisleep-chat-catgirl

# Verify .vscode/settings.json paths are absolute
```

### Scenario 5: Implementing Multiplayer Auction House (SIBLING REPO)

**Task**: Create real-time auction system synchronized across clients

```csharp
// 1. Create data structure in UniversalBankingSystem.cs
[System.Serializable]
public struct AuctionListing
{
    public string itemId;
    public ulong sellerClientId;
    public long currentBid;
    public long buyoutPrice;
    public double expirationTime;
}

// 2. Use NetworkList for synchronization
private NetworkList<AuctionListing> activeAuctions;

private void Awake()
{
    activeAuctions = new NetworkList<AuctionListing>();
}

// 3. Server handles bid logic
[ServerRpc(RequireOwnership = false)]
public void PlaceBidServerRpc(string itemId, long bidAmount, ServerRpcParams rpcParams = default)
{
    var auction = activeAuctions.FirstOrDefault(a => a.itemId == itemId);

    if (bidAmount > auction.currentBid)
    {
        // Refund previous bidder
        RefundPreviousBidder(auction);

        // Update auction
        auction.currentBid = bidAmount;
        auction.buyerClientId = rpcParams.Receive.SenderClientId;

        // Notify all clients
        NotifyBidUpdateClientRpc(itemId, bidAmount);
    }
}

// 4. Update UI on all clients
[ClientRpc]
private void NotifyBidUpdateClientRpc(string itemId, long newBid)
{
    // Update InventoryUI auction display
    FindObjectOfType<InventoryUI>().RefreshAuctionListing(itemId, newBid);
}
```

**Files to modify**: `UniversalBankingSystem.cs` (~80 lines), `InventoryUI.cs` (~40 lines), new prefab for auction UI

### Scenario 6: Optimizing Animator Performance (SIBLING REPO)

**Task**: Reduce animator overhead when many catgirls are on screen

```csharp
// Current pattern in CatgirlController.cs (CORRECT):
private static readonly int Speed = Animator.StringToHash("Speed");
private static readonly int IsPurring = Animator.StringToHash("IsPurring");

// ❌ DON'T DO THIS (performance killer):
animator.SetFloat("Speed", currentSpeed); // String lookup every frame

// ✅ DO THIS (cached hash):
animator.SetFloat(Speed, currentSpeed); // Direct hash lookup

// Additional optimization: Culling system
private void Update()
{
    // Only update animator if visible to camera
    if (!isVisibleToCamera)
    {
        animator.cullingMode = AnimatorCullingMode.CullCompletely;
        return;
    }

    animator.cullingMode = AnimatorCullingMode.CullUpdateTransforms;
    UpdateAnimations();
}
```

**Impact**: 60+ FPS with 50 catgirls vs 20 FPS with string lookups

### Scenario 7: Container Deployment with Semantic Versioning (BOTH REPOS)

**Task**: Build and deploy updated avatar system to GHCR

```bash
# 1. Update package.json version (semantic versioning)
# Change: "version": "1.0.0" → "1.1.0" (minor feature addition)

# 2. Build container with proper labels
docker build \
    -t ghcr.io/bambisleepchat/bambisleep-church:v1.1.0 \
    -t ghcr.io/bambisleepchat/bambisleep-church:latest \
    --label org.opencontainers.image.version="1.1.0" \
    --label org.bambi.feature="butterfly-flight-ability" \
    --label org.bambi.unity-version="6000.2.11f1" \
    .

# 3. Test container locally
docker run --rm bambisleep-church:v1.1.0 npm test

# 4. Push to registry (happens automatically via CI/CD)
# GitHub Actions workflow triggers on version tag:
git tag -a v1.1.0 -m "🦋 Add butterfly flight ability"
git push origin v1.1.0

# 5. Verify deployment
docker pull ghcr.io/bambisleepchat/bambisleep-church:v1.1.0
docker inspect ghcr.io/bambisleepchat/bambisleep-church:v1.1.0 | grep -i bambi
```

**CI/CD result**: 7 jobs run, container deployed with all labels, semantic versioning maintained

### Scenario 8: Memory Server for Development Context (BOTH REPOS)

**Task**: Use MCP memory server to maintain knowledge across coding sessions

```bash
# Session 1: Store Unity package versions
# AI agent remembers: "This project uses Unity Netcode 1.11.0, UGS Economy 3.4.2"

# Session 2: Query previous decisions
# AI recalls: "CatgirlController uses NetworkBehaviour, not MonoBehaviour"

# Session 3: Reference past implementations
# AI knows: "Gambling system uses 5% house edge, defined in UniversalBankingSystem.cs:299"

# Practical usage:
# - Remembers BambiSleep™ trademark requirement
# - Recalls emoji conventions (🦋 for transformations, 🌸 for packages)
# - Maintains context about cow powers being "secret level" features
# - Tracks which Unity systems are complete vs in-progress (from todo.md)
```

**MCP servers used**: memory (context persistence), sequential-thinking (complex reasoning)

### Scenario 9: Node.js ↔ Unity IPC Bidirectional Communication (THIS REPO)

**Task**: Implement bidirectional communication for cathedral rendering

```javascript
// 1. Create Unity bridge in Node.js (src/unity/unity-bridge.js)
const { spawn } = require("child_process");

class UnityBridge extends EventEmitter {
  constructor(options) {
    super();
    this.unityPath = options.unityPath;
    this.projectPath = options.projectPath;
    this.process = null;
  }

  start() {
    this.process = spawn(this.unityPath, [
      "-batchmode",
      "-projectPath",
      this.projectPath,
      "-executeMethod",
      "IPCBridge.StartIPC",
    ]);

    // Parse JSON messages from Unity
    this.process.stdout.on("data", (data) => {
      const lines = data.toString().split("\n").filter(Boolean);
      lines.forEach((line) => {
        try {
          const msg = JSON.parse(line);
          this.emit(`unity:${msg.type}`, msg.data);
        } catch (e) {
          console.error("Invalid JSON from Unity:", line);
        }
      });
    });
  }

  sendMessage(type, data) {
    const message = {
      type,
      timestamp: new Date().toISOString(),
      data,
    };
    this.process.stdin.write(JSON.stringify(message) + "\n");
  }
}

// 2. Use the bridge
const bridge = new UnityBridge({
  unityPath: "/opt/unity/Editor/Unity",
  projectPath: "./catgirl-avatar-project",
});

bridge.on("unity:scene-loaded", (data) => {
  console.log("Scene loaded:", data.sceneName);
  bridge.sendMessage("update", { neonIntensity: 7.5 });
});

bridge.on("unity:render-complete", (data) => {
  console.log("Render saved:", data.outputPath);
});

bridge.start();
```

```csharp
// 3. Unity IPC handler (Assets/Scripts/IPC/IPCBridge.cs)
using UnityEngine;
using System;

[Serializable]
public class IPCMessage {
    public string type;
    public string timestamp;
    public string data; // JSON string for nested object
}

public class IPCBridge : MonoBehaviour {
    void Update() {
        // Read from stdin (Node.js writes here)
        if (Console.KeyAvailable) {
            string json = Console.ReadLine();
            ProcessMessage(json);
        }
    }

    void ProcessMessage(string json) {
        try {
            IPCMessage msg = JsonUtility.FromJson<IPCMessage>(json);

            switch (msg.type) {
                case "initialize":
                    var initData = JsonUtility.FromJson<InitData>(msg.data);
                    InitializeScene(initData);
                    break;
                case "update":
                    var updateData = JsonUtility.FromJson<UpdateData>(msg.data);
                    UpdateParameters(updateData);
                    SendMessage("update-ack", new { success = true });
                    break;
                case "render":
                    var renderData = JsonUtility.FromJson<RenderData>(msg.data);
                    RenderScene(renderData);
                    break;
            }
        } catch (Exception e) {
            SendMessage("error", new {
                errorCode = "INVALID_MESSAGE",
                message = e.Message
            });
        }
    }

    void SendMessage(string type, object data) {
        var msg = new {
            type,
            timestamp = DateTime.UtcNow.ToString("o"),
            data
        };
        // Write to stdout (Node.js reads this)
        Console.WriteLine(JsonUtility.ToJson(msg));
    }

    void InitializeScene(InitData data) {
        // Load scene, configure parameters
        SendMessage("scene-loaded", new {
            sceneName = data.sceneName,
            objectCount = 156
        });
    }
}
```

**Message flow**: Node→Unity (initialize, update, render) | Unity→Node (scene-loaded, update-ack, render-complete, error, heartbeat)

**Files to create**: `src/unity/unity-bridge.js` (~200 lines), `Assets/Scripts/IPC/IPCBridge.cs` (~150 lines)

**Reference**: `docs/architecture/UNITY_IPC_PROTOCOL.md` for complete protocol spec with all message types

## Organization Requirements

- **Always use "BambiSleep™"** with trademark symbol in documentation
- **THIS REPO**: `github.com/BambiSleepChat/bambisleep-church` (organization pending, currently HarleyVader)
- **SIBLING REPO**: `github.com/BambiSleepChat/bambisleep-chat-catgirl`
- Organization context in `.vscode/settings.json` line 18
- MIT license with proper attribution

## Debugging

**MCP Server Issues**:

- Check VS Code Output panel → Select "MCP" extension logs
- Run `npm run mcp:status` to verify 8/8 operational
- Verify env vars loaded: `node -e "console.log(process.env.GITHUB_TOKEN ? 'Loaded' : 'Missing')"`

**Test Failures** (THIS REPO ONLY):

- Coverage report: `coverage/lcov-report/index.html`
- Run watch mode: `npm run test:watch`
- Check all branches tested (success + failure paths)

**Unity IPC** (THIS REPO):

- Unity logs: `unity-projects/cathedral-renderer/Logs/unity-renderer.log`
- Debug IPC in `src/unity/unity-bridge.js` stdout/stdin handlers
- Protocol docs: `public/docs/UNITY_IPC_PROTOCOL.md`

**Unity Gaming Services** (SIBLING REPO):

- Check initialization order (InitializeAsync → SignInAnonymouslyAsync → Service calls)
- Verify Unity Dashboard credentials
- Test with `[ContextMenu("Test UGS Connection")]` methods

---

# 🌸 COMPREHENSIVE DEEP DIVE SECTIONS 🌸

## 1️⃣ Unity Systems Deep Dive (SIBLING REPO)

### UniversalBankingSystem.cs (363 lines) - Multi-Currency & Gambling

**Architecture**: Singleton pattern with NetworkBehaviour for multiplayer sync

```csharp
// Assets/Scripts/Economy/UniversalBankingSystem.cs
public class UniversalBankingSystem : NetworkBehaviour
{
  [Header("💰 Currency Configuration")]
  public long pinkCoins = 1000;
  public long cowTokens = 100;
  public float bambiPoints = 500.0f;

  [Header("🎰 Gambling Configuration")]
  public float houseEdge = 0.05f;  // 5% house edge (CRITICAL - DO NOT CHANGE)
  public long minBet = 10;
  public long maxBet = 10000;

  // Network synced balances
  private NetworkVariable<long> networkPinkCoins = new NetworkVariable<long>();
  private NetworkVariable<long> networkCowTokens = new NetworkVariable<long>();

  // Gambling games supported
  public enum GamblingGame {
    CoinFlip,      // 50/50 odds with house edge
    SlotMachine,   // Variable payout 10-1000x
    CowRoulette,   // 36 numbers + secret cow power slot
    PinkWheel      // Spinning wheel with 8 segments
  }

  [ServerRpc(RequireOwnership = false)]
  public void PlaceBetServerRpc(GamblingGame game, long amount, ServerRpcParams rpcParams = default)
  {
    ulong clientId = rpcParams.Receive.SenderClientId;

    if (amount < minBet || amount > maxBet) {
      NotifyInvalidBetClientRpc(clientId, "Bet outside allowed range");
      return;
    }

    // Deduct bet amount
    DeductBalance(clientId, amount);

    // Process game logic with house edge
    float roll = Random.value;
    bool won = ProcessGambleWithHouseEdge(game, roll);

    if (won) {
      long payout = CalculatePayout(game, amount, roll);
      AddBalance(clientId, payout);
      NotifyWinClientRpc(clientId, payout);
    } else {
      NotifyLossClientRpc(clientId, amount);
    }
  }

  private bool ProcessGambleWithHouseEdge(GamblingGame game, float roll)
  {
    // Apply 5% house edge to all games
    float adjustedRoll = roll * (1.0f - houseEdge);

    switch (game) {
      case GamblingGame.CoinFlip:
        return adjustedRoll < 0.475f; // 47.5% win rate (50% - 2.5% edge)
      case GamblingGame.SlotMachine:
        return adjustedRoll < 0.095f; // 9.5% win rate (10% - 0.5% edge)
      case GamblingGame.CowRoulette:
        return adjustedRoll < 0.0263f; // 2.63% win rate (1/36 - edge)
      default:
        return false;
    }
  }

  private long CalculatePayout(GamblingGame game, long bet, float roll)
  {
    switch (game) {
      case GamblingGame.CoinFlip:
        return bet * 2;
      case GamblingGame.SlotMachine:
        // Tiered payouts based on roll value
        if (roll < 0.001f) return bet * 1000; // Jackpot (0.1%)
        if (roll < 0.01f) return bet * 100;   // Big win (1%)
        if (roll < 0.05f) return bet * 20;    // Medium win (5%)
        return bet * 10;                       // Small win (10%)
      case GamblingGame.CowRoulette:
        // Secret cow power bonus
        if (roll < 0.0001f) return bet * 3600; // Secret cow jackpot!
        return bet * 36;
      default:
        return bet;
    }
  }
}
```

**Key Patterns**:

- **5% house edge** ensures long-term profitability (line 299)
- **ServerRpc** for all gambling to prevent client-side cheating
- **NetworkVariable** for real-time balance synchronization across clients
- **Tiered payout system** with rare jackpot mechanics

### InventorySystem.cs (284 lines) - UGS Economy Integration

**Architecture**: 100 base slots + expandable bags, UGS Economy for persistence

```csharp
// Assets/Scripts/Economy/InventorySystem.cs
public class InventorySystem : MonoBehaviour
{
  [Header("🎒 Inventory Configuration")]
  public int baseSlots = 100;
  public int maxBags = 5;
  public int slotsPerBag = 20;

  private List<CatgirlItem> items = new List<CatgirlItem>();
  private Dictionary<string, int> itemCounts = new Dictionary<string, int>();

  [System.Serializable]
  public class CatgirlItem
  {
    public string itemId;
    public string displayName;
    public int rarity; // 0=Common, 1=Uncommon, 2=Rare, 3=Epic, 4=Legendary, 5=Divine Cow
    public bool isCowPowerItem;
    public float pinkValue;
    public Sprite icon;

    [Header("🐄 Secret Cow Powers")]
    public bool hasSecretCowPowers = false;
    public int cowPowerLevel = 0; // 0-1000 (Diablo reference)
  }

  // UGS Economy integration
  private async Task SyncWithEconomy()
  {
    try {
      // Fetch player inventory from UGS Economy
      var inventoryResult = await EconomyService.Instance
        .PlayerInventory
        .GetInventoryAsync();

      // Sync local inventory with server state
      foreach (var item in inventoryResult.PlayersInventoryItems) {
        AddItemFromEconomy(item);
      }

      Debug.Log($"✅ Synced {items.Count} items from UGS Economy");
    } catch (Exception e) {
      Debug.LogError($"❌ Economy sync failed: {e.Message}");
    }
  }

  public bool AddItem(CatgirlItem item)
  {
    // Check if inventory has space
    int totalSlots = baseSlots + (purchasedBags * slotsPerBag);
    if (items.Count >= totalSlots) {
      Debug.LogWarning("🎒 Inventory full!");
      return false;
    }

    // Add to local inventory
    items.Add(item);

    // Update item counts for stacking
    if (itemCounts.ContainsKey(item.itemId)) {
      itemCounts[item.itemId]++;
    } else {
      itemCounts[item.itemId] = 1;
    }

    // Persist to UGS Economy
    PersistItemToEconomy(item);

    // Trigger UI update
    OnInventoryChanged?.Invoke();

    return true;
  }

  // Rarity-based item generation
  public CatgirlItem GenerateRandomItem()
  {
    float rarityRoll = Random.value;
    int rarity;

    // Rarity drop rates
    if (rarityRoll < 0.0001f) rarity = 5; // Divine Cow (0.01%)
    else if (rarityRoll < 0.001f) rarity = 4; // Legendary (0.1%)
    else if (rarityRoll < 0.05f) rarity = 3; // Epic (5%)
    else if (rarityRoll < 0.15f) rarity = 2; // Rare (15%)
    else if (rarityRoll < 0.40f) rarity = 1; // Uncommon (40%)
    else rarity = 0; // Common (60%)

    var item = new CatgirlItem {
      itemId = $"item_{System.Guid.NewGuid()}",
      rarity = rarity,
      hasSecretCowPowers = (rarity == 5),
      cowPowerLevel = (rarity == 5) ? 1000 : 0
    };

    return item;
  }
}
```

**Key Patterns**:

- **100 base slots** with expandable bag system (20 slots each, max 5 bags = 200 total)
- **Rarity system** with 6 tiers including secret "Divine Cow" tier (0.01% drop rate)
- **UGS Economy sync** for cloud persistence across devices
- **Stacking system** via `itemCounts` dictionary for duplicate items

### AudioManager.cs (342 lines) - Singleton Audio System

**Architecture**: DontDestroyOnLoad singleton with spatial audio support

```csharp
// Assets/Scripts/Audio/AudioManager.cs
public class AudioManager : MonoBehaviour
{
  private static AudioManager _instance;
  public static AudioManager Instance
  {
    get {
      if (_instance == null) {
        _instance = FindObjectOfType<AudioManager>();
        if (_instance == null) {
          GameObject go = new GameObject("AudioManager");
          _instance = go.AddComponent<AudioManager>();
        }
      }
      return _instance;
    }
  }

  [Header("🎵 Audio Configuration")]
  public AudioMixerGroup masterMixer;
  public AudioMixerGroup musicMixer;
  public AudioMixerGroup sfxMixer;
  public AudioMixerGroup voiceMixer;

  [Header("🐱 Catgirl Sounds")]
  public AudioClip[] purringSounds;
  public AudioClip[] nyanSounds;
  public AudioClip[] cowMooSounds;

  private Dictionary<string, AudioSource> activeSources = new Dictionary<string, AudioSource>();
  private ObjectPool<AudioSource> sourcePool;

  private void Awake()
  {
    if (_instance != null && _instance != this) {
      Destroy(gameObject);
      return;
    }
    _instance = this;
    DontDestroyOnLoad(gameObject);

    InitializeAudioPool();
  }

  private void InitializeAudioPool()
  {
    // Create pool of 20 AudioSource components
    sourcePool = new ObjectPool<AudioSource>(
      createFunc: () => {
        GameObject go = new GameObject("PooledAudioSource");
        go.transform.SetParent(transform);
        return go.AddComponent<AudioSource>();
      },
      actionOnGet: (source) => source.gameObject.SetActive(true),
      actionOnRelease: (source) => source.gameObject.SetActive(false),
      actionOnDestroy: (source) => Destroy(source.gameObject),
      defaultCapacity: 20,
      maxSize: 50
    );
  }

  public void PlaySound(AudioClip clip, Vector3 position, float volume = 1.0f)
  {
    AudioSource source = sourcePool.Get();
    source.clip = clip;
    source.volume = volume;
    source.spatialBlend = 1.0f; // Full 3D sound
    source.transform.position = position;
    source.Play();

    // Return to pool after playback
    StartCoroutine(ReturnToPoolAfterPlay(source, clip.length));
  }

  private IEnumerator ReturnToPoolAfterPlay(AudioSource source, float delay)
  {
    yield return new WaitForSeconds(delay);
    sourcePool.Release(source);
  }

  // Catgirl-specific audio methods
  public void PlayRandomPurr(Vector3 position)
  {
    AudioClip purr = purringSounds[Random.Range(0, purringSounds.Length)];
    PlaySound(purr, position, 0.7f);
  }

  public void PlayNyan(Vector3 position, float intensity)
  {
    AudioClip nyan = nyanSounds[Random.Range(0, nyanSounds.Length)];
    PlaySound(nyan, position, Mathf.Clamp01(intensity));
  }
}
```

**Key Patterns**:

- **Singleton** with DontDestroyOnLoad for scene persistence
- **Object pooling** (20 default, 50 max) to avoid GC allocations
- **Spatial audio** with full 3D sound positioning
- **Auto-cleanup** via coroutine after playback completes

### CatgirlNetworkManager.cs (324 lines) - Relay + Lobby System

**Architecture**: Unity Gaming Services Relay + Lobby for NAT traversal

```csharp
// Assets/Scripts/Networking/CatgirlNetworkManager.cs
public class CatgirlNetworkManager : MonoBehaviour
{
  [Header("🌐 Network Configuration")]
  public int maxPlayers = 16;
  public string lobbyName = "BambiSleep Cathedral";
  public bool isPrivateLobby = false;

  private Lobby currentLobby;
  private string relayJoinCode;

  public async Task<bool> CreateLobbyWithRelay()
  {
    try {
      // 1. Create Relay allocation (host)
      Allocation allocation = await RelayService.Instance.CreateAllocationAsync(maxPlayers);
      relayJoinCode = await RelayService.Instance.GetJoinCodeAsync(allocation.AllocationId);

      // 2. Configure NetworkManager with Relay transport
      NetworkManager.Singleton.GetComponent<UnityTransport>().SetHostRelayData(
        allocation.RelayServer.IpV4,
        (ushort)allocation.RelayServer.Port,
        allocation.AllocationIdBytes,
        allocation.Key,
        allocation.ConnectionData
      );

      // 3. Create lobby with Relay join code
      CreateLobbyOptions options = new CreateLobbyOptions {
        IsPrivate = isPrivateLobby,
        Data = new Dictionary<string, DataObject> {
          { "RelayJoinCode", new DataObject(DataObject.VisibilityOptions.Member, relayJoinCode) },
          { "GameMode", new DataObject(DataObject.VisibilityOptions.Public, "Cathedral") }
        }
      };

      currentLobby = await LobbyService.Instance.CreateLobbyAsync(lobbyName, maxPlayers, options);

      // 4. Start host
      NetworkManager.Singleton.StartHost();

      Debug.Log($"✅ Lobby created: {currentLobby.Id} | Relay: {relayJoinCode}");
      return true;

    } catch (Exception e) {
      Debug.LogError($"❌ Lobby creation failed: {e.Message}");
      return false;
    }
  }

  public async Task<bool> JoinLobbyByCode(string lobbyCode)
  {
    try {
      // 1. Join lobby
      currentLobby = await LobbyService.Instance.JoinLobbyByCodeAsync(lobbyCode);

      // 2. Get Relay join code from lobby data
      string relayCode = currentLobby.Data["RelayJoinCode"].Value;

      // 3. Join Relay allocation
      JoinAllocation allocation = await RelayService.Instance.JoinAllocationAsync(relayCode);

      // 4. Configure NetworkManager with Relay transport
      NetworkManager.Singleton.GetComponent<UnityTransport>().SetClientRelayData(
        allocation.RelayServer.IpV4,
        (ushort)allocation.RelayServer.Port,
        allocation.AllocationIdBytes,
        allocation.Key,
        allocation.ConnectionData,
        allocation.HostConnectionData
      );

      // 5. Start client
      NetworkManager.Singleton.StartClient();

      Debug.Log($"✅ Joined lobby: {currentLobby.Id}");
      return true;

    } catch (Exception e) {
      Debug.LogError($"❌ Lobby join failed: {e.Message}");
      return false;
    }
  }

  // Heartbeat to keep lobby alive
  private async void Start()
  {
    InvokeRepeating(nameof(SendLobbyHeartbeat), 15f, 15f);
  }

  private async void SendLobbyHeartbeat()
  {
    if (currentLobby != null && NetworkManager.Singleton.IsHost) {
      await LobbyService.Instance.SendHeartbeatPingAsync(currentLobby.Id);
    }
  }
}
```

**Key Patterns**:

- **Relay + Lobby combo** solves NAT traversal (no port forwarding needed)
- **Join codes** for easy multiplayer matchmaking
- **Heartbeat system** (15s interval) keeps lobby alive
- **Public/private lobbies** with metadata for filtering

### InventoryUI.cs (322 lines) - UI Toolkit Interface

**Architecture**: Modern UI Toolkit (UXML + USS) with visual scripting

```csharp
// Assets/Scripts/UI/InventoryUI.cs
public class InventoryUI : MonoBehaviour
{
  private UIDocument uiDocument;
  private VisualElement root;
  private ScrollView itemScrollView;
  private Label pinkCoinsLabel;
  private Label cowTokensLabel;

  private void Awake()
  {
    uiDocument = GetComponent<UIDocument>();
    root = uiDocument.rootVisualElement;

    // Query UI elements by name (defined in UXML)
    itemScrollView = root.Q<ScrollView>("ItemScrollView");
    pinkCoinsLabel = root.Q<Label>("PinkCoinsLabel");
    cowTokensLabel = root.Q<Label>("CowTokensLabel");

    // Register button callbacks
    Button closeButton = root.Q<Button>("CloseButton");
    closeButton.clicked += OnCloseClicked;

    Button sortButton = root.Q<Button>("SortButton");
    sortButton.clicked += SortInventory;
  }

  public void RefreshInventory(List<CatgirlItem> items)
  {
    itemScrollView.Clear();

    foreach (var item in items) {
      VisualElement itemElement = CreateItemElement(item);
      itemScrollView.Add(itemElement);
    }
  }

  private VisualElement CreateItemElement(CatgirlItem item)
  {
    // Create item slot container
    VisualElement container = new VisualElement();
    container.AddToClassList("item-slot");

    // Rarity-based border color
    string rarityClass = item.rarity switch {
      0 => "common-border",
      1 => "uncommon-border",
      2 => "rare-border",
      3 => "epic-border",
      4 => "legendary-border",
      5 => "divine-cow-border", // Special pink sparkle border
      _ => "common-border"
    };
    container.AddToClassList(rarityClass);

    // Item icon
    VisualElement icon = new VisualElement();
    icon.style.backgroundImage = new StyleBackground(item.icon);
    icon.AddToClassList("item-icon");
    container.Add(icon);

    // Item name
    Label nameLabel = new Label(item.displayName);
    nameLabel.AddToClassList("item-name");
    container.Add(nameLabel);

    // Secret cow power indicator
    if (item.hasSecretCowPowers) {
      Label cowLabel = new Label("🐄 MOO!");
      cowLabel.AddToClassList("cow-power-label");
      container.Add(cowLabel);
    }

    // Click handler for item interaction
    container.RegisterCallback<ClickEvent>(evt => OnItemClicked(item));

    return container;
  }

  private void SortInventory()
  {
    // Sort by rarity (Divine Cow > Legendary > Epic > Rare > Uncommon > Common)
    var sortedItems = inventorySystem.GetItems()
      .OrderByDescending(i => i.rarity)
      .ThenBy(i => i.displayName)
      .ToList();

    RefreshInventory(sortedItems);
  }
}
```

**Key Patterns**:

- **UI Toolkit** (modern Unity UI) instead of legacy uGUI
- **UXML** for layout structure (like HTML)
- **USS** for styling (like CSS) with rarity-based classes
- **Lambda callbacks** for item click events
- **Dynamic element creation** with `VisualElement` hierarchy

---

## 2️⃣ MCP Server Examples Deep Dive

### MongoDB MCP Server Usage

```javascript
// Query catgirl player data
const mcpResponse = await mcpClient.callTool("mongodb", "find", {
  database: "bambisleep",
  collection: "players",
  query: { hasSecretCowPowers: true },
  limit: 10,
});

// Aggregation pipeline for leaderboard
const leaderboard = await mcpClient.callTool("mongodb", "aggregate", {
  database: "bambisleep",
  collection: "players",
  pipeline: [
    { $match: { pinkCoins: { $gt: 10000 } } },
    { $sort: { pinkCoins: -1 } },
    { $limit: 100 },
    {
      $project: {
        username: 1,
        pinkCoins: 1,
        cowPowerLevel: 1,
        rank: { $add: [{ $indexOfArray: ["$$ROOT", "$_id"] }, 1] },
      },
    },
  ],
});

// Schema inspection for debugging
const schema = await mcpClient.callTool("mongodb", "getSchema", {
  database: "bambisleep",
  collection: "players",
});
```

### Stripe MCP Server Usage

```javascript
// Create customer for new catgirl player
const customer = await mcpClient.callTool("stripe", "create_customer", {
  name: "PinkyCatgirl2025",
  email: "pinky@bambisleep.church",
  metadata: {
    userId: "catgirl_12345",
    cowPowerLevel: 666,
  },
});

// Create subscription for premium features
const subscription = await mcpClient.callTool("stripe", "create_subscription", {
  customerId: customer.id,
  items: [
    {
      price: "price_premium_catgirl_monthly", // $9.99/month
      quantity: 1,
    },
  ],
  metadata: {
    subscriptionType: "premium_catgirl",
    unlocksCowPowers: true,
  },
});

// Process one-time payment for Divine Cow Crown item
const paymentIntent = await mcpClient.callTool(
  "stripe",
  "create_payment_intent",
  {
    amount: 4999, // $49.99 in cents
    currency: "usd",
    customerId: customer.id,
    metadata: {
      itemId: "divine_cow_crown_001",
      itemName: "Divine Cow Crown",
      rarity: 5,
    },
  }
);

// List all disputes (for gambling refunds)
const disputes = await mcpClient.callTool("stripe", "list_disputes", {
  limit: 50,
  status: "needs_response",
});

// Create refund for invalid gambling result
const refund = await mcpClient.callTool("stripe", "create_refund", {
  paymentIntentId: "pi_xxxxx",
  amount: 1000, // $10.00 in cents
  reason: "requested_by_customer",
  metadata: {
    refundReason: "gambling_glitch",
    gameType: "CowRoulette",
  },
});
```

### Hugging Face MCP Server Usage

```javascript
// Search for catgirl-related ML models
const models = await mcpClient.callTool("huggingface", "model_search", {
  query: "text-to-image anime catgirl",
  filter: {
    task: "text-to-image",
    library: "diffusers",
  },
  limit: 10,
  sort: "downloads",
});

// Find datasets for training catgirl AI
const datasets = await mcpClient.callTool("huggingface", "dataset_search", {
  query: "anime character generation",
  filter: {
    language: "en",
    size: "large",
  },
  limit: 5,
});

// Search research papers on generative AI
const papers = await mcpClient.callTool("huggingface", "paper_search", {
  query: "stable diffusion character generation",
  limit: 20,
});

// Get model details for implementation
const modelInfo = await mcpClient.callTool("huggingface", "hub_repo_details", {
  repoId: "runwayml/stable-diffusion-v1-5",
  repoType: "model",
});
```

### Azure Quantum MCP Server Usage

```javascript
// Submit quantum circuit for gambling entropy generation
const job = await mcpClient.callTool("azure-quantum", "submit_job", {
  workspaceId: process.env.AZURE_QUANTUM_WORKSPACE_ID,
  target: "ionq.simulator",
  program: {
    qsharp: `
      operation GenerateRandomBits() : Result[] {
        use qubits = Qubit[8];
        for q in qubits {
          H(q); // Hadamard gate for superposition
        }
        return ForEach(M, qubits); // Measure all qubits
      }
    `,
  },
  shots: 100,
});

// Check job status
const status = await mcpClient.callTool("azure-quantum", "get_job_status", {
  jobId: job.id,
});

// Retrieve quantum results for true randomness
const results = await mcpClient.callTool("azure-quantum", "get_job_results", {
  jobId: job.id,
});
```

### Microsoft Clarity MCP Server Usage

```javascript
// Fetch session recordings of catgirl gameplay
const sessions = await mcpClient.callTool("clarity", "list_sessions", {
  projectId: process.env.CLARITY_PROJECT_ID,
  filters: {
    urls: ["https://bambisleep.church/catgirl-game"],
    deviceTypes: ["Desktop", "Mobile"],
    startDate: "2025-10-01",
    endDate: "2025-10-31",
  },
  limit: 50,
});

// Get analytics data for user behavior
const analytics = await mcpClient.callTool("clarity", "fetch_analytics", {
  projectId: process.env.CLARITY_PROJECT_ID,
  query: "Show me session duration for users who clicked the cow button",
  timeRange: "last_30_days",
});

// Retrieve heatmap data for UI optimization
const heatmap = await mcpClient.callTool("clarity", "get_heatmap_data", {
  projectId: process.env.CLARITY_PROJECT_ID,
  url: "https://bambisleep.church/inventory",
  type: "click", // or 'scroll', 'move'
});
```

---

## 3️⃣ CI/CD Pipeline Deep Dive (SIBLING REPO)

### GitHub Actions Workflow (.github/workflows/build.yml)

```yaml
name: 🌸 BambiSleep™ CatGirl Build & Deploy

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]
  release:
    types: [published]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: bambisleepchat/bambisleep-church
  UNITY_VERSION: 6000.2.11f1

jobs:
  # Job 1: Validate MCP servers
  validate-mcp:
    name: 🌀 Validate MCP Servers (8/8)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20.x"

      - name: Install dependencies
        run: npm install --no-bin-links

      - name: Run MCP validation script
        run: ./scripts/mcp-validate.sh

      - name: Check MCP server status
        run: npm run mcp:status

  # Job 2: Run tests (currently stubs)
  test:
    name: 💎 Run Tests
    runs-on: ubuntu-latest
    needs: validate-mcp
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20.x"

      - name: Install dependencies
        run: npm install --no-bin-links

      - name: Run test suite
        run: npm test -- --coverage=100
        continue-on-error: true # ⚠️ Tests are stubs currently

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info

  # Job 3: Build container
  build-container:
    name: 🐳 Build Docker Container
    runs-on: ubuntu-latest
    needs: test
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=semver,pattern={{major}}
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push container
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: |
            org.opencontainers.image.title=BambiSleep™ CatGirl Avatar
            org.opencontainers.image.description=Unity 6.2 LTS CatGirl Avatar System
            org.opencontainers.image.version=${{ github.ref_name }}
            org.bambi.unity-version=${{ env.UNITY_VERSION }}
            org.bambi.mcp-servers=8
            org.bambi.cuteness-level=MAXIMUM_OVERDRIVE
            org.bambi.cow-power-status=SECRET_LEVEL_UNLOCKED

  # Job 4: Unity validation
  unity-validation:
    name: 🎮 Validate Unity Project
    runs-on: ubuntu-latest
    needs: build-container
    steps:
      - uses: actions/checkout@v4

      - name: Check Unity version
        run: |
          UNITY_VERSION=$(cat catgirl-avatar-project/ProjectSettings/ProjectVersion.txt | grep -oP 'm_EditorVersion: \K.*')
          echo "Unity version: $UNITY_VERSION"
          if [ "$UNITY_VERSION" != "${{ env.UNITY_VERSION }}" ]; then
            echo "❌ Unity version mismatch!"
            exit 1
          fi

      - name: Validate Packages
        run: |
          cd catgirl-avatar-project
          PACKAGES=$(cat Packages/manifest.json | jq -r '.dependencies | length')
          echo "✅ Found $PACKAGES Unity packages"

      - name: Check for corruption
        run: |
          if [ -d "catgirl-avatar-project/Library" ]; then
            echo "⚠️ Library folder should be gitignored"
            exit 1
          fi

  # Job 5: Deploy
  deploy:
    name: 🚀 Deploy to GHCR
    runs-on: ubuntu-latest
    needs: [build-container, unity-validation]
    if: github.event_name == 'release'
    steps:
      - name: Deploy notification
        run: |
          echo "🌸 Deployed version ${{ github.ref_name }} to GHCR"
          echo "📦 Image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.ref_name }}"

  # Job 6: Quality check
  quality-check:
    name: 🔍 Quality Metrics
    runs-on: ubuntu-latest
    needs: [test, unity-validation]
    steps:
      - uses: actions/checkout@v4

      - name: Run quality check script
        run: ./tools/quality-check.sh

      - name: Generate stats
        run: ./tools/stats.sh

      - name: Check codebase completion
        run: |
          if [ -f "docs/CODEBASE_COMPLETION.md" ]; then
            COMPLETION=$(grep -oP 'Overall Completion: \K[0-9]+' docs/CODEBASE_COMPLETION.md)
            echo "📊 Codebase completion: $COMPLETION%"
          fi

  # Job 7: Summary
  summary:
    name: 📋 Build Summary
    runs-on: ubuntu-latest
    needs:
      [
        validate-mcp,
        test,
        build-container,
        unity-validation,
        deploy,
        quality-check,
      ]
    if: always()
    steps:
      - name: Generate summary
        run: |
          echo "## 🌸 BambiSleep™ Build Summary 🌸" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "- MCP Servers: 8/8 operational ✅" >> $GITHUB_STEP_SUMMARY
          echo "- Tests: ${{ needs.test.result }} ⚠️ (stubs)" >> $GITHUB_STEP_SUMMARY
          echo "- Container: ${{ needs.build-container.result }} 🐳" >> $GITHUB_STEP_SUMMARY
          echo "- Unity: ${{ needs.unity-validation.result }} 🎮" >> $GITHUB_STEP_SUMMARY
          echo "- Deploy: ${{ needs.deploy.result }} 🚀" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Unity Version:** ${{ env.UNITY_VERSION }}" >> $GITHUB_STEP_SUMMARY
          echo "**Image:** \`${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}\`" >> $GITHUB_STEP_SUMMARY
```

**Key Features**:

- **7-stage pipeline** with job dependencies
- **MCP validation first** to ensure tooling works
- **Container semantic versioning** (v1.2.3, v1.2, v1, latest)
- **Custom OCI labels** including cow power status 🐄
- **Unity version enforcement** prevents accidental upgrades
- **Quality metrics** from custom shell scripts
- **GitHub Step Summary** for pretty CI output

### Dockerfile Configuration

```dockerfile
# syntax=docker/dockerfile:1

# Stage 1: Base Node.js image
FROM node:20-alpine AS base
LABEL org.opencontainers.image.source="https://github.com/BambiSleepChat/bambisleep-chat-catgirl"
LABEL org.opencontainers.image.description="BambiSleep™ CatGirl Avatar System"
LABEL org.bambi.unity-version="6000.2.11f1"
LABEL org.bambi.trademark="BambiSleep™ is a trademark of BambiSleepChat"

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Stage 2: Dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --production --no-bin-links

# Stage 3: Development dependencies
FROM base AS dev-deps
COPY package.json package-lock.json ./
RUN npm ci --no-bin-links

# Stage 4: Builder
FROM dev-deps AS builder
COPY . .
RUN npm run build -- --universal

# Stage 5: Runner
FROM base AS runner
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 catgirl

# Copy necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

USER catgirl

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/index.js"]
```

**Key Patterns**:

- **Multi-stage build** reduces final image size (base 150MB → final 80MB)
- **Custom labels** for Bambi metadata tracking
- **Non-root user** (catgirl:1001) for security
- **Health check** every 30s with /health endpoint
- **Production-only deps** in final stage

---

## 4️⃣ Advanced Unity Patterns

### Addressables Asset Management

```csharp
// Assets/Scripts/Utils/AddressableLoader.cs
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class AddressableLoader : MonoBehaviour
{
  // Load catgirl prefab by address
  public async Task<GameObject> LoadCatgirlPrefab(string catgirlId)
  {
    AsyncOperationHandle<GameObject> handle =
      Addressables.LoadAssetAsync<GameObject>($"Catgirl_{catgirlId}");

    await handle.Task;

    if (handle.Status == AsyncOperationStatus.Succeeded) {
      return handle.Result;
    } else {
      Debug.LogError($"Failed to load catgirl: {catgirlId}");
      return null;
    }
  }

  // Load asset catalog from remote CDN
  public async Task UpdateCatalog()
  {
    AsyncOperationHandle<IResourceLocator> handle =
      Addressables.UpdateCatalogs();

    await handle.Task;

    if (handle.Status == AsyncOperationStatus.Succeeded) {
      Debug.Log("✅ Asset catalog updated from CDN");
    }
  }

  // Preload critical assets on scene load
  public async Task PreloadCriticalAssets()
  {
    List<string> criticalAddresses = new List<string> {
      "UI_MainMenu",
      "UI_InventoryPanel",
      "Audio_BackgroundMusic",
      "VFX_PinkSparkles"
    };

    AsyncOperationHandle handle =
      Addressables.LoadAssetsAsync<GameObject>(criticalAddresses, null);

    await handle.Task;
    Debug.Log($"✅ Preloaded {criticalAddresses.Count} critical assets");
  }

  // Release loaded assets to free memory
  public void UnloadCatgirl(GameObject catgirlInstance)
  {
    Addressables.ReleaseInstance(catgirlInstance);
  }
}
```

**Benefits**:

- **Remote asset delivery** from CDN (reduces initial download)
- **Async loading** prevents frame drops
- **Memory management** via explicit release
- **Hot-update capability** without rebuilding app

### Visual Effect Graph (VFX Graph)

```csharp
// Assets/Scripts/VFX/PinkSparkleController.cs
using UnityEngine.VFX;

public class PinkSparkleController : MonoBehaviour
{
  [Header("🌸 VFX Configuration")]
  public VisualEffect sparkleEffect;
  public float baseSpawnRate = 100.0f;
  public Color pinkColor = new Color(1.0f, 0.5f, 0.9f);

  private void Start()
  {
    // Configure VFX Graph properties
    sparkleEffect.SetFloat("SpawnRate", baseSpawnRate);
    sparkleEffect.SetVector4("TintColor", pinkColor);
    sparkleEffect.SetFloat("Lifetime", 2.0f);
  }

  public void TriggerCowPowerExplosion()
  {
    // Burst event for dramatic effect
    sparkleEffect.SendEvent("OnCowPowerActivated");

    // Temporarily increase spawn rate
    StartCoroutine(SpawnRateBurst());
  }

  private IEnumerator SpawnRateBurst()
  {
    float originalRate = baseSpawnRate;
    sparkleEffect.SetFloat("SpawnRate", originalRate * 10.0f);

    yield return new WaitForSeconds(2.0f);

    sparkleEffect.SetFloat("SpawnRate", originalRate);
  }

  // Dynamic color based on pink intensity
  public void UpdatePinkIntensity(float intensity)
  {
    Color adjustedColor = Color.Lerp(Color.white, pinkColor, intensity);
    sparkleEffect.SetVector4("TintColor", adjustedColor);
  }
}
```

**VFX Graph Features**:

- **GPU-accelerated** particle systems (10x faster than legacy)
- **Event system** for triggered effects
- **Visual scripting** in VFX Graph editor
- **Dynamic properties** via C# API

### Timeline & Cinemachine Integration

```csharp
// Assets/Scripts/Cutscenes/CutsceneManager.cs
using UnityEngine.Playables;
using Cinemachine;

public class CutsceneManager : MonoBehaviour
{
  [Header("🎬 Cutscene Configuration")]
  public PlayableDirector timelineDirector;
  public CinemachineVirtualCamera[] cutsceneCameras;

  private PlayableAsset currentCutscene;

  public void PlayCutscene(string cutsceneName)
  {
    // Load timeline asset
    currentCutscene = Resources.Load<PlayableAsset>($"Cutscenes/{cutsceneName}");
    timelineDirector.playableAsset = currentCutscene;

    // Bind catgirl character to timeline
    var catgirl = FindObjectOfType<CatgirlController>();
    foreach (var binding in timelineDirector.playableAsset.outputs) {
      if (binding.streamName == "CatgirlTrack") {
        timelineDirector.SetGenericBinding(binding.sourceObject, catgirl);
      }
    }

    // Activate cutscene camera
    ActivateCutsceneCamera(0);

    // Play timeline
    timelineDirector.Play();

    // Register completion callback
    timelineDirector.stopped += OnCutsceneFinished;
  }

  private void ActivateCutsceneCamera(int index)
  {
    for (int i = 0; i < cutsceneCameras.Length; i++) {
      cutsceneCameras[i].Priority = (i == index) ? 100 : 0;
    }
  }

  private void OnCutsceneFinished(PlayableDirector director)
  {
    // Restore gameplay camera
    ActivateCutsceneCamera(-1);

    // Return control to player
    var catgirl = FindObjectOfType<CatgirlController>();
    catgirl.EnablePlayerControl(true);

    timelineDirector.stopped -= OnCutsceneFinished;
  }

  // Skip cutscene with input
  private void Update()
  {
    if (Input.GetKeyDown(KeyCode.Escape) && timelineDirector.state == PlayState.Playing) {
      timelineDirector.time = timelineDirector.duration; // Jump to end
    }
  }
}
```

**Timeline Features**:

- **Animation tracks** for character movement
- **Audio tracks** for synchronized music
- **Cinemachine tracks** for camera control
- **Activation tracks** for enabling/disabling GameObjects
- **Signal tracks** for triggering C# methods

### Animation Rigging (Procedural Animation)

```csharp
// Assets/Scripts/Animation/CatgirlIKController.cs
using UnityEngine.Animations.Rigging;

public class CatgirlIKController : MonoBehaviour
{
  [Header("🐱 IK Configuration")]
  public TwoBoneIKConstraint leftHandIK;
  public TwoBoneIKConstraint rightHandIK;
  public TwoBoneIKConstraint leftFootIK;
  public TwoBoneIKConstraint rightFootIK;
  public MultiAimConstraint headLookAt;

  [Header("🎯 Look At Targets")]
  public Transform currentLookTarget;
  public float lookAtSpeed = 5.0f;

  private void Update()
  {
    // Smooth head look-at
    if (currentLookTarget != null) {
      float weight = Mathf.Lerp(
        headLookAt.weight,
        1.0f,
        Time.deltaTime * lookAtSpeed
      );
      headLookAt.weight = weight;
    }
  }

  // Enable hand IK for grabbing objects
  public void EnableHandIK(bool left, Transform target)
  {
    TwoBoneIKConstraint handIK = left ? leftHandIK : rightHandIK;

    handIK.data.target = target;
    handIK.weight = 1.0f;
  }

  // Disable IK when not needed
  public void DisableHandIK(bool left)
  {
    TwoBoneIKConstraint handIK = left ? leftHandIK : rightHandIK;
    handIK.weight = 0.0f;
  }

  // Foot IK for uneven terrain
  public void UpdateFootIK(bool grounded)
  {
    float targetWeight = grounded ? 1.0f : 0.0f;
    leftFootIK.weight = Mathf.Lerp(leftFootIK.weight, targetWeight, Time.deltaTime * 5.0f);
    rightFootIK.weight = Mathf.Lerp(rightFootIK.weight, targetWeight, Time.deltaTime * 5.0f);
  }

  // Set look target (e.g., another player)
  public void SetLookTarget(Transform target)
  {
    currentLookTarget = target;

    // Update MultiAimConstraint source
    var sourceObjects = headLookAt.data.sourceObjects;
    sourceObjects.SetTransform(0, target);
    headLookAt.data.sourceObjects = sourceObjects;
  }
}
```

**Animation Rigging Benefits**:

- **Procedural IK** adapts to environment
- **Head tracking** for natural interactions
- **Grab animations** without animator states
- **Foot placement** on uneven terrain

### XR Interaction Toolkit Patterns

```csharp
// Assets/Scripts/XR/XRCatgirlInteraction.cs
using UnityEngine.XR.Interaction.Toolkit;

public class XRCatgirlInteraction : MonoBehaviour
{
  [Header("👐 Hand Tracking")]
  public XRHandTrackingProvider handProvider;
  public Animator catgirlAnimator;

  [Header("🎮 Controllers")]
  public ActionBasedController leftController;
  public ActionBasedController rightController;

  // Pet catgirl with hand tracking
  private void Update()
  {
    if (handProvider.isTracking) {
      Vector3 rightHandPos = handProvider.GetJointPosition(XRHandJointID.Palm, Handedness.Right);

      // Check if hand is near catgirl head
      Vector3 headPos = catgirlAnimator.GetBoneTransform(HumanBodyBones.Head).position;
      float distance = Vector3.Distance(rightHandPos, headPos);

      if (distance < 0.2f) {
        TriggerPurring();
      }
    }
  }

  private void TriggerPurring()
  {
    catgirlAnimator.SetBool("IsPurring", true);

    // Haptic feedback
    leftController.SendHapticImpulse(0.5f, 0.2f);
    rightController.SendHapticImpulse(0.5f, 0.2f);

    // Audio
    AudioManager.Instance.PlayRandomPurr(transform.position);
  }

  // Teleport locomotion
  public void OnTeleportRequest(Vector3 targetPosition)
  {
    var catgirl = GetComponent<CatgirlController>();
    catgirl.TeleportTo(targetPosition);

    // VFX at teleport location
    Instantiate(teleportVFXPrefab, targetPosition, Quaternion.identity);
  }

  // Grab interaction for inventory items
  public void OnItemGrabbed(SelectEnterEventArgs args)
  {
    XRGrabInteractable item = args.interactableObject as XRGrabInteractable;

    if (item.CompareTag("InventoryItem")) {
      var itemData = item.GetComponent<ItemData>();
      inventorySystem.AddItem(itemData.catgirlItem);

      // Destroy physical item after pickup
      Destroy(item.gameObject);
    }
  }
}
```

**XR Features**:

- **Hand tracking** for natural interactions
- **Haptic feedback** for immersion
- **Teleport locomotion** for comfort
- **Grab interactions** for inventory
- **Gaze tracking** with eye tracking API
