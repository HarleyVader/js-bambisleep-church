# Contributing to BambiSleep™ Church MCP Control Tower

🌸 Thank you for contributing to the Universal Machine Philosophy! 🌸

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥20.0.0 (LTS)
- **npm** ≥10.0.0
- **VS Code** recommended (MCP extension support)
- **WSL2** if on Windows (see WSL2 Setup below)

### Installation

```bash
git clone https://github.com/BambiSleepChat/bambisleep-church.git
cd bambisleep-church

# IMPORTANT: Use --no-bin-links on WSL2 to avoid symlink issues
npm install --no-bin-links

# Copy environment template
cp .env.example .env
# Edit .env with your API keys
```

## 🐧 WSL2 Setup (Windows Users)

### The Symlink Issue
WSL2 cannot create symlinks on Windows filesystem mounts (/mnt/c, /mnt/f, etc.) without special permissions. This affects npm's bin-link creation.

### Solution: Always use --no-bin-links

```bash
npm install --no-bin-links
```

All npm scripts in `package.json` are configured to use direct paths to node_modules binaries, so they work correctly with --no-bin-links.

### Alternative: Move Project to WSL Filesystem
```bash
# Instead of /mnt/f/project, use:
cp -r /mnt/f/js-bambisleep-church ~/projects/bambisleep-church
cd ~/projects/bambisleep-church
npm install  # No --no-bin-links needed
```

## 🧪 Testing

### Run All Tests
```bash
npm test  # Includes coverage, verbose output, auto-exits
```

### Quick Test (No Coverage)
```bash
npm run test:quick
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### Test Individual File
```bash
node node_modules/jest/bin/jest.js src/tests/mcp/orchestrator.test.js
```

### Coverage Reports
After running tests, view detailed coverage:
```bash
# Open in browser
xdg-open coverage/lcov-report/index.html  # Linux
open coverage/lcov-report/index.html       # macOS
start coverage/lcov-report/index.html      # Windows
```

## 💎 100% Test Coverage Philosophy

> *"100% test coverage or suffer in callback hell eternal"*  
> — The Universal Machine Philosophy

**All code must have 100% coverage** across:
- ✅ Branches (every if/else path)
- ✅ Functions (every function called)
- ✅ Lines (every line executed)
- ✅ Statements (every statement run)

Jest will **fail the build** if coverage drops below 100% in any metric.

### Writing Tests

#### Mock child_process for Process Testing
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

#### Test ALL Branches
```javascript
// SUCCESS path
it('should handle success case', () => {
  const result = functionUnderTest(validInput);
  expect(result).toBe(expectedValue);
});

// FAILURE path
it('should handle error case', () => {
  const result = functionUnderTest(invalidInput);
  expect(result).toBe(errorValue);
});
```

#### Use Fake Timers for Intervals
```javascript
it('should perform health check', () => {
  jest.useFakeTimers();
  
  const orchestrator = new MCPOrchestrator({ healthCheckInterval: 1000 });
  
  jest.advanceTimersByTime(1000);
  expect(mockHealthCheck).toHaveBeenCalled();
  
  jest.useRealTimers();
});
```

## 🌸 Emoji-Driven Commit Convention

**All commits MUST use machine-readable emoji prefixes:**

```bash
git commit -m "🌸 Add dependencies"        # CHERRY_BLOSSOM - Package management
git commit -m "👑 Refactor architecture"   # CROWN - Architecture decisions
git commit -m "💎 Add tests"               # GEM - Quality/coverage
git commit -m "✨ Configure servers"       # SPARKLES - Server operations
git commit -m "🦋 Transform data flow"     # BUTTERFLY - Transformations
git commit -m "🎭 Update lifecycle"        # PERFORMING_ARTS - Development lifecycle
git commit -m "🌀 Fix health checks"       # CYCLONE - MCP operations
git commit -m "🔥 Optimize performance"    # FIRE - Performance improvements
```

See `public/docs/RELIGULOUS_MANTRA.md` for complete emoji mappings.

## 🎨 Code Style

### Formatting
- **Prettier** available but NO auto-format on save
- Run manually: `npm run format`
- ESLint with auto-fix: `npm run lint:fix`

### Logging
Always use the structured Logger utility:

```javascript
const Logger = require('./utils/logger');
const logger = new Logger({ 
  level: 'INFO',
  context: { component: 'YourComponent' }
});

