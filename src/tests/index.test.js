/**
 * BambiSleep™ Church - Main Entry Point Tests
 * Comprehensive test coverage for application initialization and lifecycle
 * Targets: 100% branches, functions, lines, statements
 */

const { EventEmitter } = require('events');

// Mock dependencies before requiring main module
jest.mock('../mcp/orchestrator');
jest.mock('../unity/unity-bridge');
jest.mock('../utils/logger');

// Mock process.exit to prevent tests from exiting
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

const MCPOrchestrator = require('../mcp/orchestrator');
const UnityBridge = require('../unity/unity-bridge');
const Logger = require('../utils/logger');

describe('Main Application (index.js)', () => {
  let mockOrchestrator;
  let mockUnityBridge;
  let mockLogger;
  let indexModule;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset environment variables
    process.env.LOG_LEVEL = 'INFO';
    delete process.env.UNITY_ENABLED;
    delete process.env.MONGODB_CONNECTION_STRING;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.HUGGINGFACE_HUB_TOKEN;
    delete process.env.AZURE_QUANTUM_WORKSPACE_ID;
    delete process.env.CLARITY_PROJECT_ID;

    // Mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    Logger.mockImplementation(() => mockLogger);

    // Mock orchestrator with EventEmitter
    mockOrchestrator = new EventEmitter();
    mockOrchestrator.registerServer = jest.fn();
    mockOrchestrator.startAll = jest.fn().mockResolvedValue(3);
    mockOrchestrator.stopAll = jest.fn().mockResolvedValue(3);
    mockOrchestrator.shutdown = jest.fn().mockResolvedValue(true);
    mockOrchestrator.getStats = jest.fn().mockReturnValue({
      total: 3,
      running: 3,
      stopped: 0,
      error: 0
    });
    mockOrchestrator.getAllStatus = jest.fn().mockReturnValue({
      filesystem: { state: 'RUNNING', pid: 1001, healthStatus: 'healthy' },
      git: { state: 'RUNNING', pid: 1002, healthStatus: 'healthy' },
      github: { state: 'RUNNING', pid: 1003, healthStatus: 'healthy' }
    });
    MCPOrchestrator.mockImplementation(() => mockOrchestrator);

    // Mock Unity bridge with EventEmitter
    mockUnityBridge = new EventEmitter();
    mockUnityBridge.start = jest.fn().mockResolvedValue(true);
    mockUnityBridge.stop = jest.fn().mockResolvedValue(true);
    mockUnityBridge.isRunning = jest.fn().mockReturnValue(false);
    UnityBridge.mockImplementation(() => mockUnityBridge);

    // Clear module cache to get fresh instance
    jest.resetModules();
  });

  afterEach(() => {
    mockExit.mockClear();
  });

  describe('Configuration', () => {
    it('should export CONFIG with default values', () => {
      indexModule = require('../index');

      expect(indexModule.CONFIG).toEqual({
        port: 3000,
        docsPort: 4000,
        workspacePath: expect.any(String),
        healthCheckInterval: 30000,
        autoRestart: true,
        maxRestartAttempts: 3
      });
    });

    it('should respect environment variable overrides', () => {
      process.env.PORT = '5000';
      process.env.DOCS_PORT = '6000';
      process.env.HEALTH_CHECK_INTERVAL = '60000';
      process.env.AUTO_RESTART = 'false';
      process.env.MAX_RESTART_ATTEMPTS = '5';

      indexModule = require('../index');

      expect(indexModule.CONFIG.port).toBe(5000);
      expect(indexModule.CONFIG.docsPort).toBe(6000);
      expect(indexModule.CONFIG.healthCheckInterval).toBe(60000);
      expect(indexModule.CONFIG.autoRestart).toBe(false);
      expect(indexModule.CONFIG.maxRestartAttempts).toBe(5);
    });

    it('should include core MCP servers by default', () => {
      indexModule = require('../index');

      expect(indexModule.MCP_SERVERS).toHaveProperty('filesystem');
      expect(indexModule.MCP_SERVERS).toHaveProperty('git');
      expect(indexModule.MCP_SERVERS).toHaveProperty('github');
    });

    it('should include mongodb server if environment variable set', () => {
      process.env.MONGODB_CONNECTION_STRING = 'mongodb://localhost:27017';
      
      indexModule = require('../index');

      expect(indexModule.MCP_SERVERS).toHaveProperty('mongodb');
      expect(indexModule.MCP_SERVERS.mongodb.args).toContain('mongodb://localhost:27017');
    });

    it('should include stripe server if environment variable set', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      
      indexModule = require('../index');

      expect(indexModule.MCP_SERVERS).toHaveProperty('stripe');
    });

    it('should include huggingface server if environment variable set', () => {
      process.env.HUGGINGFACE_HUB_TOKEN = 'hf_123';
      
      indexModule = require('../index');

      expect(indexModule.MCP_SERVERS).toHaveProperty('huggingface');
    });

    it('should include azure-quantum server if environment variable set', () => {
      process.env.AZURE_QUANTUM_WORKSPACE_ID = 'azure_123';
      
      indexModule = require('../index');

      expect(indexModule.MCP_SERVERS).toHaveProperty('azure-quantum');
    });

    it('should include clarity server if environment variable set', () => {
      process.env.CLARITY_PROJECT_ID = 'clarity_123';
      
      indexModule = require('../index');

      expect(indexModule.MCP_SERVERS).toHaveProperty('clarity');
    });

    it('should include all 8 servers when all environment variables set', () => {
      process.env.MONGODB_CONNECTION_STRING = 'mongodb://localhost:27017';
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.HUGGINGFACE_HUB_TOKEN = 'hf_123';
      process.env.AZURE_QUANTUM_WORKSPACE_ID = 'azure_123';
      process.env.CLARITY_PROJECT_ID = 'clarity_123';
      
      indexModule = require('../index');

      expect(Object.keys(indexModule.MCP_SERVERS)).toHaveLength(8);
    });
  });

  describe('Initialization', () => {
    beforeEach(() => {
      indexModule = require('../index');
    });

    it('should initialize orchestrator with correct config', () => {
      expect(MCPOrchestrator).toHaveBeenCalledWith({
        workspacePath: expect.any(String),
        healthCheckInterval: 30000,
        autoRestart: true,
        maxRestartAttempts: 3
      });
    });

    it('should initialize Unity bridge with correct config', () => {
      expect(UnityBridge).toHaveBeenCalledWith({
        unityPath: '/opt/unity/Editor/Unity',
        projectPath: expect.stringContaining('unity-projects/cathedral-renderer'),
        renderOnStart: true,
        logger: expect.any(Object)
      });
    });

    it('should register all MCP servers on initialization', async () => {
      await indexModule.initialize();

      expect(mockOrchestrator.registerServer).toHaveBeenCalledWith('filesystem', expect.any(Object));
      expect(mockOrchestrator.registerServer).toHaveBeenCalledWith('git', expect.any(Object));
      expect(mockOrchestrator.registerServer).toHaveBeenCalledWith('github', expect.any(Object));
      expect(mockOrchestrator.registerServer).toHaveBeenCalledTimes(3);
    });

    it('should start all MCP servers on initialization', async () => {
      await indexModule.initialize();

      expect(mockOrchestrator.startAll).toHaveBeenCalled();
    });

    it('should start Unity bridge if UNITY_ENABLED is not false', async () => {
      await indexModule.initialize();

      expect(mockUnityBridge.start).toHaveBeenCalled();
    });

    it('should skip Unity bridge if UNITY_ENABLED is false', async () => {
      process.env.UNITY_ENABLED = 'false';
      
      await indexModule.initialize();

      expect(mockUnityBridge.start).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Unity Cathedral Renderer disabled')
      );
    });

    it('should log initialization progress', async () => {
      await indexModule.initialize();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('BambiSleep™ Church MCP Control Tower starting'),
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('initialization complete'),
        expect.any(Object)
      );
    });

    it('should return true on successful initialization', async () => {
      const result = await indexModule.initialize();

      expect(result).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      mockOrchestrator.startAll.mockRejectedValue(new Error('Server failed'));

      await expect(indexModule.initialize()).rejects.toThrow('Server failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize'),
        expect.objectContaining({ error: 'Server failed' })
      );
    });
  });

  describe('Event Handlers', () => {
    beforeEach(() => {
      indexModule = require('../index');
    });

    it('should handle orchestrator server:registered event', () => {
      mockOrchestrator.emit('server:registered', { name: 'test-server' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Registered MCP server: test-server')
      );
    });

    it('should handle orchestrator server:started event', () => {
      mockOrchestrator.emit('server:started', {
        name: 'test-server',
        server: { pid: 12345 }
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Started MCP server: test-server'),
        expect.objectContaining({ pid: 12345 })
      );
    });

    it('should handle orchestrator server:stopped event', () => {
      mockOrchestrator.emit('server:stopped', { name: 'test-server', code: 0 });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Stopped MCP server: test-server'),
        expect.objectContaining({ exitCode: 0 })
      );
    });

    it('should handle orchestrator server:error event', () => {
      mockOrchestrator.emit('server:error', {
        name: 'test-server',
        error: new Error('Test error')
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in MCP server: test-server'),
        expect.objectContaining({ error: 'Test error' })
      );
    });

    it('should handle orchestrator server:unhealthy event', () => {
      mockOrchestrator.emit('server:unhealthy', { name: 'test-server' });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Unhealthy MCP server: test-server')
      );
    });

    it('should handle Unity unity:starting event', () => {
      mockUnityBridge.emit('unity:starting');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Unity Cathedral Renderer initializing')
      );
    });

    it('should handle Unity unity:started event', () => {
      mockUnityBridge.emit('unity:started', { pid: 54321 });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Unity Cathedral Renderer started'),
        expect.objectContaining({ pid: 54321 })
      );
    });

    it('should handle Unity unity:error event', () => {
      mockUnityBridge.emit('unity:error', { error: 'Unity error' });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Unity error'),
        expect.objectContaining({ error: 'Unity error' })
      );
    });
  });

  describe('Shutdown', () => {
    beforeEach(() => {
      indexModule = require('../index');
    });

    it('should stop Unity bridge before orchestrator on shutdown', async () => {
      mockUnityBridge.isRunning.mockReturnValue(true);

      await indexModule.shutdown('SIGTERM');

      expect(mockUnityBridge.stop).toHaveBeenCalled();
      expect(mockOrchestrator.shutdown).toHaveBeenCalled();
      
      // Verify Unity stopped before orchestrator
      const unityStopOrder = mockUnityBridge.stop.mock.invocationCallOrder[0];
      const orchestratorStopOrder = mockOrchestrator.shutdown.mock.invocationCallOrder[0];
      expect(unityStopOrder).toBeLessThan(orchestratorStopOrder);
    });

    it('should skip Unity stop if not running', async () => {
      mockUnityBridge.isRunning.mockReturnValue(false);

      await indexModule.shutdown('SIGTERM');

      expect(mockUnityBridge.stop).not.toHaveBeenCalled();
      expect(mockOrchestrator.shutdown).toHaveBeenCalled();
    });

    it('should exit with code 0 on successful shutdown', async () => {
      await indexModule.shutdown('SIGTERM');

      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('should exit with code 1 on shutdown error', async () => {
      mockOrchestrator.shutdown.mockRejectedValue(new Error('Shutdown failed'));

      await indexModule.shutdown('SIGTERM');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error during shutdown'),
        expect.any(Object)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should log shutdown signal', async () => {
      await indexModule.shutdown('SIGINT');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Received SIGINT')
      );
    });
  });

  describe('Signal Handlers', () => {
    beforeEach(() => {
      indexModule = require('../index');
    });

    it('should handle SIGTERM signal', async () => {
      const shutdownSpy = jest.spyOn(indexModule, 'shutdown').mockResolvedValue();

      process.emit('SIGTERM');
      await new Promise(resolve => setImmediate(resolve));

      expect(shutdownSpy).toHaveBeenCalledWith('SIGTERM');
      
      shutdownSpy.mockRestore();
    });

    it('should handle SIGINT signal', async () => {
      const shutdownSpy = jest.spyOn(indexModule, 'shutdown').mockResolvedValue();

      process.emit('SIGINT');
      await new Promise(resolve => setImmediate(resolve));

      expect(shutdownSpy).toHaveBeenCalledWith('SIGINT');
      
      shutdownSpy.mockRestore();
    });

    it('should handle uncaughtException', async () => {
      const shutdownSpy = jest.spyOn(indexModule, 'shutdown').mockResolvedValue();
      const testError = new Error('Uncaught error');

      process.emit('uncaughtException', testError);
      await new Promise(resolve => setImmediate(resolve));

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Uncaught exception'),
        expect.any(Object)
      );
      expect(shutdownSpy).toHaveBeenCalledWith('UNCAUGHT_EXCEPTION');
      
      shutdownSpy.mockRestore();
    });

    it('should handle unhandledRejection', async () => {
      const testReason = 'Promise rejection reason';

      process.emit('unhandledRejection', testReason, Promise.resolve());
      await new Promise(resolve => setImmediate(resolve));

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Unhandled promise rejection'),
        expect.objectContaining({ reason: testReason })
      );
    });
  });

  describe('Module Exports', () => {
    it('should export orchestrator instance', () => {
      indexModule = require('../index');

      expect(indexModule.orchestrator).toBeDefined();
      expect(indexModule.orchestrator).toBe(mockOrchestrator);
    });

    it('should export initialize function', () => {
      indexModule = require('../index');

      expect(typeof indexModule.initialize).toBe('function');
    });

    it('should export shutdown function', () => {
      indexModule = require('../index');

      expect(typeof indexModule.shutdown).toBe('function');
    });

    it('should export CONFIG object', () => {
      indexModule = require('../index');

      expect(indexModule.CONFIG).toBeDefined();
      expect(typeof indexModule.CONFIG).toBe('object');
    });

    it('should export MCP_SERVERS object', () => {
      indexModule = require('../index');

      expect(indexModule.MCP_SERVERS).toBeDefined();
      expect(typeof indexModule.MCP_SERVERS).toBe('object');
    });
  });
});
