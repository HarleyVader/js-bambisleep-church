# BambiSleep™ Church - AI Agent Instructions

_🌸 MCP Control Tower & Unity Cathedral Renderer Integration 🌸_

## Project Overview

This is a **triple-platform development environment** with integrated Node.js/Unity communication:

- **MCP Control Tower** - Node.js enterprise-grade orchestration platform managing 8 MCP servers for AI tooling integration
- **Unity Bridge Service** - Node.js IPC bridge managing Unity renderer processes via stdin/stdout JSON protocol
- **Unity Cathedral Renderer** - C# procedural Neon Cyber Goth cathedral visualization with XR support

**Critical Understanding**: This project follows the "Universal Machine Philosophy" with emoji-driven development workflows and **100% test coverage enforcement** via Jest.

**Current State - FULLY OPERATIONAL**:

- ✅ **8/8 MCP servers configured** in `.vscode/settings.json` (filesystem, git, github, mongodb, stripe, huggingface, azure-quantum, clarity)
- ✅ **Source code implemented**: `src/mcp/orchestrator.js` (472 lines, 29 methods), `src/utils/logger.js` (237 lines), `src/index.js` (277 lines), `src/unity/unity-bridge.js` (259 lines)
- ✅ **Unity integration active**: C# script `CathedralRenderer.cs` (684 lines) with JSON IPC protocol documented in `public/docs/UNITY_IPC_PROTOCOL.md` (432 lines)
- ✅ **100% test coverage achieved**: `src/tests/mcp/orchestrator.test.js` (605 lines, comprehensive mocking), `src/tests/utils/logger.test.js`
- ✅ **All npm scripts functional**: Use directly (`npm test`, `npm run dev`) or via VS Code tasks (`Ctrl+Shift+P` → "Run Task")
- 🚧 **UI dashboard pending**: `src/ui/` directory empty, ready for MCP status dashboard implementation

_Complete philosophy in `public/docs/RELIGULOUS_MANTRA.md`, CatGirl avatar specs in `public/docs/CATGIRL.md`, Unity IPC protocol in `public/docs/UNITY_IPC_PROTOCOL.md`_

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
("server:registered", "server:unregistered");
("server:starting", "server:started", "server:stopping", "server:stopped");
("server:error", "server:restarting", "server:unhealthy");
("server:output"); // Emits {name, type: 'stdout'|'stderr', data}
("orchestrator:started", "orchestrator:stopped");
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
  level: "INFO", // or process.env.LOG_LEVEL
  logFile: "/path/to/log", // or process.env.LOG_FILE
  enableConsole: true, // default
  enableFile: true, // requires logFile
  jsonFormat: false, // default: human-readable
  includeTimestamp: true, // ISO 8601 timestamps
  includeContext: true, // merge context objects
  context: { component: "MCPOrchestrator" }, // persistent context
});
```

**Usage Pattern in codebase**:

```javascript
const Logger = require("./utils/logger");
const logger = new Logger({ context: { component: "MCPOrchestrator" } });
logger.info("Server started", { pid: 12345, name: "github" });
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

**Advanced IPC Testing Patterns**:

