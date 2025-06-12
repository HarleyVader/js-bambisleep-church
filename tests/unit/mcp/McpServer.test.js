const McpServer = require('../../../src/mcp/McpServer');

describe('McpServer', () => {
  let mcpServer;

  beforeEach(() => {
    mcpServer = new McpServer();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      expect(mcpServer.config).toEqual({});
      expect(mcpServer.initialized).toBe(false);
      expect(mcpServer.tools).toBeInstanceOf(Map);
      expect(mcpServer.tools.size).toBe(0);
    });

    it('should accept custom config', () => {
      const customConfig = { timeout: 5000, debug: true };
      const server = new McpServer(customConfig);
      
      expect(server.config).toEqual(customConfig);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      const result = await mcpServer.initialize();
      
      expect(mcpServer.initialized).toBe(true);
      expect(result).toBe(mcpServer);
    });

    it('should log initialization messages', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await mcpServer.initialize();
      
      expect(consoleSpy).toHaveBeenCalledWith('🚀 MCP Server initializing...');
      expect(consoleSpy).toHaveBeenCalledWith('✅ MCP Server ready');
      
      consoleSpy.mockRestore();
    });
  });

  describe('registerTool', () => {
    it('should register a tool successfully', () => {
      const toolConfig = {
        description: 'Test tool',
        parameters: {
          type: 'object',
          properties: {
            input: { type: 'string' }
          }
        }
      };
      const toolHandler = jest.fn();

      mcpServer.registerTool('test-tool', toolConfig, toolHandler);

      expect(mcpServer.tools.has('test-tool')).toBe(true);
      expect(mcpServer.tools.get('test-tool')).toEqual({
        config: toolConfig,
        handler: toolHandler
      });
    });

    it('should allow overwriting existing tools', () => {
      const firstHandler = jest.fn();
      const secondHandler = jest.fn();
      
      mcpServer.registerTool('test-tool', {}, firstHandler);
      mcpServer.registerTool('test-tool', {}, secondHandler);

      expect(mcpServer.tools.get('test-tool').handler).toBe(secondHandler);
    });
  });

  describe('callTool', () => {
    beforeEach(() => {
      const toolHandler = jest.fn().mockResolvedValue({ success: true, result: 'test result' });
      mcpServer.registerTool('test-tool', {}, toolHandler);
    });

    it('should call existing tool successfully', async () => {
      const params = { input: 'test input' };
      const result = await mcpServer.callTool('test-tool', params);

      expect(result).toEqual({ success: true, result: 'test result' });
      expect(mcpServer.tools.get('test-tool').handler).toHaveBeenCalledWith(params);
    });

    it('should handle missing parameters', async () => {
      const result = await mcpServer.callTool('test-tool');

      expect(mcpServer.tools.get('test-tool').handler).toHaveBeenCalledWith({});
    });

    it('should return error for non-existent tool', async () => {
      const result = await mcpServer.callTool('non-existent-tool');

      expect(result).toEqual({
        success: false,
        error: "Tool 'non-existent-tool' not found"
      });
    });

    it('should catch and return handler errors', async () => {
      const errorHandler = jest.fn().mockRejectedValue(new Error('Tool execution failed'));
      mcpServer.registerTool('error-tool', {}, errorHandler);

      const result = await mcpServer.callTool('error-tool');

      expect(result).toEqual({
        success: false,
        error: 'Tool execution failed'
      });
    });
  });

  describe('getStatus', () => {
    it('should return correct status when not initialized', () => {
      const status = mcpServer.getStatus();

      expect(status.status).toBe('initializing');
      expect(status.toolCount).toBe(0);
      expect(status.timestamp).toBeDefined();
      expect(new Date(status.timestamp)).toBeInstanceOf(Date);
    });

    it('should return correct status when initialized', async () => {
      await mcpServer.initialize();
      mcpServer.registerTool('test-tool', {}, jest.fn());

      const status = mcpServer.getStatus();

      expect(status.status).toBe('ready');
      expect(status.toolCount).toBe(1);
      expect(status.timestamp).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple tools registration and execution', async () => {
      await mcpServer.initialize();

      // Register multiple tools
      mcpServer.registerTool('add', {}, (params) => Promise.resolve({ result: params.a + params.b }));
      mcpServer.registerTool('multiply', {}, (params) => Promise.resolve({ result: params.a * params.b }));
      mcpServer.registerTool('echo', {}, (params) => Promise.resolve({ result: params.message }));

      // Test all tools
      const addResult = await mcpServer.callTool('add', { a: 5, b: 3 });
      const multiplyResult = await mcpServer.callTool('multiply', { a: 4, b: 7 });
      const echoResult = await mcpServer.callTool('echo', { message: 'hello world' });

      expect(addResult).toEqual({ result: 8 });
      expect(multiplyResult).toEqual({ result: 28 });
      expect(echoResult).toEqual({ result: 'hello world' });
      expect(mcpServer.getStatus().toolCount).toBe(3);
    });

    it('should maintain tool isolation', async () => {
      const tool1State = { counter: 0 };
      const tool2State = { counter: 100 };

      mcpServer.registerTool('increment1', {}, () => {
        tool1State.counter++;
        return Promise.resolve({ counter: tool1State.counter });
      });

      mcpServer.registerTool('increment2', {}, () => {
        tool2State.counter++;
        return Promise.resolve({ counter: tool2State.counter });
      });

      const result1a = await mcpServer.callTool('increment1');
      const result2a = await mcpServer.callTool('increment2');
      const result1b = await mcpServer.callTool('increment1');

      expect(result1a).toEqual({ counter: 1 });
      expect(result2a).toEqual({ counter: 101 });
      expect(result1b).toEqual({ counter: 2 });
    });
  });
});
