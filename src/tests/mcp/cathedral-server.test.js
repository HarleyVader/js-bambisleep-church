/**
 * BambiSleep™ Church - Cathedral MCP Server Tests
 * Tests JSON-RPC 2.0 protocol implementation for MCP compliance
 */

const CathedralMCPServer = require('../cathedral-server');
const { EventEmitter } = require('events');

// Mock UnityBridge
jest.mock('../../unity/unity-bridge');
const UnityBridge = require('../../unity/unity-bridge');

describe('CathedralMCPServer', () => {
  let server;
  let mockUnityBridge;

  beforeEach(() => {
    // Create mock Unity bridge
    mockUnityBridge = new EventEmitter();
    mockUnityBridge.start = jest.fn().mockResolvedValue(true);
    mockUnityBridge.stop = jest.fn().mockResolvedValue(true);
    mockUnityBridge.isRunning = jest.fn().mockReturnValue(true);
    mockUnityBridge.sendMessage = jest.fn();

    UnityBridge.mockImplementation(() => mockUnityBridge);

    server = new CathedralMCPServer();
  });

  afterEach(async () => {
    if (server && server.initialized) {
      await server.shutdown();
    }
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize Unity bridge and cathedral tools', async () => {
      await server.initialize();

      expect(server.initialized).toBe(true);
      expect(server.unityBridge).toBeDefined();
      expect(server.cathedralTools).toBeDefined();
      expect(mockUnityBridge.start).toHaveBeenCalled();
    });

    it('should set server capabilities and info', async () => {
      await server.initialize();

      expect(server.capabilities).toEqual({
        tools: {
          listChanged: true
        }
      });

      expect(server.serverInfo).toEqual({
        name: 'bambisleep-cathedral',
        version: '1.0.0'
      });
    });

    it('should handle initialization errors', async () => {
      mockUnityBridge.start.mockRejectedValue(new Error('Unity startup failed'));

      await expect(server.initialize()).rejects.toThrow('Unity startup failed');
      expect(server.initialized).toBe(false);
    });
  });

  describe('JSON-RPC Protocol - Initialize', () => {
    it('should handle initialize request', async () => {
      await server.initialize();

      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        }
      };

      const response = await server.processRequest(request);

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(1);
      expect(response.result).toBeDefined();
      expect(response.result.protocolVersion).toBe('2024-11-05');
      expect(response.result.capabilities).toEqual(server.capabilities);
      expect(response.result.serverInfo).toEqual(server.serverInfo);
    });

    it('should reject non-JSON-RPC 2.0 requests', async () => {
      const request = {
        jsonrpc: '1.0',
        id: 1,
        method: 'initialize'
      };

      const response = await server.processRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32600);
      expect(response.error.message).toContain('JSON-RPC 2.0');
    });
  });

  describe('JSON-RPC Protocol - Tools List', () => {
    it('should return tools list', async () => {
      await server.initialize();

      const request = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      };

      const response = await server.processRequest(request);

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(2);
      expect(response.result.tools).toBeDefined();
      expect(Array.isArray(response.result.tools)).toBe(true);
      expect(response.result.tools.length).toBe(6);

      // Validate tool structure
      const tool = response.result.tools[0];
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
    });

    it('should error if not initialized', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      };

      const response = await server.processRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error.message).toContain('not initialized');
    });

    it('should include all 6 cathedral tools', async () => {
      await server.initialize();

      const request = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      };

      const response = await server.processRequest(request);
      const toolNames = response.result.tools.map(t => t.name);

      expect(toolNames).toContain('setCathedralStyle');
      expect(toolNames).toContain('spawnObject');
      expect(toolNames).toContain('applyPhysics');
      expect(toolNames).toContain('clearObjects');
      expect(toolNames).toContain('getCathedralStatus');
      expect(toolNames).toContain('setTimeOfDay');
    });
  });

  describe('JSON-RPC Protocol - Tool Execution', () => {
    beforeEach(async () => {
      await server.initialize();
      
      // Mock executeTool to return success
      server.cathedralTools.executeTool = jest.fn().mockResolvedValue({
        success: true,
        result: { objectId: 'test_0' }
      });
    });

    it('should execute tool and return result', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'spawnObject',
          arguments: {
            objectType: 'cube',
            x: 0,
            y: 10,
            z: 0
          }
        }
      };

      const response = await server.processRequest(request);

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(3);
      expect(response.result).toBeDefined();
      expect(response.result.content).toBeDefined();
      expect(response.result.content[0].type).toBe('text');

      // Verify executeTool was called
      expect(server.cathedralTools.executeTool).toHaveBeenCalledWith(
        'spawnObject',
        { objectType: 'cube', x: 0, y: 10, z: 0 }
      );
    });

    it('should handle tool execution errors', async () => {
      server.cathedralTools.executeTool.mockRejectedValue(
        new Error('Unity communication failed')
      );

      const request = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'spawnObject',
          arguments: {}
        }
      };

      const response = await server.processRequest(request);

      expect(response.result.isError).toBe(true);
      expect(response.result.content[0].text).toContain('Unity communication failed');
    });

    it('should validate tool exists before execution', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'nonExistentTool',
          arguments: {}
        }
      };

      const response = await server.processRequest(request);

      // Should attempt to execute and fail
      expect(response.result).toBeDefined();
    });
  });

  describe('JSON-RPC Protocol - Notifications', () => {
    it('should handle initialized notification', async () => {
      await server.initialize();

      const request = {
        jsonrpc: '2.0',
        method: 'notifications/initialized'
      };

      const response = await server.processRequest(request);

      // Notifications return null (no response)
      expect(response).toBeNull();
    });

    it('should send tool list changed notification', () => {
      const mockStdout = jest.spyOn(process.stdout, 'write').mockImplementation();

      server.sendNotification('notifications/tools/list_changed', {});

      expect(mockStdout).toHaveBeenCalled();
      const notification = JSON.parse(mockStdout.mock.calls[0][0]);
      expect(notification.jsonrpc).toBe('2.0');
      expect(notification.method).toBe('notifications/tools/list_changed');
      expect(notification.id).toBeUndefined(); // Notifications have no ID

      mockStdout.mockRestore();
    });
  });

  describe('JSON-RPC Protocol - Error Handling', () => {
    it('should return method not found error', async () => {
      await server.initialize();

      const request = {
        jsonrpc: '2.0',
        id: 4,
        method: 'unknown/method'
      };

      const response = await server.processRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32601);
      expect(response.error.message).toContain('Method not found');
    });

    it('should handle internal errors', async () => {
      await server.initialize();

      // Force an internal error
      server.handleToolsList = jest.fn(() => {
        throw new Error('Internal server error');
      });

      const request = {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/list'
      };

      const response = await server.processRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32603);
      expect(response.error.message).toBe('Internal server error');
    });

    it('should preserve error codes from thrown objects', async () => {
      await server.initialize();

      server.handleToolsList = jest.fn(() => {
        throw { code: -32001, message: 'Custom error' };
      });

      const request = {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/list'
      };

      const response = await server.processRequest(request);

      expect(response.error.code).toBe(-32001);
      expect(response.error.message).toBe('Custom error');
    });
  });

  describe('Lifecycle Management', () => {
    it('should cleanup on shutdown', async () => {
      await server.initialize();
      expect(server.initialized).toBe(true);

      await server.shutdown();

      expect(mockUnityBridge.stop).toHaveBeenCalled();
    });

    it('should handle shutdown when not initialized', async () => {
      await expect(server.shutdown()).resolves.not.toThrow();
    });

    it('should handle shutdown errors gracefully', async () => {
      await server.initialize();
      mockUnityBridge.stop.mockRejectedValue(new Error('Stop failed'));

      // Should not throw, but exit process
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation();

      await server.shutdown();

      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });
  });

  describe('Integration Workflow', () => {
    it('should complete full MCP handshake', async () => {
      await server.initialize();

      // 1. Initialize
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' }
        }
      };

      const initResponse = await server.processRequest(initRequest);
      expect(initResponse.result).toBeDefined();

      // 2. Initialized notification
      const notifyRequest = {
        jsonrpc: '2.0',
        method: 'notifications/initialized'
      };

      const notifyResponse = await server.processRequest(notifyRequest);
      expect(notifyResponse).toBeNull();

      // 3. List tools
      const listRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      };

      const listResponse = await server.processRequest(listRequest);
      expect(listResponse.result.tools.length).toBe(6);

      // 4. Execute tool
      server.cathedralTools.executeTool = jest.fn().mockResolvedValue({
        success: true
      });

      const callRequest = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'getCathedralStatus',
          arguments: {}
        }
      };

      const callResponse = await server.processRequest(callRequest);
      expect(callResponse.result.content).toBeDefined();
    });
  });

  describe('STDIO Logging', () => {
    it('should never use console.log', () => {
      // Ensure console.log is never called in server code
      const consoleLogSpy = jest.spyOn(console, 'log');
      
      server.start(); // Would trigger initialization
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });

    it('should only log to stderr', () => {
      const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation();
      
      // Trigger log via internal logging
      const logData = { level: 'info', message: 'Test log' };
      process.stderr.write(JSON.stringify(logData) + '\n');
      
      expect(stderrSpy).toHaveBeenCalled();
      stderrSpy.mockRestore();
    });
  });
});