```javascript
// Testing Unity Bridge IPC with mock process streams
describe("UnityBridge IPC", () => {
  it("should handle JSON messages from Unity stdout", (done) => {
    const unityBridge = new UnityBridge({ unityPath: "/mock/unity" });

    unityBridge.on("scene:initialized", (data) => {
      expect(data.sceneName).toBe("MainScene");
      expect(data.fps).toBe(60);
      done();
    });

    // Simulate Unity sending JSON via stdout
    const message = JSON.stringify({
      type: "sceneInitialized",
      data: { sceneName: "MainScene", fps: 60 },
    });
    mockProcess.stdout.emit("data", Buffer.from(message + "\n"));
  });

  it("should send messages to Unity via stdin", async () => {
    const unityBridge = new UnityBridge({ unityPath: "/mock/unity" });
    await unityBridge.startRenderer();

    const mockWrite = jest.fn();
    mockProcess.stdin = { write: mockWrite };

    unityBridge.sendMessage({
      type: "updateStyle",
      data: { pinkIntensity: 0.95 },
    });

    expect(mockWrite).toHaveBeenCalledWith(
      expect.stringContaining('"type":"updateStyle"')
    );
  });
});

// Testing health check intervals with fake timers
describe("Health Monitoring", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should check server health at configured interval", async () => {
    const orchestrator = new MCPOrchestrator({ healthCheckInterval: 30000 });
    orchestrator.registerServer("test-server", { command: "node" });
    await orchestrator.startServer("test-server");

    const healthSpy = jest.spyOn(orchestrator, "checkServerHealth");
    orchestrator.startHealthChecks();

    // Fast-forward 30 seconds
    jest.advanceTimersByTime(30000);
    expect(healthSpy).toHaveBeenCalledWith("test-server");

    // Fast-forward another 30 seconds
    jest.advanceTimersByTime(30000);
    expect(healthSpy).toHaveBeenCalledTimes(2);
  });
});

// Testing graceful shutdown with SIGTERM timeout
describe("Graceful Shutdown", () => {
  it("should send SIGTERM and wait before SIGKILL", async () => {
    const orchestrator = new MCPOrchestrator({ stopTimeout: 5000 });
    orchestrator.registerServer("test-server", { command: "node" });
    await orchestrator.startServer("test-server");

    const stopPromise = orchestrator.stopServer("test-server");

    // Verify SIGTERM sent
    expect(mockProcess.kill).toHaveBeenCalledWith("SIGTERM");

    // Simulate process not exiting within timeout
    jest.advanceTimersByTime(5000);

    // Should force SIGKILL after timeout
    expect(mockProcess.kill).toHaveBeenCalledWith("SIGKILL");

    // Simulate process exit
    mockProcess.emit("exit", 0);
    await stopPromise;
  });
});
```

**Coverage Strategies for 100% Branch Coverage**:

1. **Test Both Success and Failure Paths**: Every if/else, try/catch must have tests for both branches
2. **Test Boundary Conditions**: Empty arrays, null values, max/min integers
3. **Test Async Timing**: Promises resolving/rejecting, event emission before/after listeners attached
4. **Test Error Recovery**: Auto-restart logic, retry attempts, fallback configurations
5. **Test State Transitions**: All 6 server states (STOPPED → STARTING → RUNNING → STOPPING → ERROR → UNREACHABLE)

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

## Unity Bridge IPC Architecture

### Node.js ↔ Unity Communication Pattern

**Location**: `src/unity/unity-bridge.js` (259 lines), `CathedralRenderer.cs` (684 lines)
**Protocol**: Bidirectional JSON messages via stdin/stdout streams (documented in `public/docs/UNITY_IPC_PROTOCOL.md`)

**Unity Process Lifecycle** (UnityBridge class):

```javascript
// Start Unity in headless batch mode
const args = [
  "-batchmode",
  "-nographics",
  "-projectPath",
  this.projectPath,
  "-executeMethod",
  "CathedralRenderer.StartServer",
  "-logFile",
  "Logs/unity-renderer.log",
  "-rendererType",
  "cathedral",
  "-sceneConfig",
  JSON.stringify(sceneConfig),
];
this.rendererProcess = spawn(this.unityPath, args);
```

**Message Protocol Examples**:

```javascript
// Node.js → Unity: Initialize scene
{
  "type": "initialize",
  "timestamp": "2024-01-15T12:34:56.789Z",
  "data": {
    "sceneName": "MainScene",
    "style": "neon-cyber-goth",
    "pinkIntensity": 0.8,
    "eldritchLevel": 666
  }
}

// Unity → Node.js: Render frame complete
{
  "type": "frameRendered",
  "timestamp": "2024-01-15T12:34:57.890Z",
  "data": {
    "frameNumber": 1234,
    "fps": 60,
    "triangles": 150000
  }
}
```

**Event Integration**: Unity lifecycle events forwarded to MCP orchestrator via `UnityBridge` EventEmitter:

```javascript
unityBridge.on("scene:initialized", (data) => {
  orchestrator.emit("unity:scene:ready", data);
});
```

