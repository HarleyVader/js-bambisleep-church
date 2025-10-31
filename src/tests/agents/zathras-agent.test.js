/**
 * Tests for Zathras Agent
 * Target: 100% coverage (branches, functions, lines, statements)
 * 
 * "Zathras tested. Zathras verified. Zathras have no bugs... mostly."
 */

const ZathrasAgent = require('../../agents/ZathrasAgent');
const MCPOrchestrator = require('../../mcp/orchestrator');
const UnityBridge = require('../../unity/unity-bridge');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('../../mcp/orchestrator');
jest.mock('../../unity/unity-bridge');
jest.mock('fs');
jest.mock('child_process');

describe('ZathrasAgent', () => {
  let zathras;
  let mockOrchestrator;
  let mockUnity;

  const mockMCPConfigString = '{"mcp.servers":{"filesystem":{"command":"npx","args":["-y","@modelcontextprotocol/server-filesystem"],"type":"stdio"},"github":{"type":"http","url":"https://api.githubcopilot.com/mcp/"},"cathedral":{"command":"node","args":["src/mcp/cathedral-server.js"],"type":"stdio"}}}';

  beforeEach(() => {
    // Mock fs.existsSync and fs.readFileSync
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(mockMCPConfigString);

    // Create mock orchestrator
    mockOrchestrator = new EventEmitter();
    mockOrchestrator.registerServer = jest.fn();
    mockOrchestrator.startServer = jest.fn().mockResolvedValue(true);
    mockOrchestrator.stopServer = jest.fn().mockResolvedValue(true);
    mockOrchestrator.stopAll = jest.fn().mockResolvedValue(true);
    mockOrchestrator.servers = new Map();
    mockOrchestrator.servers.set('filesystem', {
      state: 'running',
      pid: 12345,
      startTime: Date.now()
    });
    MCPOrchestrator.mockImplementation(() => mockOrchestrator);

    // Create mock Unity bridge
    mockUnity = new EventEmitter();
    mockUnity.startRenderer = jest.fn().mockResolvedValue(true);
    mockUnity.stopRenderer = jest.fn().mockResolvedValue(true);
    mockUnity.sendCommand = jest.fn().mockResolvedValue({ success: true });
    mockUnity.isRunning = false;
    UnityBridge.mockImplementation(() => mockUnity);

    // Create Zathras agent
    zathras = new ZathrasAgent({
      workspacePath: '/test/workspace',
      unityEnabled: true,
      logLevel: 'DEBUG'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (zathras) {
      zathras.removeAllListeners();
    }
  });

  describe('Constructor', () => {
    it('should initialize with default config', () => {
      const agent = new ZathrasAgent();
      expect(agent.config.mcpConfigPath).toBe('.vscode/settings.json');
      expect(agent.config.workspacePath).toBe(process.cwd());
      expect(agent.config.unityEnabled).toBe(true);
      expect(agent.config.maxWorkflowSteps).toBe(50);
      expect(agent.config.timeout).toBe(300000);
    });

    it('should initialize with custom config', () => {
      expect(zathras.config.workspacePath).toBe('/test/workspace');
      expect(zathras.config.unityEnabled).toBe(true);
      expect(zathras.config.logLevel).toBe('DEBUG');
    });

    it('should be an EventEmitter', () => {
      expect(zathras).toBeInstanceOf(EventEmitter);
    });

    it('should start uninitialized', () => {
      expect(zathras.isInitialized).toBe(false);
      expect(zathras.orchestrator).toBe(null);
      expect(zathras.unity).toBe(null);
    });
  });

  describe('initialize()', () => {
    it('should initialize successfully', async () => {
      await zathras.initialize();

      expect(zathras.isInitialized).toBe(true);
      expect(zathras.orchestrator).toBeDefined();
      expect(zathras.unity).toBeDefined();
      expect(zathras.mcpServers.size).toBe(3);
    });

    it('should emit initialized event', async () => {
      const listener = jest.fn();
      zathras.on('initialized', listener);

      await zathras.initialize();

      expect(listener).toHaveBeenCalledWith({
        mcpServers: expect.arrayContaining(['filesystem', 'github', 'cathedral']),
        unityEnabled: true
      });
    });

    it('should register MCP servers with orchestrator', async () => {
      await zathras.initialize();

      expect(mockOrchestrator.registerServer).toHaveBeenCalledTimes(3);
      expect(mockOrchestrator.registerServer).toHaveBeenCalledWith(
        'filesystem',
        expect.objectContaining({ command: 'npx', type: 'stdio' })
      );
    });

    it('should not initialize twice', async () => {
      await zathras.initialize();
      const listener = jest.fn();
      zathras.on('initialized', listener);

      await zathras.initialize();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      fs.existsSync.mockReturnValue(false);
      const errorListener = jest.fn();
      zathras.on('error', errorListener);

      await expect(zathras.initialize()).rejects.toThrow();
      expect(errorListener).toHaveBeenCalled();
    });

    it('should initialize without Unity if disabled', async () => {
      const agent = new ZathrasAgent({
        workspacePath: '/test/workspace',
        unityEnabled: false
      });
      
      await agent.initialize();

      expect(agent.unity).toBe(null);
    });
  });

  describe('loadMCPConfig()', () => {
    it('should load MCP server configuration', async () => {
      await zathras.loadMCPConfig();

      expect(zathras.mcpServers.size).toBe(3);
      expect(zathras.mcpServers.has('filesystem')).toBe(true);
      expect(zathras.mcpServers.has('github')).toBe(true);
      expect(zathras.mcpServers.has('cathedral')).toBe(true);
    });

    it('should handle missing config file', async () => {
      fs.existsSync.mockReturnValue(false);

      await expect(zathras.loadMCPConfig()).rejects.toThrow('MCP config not found');
    });

    it('should handle invalid JSON', async () => {
      fs.readFileSync.mockReturnValue('invalid json');

      await expect(zathras.loadMCPConfig()).rejects.toThrow();
    });

    it('should handle missing mcp.servers section', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({}));

      await expect(zathras.loadMCPConfig()).rejects.toThrow('No mcp.servers configuration found');
    });

    it('should strip comments from JSONC', async () => {
      const jsonc = `{
        // Comment
        "mcp.servers": {
          /* Block comment */
          "test": { "command": "node" }
        }
      }`;
      fs.readFileSync.mockReturnValue(jsonc);

      await zathras.loadMCPConfig();

      expect(zathras.mcpServers.size).toBe(1);
    });
  });

  describe('initializeUnity()', () => {
    it('should initialize Unity bridge', async () => {
      await zathras.initialize();

      expect(zathras.unity).toBeDefined();
      expect(UnityBridge).toHaveBeenCalledWith({
        unityPath: undefined,
        projectPath: expect.stringContaining('unity-projects/cathedral-renderer')
      });
    });

    it('should setup Unity event handlers', async () => {
      await zathras.initialize();

      mockUnity.emit('renderer:started', { pid: 99999 });
      mockUnity.emit('renderer:stopped', { code: 0 });
      mockUnity.emit('renderer:error', { error: new Error('test') });

      // Verify events propagate
      expect(zathras.listenerCount('unity:started')).toBeGreaterThan(0);
    });

    it('should handle Unity initialization error', async () => {
      UnityBridge.mockImplementation(() => {
        throw new Error('Unity not found');
      });

      const agent = new ZathrasAgent({ unityEnabled: true });
      await expect(agent.initialize()).rejects.toThrow();
    });
  });

  describe('setupOrchestratorEvents()', () => {
    it('should setup orchestrator event handlers', async () => {
      await zathras.initialize();

      mockOrchestrator.emit('server:started', { name: 'test', server: {} });
      mockOrchestrator.emit('server:stopped', { name: 'test', server: {}, code: 0 });
      mockOrchestrator.emit('server:error', { name: 'test', server: {}, error: new Error() });

      // Verify events propagate
      expect(zathras.listenerCount('server:started')).toBeGreaterThan(0);
    });
  });

  describe('callServer()', () => {
    beforeEach(async () => {
      await zathras.initialize();
    });

    it('should call MCP server successfully', async () => {
      const result = await zathras.callServer('filesystem', 'read_file', { path: '/test.txt' });

      expect(mockOrchestrator.startServer).toHaveBeenCalledWith('filesystem');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should emit server:call event', async () => {
      const listener = jest.fn();
      zathras.on('server:call', listener);

      await zathras.callServer('filesystem', 'read_file', {});

      expect(listener).toHaveBeenCalledWith({
        serverName: 'filesystem',
        tool: 'read_file',
        parameters: {}
      });
    });

    it('should emit server:response event', async () => {
      const listener = jest.fn();
      zathras.on('server:response', listener);

      await zathras.callServer('filesystem', 'read_file', {});

      expect(listener).toHaveBeenCalledWith({
        serverName: 'filesystem',
        tool: 'read_file',
        result: expect.any(Object)
      });
    });

    it('should throw if not initialized', async () => {
      const agent = new ZathrasAgent();
      await expect(agent.callServer('test', 'tool')).rejects.toThrow('not initialized');
    });

    it('should throw if server not configured', async () => {
      await expect(zathras.callServer('nonexistent', 'tool')).rejects.toThrow('not configured');
    });

    it('should start server if not running', async () => {
      mockOrchestrator.servers.set('github', { state: 'stopped' });

      await zathras.callServer('github', 'list_repos', {});

      expect(mockOrchestrator.startServer).toHaveBeenCalledWith('github');
    });

    it('should emit error event on failure', async () => {
      mockOrchestrator.startServer.mockRejectedValue(new Error('Start failed'));
      const listener = jest.fn();
      zathras.on('server:call-error', listener);

      await expect(zathras.callServer('filesystem', 'test')).rejects.toThrow();
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('waitForServerReady()', () => {
    beforeEach(async () => {
      await zathras.initialize();
    });

    it('should wait for server to be ready', async () => {
      mockOrchestrator.servers.set('test', { state: 'running' });

      const result = await zathras.waitForServerReady('test');
      expect(result).toBe(true);
    });

    it('should timeout if server does not start', async () => {
      mockOrchestrator.servers.set('test', { state: 'starting' });

      await expect(zathras.waitForServerReady('test', 100)).rejects.toThrow('did not start');
    });
  });

  describe('executeWorkflow()', () => {
    beforeEach(async () => {
      await zathras.initialize();
    });

    it('should execute multi-step workflow', async () => {
      const workflow = {
        name: 'test-workflow',
        steps: [
          { server: 'filesystem', action: 'read_file', parameters: { path: '/test.txt' } },
          { server: 'github', action: 'list_repos', parameters: {} }
        ]
      };

      const result = await zathras.executeWorkflow(workflow);

      expect(result.state).toBe('completed');
      expect(result.results).toHaveLength(2);
    });

    it('should emit workflow events', async () => {
      const startListener = jest.fn();
      const stepListener = jest.fn();
      const completeListener = jest.fn();

      zathras.on('workflow:started', startListener);
      zathras.on('workflow:step', stepListener);
      zathras.on('workflow:complete', completeListener);

      const workflow = {
        name: 'test',
        steps: [{ server: 'filesystem', action: 'test' }]
      };

      await zathras.executeWorkflow(workflow);

      expect(startListener).toHaveBeenCalled();
      expect(stepListener).toHaveBeenCalled();
      expect(completeListener).toHaveBeenCalled();
    });

    it('should throw if not initialized', async () => {
      const agent = new ZathrasAgent();
      await expect(agent.executeWorkflow({ name: 'test', steps: [] }))
        .rejects.toThrow('not initialized');
    });

    it('should handle workflow failure', async () => {
      mockOrchestrator.startServer.mockRejectedValue(new Error('Server error'));
      const listener = jest.fn();
      zathras.on('workflow:failed', listener);

      const workflow = {
        name: 'test',
        steps: [{ server: 'filesystem', action: 'test' }]
      };

      await expect(zathras.executeWorkflow(workflow)).rejects.toThrow();
      expect(listener).toHaveBeenCalled();
    });

    it('should store workflow in history', async () => {
      const workflow = {
        name: 'test',
        steps: [{ server: 'filesystem', action: 'test' }]
      };

      await zathras.executeWorkflow(workflow);

      expect(zathras.workflowHistory).toHaveLength(1);
      expect(zathras.workflowHistory[0].name).toBe('test');
    });

    it('should execute Unity workflow steps', async () => {
      const workflow = {
        name: 'unity-test',
        steps: [
          { server: 'cathedral', action: 'updateStyle', data: { neonIntensity: 7.5 } }
        ]
      };

      await zathras.executeWorkflow(workflow);

      expect(zathras.workflowHistory[0].results).toHaveLength(1);
    });
  });

  describe('executeUnityStep()', () => {
    beforeEach(async () => {
      await zathras.initialize();
    });

    it('should execute updateStyle action', async () => {
      const step = { action: 'updateStyle', data: { neonIntensity: 8.0 } };
      const result = await zathras.executeUnityStep(step);

      expect(result).toBeDefined();
    });

    it('should execute renderSnapshot action', async () => {
      const step = { action: 'renderSnapshot', data: { width: 1920, height: 1080 } };
      const result = await zathras.executeUnityStep(step);

      expect(result).toBeDefined();
    });

    it('should execute custom Unity commands', async () => {
      const step = { action: 'customCommand', data: {} };
      const result = await zathras.executeUnityStep(step);

      expect(result).toBeDefined();
    });

    it('should throw if Unity not initialized', async () => {
      zathras.unity = null;
      await expect(zathras.executeUnityStep({ action: 'test' }))
        .rejects.toThrow('Unity bridge not initialized');
    });
  });

  describe('unityCommand()', () => {
    beforeEach(async () => {
      await zathras.initialize();
    });

    it('should send command to Unity', async () => {
      mockUnity.isRunning = true;
      const result = await zathras.unityCommand('test', { param: 'value' });

      expect(mockUnity.sendCommand).toHaveBeenCalledWith({
        type: 'zathras:test',
        timestamp: expect.any(String),
        data: { param: 'value' }
      });
    });

    it('should start Unity if not running', async () => {
      mockUnity.isRunning = false;
      
      // Setup Unity ready event
      setTimeout(() => mockUnity.emit('cathedral:ready'), 50);

      await zathras.unityCommand('test', {});

      expect(mockUnity.startRenderer).toHaveBeenCalled();
    });

    it('should timeout if Unity does not start', async () => {
      mockUnity.isRunning = false;

      await expect(zathras.unityCommand('test', {})).rejects.toThrow('Unity startup timeout');
    });
  });

  describe('getServerStatus()', () => {
    beforeEach(async () => {
      await zathras.initialize();
    });

    it('should return status of all servers', () => {
      const status = zathras.getServerStatus();

      expect(status).toBeDefined();
      expect(status.filesystem).toBeDefined();
      expect(status.filesystem.state).toBe('running');
      expect(status.filesystem.pid).toBe(12345);
    });

    it('should calculate uptime', () => {
      const status = zathras.getServerStatus();
      expect(status.filesystem.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('shutdown()', () => {
    beforeEach(async () => {
      await zathras.initialize();
    });

    it('should shutdown successfully', async () => {
      await zathras.shutdown();

      expect(mockOrchestrator.stopAll).toHaveBeenCalled();
      expect(zathras.isInitialized).toBe(false);
    });

    it('should emit shutdown events', async () => {
      const startListener = jest.fn();
      const completeListener = jest.fn();

      zathras.on('shutdown:started', startListener);
      zathras.on('shutdown:complete', completeListener);

      await zathras.shutdown();

      expect(startListener).toHaveBeenCalled();
      expect(completeListener).toHaveBeenCalled();
    });

    it('should stop Unity if running', async () => {
      mockUnity.isRunning = true;

      await zathras.shutdown();

      expect(mockUnity.stopRenderer).toHaveBeenCalled();
    });

    it('should handle shutdown errors', async () => {
      mockOrchestrator.stopAll.mockRejectedValue(new Error('Stop failed'));
      const listener = jest.fn();
      zathras.on('shutdown:error', listener);

      await expect(zathras.shutdown()).rejects.toThrow();
      expect(listener).toHaveBeenCalled();
    });
  });
});
