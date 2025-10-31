# BambiSleep™ Church - AI Agent Instructions

## Architecture
MCP Control Tower: 8 servers + Unity renderer. EventEmitter lifecycle, 100% test coverage enforced.
**3-layer**: Control Tower (`src/index.js`) → Orchestrator (`src/mcp/orchestrator.js`, 29 methods) → Zathras Agent (`src/agents/ZathrasAgent.js`, 20+ servers). Core: Orchestrator, Unity Bridge, Cathedral MCP, Logger.
**Org**: BambiSleepChat - use "BambiSleep™" in user text.

## Critical Patterns

### WSL2: `npm install --no-bin-links` (REQUIRED)
All scripts: `node node_modules/[tool]/bin/[tool].js` (no symlinks)

### 100% Test Coverage ENFORCED
Jest fails <100% branches/functions/lines. Mock child_process: `mockProcess = new EventEmitter(); mockProcess.pid=12345; mockProcess.stdout/stderr = new EventEmitter(); spawn.mockReturnValue(mockProcess)`. Test ALL branches. Use `jest.useFakeTimers()`.

### MCP Servers
Core (always): filesystem, git, github. Optional (env vars): mongodb, stripe, huggingface, azure-quantum, clarity, cathedral (`src/index.js:46-83`). After `.env` edit: reload window.
**Custom** (cathedral): `type:'custom'`, local script. **Registry**: `npx -y @modelcontextprotocol/server-*`.

### Events
Emit success/failure: `this.emit("server:started",{name,server})` / `this.emit("server:error",{name,error})`. Test both paths.
Logger: `new Logger({context:{component:'X'}})` merges context.
Events: `server:registered|started|stopped|error|restarting|health-check|health-check:complete|shutdown:complete`

### STDIO Protocol
**NEVER** `console.log()` in `src/mcp/cathedral-server.js` - use `process.stderr.write(JSON.stringify({level,message})+"\n")`

### Unity IPC
JSON stdin/stdout: `{type:"updateStyle",data:{...}}`. See `public/docs/UNITY_IPC_PROTOCOL.md`.

### ZathrasAgent
Init: Load `.vscode/settings.json` (JSONC) → register servers → start Unity if enabled → execute workflows (max 50 steps).
States: `pending|running|completed|failed|cancelled`

## Dev

### Commands
```bash
npm run dev        # Auto-reload (Ctrl+Shift+B)
npm test           # Fails <100%
npm run mcp:status # Check 8/8
```

### Commits
`🌸` packages, `👑` architecture, `💎` tests, `✨` servers. See `RELIGULOUS_MANTRA.md`.

### Logger
```js
const logger = new Logger({level:"INFO",context:{component:"X"}});
logger.info("msg",{meta});
```

## Files
- `src/index.js` (288L) - entry
- `src/mcp/orchestrator.js` (472L) - 29 methods
- `src/mcp/cathedral-server.js` (~350L) - JSON-RPC 2.0
- `src/tests/mcp/orchestrator.test.js` (605L) - test patterns
- `.vscode/settings.json` (116-169) - MCP registry
- `package.json` (53-74) - Jest thresholds
- `jest.setup.js` - 10s timeout

## Refs
`docs/DEVELOPMENT.md`, `public/docs/UNITY_SETUP_GUIDE.md`, `docs/CATHEDRAL_MCP_SERVER_REGISTRATION.md`, `public/docs/UNITY_IPC_PROTOCOL.md`
