/**
 * Tests for Cathedral MCP Tools
 * Demonstrates how AI agents can interact with Unity cathedral
 */

const { CathedralMCPTools, CATHEDRAL_TOOLS } = require('../../mcp/cathedral-tools');
const UnityBridge = require('../../unity/unity-bridge');
const EventEmitter = require('events');

// Mock UnityBridge for testing
class MockUnityBridge extends EventEmitter {
  constructor() {
    super();
    this.isRunning = true;
    this.sentMessages = [];
  }

  sendMessage(message) {
    this.sentMessages.push(message);
    
    // Simulate Unity response after short delay
    setTimeout(() => {
      const data = JSON.parse(message.data);
      const callId = JSON.parse(data).callId;
      
      this.emit('unity:message', JSON.stringify({
        callId,
        success: true,
        result: JSON.stringify({ status: 'ok' })
      }));
    }, 10);
  }
}

describe('CathedralMCPTools', () => {
  let cathedralTools;
  let mockBridge;

  beforeEach(() => {
    mockBridge = new MockUnityBridge();
    cathedralTools = new CathedralMCPTools(mockBridge);
  });

  afterEach(() => {
    if (cathedralTools) {
      cathedralTools.destroy();
    }
  });

  describe('Tool Definitions', () => {
    it('should have all expected tools', () => {
      const tools = cathedralTools.getTools();
      expect(tools).toHaveLength(6);
      
      const toolNames = tools.map(t => t.name);
      expect(toolNames).toContain('setCathedralStyle');
      expect(toolNames).toContain('spawnObject');
      expect(toolNames).toContain('applyPhysics');
      expect(toolNames).toContain('clearObjects');
      expect(toolNames).toContain('getCathedralStatus');
      expect(toolNames).toContain('setTimeOfDay');
    });

    it('should have valid input schemas', () => {
      const tools = cathedralTools.getTools();
      
      tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });
  });

  describe('Tool Execution', () => {
    it('should execute setCathedralStyle tool', async () => {
      const result = await cathedralTools.executeTool('setCathedralStyle', {
        pinkIntensity: 0.9,
        eldritchLevel: 777,
        neonIntensity: 12.5,
        lightingMode: 'neon'
      });

      expect(result).toBeDefined();
      expect(mockBridge.sentMessages).toHaveLength(1);
      expect(mockBridge.sentMessages[0].type).toBe('mcpToolCall');
    });

    it('should execute spawnObject tool', async () => {
      const result = await cathedralTools.executeTool('spawnObject', {
        objectType: 'sphere',
        x: 0,
        y: 10,
        z: 0,
        scale: 2.0,
        color: '#FF00FF'
      });

      expect(result).toBeDefined();
      expect(mockBridge.sentMessages).toHaveLength(1);
    });

    it('should execute applyPhysics tool', async () => {
      const result = await cathedralTools.executeTool('applyPhysics', {
        action: 'explode',
        x: 0,
        y: 5,
        z: 0,
        force: 100,
        radius: 15
      });

      expect(result).toBeDefined();
      expect(mockBridge.sentMessages).toHaveLength(1);
    });

    it('should execute clearObjects tool', async () => {
      const result = await cathedralTools.executeTool('clearObjects', {});

      expect(result).toBeDefined();
      expect(mockBridge.sentMessages).toHaveLength(1);
    });

    it('should execute getCathedralStatus tool', async () => {
      const result = await cathedralTools.executeTool('getCathedralStatus', {});

      expect(result).toBeDefined();
      expect(mockBridge.sentMessages).toHaveLength(1);
    });

    it('should execute setTimeOfDay tool', async () => {
      const result = await cathedralTools.executeTool('setTimeOfDay', {
        hour: 18.5
      });

      expect(result).toBeDefined();
      expect(mockBridge.sentMessages).toHaveLength(1);
    });

    it('should reject unknown tools', async () => {
      await expect(
        cathedralTools.executeTool('unknownTool', {})
      ).rejects.toThrow('Unknown tool: unknownTool');
    });

    it('should reject when Unity bridge not running', async () => {
      mockBridge.isRunning = false;

      await expect(
        cathedralTools.executeTool('getCathedralStatus', {})
      ).rejects.toThrow('Unity bridge not running');
    });

    it('should timeout on no response', async () => {
      // Create bridge that doesn't respond
      const silentBridge = new EventEmitter();
      silentBridge.isRunning = true;
      silentBridge.sendMessage = jest.fn();
      
      const tools = new CathedralMCPTools(silentBridge);

      await expect(
        cathedralTools.executeTool('getCathedralStatus', {})
      ).rejects.toThrow('Tool call timeout');

      tools.destroy();
    }, 35000);
  });

  describe('Response Handling', () => {
    it('should handle successful tool responses', async () => {
      const responsePromise = cathedralTools.executeTool('getCathedralStatus', {});

      // Wait a bit then send response
      setTimeout(() => {
        mockBridge.emit('unity:message', JSON.stringify({
          callId: 'mcp_0_' + Date.now(),
          success: true,
          result: JSON.stringify({
            pinkIntensity: 0.8,
            eldritchLevel: 666,
            fps: 60
          })
        }));
      }, 20);

      await expect(responsePromise).resolves.toBeDefined();
    });

    it('should handle error responses', async () => {
      // Mock Unity to send error
      mockBridge.sendMessage = (message) => {
        const data = JSON.parse(message.data);
        const callId = JSON.parse(data).callId;
        
        setTimeout(() => {
          mockBridge.emit('unity:message', JSON.stringify({
            callId,
            success: false,
            error: 'UNITY_ERROR: Something went wrong'
          }));
        }, 10);
      };

      await expect(
        cathedralTools.executeTool('getCathedralStatus', {})
      ).rejects.toThrow('UNITY_ERROR');
    });

    it('should cleanup pending calls on destroy', () => {
      cathedralTools.executeTool('getCathedralStatus', {})
        .catch(() => {}); // Ignore rejection

      expect(cathedralTools.pendingCalls.size).toBe(1);

      cathedralTools.destroy();

      expect(cathedralTools.pendingCalls.size).toBe(0);
    });
  });

  describe('Integration Examples', () => {
    it('should demonstrate complete workflow', async () => {
      // 1. Get initial status
      const status1 = await cathedralTools.executeTool('getCathedralStatus', {});
      expect(status1).toBeDefined();

      // 2. Update cathedral style
      await cathedralTools.executeTool('setCathedralStyle', {
        pinkIntensity: 0.95,
        eldritchLevel: 777,
        lightingMode: 'nuclear'
      });

      // 3. Spawn some objects
      await cathedralTools.executeTool('spawnObject', {
        objectType: 'angel',
        x: 0,
        y: 20,
        z: 0,
        scale: 3.0,
        color: '#FFFFFF'
      });

      await cathedralTools.executeTool('spawnObject', {
        objectType: 'cross',
        x: 5,
        y: 10,
        z: 5,
        scale: 2.0,
        color: '#FFD700'
      });

      // 4. Apply physics
      await cathedralTools.executeTool('applyPhysics', {
        action: 'float',
        x: 0,
        y: 0,
        z: 0,
        force: 50
      });

      // 5. Set time of day
      await cathedralTools.executeTool('setTimeOfDay', {
        hour: 21.0 // Night time
      });

      // 6. Get final status
      const status2 = await cathedralTools.executeTool('getCathedralStatus', {});
      expect(status2).toBeDefined();

      // 7. Clear all objects
      await cathedralTools.executeTool('clearObjects', {});

      expect(mockBridge.sentMessages.length).toBeGreaterThan(5);
    });
  });
});
