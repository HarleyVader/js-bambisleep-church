#!/usr/bin/env node
/**
 * BambiSleep™ Church - Cathedral MCP Server
 * Formal MCP server implementing JSON-RPC 2.0 protocol for Unity cathedral tools
 * 
 * This server exposes Unity cathedral functionality as standardized MCP tools,
 * allowing AI agents (Claude, VS Code Copilot, etc.) to control 3D cathedral
 * visualization in real-time.
 * 
 * Protocol: JSON-RPC 2.0 over STDIO
 * Transport: Standard input/output streams
 * 
 * ⚠️ CRITICAL: Never use console.log() - corrupts JSON-RPC messages!
 * Use stderr for logging only (process.stderr.write)
 */

const path = require('path');
const UnityBridge = require('../unity/unity-bridge');
const CathedralMCPTools = require('./cathedral-tools');

// Logging to stderr only (never stdout - corrupts JSON-RPC)
function log(level, message, data = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    component: 'CathedralMCPServer',
    message,
    ...data
  };
  process.stderr.write(JSON.stringify(logEntry) + '\n');
}

/**
 * Cathedral MCP Server
 * Implements JSON-RPC 2.0 protocol for MCP communication
 */
class CathedralMCPServer {
  constructor() {
    this.unityBridge = null;
    this.cathedralTools = null;
    this.initialized = false;
    this.capabilities = {
      tools: {
        listChanged: true // We support tool list change notifications
      }
    };
    this.serverInfo = {
      name: 'bambisleep-cathedral',
      version: '1.0.0'
    };
  }

  /**
   * Initialize Unity bridge and cathedral tools
   */
  async initialize() {
    try {
      log('info', 'Initializing Cathedral MCP Server...');

      // Initialize Unity bridge
      this.unityBridge = new UnityBridge({
        unityPath: process.env.UNITY_PATH || '/opt/unity/Editor/Unity',
        projectPath: path.join(__dirname, '..', '..', 'unity-projects', 'cathedral-renderer'),
        renderOnStart: false, // Don't auto-render, wait for tool calls
        logger: {
          // Redirect Unity logs to stderr
          info: (msg, data) => log('info', msg, data),
          warn: (msg, data) => log('warn', msg, data),
          error: (msg, data) => log('error', msg, data),
          debug: (msg, data) => log('debug', msg, data)
        }
      });

      // Start Unity process
      await this.unityBridge.start();

      // Initialize cathedral tools wrapper
      this.cathedralTools = new CathedralMCPTools(this.unityBridge);

      this.initialized = true;
      log('info', 'Cathedral MCP Server initialized successfully');
      
      return true;
    } catch (error) {
      log('error', 'Failed to initialize Cathedral MCP Server', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Handle JSON-RPC 2.0 initialize request
   * MCP lifecycle management - capability negotiation
   */
  handleInitialize(params) {
    log('info', 'Received initialize request', { params });

    return {
      protocolVersion: '2024-11-05', // MCP protocol version
      capabilities: this.capabilities,
      serverInfo: this.serverInfo
    };
  }

  /**
   * Handle tools/list request
   * Returns all available cathedral tools
   */
  handleToolsList() {
    if (!this.initialized) {
      throw new Error('Server not initialized');
    }

    const tools = this.cathedralTools.getToolDefinitions();
    log('info', 'Listing cathedral tools', { count: tools.length });

    return { tools };
  }

  /**
   * Handle tools/call request
   * Execute a cathedral tool with given arguments
   */
  async handleToolsCall(params) {
    if (!this.initialized) {
      throw new Error('Server not initialized');
    }

    const { name, arguments: args } = params;
    log('info', 'Executing tool', { name, args });

    try {
      const result = await this.cathedralTools.executeTool(name, args);
      
      // MCP expects tool results in content array format
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      log('error', 'Tool execution failed', {
        name,
        error: error.message
      });
      
      // Return error as content
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              code: 'TOOL_EXECUTION_ERROR'
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }

  /**
   * Process JSON-RPC 2.0 request
   */
  async processRequest(request) {
    const { jsonrpc, id, method, params } = request;

    // Validate JSON-RPC version
    if (jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32600,
          message: 'Invalid Request - must use JSON-RPC 2.0'
        }
      };
    }

    try {
      let result;

      // Route to appropriate handler based on method
      switch (method) {
        case 'initialize':
          result = this.handleInitialize(params);
          break;

        case 'tools/list':
          result = this.handleToolsList();
          break;

        case 'tools/call':
          result = await this.handleToolsCall(params);
          break;

        case 'notifications/initialized':
          // Client acknowledging initialization
          log('info', 'Client initialized notification received');
          return null; // No response for notifications

        default:
          throw {
            code: -32601,
            message: `Method not found: ${method}`
          };
      }

      // Return successful response
      return {
        jsonrpc: '2.0',
        id,
        result
      };

    } catch (error) {
      // Return error response
      const errorCode = error.code || -32603;
      const errorMessage = error.message || 'Internal error';

      log('error', 'Request processing error', {
        method,
        error: errorMessage,
        code: errorCode
      });

      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: errorCode,
          message: errorMessage,
          data: error.data
        }
      };
    }
  }

