# Zathras Agent - BambiSleep™ Church MCP Control Tower

_"Zathras understand. Zathras do. Zathras good at understanding things." - Babylon 5_

## Overview

**Zathras** is a codebase-aware autonomous agent integrated into the BambiSleep™ Church MCP Control Tower. Zathras can interact with all 20+ Model Context Protocol (MCP) servers, execute complex multi-server workflows, and communicate with the Unity 3D cathedral renderer through the IPC protocol.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Zathras Agent Core                       │
│                  (src/agents/ZathrasAgent.js)               │
└──────────────┬──────────────────────────────────────────────┘
               │
               ├──► MCP Orchestrator (20+ servers)
               │    ├─ Official Gallery: Microsoft, MongoDB, Stripe
               │    ├─ Core: filesystem, git, github, memory
               │    ├─ Utility: docker, postgres, brave-search
               │    └─ Custom: cathedral (Unity bridge)
               │
               ├──► Unity Bridge (IPC)
               │    └─ Cathedral Renderer (Unity 6.2 LTS)
               │
               └──► Memory/Knowledge Graph
                    └─ Persistent state & conversation context
```

## MCP Server Capabilities

Zathras has access to all configured MCP servers in `.vscode/settings.json`:

### Official MCP Gallery Servers

1. **microsoft/markitdown** - Convert documents to Markdown
2. **microsoft/playwright-mcp** - Browser automation and web scraping
3. **microsoft/clarity-mcp-server** - Analytics and session recording
4. **mongodb-js/mongodb-mcp-server** - Database operations (read-only mode)
5. **stripe/agent-toolkit** - Payment processing and subscription management
6. **evalstate/hf-mcp-server** - HuggingFace model and dataset search
7. **github/github-mcp-server** - GitHub API operations

### Core MCP Servers

8. **filesystem** - File system operations (read/write/search)
9. **git** - Repository operations (commits, branches, diffs)
10. **github** - Legacy GitHub HTTP integration
11. **memory** - Persistent knowledge graph storage
12. **sequential-thinking** - Chain-of-thought reasoning
13. **everything** - Diagnostic and testing tools

### Additional Utility Servers

14. **docker** - Container management and execution
15. **brave-search** - Web search capabilities
16. **postgres** - PostgreSQL database operations

### Custom Cathedral Server

17. **cathedral** - Unity 3D cathedral renderer control via STDIO IPC

## Core Features

### 1. Multi-Server Orchestration

Zathras can execute complex workflows involving multiple MCP servers:

```javascript
// Example: Research paper analysis workflow
const workflow = await zathras.executeWorkflow({
  name: "research-analysis",
  steps: [
    {
      server: "brave-search",
      action: "search",
      query: "quantum computing 2024",
    },
    {
      server: "evalstate/hf-mcp-server",
      action: "search_papers",
      keywords: ["quantum"],
    },
    { server: "microsoft/markitdown", action: "convert", url: "<paper-url>" },
    {
      server: "memory",
      action: "create_entities",
      entities: [{ name: "Research Finding", type: "knowledge" }],
    },
  ],
});
```

### 2. Unity Cathedral Integration

Zathras can control the Unity 3D cathedral renderer through the IPC protocol:

```javascript
// Example: Dynamic cathedral visualization
await zathras.unity.updateStyle({
  style: "neon-cyber-goth",
  lighting: "electro-nuclear",
  neonIntensity: 7.5,
  bloomIntensity: 4.0,
  pinkIntensity: 0.9,
});

