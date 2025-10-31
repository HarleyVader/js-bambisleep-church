// BambiSleep™ Church MCP Control Tower
require('dotenv').config();
const MCPOrchestrator = require('./mcp/orchestrator');
const UnityBridge = require('./unity/unity-bridge');
const Logger = require('./utils/logger');
const path = require('path');
const fs = require('fs');

const logger = new Logger({
  level: process.env.LOG_LEVEL || 'INFO',
  logFile: process.env.LOG_FILE,
  enableConsole: true,
  enableFile: !!process.env.LOG_FILE
});

const CONFIG = {
  port: process.env.PORT || 3000,
  docsPort: process.env.DOCS_PORT || 4000,
  workspacePath: process.env.WORKSPACE_PATH || path.resolve(__dirname, '..'),
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
  autoRestart: process.env.AUTO_RESTART !== 'false',
  maxRestartAttempts: parseInt(process.env.MAX_RESTART_ATTEMPTS) || 3
};

const MCP_SERVERS = {
  filesystem: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', CONFIG.workspacePath]
  },
  git: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git', '--repository', CONFIG.workspacePath]
  },
  github: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github']
  }
};

if (process.env.MONGODB_CONNECTION_STRING) {
  MCP_SERVERS.mongodb = {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-mongodb', '--connection-string', process.env.MONGODB_CONNECTION_STRING]
  };
}

if (process.env.STRIPE_SECRET_KEY) {
  MCP_SERVERS.stripe = {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-stripe']
  };
}

if (process.env.HUGGINGFACE_HUB_TOKEN) {
  MCP_SERVERS.huggingface = {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-huggingface']
  };
}

if (process.env.AZURE_QUANTUM_WORKSPACE_ID) {
  MCP_SERVERS['azure-quantum'] = {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-azure-quantum']
  };
}

if (process.env.CLARITY_PROJECT_ID) {
  MCP_SERVERS.clarity = {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-microsoft-clarity']
  };
}

if (process.env.UNITY_ENABLED !== 'false') {
  MCP_SERVERS.cathedral = {
    command: 'node',
    args: [path.join(__dirname, 'mcp', 'cathedral-server.js')],
    type: 'custom',
    description: 'Unity Cathedral 3D visualization and interaction tools'
  };
}

const orchestrator = new MCPOrchestrator({
  workspacePath: CONFIG.workspacePath,
  healthCheckInterval: CONFIG.healthCheckInterval,
  autoRestart: CONFIG.autoRestart,
  maxRestartAttempts: CONFIG.maxRestartAttempts
});

// Register event listeners
orchestrator.on('server:registered', ({ name }) => {
  logger.info(`✨ Registered MCP server: ${name}`);
});

orchestrator.on('server:started', ({ name, server }) => {
  logger.info(`🌸 Started MCP server: ${name}`, { pid: server.pid });
});

orchestrator.on('server:stopped', ({ name, code }) => {
  logger.info(`🌀 Stopped MCP server: ${name}`, { exitCode: code });
});

orchestrator.on('server:error', ({ name, error }) => {
  logger.error(`💎 Error in MCP server: ${name}`, { error: error.message });
});

orchestrator.on('server:unhealthy', ({ name }) => {
  logger.warn(`🦋 Unhealthy MCP server: ${name}`);
});

orchestrator.on('orchestrator:started', ({ total, success }) => {
  logger.info(`🎭 MCP Control Tower operational: ${success}/${total} servers running`);
});

orchestrator.on('orchestrator:stopped', ({ total, success }) => {
  logger.info(`🌸 MCP Control Tower stopped: ${success}/${total} servers terminated`);
});

// Initialize Unity Cathedral Renderer Bridge
const unityBridge = new UnityBridge({
  unityPath: process.env.UNITY_PATH || '/opt/unity/Editor/Unity',
  projectPath: path.join(__dirname, '..', 'unity-projects', 'cathedral-renderer'),
  renderOnStart: process.env.UNITY_RENDER_ON_START !== 'false',
  logger
});

// Register Unity event listeners
unityBridge.on('unity:starting', () => {
  logger.info('🔮 Unity Cathedral Renderer initializing...');
});

unityBridge.on('unity:started', ({ pid }) => {
  logger.info('🔮✨ Unity Cathedral Renderer started', { pid });
});

unityBridge.on('unity:scene-loaded', ({ sceneName }) => {
  logger.info('🔮🌸 Unity scene loaded', { sceneName });
});

unityBridge.on('unity:render-complete', ({ timestamp }) => {
  logger.info('🔮💎 Cathedral render complete', { timestamp });
});

unityBridge.on('unity:error', ({ error }) => {
  logger.error('🔮💥 Unity error', { error });
});

unityBridge.on('unity:stopped', ({ code }) => {
  logger.info('🔮🌀 Unity Cathedral Renderer stopped', { exitCode: code });
});

/**
 * Initialize and start all MCP servers
 */
async function initialize() {
  try {
    logger.info('🌸✨ BambiSleep™ Church MCP Control Tower starting...', {
      nodeVersion: process.version,
      platform: process.platform,
      workspacePath: CONFIG.workspacePath
    });

    // Register all configured MCP servers
    for (const [name, config] of Object.entries(MCP_SERVERS)) {
      orchestrator.registerServer(name, config);
    }

    // Start all servers
    const startedCount = await orchestrator.startAll();
    
    // Display status
    const stats = orchestrator.getStats();
    logger.info('🌸 MCP Control Tower Status:', stats);
    
    // Log server details
    const allStatus = orchestrator.getAllStatus();
    for (const [name, status] of Object.entries(allStatus)) {
      logger.info(`  → ${name}: ${status.state}`, {
        pid: status.pid,
        healthStatus: status.healthStatus
      });
    }

    logger.info('🌸✨ MCP Control Tower initialization complete! 🌸✨');
    logger.info(`📚 Documentation available on port ${CONFIG.docsPort}`);
    logger.info(`🔧 Control interface available on port ${CONFIG.port}`);
    
    // Start Unity Cathedral Renderer if configured
    if (process.env.UNITY_ENABLED !== 'false') {
      logger.info('🔮 Starting Unity Cathedral Renderer...');
      await unityBridge.start();
      logger.info('🔮✨ Unity Cathedral Renderer ready for commands');
    } else {
      logger.info('🔮 Unity Cathedral Renderer disabled (UNITY_ENABLED=false)');
    }
    
    return true;
  } catch (error) {
    logger.error('💎 Failed to initialize MCP Control Tower', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal) {
  logger.info(`🌀 Received ${signal}, initiating graceful shutdown...`);
  
  try {
    // Stop Unity renderer first
    if (unityBridge.isRunning()) {
      logger.info('🔮 Stopping Unity Cathedral Renderer...');
      await unityBridge.stop();
    }
    
    await orchestrator.shutdown();
    logger.info('🌸 Shutdown complete. Goodbye! 🌸');
    process.exit(0);
  } catch (error) {
    logger.error('💎 Error during shutdown', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Error handler
 */
function handleError(error) {
  logger.error('💎 Unhandled error', {
    error: error.message,
    stack: error.stack
  });
}

// Register signal handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  logger.error('💎 Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  shutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('💎 Unhandled promise rejection', {
    reason,
    promise
  });
});

// Start the application
if (require.main === module) {
  initialize().catch((error) => {
    handleError(error);
    process.exit(1);
  });
}

// Export for testing
module.exports = {
  orchestrator,
  initialize,
  shutdown,
  CONFIG,
  MCP_SERVERS
};