  /**
   * Send JSON-RPC notification (no response expected)
   */
  sendNotification(method, params) {
    const notification = {
      jsonrpc: '2.0',
      method,
      params
    };
    
    process.stdout.write(JSON.stringify(notification) + '\n');
    log('debug', 'Sent notification', { method, params });
  }

  /**
   * Start the MCP server
   * Listens on stdin for JSON-RPC requests, responds on stdout
   */
  async start() {
    try {
      log('info', '🌸 Starting Cathedral MCP Server...');

      // Initialize Unity and tools
      await this.initialize();

      // Set up stdin for JSON-RPC requests
      process.stdin.setEncoding('utf8');
      
      let buffer = '';
      
      process.stdin.on('data', async (chunk) => {
        buffer += chunk;
        
        // Process complete JSON objects (separated by newlines)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const request = JSON.parse(line);
            log('debug', 'Received request', { method: request.method, id: request.id });
            
            const response = await this.processRequest(request);
            
            // Send response (null for notifications)
            if (response !== null) {
              process.stdout.write(JSON.stringify(response) + '\n');
              log('debug', 'Sent response', { id: response.id });
            }
          } catch (parseError) {
            log('error', 'Failed to parse JSON-RPC request', {
              error: parseError.message,
              line
            });
            
            // Send parse error response
            const errorResponse = {
              jsonrpc: '2.0',
              id: null,
              error: {
                code: -32700,
                message: 'Parse error'
              }
            };
            process.stdout.write(JSON.stringify(errorResponse) + '\n');
          }
        }
      });

      process.stdin.on('end', () => {
        log('info', 'Stdin closed, shutting down...');
        this.shutdown();
      });

      log('info', '✨ Cathedral MCP Server ready on STDIO');
      log('info', '📚 Available tools: 6 (setCathedralStyle, spawnObject, applyPhysics, clearObjects, getCathedralStatus, setTimeOfDay)');

    } catch (error) {
      log('error', '💎 Failed to start Cathedral MCP Server', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      log('info', 'Shutting down Cathedral MCP Server...');
      
      if (this.unityBridge && this.unityBridge.isRunning()) {
        await this.unityBridge.stop();
      }
      
      log('info', '🌸 Cathedral MCP Server stopped');
      process.exit(0);
    } catch (error) {
      log('error', 'Error during shutdown', { error: error.message });
      process.exit(1);
    }
  }
}

// Handle process signals
const server = new CathedralMCPServer();

process.on('SIGTERM', () => server.shutdown());
process.on('SIGINT', () => server.shutdown());
process.on('uncaughtException', (error) => {
  log('error', 'Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  server.shutdown();
});

// Start server if run directly
if (require.main === module) {
  server.start().catch((error) => {
    log('error', 'Fatal error', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });
}

module.exports = CathedralMCPServer;