await zathras.unity.renderSnapshot({
  outputPath: "/output/cathedral-vision.png",
  width: 1920,
  height: 1080,
});
```

### 3. Codebase Awareness

Zathras understands the project structure and can:

- Read/modify source code via `filesystem` server
- Execute git operations via `git` server
- Search code patterns and documentation
- Maintain 100% test coverage (Jest enforced)

### 4. Memory & Context Management

Zathras uses the `memory` MCP server to maintain:

- Conversation history
- Knowledge graph of entities and relations
- Task state and progress tracking
- User preferences and patterns

### 5. Web Automation

Via `microsoft/playwright-mcp`, Zathras can:

- Navigate websites
- Extract structured data
- Fill forms and interact with UI elements
- Take screenshots and monitor console logs

### 6. Development Operations

Zathras integrates with development tools:

- **Docker**: Manage containers, execute commands
- **MongoDB**: Query databases in read-only mode
- **PostgreSQL**: Database operations
- **GitHub**: Repository management, PR creation, issue tracking

## Unity Integration

Zathras communicates with Unity via the `ZathrasIntegration.cs` script in the cathedral renderer project.

### IPC Message Protocol

**Node.js → Unity (Commands)**:

```json
{
  "type": "zathras:command",
  "timestamp": "2024-10-31T12:34:56.789Z",
  "data": {
    "action": "updateStyle",
    "parameters": {
      "style": "neon-cyber-goth",
      "neonIntensity": 7.5
    }
  }
}
```

**Unity → Node.js (Events)**:

```json
{
  "type": "zathras:event",
  "timestamp": "2024-10-31T12:34:56.789Z",
  "data": {
    "event": "renderComplete",
    "status": "success",
    "outputPath": "/output/cathedral.png"
  }
}
```

### Supported Unity Commands

- `initialize` - Initialize cathedral scene
- `updateStyle` - Update visual parameters
- `renderSnapshot` - Capture high-resolution image
- `startAnimation` - Begin animation sequence
- `stopAnimation` - Stop animation
- `setCamera` - Configure camera position/settings
- `applyVFX` - Apply visual effects
- `shutdown` - Gracefully close Unity renderer

## Usage Examples

### Example 1: Code Analysis with Visualization

```javascript
// Analyze codebase and visualize architecture in Unity
await zathras.executeTask({
  name: "Architecture Analysis",
  steps: [
    // Search codebase
    { server: "filesystem", action: "search_files", pattern: "**/*.js" },

    // Parse and analyze
    {
      server: "sequential-thinking",
      action: "analyze",
      context: "code-structure",
    },

    // Store findings
    {
      server: "memory",
      action: "create_entities",
      entities: [
        /* ... */
      ],
    },

    // Visualize in Unity
    {
      server: "cathedral",
      action: "updateStyle",
      data: {
        /* cathedral params */
      },
    },
  ],
});
```

### Example 2: Research with HuggingFace

```javascript
// Search for ML models and datasets
const models = await zathras.mcp.call("evalstate/hf-mcp-server", {
  tool: "model_search",
  parameters: { query: "text-to-image", limit: 5 },
});

const datasets = await zathras.mcp.call("evalstate/hf-mcp-server", {
  tool: "dataset_search",
  parameters: { query: "stable-diffusion", limit: 3 },
});

// Store in knowledge graph
await zathras.mcp.call("memory", {
  tool: "create_entities",
  parameters: {
    entities: models.map((m) => ({ name: m.id, type: "model" })),
  },
});
```

### Example 3: GitHub Issue Management

```javascript
// Create GitHub issue with analysis
const issue = await zathras.mcp.call("github/github-mcp-server", {
  tool: "create_issue",
  parameters: {
    owner: "HarleyVader",
    repo: "js-bambisleep-church",
    title: "🌸 Add Zathras agent dependencies",
    body: "Automated issue created by Zathras agent",
    labels: ["enhancement", "automation"],
  },
});

console.log(`Created issue #${issue.number}`);
```

### Example 4: MongoDB Query Visualization

```javascript
// Query MongoDB and visualize data in Unity
const data = await zathras.mcp.call("mongodb-js/mongodb-mcp-server", {
  tool: "find",
  parameters: {
    database: "cathedral",
    collection: "sessions",
    query: { timestamp: { $gte: "2024-10-01" } },
  },
});

// Update Unity visualization based on data
await zathras.unity.updateStyle({
  neonIntensity: data.length / 10,
  bloomIntensity: Math.min(data.length / 5, 10),
});
```

## Configuration

Zathras reads MCP server configuration from `.vscode/settings.json`:

```javascript
const zathras = new ZathrasAgent({
  mcpConfigPath: ".vscode/settings.json",
  workspacePath: "/mnt/f/js-bambisleep-church",
  unityEnabled: process.env.UNITY_ENABLED === "true",
  unityPath: process.env.UNITY_PATH,
  logLevel: "INFO",
});