**Critical Pattern**: Unity runs as child process managed by Node.js, not separate service. Graceful shutdown required via SIGTERM before killing process.

### Unity CathedralStyle Configuration System

**Location**: `CathedralRenderer.cs` lines 20-57
**Design**: Serializable configuration class for procedural architecture generation

**Core Parameters**:

```csharp
[System.Serializable]
public class CathedralStyle {
  // Visual Style (lines 24-27)
  public string style = "neon-cyber-goth";
  public string lighting = "electro-nuclear";
  public bool catholicVibes = true;

  // Pink Intensity (0.0-1.0) - Controls neon magenta saturation (line 29-30)
  [Range(0f, 1f)]
  public float pinkIntensity = 0.8f;

  // Eldritch Level (0-1000) - Procedural complexity multiplier (lines 32-33)
  [Range(0, 1000)]
  public int eldritchLevel = 666;

  // Architectural Parameters (lines 35-40)
  public float heightMultiplier = 50f;   // Cathedral height scaling
  public float naveWidth = 20f;          // Main hall width in Unity units
  public int archCount = 12;             // Number of gothic arches
  public bool hasRosettaWindow = true;   // Enable rose window geometry
  public bool hasFlyingButtresses = true; // External support structures

  // Neon Effects (lines 42-46)
  public Color primaryNeonColor = Color.magenta;
  public Color secondaryNeonColor = Color.cyan;
  public float neonIntensity = 10f;      // HDR emission multiplier
  public float neonFlickerSpeed = 0.5f;  // Animation speed for flicker effect

  // Nuclear Glow (lines 48-52)
  public Color nuclearGlowColor = new Color(0f, 1f, 0.5f, 1f); // Cyan-green
  public float nuclearPulseSpeed = 2f;   // Pulse animation frequency
  public float radiationIntensity = 5f;  // Particle emission rate
}
```

**Procedural Generation Logic** (`GenerateCathedral()` method, lines 92-98):

1. `GenerateNave()` - Creates main cathedral hall with archCount gothic arches
2. `GenerateTransept()` - Adds cross-section perpendicular to nave
3. `GenerateAltarArea()` - Procedural altar with neon lighting
4. `GenerateRosettaWindow()` - Circular stained glass if hasRosettaWindow enabled
5. `GenerateFlyingButtresses()` - External supports if hasFlyingButtresses enabled
6. `ApplyNeonMaterials()` - Applies HDR materials with pinkIntensity and neonIntensity
7. `SetupLighting()` - Configures electro-nuclear lighting with nuclearGlowColor

**IPC Integration**: Node.js can update CathedralStyle at runtime via "updateStyle" message type:

```javascript
// Node.js sends style update to Unity
unityBridge.sendMessage({
  type: "updateStyle",
  data: {
    pinkIntensity: 0.95,
    eldritchLevel: 777,
    neonFlickerSpeed: 1.2,
  },
});
```

### Unity IPC Message Types (Complete Reference)

**Node.js → Unity (Commands)** - All messages use JSON format via stdin:

```javascript
// 1. Initialize Scene
{
  type: "initialize",
  timestamp: "2024-01-15T12:34:56.789Z",
  data: {
    sceneName: "MainScene",
    style: "neon-cyber-goth",
    pinkIntensity: 0.8,
    eldritchLevel: 666,
    catholicVibes: true
  }
}

// 2. Update Visual Style (runtime configuration)
{
  type: "updateStyle",
  data: {
    pinkIntensity: 0.95,           // 0.0-1.0 range
    eldritchLevel: 777,            // 0-1000 complexity
    neonFlickerSpeed: 1.2,         // Animation speed
    nuclearPulseSpeed: 2.5         // Glow animation
  }
}

// 3. Camera Control
{
  type: "setCameraPosition",
  data: {
    position: { x: 0, y: 10, z: -20 },
    rotation: { x: 15, y: 0, z: 0 },
    fov: 60
  }
}

// 4. Capture Screenshot
{
  type: "captureScreenshot",
  data: {
    width: 1920,
    height: 1080,
    filename: "cathedral_render.png"
  }
}

// 5. Pause/Resume Rendering
{
  type: "setPaused",
  data: { paused: true }
}

// 6. Shutdown Command
{
  type: "shutdown",
  data: { graceful: true }
}
```

