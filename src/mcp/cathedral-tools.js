/**
 * BambiSleep™ Church - Cathedral MCP Tools
 * Exposes Unity cathedral functionality as MCP tools to AI agents
 * Integrates with UnityBridge for IPC communication
 */

const Logger = require('../utils/logger');

const logger = new Logger({ context: { component: 'CathedralMCPTools' } });

/**
 * Cathedral MCP Tool Definitions
 * These are exposed to AI agents through the MCP protocol
 */
const CATHEDRAL_TOOLS = {
  setCathedralStyle: {
    name: 'setCathedralStyle',
    description: 'Update the visual style of the cathedral in real-time',
    inputSchema: {
      type: 'object',
      properties: {
        pinkIntensity: {
          type: 'number',
          description: 'Pink neon intensity (0.0-1.0)',
          minimum: 0,
          maximum: 1
        },
        eldritchLevel: {
          type: 'integer',
          description: 'Eldritch power level (0-1000)',
          minimum: 0,
          maximum: 1000
        },
        neonIntensity: {
          type: 'number',
          description: 'Neon light intensity (0-20)',
          minimum: 0,
          maximum: 20
        },
        lightingMode: {
          type: 'string',
          description: 'Lighting mode',
          enum: ['neon', 'nuclear', 'holy', 'cursed']
        }
      }
    }
  },

  spawnObject: {
    name: 'spawnObject',
    description: 'Spawn an interactive 3D object in the cathedral',
    inputSchema: {
      type: 'object',
      properties: {
        objectType: {
          type: 'string',
          description: 'Type of object to spawn',
          enum: ['sphere', 'cube', 'cylinder', 'cross', 'angel']
        },
        x: { type: 'number', description: 'X position' },
        y: { type: 'number', description: 'Y position' },
        z: { type: 'number', description: 'Z position' },
        scale: {
          type: 'number',
          description: 'Object scale (default: 1.0)',
          default: 1.0
        },
        color: {
          type: 'string',
          description: 'Hex color (e.g., #FF00FF)',
          default: '#FF00FF'
        }
      },
      required: ['objectType', 'x', 'y', 'z']
    }
  },

  applyPhysics: {
    name: 'applyPhysics',
    description: 'Apply physics forces to objects in the cathedral',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Physics action type',
          enum: ['explode', 'attract', 'repel', 'float']
        },
        x: { type: 'number', description: 'Center X position' },
        y: { type: 'number', description: 'Center Y position' },
        z: { type: 'number', description: 'Center Z position' },
        force: {
          type: 'number',
          description: 'Force magnitude (default: 10)',
          default: 10
        },
        radius: {
          type: 'number',
          description: 'Effect radius (default: 10)',
          default: 10
        }
      },
      required: ['action', 'x', 'y', 'z']
    }
  },

  clearObjects: {
    name: 'clearObjects',
    description: 'Remove all spawned objects from the cathedral',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  getCathedralStatus: {
    name: 'getCathedralStatus',
    description: 'Get current status of the cathedral (style, objects, performance)',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  setTimeOfDay: {
    name: 'setTimeOfDay',
    description: 'Change the time of day lighting in the cathedral',
    inputSchema: {
      type: 'object',
      properties: {
        hour: {
          type: 'number',
          description: 'Hour of day (0-24)',
          minimum: 0,
          maximum: 24
        }
      },
      required: ['hour']
    }
  }
};

/**
 * Cathedral MCP Tools Handler
 * Manages tool calls and communicates with Unity
 */
class CathedralMCPTools {
  constructor(unityBridge) {
    this.unityBridge = unityBridge;
    this.pendingCalls = new Map(); // Track pending tool calls
    this.callIdCounter = 0;

    // Listen for tool responses from Unity
    this.setupResponseListeners();

    logger.info('Cathedral MCP Tools initialized', {
      toolCount: Object.keys(CATHEDRAL_TOOLS).length
    });
  }

  /**
   * Get list of available tools
   */
  getTools() {
    return Object.values(CATHEDRAL_TOOLS);
  }

  /**
   * Execute a tool call
   */
  async executeTool(toolName, parameters) {
    const tool = CATHEDRAL_TOOLS[toolName];
    
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    if (!this.unityBridge || !this.unityBridge.isRunning) {
      throw new Error('Unity bridge not running - cathedral unavailable');
    }

    // Generate unique call ID
    const callId = `mcp_${this.callIdCounter++}_${Date.now()}`;

    logger.info(`Executing cathedral tool: ${toolName}`, { callId, parameters });

    // Create promise for response
    const responsePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingCalls.delete(callId);
        reject(new Error(`Tool call timeout: ${toolName}`));
      }, 30000); // 30 second timeout

      this.pendingCalls.set(callId, { resolve, reject, timeout });
    });

    // Send tool call to Unity
    this.unityBridge.sendMessage({
      type: 'mcpToolCall',
      data: JSON.stringify({
        tool: toolName,
        parameters: JSON.stringify(parameters),
        callId
      })
    });

    return responsePromise;
  }

  /**
   * Setup listeners for tool responses from Unity
   */
  setupResponseListeners() {
    if (!this.unityBridge) return;

    // Listen for Unity stdout
    this.unityBridge.on('unity:toolResponse', (data) => {
      this.handleToolResponse(data);
    });

    // Parse stdout for tool responses
    this.unityBridge.on('unity:message', (message) => {
      try {
        const parsed = JSON.parse(message);
        if (parsed.callId && this.pendingCalls.has(parsed.callId)) {
          this.handleToolResponse(parsed);
        }
      } catch (e) {
        // Not a JSON tool response, ignore
      }
    });
  }

  /**
   * Handle tool response from Unity
   */
  handleToolResponse(response) {
    const { callId, success, result, error } = response;

    if (!this.pendingCalls.has(callId)) {
      logger.warn('Received response for unknown call ID', { callId });
      return;
    }

    const { resolve, reject, timeout } = this.pendingCalls.get(callId);
    clearTimeout(timeout);
    this.pendingCalls.delete(callId);

    if (success) {
      logger.info('Tool call succeeded', { callId });
      resolve(JSON.parse(result || '{}'));
    } else {
      logger.error('Tool call failed', { callId, error });
      reject(new Error(error || 'Unknown error'));
    }
  }

  /**
   * Get tool definitions in MCP format
   * Returns array of tool objects with name, description, and inputSchema
   */
  getToolDefinitions() {
    return Object.values(CATHEDRAL_TOOLS).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }

  /**
   * Cleanup
   */
  destroy() {
    // Reject all pending calls
    for (const [callId, { reject, timeout }] of this.pendingCalls.entries()) {
      clearTimeout(timeout);
      reject(new Error('Cathedral tools shutting down'));
    }
    this.pendingCalls.clear();

    logger.info('Cathedral MCP Tools destroyed');
  }
}

module.exports = {
  CATHEDRAL_TOOLS,
  CathedralMCPTools
};