await zathras.initialize();
```

## Event System

Zathras emits events for all major operations:

```javascript
zathras.on("server:call", ({ server, tool, parameters }) => {
  console.log(`Calling ${server}.${tool}`);
});

zathras.on("unity:message", ({ type, data }) => {
  console.log(`Unity: ${type}`, data);
});

zathras.on("workflow:complete", ({ name, duration, results }) => {
  console.log(`Workflow ${name} completed in ${duration}ms`);
});

zathras.on("error", ({ error, context }) => {
  console.error("Zathras error:", error, context);
});
```

## Testing

Zathras follows the project's 100% test coverage requirement:

```bash
npm test -- src/tests/agents/zathras-agent.test.js
```

Test suite includes:

- MCP server integration tests
- Unity IPC protocol tests
- Workflow execution tests
- Error handling and recovery tests
- Memory persistence tests

## Project Structure

```
src/
  agents/
    ZathrasAgent.js          # Main agent implementation
  tests/
    agents/
      zathras-agent.test.js  # 100% coverage test suite

unity-projects/
  cathedral-renderer/
    Assets/
      Scripts/
        ZathrasIntegration.cs  # Unity-side IPC handler
```

## Environment Variables

```bash
# Unity Configuration
UNITY_PATH="C:\\Program Files\\Unity\\Hub\\Editor\\6000.2.11f1\\Editor\\Unity.exe"
UNITY_ENABLED=true

# MCP Server Credentials (optional)
MDB_MCP_CONNECTION_STRING="mongodb://localhost:27017"
CLARITY_API_TOKEN="your-token-here"
STRIPE_API_KEY="your-stripe-key"

# Agent Configuration
ZATHRAS_LOG_LEVEL=INFO
ZATHRAS_MAX_WORKFLOW_STEPS=50
ZATHRAS_TIMEOUT=300000
```

## API Reference

### ZathrasAgent Class

```javascript
class ZathrasAgent extends EventEmitter {
  constructor(config)
  async initialize()
  async shutdown()

  // MCP Operations
  async callServer(serverName, tool, parameters)
  async executeWorkflow(workflow)
  async getServerStatus()

  // Unity Operations
  async unityCommand(command, data)
  async unityUpdateStyle(styleConfig)
  async unityRenderSnapshot(outputConfig)

  // Memory Operations
  async storeMemory(entity)
  async recallMemory(query)
  async createKnowledgeGraph(entities, relations)

  // Utility Operations
  async searchWeb(query)
  async analyzeCode(filePath)
  async executeDocker(command)
}
```

## Best Practices

1. **STDIO Protocol**: Never use `console.log()` in cathedral server - corrupts JSON-RPC stdout
2. **Test Coverage**: All Zathras code must maintain 100% coverage
3. **Error Handling**: Use EventEmitter error events, don't throw uncaught exceptions
4. **Memory Management**: Clean up MCP server processes on shutdown
5. **Unity Lifecycle**: Always call `shutdown` command before terminating Unity process
6. **WSL2 Installation**: Use `npm install --no-bin-links` on /mnt/\* paths

## Emoji Commit Convention

When committing Zathras changes:

```bash
git commit -m "🤖 Add Zathras agent implementation"
git commit -m "🔮 Integrate Unity IPC protocol"
git commit -m "💎 Add Zathras test suite (100% coverage)"
git commit -m "📚 Document Zathras capabilities"
```

## References

- MCP Specification: `docs/CATHEDRAL_MCP_SERVER_REGISTRATION.md`
- Unity IPC Protocol: `public/docs/UNITY_IPC_PROTOCOL.md`
- MCP Orchestrator: `src/mcp/orchestrator.js`
- Unity Bridge: `src/unity/unity-bridge.js`
- Project Guidelines: `.github/copilot-instructions.md`

## Future Enhancements

- [ ] Multi-agent coordination (Zathras + other AI agents)
- [ ] Real-time Unity visualization streaming
- [ ] LangChain integration for advanced reasoning
- [ ] Voice command interface via browser speech API
- [ ] Automated code generation with test coverage validation
- [ ] Neural architecture search via HuggingFace integration

---

_"Zathras serve. Zathras help. Zathras never complain about 100% test coverage."_ 🤖✨