**Unity → Node.js (Status Reports)** - All messages sent via stdout:

```javascript
// 1. Scene Initialized
{
  type: "sceneInitialized",
  timestamp: "2024-01-15T12:34:57.890Z",
  data: {
    sceneName: "MainScene",
    fps: 60,
    renderer: "Universal Render Pipeline",
    triangles: 150000
  }
}

// 2. Frame Rendered (periodic updates)
{
  type: "frameRendered",
  data: {
    frameNumber: 1234,
    fps: 60,
    renderTime: 16.67,  // milliseconds
    triangles: 150000
  }
}

// 3. Style Updated (confirmation)
{
  type: "styleUpdated",
  data: {
    pinkIntensity: 0.95,
    eldritchLevel: 777,
    success: true
  }
}

// 4. Screenshot Captured
{
  type: "screenshotCaptured",
  data: {
    filename: "cathedral_render.png",
    path: "/absolute/path/to/file.png",
    width: 1920,
    height: 1080
  }
}

// 5. Error Report
{
  type: "error",
  data: {
    message: "Failed to load material",
    stack: "UnityEngine.Material...",
    severity: "warning"
  }
}

// 6. Shutdown Complete
{
  type: "shutdownComplete",
  data: {
    totalFrames: 5000,
    uptime: 300000  // milliseconds
  }
}
```

**IPC Error Handling Pattern**:

```javascript
// In UnityBridge class (src/unity/unity-bridge.js)
this.rendererProcess.stdout.on("data", (data) => {
  try {
    const messages = data.toString().split("\n").filter(Boolean);
    messages.forEach((msg) => {
      const parsed = JSON.parse(msg);

      // Emit typed event based on message type
      this.emit(`unity:${parsed.type}`, parsed.data);

      // Handle errors
      if (parsed.type === "error") {
        logger.error("Unity error", parsed.data);
      }
    });
  } catch (error) {
    logger.error("Failed to parse Unity message", {
      error,
      data: data.toString(),
    });
  }
});
```

## Dual-Platform Architecture

### Node.js MCP Control Tower

**Current State**: Fully operational with 8/8 MCP servers

- ✅ `src/mcp/orchestrator.js` - EventEmitter-based process manager (472 lines)
- ✅ `src/utils/logger.js` - Multi-level structured logging (237 lines)
- ✅ `src/index.js` - Main entry point with conditional server registration (277 lines)
- ✅ `src/unity/unity-bridge.js` - Unity process management via IPC (259 lines)
- 🚧 `src/ui/` - Directory empty, ready for MCP dashboard implementation
- ✅ All npm scripts functional (dev, test, start, lint:fix, format, mcp:status, docs)

**Key Workflows**:

```bash
npm run dev          # Development with nodemon auto-reload
npm test             # Jest with 100% coverage enforcement
npm run mcp:status   # Check operational status of all 8 MCP servers
```

### Unity Cathedral Renderer

**Specifications**: Complete 683-line spec in `public/docs/CATGIRL.md`

- Unity 6.2 LTS with Universal Render Pipeline
- Procedural gothic architecture with HDR neon materials
- Post-processing: Bloom (3.0), chromatic aberration (0.3), vignette (0.4)
- JSON IPC protocol documented in `UNITY_IPC_PROTOCOL.md` (432 lines)
- Separate project in `unity-projects/cathedral-renderer/`
- Setup guide: `public/docs/UNITY_SETUP_GUIDE.md`

**Unity C# Architecture** (`CathedralRenderer.cs`, 684 lines):

- `CathedralStyle` class: Configuration with pink intensity (0-1), eldritch level (0-1000), neon colors
- `CathedralRenderer` MonoBehaviour: Procedural geometry generation, IPC command listener
- Batch mode support: Detects `Application.isBatchMode` for headless rendering
- Command listener coroutine: Reads stdin JSON messages, executes Unity operations

### VS Code Integration Patterns