logger.info('Operation successful', { details: data });
logger.error('Operation failed', { error: error.message });
```

### Organization Requirements
- Always use **"BambiSleep™"** with trademark symbol in documentation
- Attribute: BambiSleepChat organization
- License: MIT

## 📁 Project Structure

```
src/
├── mcp/
│   └── orchestrator.js       # MCP server lifecycle (29 methods, 472 lines)
├── unity/
│   └── unity-bridge.js       # Unity IPC communication (409 lines)
├── utils/
│   └── logger.js             # Structured logging (237 lines)
├── ui/
│   └── dashboard-server.js   # Express + WebSocket dashboard (259 lines)
├── tests/
│   ├── mcp/orchestrator.test.js       # 605 lines, 40+ tests
│   ├── utils/logger.test.js           # ~150 lines, 20+ tests
│   ├── unity/unity-bridge.test.js     # 577 lines, 45+ tests
│   ├── unity/unity-ipc-protocol.test.js
│   ├── index.test.js                  # 520 lines, 35+ tests
│   └── ui/dashboard-server.test.js    # 595 lines, 50+ tests
└── index.js                  # Main entry (277 lines)
```

## 🌀 MCP Server Development

### Adding a New MCP Server

1. **Add to `.vscode/settings.json`** (for VS Code AI integration):
```json
"mcpServers": {
  "your-server": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-your-server"]
  }
}
```

2. **Add conditional loading to `src/index.js`**:
```javascript
if (process.env.YOUR_SERVER_API_KEY) {
  MCP_SERVERS['your-server'] = {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-your-server']
  };
}
```

3. **Register in main initialization** (already done in loop at lines 90-92)

4. **Document environment variable in `.env.example`**:
```bash
# Your Server Integration
YOUR_SERVER_API_KEY="your_key_here"
```

5. **Reload VS Code** after editing `.env`:
   - Ctrl+Shift+P → "Reload Window"

## 🔧 Development Workflows

### Use VS Code Tasks
Instead of typing npm commands, use VS Code tasks:
- **Ctrl+Shift+P** → "Tasks: Run Task"
- Select from 9 emoji-prefixed tasks:
  - 🌸 Start Control Tower (Dev)
  - 💎 Run Tests (100% Coverage)
  - 🌀 Check MCP Server Status
  - 📚 Start Documentation Server
  - 🚀 Start Production Server
  - 🧹 Lint & Fix Code
  - 💅 Format Code (Prettier)
  - 🔍 Test Watch Mode
  - 🏗️ Build Production

### Common Commands
```bash
npm run dev          # Development with auto-reload
npm test             # Full test suite with coverage
npm run mcp:status   # Check 8/8 MCP server status
npm start            # Production server
npm run docs         # Serve documentation on port 4000
```

## 🐛 Debugging

### MCP Server Issues
```bash
# Check server status
npm run mcp:status

# View VS Code MCP logs
# Output panel → Select "MCP" from dropdown

# Verify environment variables loaded
node -e "console.log(process.env.GITHUB_TOKEN ? 'Loaded' : 'Missing')"
```

### Test Failures
```bash
# Run with watch mode for rapid debugging
npm run test:watch

# Test specific file
node node_modules/jest/bin/jest.js src/tests/mcp/orchestrator.test.js

# View coverage gaps
xdg-open coverage/lcov-report/index.html
```

### Unity IPC Issues
```bash
# Check Unity logs
cat unity-projects/cathedral-renderer/Logs/unity-renderer.log

# Debug IPC in source
# Edit src/unity/unity-bridge.js - look for stdin/stdout handlers

# Protocol documentation
cat public/docs/UNITY_IPC_PROTOCOL.md
```

## 📚 Additional Resources

- [MCP Setup Guide](public/docs/MCP_SETUP_GUIDE.md)
- [Unity IPC Protocol](public/docs/UNITY_IPC_PROTOCOL.md)
- [Unity Setup Guide](public/docs/UNITY_SETUP_GUIDE.md)
- [Emoji Commit Convention](public/docs/RELIGULOUS_MANTRA.md)
- [CatGirl Server Spec](public/docs/CATGIRL_SERVER.md)

## 🏆 Pull Request Guidelines

1. **All tests must pass** with 100% coverage
2. **Use emoji-driven commits** (machine-readable)
3. **Follow code style** (run `npm run lint:fix`)
4. **Update documentation** if adding features
5. **Add tests first** (TDD approach)
6. **Reference issues** in PR description

## 💖 Questions?

Open an issue or contact the BambiSleepChat organization maintainers.

---

*Built with the Universal Machine Philosophy* 🌸✨  
*"Write once, run forever, across all machines"*