**MCP Servers**: Auto-register in AI assistant when added to `.vscode/settings.json`
**Tasks**: Use emoji-prefixed tasks (🌸, 💎, 🌀) instead of npm scripts
**Problem Matchers**: ESLint integration via `$eslint-stylish`
**Zero-Config**: No default formatter set (intentional design choice)

## MCP Server Configuration Guide

### All 8 Servers Configured (Operational Status: 8/8)

All MCP servers are configured in `.vscode/settings.json` and conditionally loaded in `src/index.js` based on environment variables:

```javascript
// Core servers (no authentication required)
const MCP_SERVERS = {
  filesystem: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", workspacePath],
  },
  git: {
    command: "npx",
    args: [
      "-y",
      "@modelcontextprotocol/server-git",
      "--repository",
      workspacePath,
    ],
  },
  github: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
  },
};

// Optional servers (conditional loading in src/index.js lines 46-77)
if (process.env.MONGODB_CONNECTION_STRING) {
  /* add mongodb */
}
if (process.env.STRIPE_SECRET_KEY) {
  /* add stripe */
}
if (process.env.HUGGINGFACE_HUB_TOKEN) {
  /* add huggingface */
}
if (process.env.AZURE_QUANTUM_WORKSPACE_ID) {
  /* add azure-quantum */
}
if (process.env.CLARITY_PROJECT_ID) {
  /* add clarity */
}
```

**Environment Variables Required** (see `.env.example`):

- `GITHUB_TOKEN` - Required for github server operations
- `MONGODB_CONNECTION_STRING` - Default: `mongodb://localhost:27017`
- `STRIPE_SECRET_KEY` - Required for stripe server (payment processing)
- `HUGGINGFACE_HUB_TOKEN` - Required for huggingface server (AI/ML models)
- `AZURE_QUANTUM_WORKSPACE_ID` - Required for azure-quantum server
- `CLARITY_PROJECT_ID` - Required for clarity server (analytics)

**Environment Variable Security Patterns**:

```javascript
// Pattern 1: Conditional server loading (src/index.js lines 46-77)
// Servers only register if credentials exist - fail-safe deployment
if (process.env.STRIPE_SECRET_KEY) {
  MCP_SERVERS.stripe = {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-stripe"],
  };
} // No error thrown if key missing - graceful degradation

// Pattern 2: Default values for optional services
const MONGODB_URI =
  process.env.MONGODB_CONNECTION_STRING || "mongodb://localhost:27017";

// Pattern 3: VS Code reload required after .env changes
// Environment variables loaded at VS Code startup via dotenv
// Must reload window (Ctrl+Shift+P → "Reload Window") after editing .env
```

**Secret Management Best Practices**:

1. **Never commit `.env`** - Only commit `.env.example` with placeholder values
2. **Use .gitignore** - `.env` already ignored in project root
3. **Reload VS Code Window** - Required after adding/modifying environment variables
4. **Test with Minimal Keys** - Core servers (filesystem, git, github) work without API keys
5. **Verify Server Status** - Run `npm run mcp:status` to check which servers are operational
6. **Rotate Secrets Regularly** - Especially production keys (Stripe, Azure)
7. **Use Different Keys per Environment** - Dev vs staging vs production credentials

**Debugging Environment Issues**:

```bash
# Check if environment variables are loaded
node -e "console.log(process.env.GITHUB_TOKEN ? 'GitHub token loaded' : 'Missing')"

# Verify MCP server can start
npx -y @modelcontextprotocol/server-github

# Check VS Code MCP extension logs
# View → Output → Select "MCP" from dropdown
```

**Adding New MCP Servers**:

1. Add to `.vscode/settings.json` for VS Code AI assistant integration
2. Add conditional loading in `src/index.js` (follow existing pattern)
3. Add environment variable to `.env.example` with documentation
4. Register server in main initialization loop (`src/index.js` lines 90-92)

### Unity Development Patterns

**Architecture**: Component-based procedural generation with Unity 6.2 URP
**Key Systems**: Neon lighting, post-processing stack, JSON IPC communication
**Implementation**: Separate Unity project in `unity-projects/cathedral-renderer/`
**IPC Protocol**: Documented in `public/docs/UNITY_IPC_PROTOCOL.md` (432 lines)

## Development Workflows

### Adding New MCP Servers

**Pattern**: All servers conditionally loaded in `src/index.js` based on environment variables:

```javascript
// Add to MCP_SERVERS object (lines 46-77 in src/index.js)
if (process.env.NEW_SERVER_API_KEY) {
  MCP_SERVERS["new-server"] = {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-new-server"],
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

### VS Code Tasks & Debugging Patterns

**Task Execution** (`.vscode/tasks.json` - 9 emoji-prefixed tasks):

```bash
# Method 1: VS Code Command Palette (Recommended)
Ctrl+Shift+P → "Tasks: Run Task" → Select task

# Method 2: Direct npm scripts (if tasks unavailable)
npm run dev          # Start with nodemon auto-reload
npm test             # Jest with 100% coverage enforcement
npm run mcp:status   # Check MCP server operational status
```

**Available Tasks**:

1. **🌸 Start Control Tower (Dev)** - `npm run dev` with nodemon auto-reload
2. **💎 Run Tests (100% Coverage)** - `npm test` with coverage enforcement
3. **🌀 Check MCP Server Status** - `npm run mcp:status` to verify 8/8 operational
4. **📚 Start Documentation Server** - `npm run docs` on port 4000
5. **🚀 Start Production Server** - `npm start` on port 3000
6. **🧹 Lint & Fix Code** - `npm run lint:fix` with ESLint auto-fix
7. **💅 Format Code (Prettier)** - `npm run format` for all JS files
8. **🔍 Test Watch Mode** - `npm run test:watch` for continuous development
9. **🏗️ Build Production** - `npm run build` (tests + docs)

**Problem Matchers**: All tasks configured with `$eslint-stylish` for automatic error detection in Problems panel.

**Debugging Configuration** (`.vscode/launch.json`):

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug MCP Control Tower",
  "program": "${workspaceFolder}/src/index.js",
  "envFile": "${workspaceFolder}/.env",
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

**Debugging Workflows**:

1. **MCP Orchestrator**: Set breakpoints in `src/mcp/orchestrator.js`, debug spawn() calls and event emission
2. **Unity Bridge**: Debug IPC message parsing in `src/unity/unity-bridge.js` stdout/stdin handlers
3. **Logger Output**: Check `logs/` directory for file-based logs (if `LOG_FILE` env var set)
4. **VS Code Output Panel**: View → Output → Select "MCP" for MCP extension diagnostics

**Task Problem Matcher Example**:

```json
"problemMatcher": ["$eslint-stylish"],
"presentation": {
  "reveal": "always",
  "panel": "dedicated"
}
```

This automatically parses ESLint output and populates VS Code's Problems panel with clickable errors.

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
├── unity/unity-bridge.js    # 259 lines, Unity process management via IPC
└── index.js                 # 277 lines, main entry with conditional MCP registration

public/docs/
├── RELIGULOUS_MANTRA.md     # Development philosophy & emoji mappings
├── MCP_SETUP_GUIDE.md       # Complete 8-server setup instructions
├── CATGIRL.md               # Unity avatar specs (separate project)
└── UNITY_IPC_PROTOCOL.md    # JSON IPC protocol documentation (432 lines)

unity-projects/cathedral-renderer/
├── Assets/Scripts/CathedralRenderer.cs    # 684 lines, procedural cathedral generation
└── Assets/Scenes/MainScene.unity          # Cathedral scene configuration

.vscode/settings.json        # Lines 116-169: MCP server registry (8/8 configured)
package.json                 # Lines 53-74: Jest config with 100% coverage thresholds
```

### Unity CatGirl Avatar System (Separate Project)

**Specifications**: Complete 683-line spec in `public/docs/CATGIRL.md`

- Unity 6.2 LTS with XR Interaction Toolkit
- Eye/hand tracking, RPG inventory, multi-currency economy
- Setup guide: `public/docs/UNITY_SETUP_GUIDE.md`
- **Important**: Separate Unity project, not in this Node.js codebase
