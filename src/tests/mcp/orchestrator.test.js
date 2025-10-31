/**
 * Tests for MCP Orchestrator
 * Target: 100% coverage (branches, functions, lines, statements)
 */

const MCPOrchestrator = require('../../mcp/orchestrator');
const { SERVER_STATES } = require('../../mcp/orchestrator');
const EventEmitter = require('events');

// Mock child_process
jest.mock('child_process');
const { spawn } = require('child_process');

describe('MCPOrchestrator', () => {
  let orchestrator;
  let mockProcess;

  beforeEach(() => {
    // Create mock process
    mockProcess = new EventEmitter();
    mockProcess.pid = 12345;
    mockProcess.exitCode = null;
    mockProcess.kill = jest.fn();
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();

    // Mock spawn to return our mock process
    spawn.mockReturnValue(mockProcess);

    orchestrator = new MCPOrchestrator({
      workspacePath: '/test/workspace',
      healthCheckInterval: 1000,
      autoRestart: true,
      maxRestartAttempts: 3,
      restartDelay: 100
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    if (orchestrator) {
      orchestrator.removeAllListeners();
    }
  });

  describe('Constructor', () => {
    it('should initialize with default config', () => {
      const orch = new MCPOrchestrator();
      expect(orch.config).toEqual({});
      expect(orch.servers).toBeInstanceOf(Map);
      expect(orch.healthCheckInterval).toBe(30000);
      expect(orch.autoRestart).toBe(true);
      expect(orch.maxRestartAttempts).toBe(3);
    });

    it('should initialize with custom config', () => {
      expect(orchestrator.workspacePath).toBe('/test/workspace');
      expect(orchestrator.healthCheckInterval).toBe(1000);
      expect(orchestrator.autoRestart).toBe(true);
      expect(orchestrator.maxRestartAttempts).toBe(3);
    });

    it('should be an EventEmitter', () => {
      expect(orchestrator).toBeInstanceOf(EventEmitter);
    });
  });

  describe('Server Registration', () => {
    it('should register a new server', () => {
      const config = { command: 'node', args: ['server.js'] };
      const result = orchestrator.registerServer('test-server', config);

      expect(result).toBe(true);
      expect(orchestrator.servers.has('test-server')).toBe(true);
      
      const server = orchestrator.servers.get('test-server');
      expect(server.name).toBe('test-server');
      expect(server.config).toEqual(config);
      expect(server.state).toBe(SERVER_STATES.STOPPED);
    });

    it('should emit server:registered event', (done) => {
      orchestrator.on('server:registered', ({ name, server }) => {
        expect(name).toBe('test-server');
        expect(server).toBeDefined();
        done();
      });

      orchestrator.registerServer('test-server', { command: 'node' });
    });

    it('should not register duplicate servers', () => {
      orchestrator.registerServer('test-server', { command: 'node' });
      const result = orchestrator.registerServer('test-server', { command: 'node' });

      expect(result).toBe(false);
      expect(orchestrator.servers.size).toBe(1);
    });
  });

  describe('Server Unregistration', () => {
    beforeEach(() => {
      orchestrator.registerServer('test-server', { command: 'node' });
    });

    it('should unregister a stopped server', async () => {
      const result = await orchestrator.unregisterServer('test-server');

      expect(result).toBe(true);
      expect(orchestrator.servers.has('test-server')).toBe(false);
    });

    it('should stop and unregister a running server', async () => {
      await orchestrator.startServer('test-server');
      const result = await orchestrator.unregisterServer('test-server');

      expect(result).toBe(true);
      expect(orchestrator.servers.has('test-server')).toBe(false);
    });

    it('should emit server:unregistered event', (done) => {
      orchestrator.on('server:unregistered', ({ name }) => {
        expect(name).toBe('test-server');
        done();
      });

      orchestrator.unregisterServer('test-server');
    });

    it('should return false for non-existent server', async () => {
      const result = await orchestrator.unregisterServer('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('Starting Servers', () => {
    beforeEach(() => {
      orchestrator.registerServer('test-server', {
        command: 'node',
        args: ['server.js']
      });
    });

    it('should start a registered server', async () => {
      const result = await orchestrator.startServer('test-server');

      expect(result).toBe(true);
      expect(spawn).toHaveBeenCalledWith('node', ['server.js'], expect.any(Object));
      
      const server = orchestrator.servers.get('test-server');
      expect(server.state).toBe(SERVER_STATES.RUNNING);
      expect(server.pid).toBe(12345);
      expect(server.startTime).toBeDefined();
    });

    it('should emit server:starting and server:started events', (done) => {
      let startingEmitted = false;

      orchestrator.on('server:starting', () => {
        startingEmitted = true;
      });

      orchestrator.on('server:started', ({ name }) => {
        expect(startingEmitted).toBe(true);
        expect(name).toBe('test-server');
        done();
      });

      orchestrator.startServer('test-server');
    });

    it('should throw error for non-existent server', async () => {
      await expect(orchestrator.startServer('non-existent'))
        .rejects.toThrow('Server non-existent not registered');
    });

    it('should not start already running server', async () => {
      await orchestrator.startServer('test-server');
      const result = await orchestrator.startServer('test-server');

      expect(result).toBe(false);
    });

    it('should handle stdout data', (done) => {
      orchestrator.on('server:output', ({ name, type, data }) => {
        expect(name).toBe('test-server');
        expect(type).toBe('stdout');
        expect(data).toBe('test output');
        done();
      });

      orchestrator.startServer('test-server').then(() => {
        mockProcess.stdout.emit('data', Buffer.from('test output'));
      });
    });

    it('should handle stderr data', (done) => {
      orchestrator.on('server:output', ({ name, type, data }) => {
        expect(type).toBe('stderr');
        done();
      });

      orchestrator.startServer('test-server').then(() => {
        mockProcess.stderr.emit('data', Buffer.from('error output'));
      });
    });

    it('should handle process exit', (done) => {
      orchestrator.on('server:stopped', ({ name, code }) => {
        expect(name).toBe('test-server');
        expect(code).toBe(0);
        done();
      });

      orchestrator.startServer('test-server').then(() => {
        mockProcess.emit('exit', 0, null);
      });
    });

    it('should handle process error', (done) => {
      orchestrator.on('server:error', ({ name, error }) => {
        expect(name).toBe('test-server');
        expect(error).toBeDefined();
        done();
      });

      orchestrator.startServer('test-server').then(() => {
        mockProcess.emit('error', new Error('Process error'));
      });
    });

    it('should schedule restart on non-zero exit with autoRestart', (done) => {
      jest.useFakeTimers();
      
      orchestrator.startServer('test-server').then(() => {
        mockProcess.emit('exit', 1, null);
        
        const server = orchestrator.servers.get('test-server');
        expect(server.state).toBe(SERVER_STATES.ERROR);
        
        // Fast-forward time
        jest.advanceTimersByTime(100);
        
        // Should attempt to restart
        expect(spawn).toHaveBeenCalledTimes(2);
        
        jest.useRealTimers();
        done();
      });
    });

    it('should not restart if max attempts reached', (done) => {
      jest.useFakeTimers();
      
      orchestrator.maxRestartAttempts = 1;
      
      orchestrator.startServer('test-server').then(() => {
        const server = orchestrator.servers.get('test-server');
        server.restartAttempts = 1;
        
        mockProcess.emit('exit', 1, null);
        
        jest.advanceTimersByTime(1000);
        
        // Should not restart beyond max attempts
        expect(spawn).toHaveBeenCalledTimes(1);
        
        jest.useRealTimers();
        done();
      });
    });
  });

  describe('Stopping Servers', () => {
    beforeEach(async () => {
      orchestrator.registerServer('test-server', {
        command: 'node',
        args: ['server.js']
      });
      await orchestrator.startServer('test-server');
    });

    it('should stop a running server', async () => {
      const stopPromise = orchestrator.stopServer('test-server');
      
      // Simulate process exit
      mockProcess.emit('exit', 0, 'SIGTERM');
      
      await stopPromise;

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      
      const server = orchestrator.servers.get('test-server');
      expect(server.state).toBe(SERVER_STATES.STOPPED);
      expect(server.process).toBeNull();
    });

    it('should emit server:stopping and server:stopped events', (done) => {
      let stoppingEmitted = false;

      orchestrator.on('server:stopping', () => {
        stoppingEmitted = true;
      });

      orchestrator.on('server:stopped', () => {
        expect(stoppingEmitted).toBe(true);
        done();
      });

      const stopPromise = orchestrator.stopServer('test-server');
      mockProcess.emit('exit', 0);
    });

    it('should force kill if graceful shutdown times out', async () => {
      jest.useFakeTimers();
      
      const stopPromise = orchestrator.stopServer('test-server');
      
      // Fast-forward past timeout
      jest.advanceTimersByTime(6000);
      
      await stopPromise;

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL');
      
      jest.useRealTimers();
    });

    it('should return false if server not running', async () => {
      mockProcess.emit('exit', 0);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = await orchestrator.stopServer('test-server');
      expect(result).toBe(false);
    });

    it('should throw error for non-existent server', async () => {
      await expect(orchestrator.stopServer('non-existent'))
        .rejects.toThrow('Server non-existent not registered');
    });
  });

  describe('Restarting Servers', () => {
    beforeEach(async () => {
      orchestrator.registerServer('test-server', {
        command: 'node',
        args: ['server.js']
      });
      await orchestrator.startServer('test-server');
    });

    it('should restart a server', async () => {
      const restartPromise = orchestrator.restartServer('test-server');
      
      // Simulate first process exit
      mockProcess.emit('exit', 0);
      
      await restartPromise;

      expect(spawn).toHaveBeenCalledTimes(2); // Initial start + restart
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(() => {
      orchestrator.registerServer('server1', { command: 'node', args: ['s1.js'] });
      orchestrator.registerServer('server2', { command: 'node', args: ['s2.js'] });
      orchestrator.registerServer('server3', { command: 'node', args: ['s3.js'] });
    });

    it('should start all servers', async () => {
      const count = await orchestrator.startAll();

      expect(count).toBe(3);
      expect(spawn).toHaveBeenCalledTimes(3);
    });

    it('should emit orchestrator:started event', (done) => {
      orchestrator.on('orchestrator:started', ({ total, success }) => {
        expect(total).toBe(3);
        expect(success).toBe(3);
        done();
      });

      orchestrator.startAll();
    });

    it('should start health checks after startAll', async () => {
      jest.spyOn(orchestrator, 'startHealthChecks');
      await orchestrator.startAll();
      expect(orchestrator.startHealthChecks).toHaveBeenCalled();
    });

    it('should stop all servers', async () => {
      await orchestrator.startAll();
      
      const stopPromise = orchestrator.stopAll();
      
      // Simulate all processes exiting
      mockProcess.emit('exit', 0);
      
      await stopPromise;

      for (const [, server] of orchestrator.servers) {
        expect(server.state).toBe(SERVER_STATES.STOPPED);
      }
    });

    it('should emit orchestrator:stopped event', (done) => {
      orchestrator.startAll().then(() => {
        orchestrator.on('orchestrator:stopped', ({ total, success }) => {
          expect(total).toBeGreaterThan(0);
          done();
        });

        const stopPromise = orchestrator.stopAll();
        mockProcess.emit('exit', 0);
      });
    });

    it('should stop health checks before stopAll', async () => {
      jest.spyOn(orchestrator, 'stopHealthChecks');
      await orchestrator.startAll();
      
      const stopPromise = orchestrator.stopAll();
      mockProcess.emit('exit', 0);
      await stopPromise;
      
      expect(orchestrator.stopHealthChecks).toHaveBeenCalled();
    });
  });

  describe('Server Status', () => {
    beforeEach(async () => {
      orchestrator.registerServer('test-server', {
        command: 'node',
        args: ['server.js']
      });
      await orchestrator.startServer('test-server');
    });

    it('should get status of a specific server', () => {
      const status = orchestrator.getServerStatus('test-server');

      expect(status).toMatchObject({
        name: 'test-server',
        state: SERVER_STATES.RUNNING,
        pid: 12345,
        restartAttempts: 0
      });
      expect(status.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return null for non-existent server', () => {
      const status = orchestrator.getServerStatus('non-existent');
      expect(status).toBeNull();
    });

    it('should get status of all servers', () => {
      orchestrator.registerServer('server2', { command: 'node' });
      
      const statuses = orchestrator.getAllStatus();

      expect(Object.keys(statuses)).toHaveLength(2);
      expect(statuses['test-server']).toBeDefined();
      expect(statuses['server2']).toBeDefined();
    });
  });

  describe('Health Checks', () => {
    beforeEach(async () => {
      orchestrator.registerServer('test-server', {
        command: 'node',
        args: ['server.js']
      });
      await orchestrator.startServer('test-server');
    });

    it('should check health of a running server', async () => {
      const health = await orchestrator.checkServerHealth('test-server');

      expect(health).toBe('healthy');
      
      const server = orchestrator.servers.get('test-server');
      expect(server.healthStatus).toBe('healthy');
      expect(server.lastHealthCheck).toBeDefined();
    });

    it('should detect unhealthy server', async () => {
      mockProcess.exitCode = 1;
      
      const health = await orchestrator.checkServerHealth('test-server');

      expect(health).toBe('unhealthy');
    });

    it('should emit server:unhealthy event', (done) => {
      orchestrator.on('server:unhealthy', ({ name }) => {
        expect(name).toBe('test-server');
        done();
      });

      mockProcess.exitCode = 1;
      orchestrator.checkServerHealth('test-server');
    });

    it('should return stopped status for stopped server', async () => {
      mockProcess.emit('exit', 0);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const health = await orchestrator.checkServerHealth('test-server');
      expect(health).toBe('stopped');
    });

    it('should check health of all servers', async () => {
      orchestrator.registerServer('server2', { command: 'node' });
      await orchestrator.startServer('server2');
      
      const results = await orchestrator.checkAllHealth();

      expect(results).toHaveLength(2);
    });

    it('should start periodic health checks', () => {
      jest.useFakeTimers();
      jest.spyOn(orchestrator, 'checkAllHealth');
      
      orchestrator.startHealthChecks();
      
      expect(orchestrator.healthCheckTimer).toBeDefined();
      
      jest.advanceTimersByTime(1000);
      expect(orchestrator.checkAllHealth).toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('should not start health checks if already running', () => {
      orchestrator.startHealthChecks();
      const timer1 = orchestrator.healthCheckTimer;
      
      orchestrator.startHealthChecks();
      const timer2 = orchestrator.healthCheckTimer;
      
      expect(timer1).toBe(timer2);
      
      orchestrator.stopHealthChecks();
    });

    it('should stop periodic health checks', () => {
      orchestrator.startHealthChecks();
      expect(orchestrator.healthCheckTimer).toBeDefined();
      
      orchestrator.stopHealthChecks();
      expect(orchestrator.healthCheckTimer).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should get orchestrator statistics', async () => {
      orchestrator.registerServer('server1', { command: 'node' });
      orchestrator.registerServer('server2', { command: 'node' });
      orchestrator.registerServer('server3', { command: 'node' });
      
      await orchestrator.startServer('server1');
      await orchestrator.startServer('server2');
      
      const stats = orchestrator.getStats();

      expect(stats.totalServers).toBe(3);
      expect(stats.runningServers).toBe(2);
      expect(stats.stoppedServers).toBe(1);
    });
  });

  describe('Shutdown', () => {
    it('should perform clean shutdown', async () => {
      orchestrator.registerServer('server1', { command: 'node' });
      await orchestrator.startServer('server1');
      orchestrator.startHealthChecks();
      
      const shutdownPromise = orchestrator.shutdown();
      mockProcess.emit('exit', 0);
      await shutdownPromise;

      expect(orchestrator.healthCheckTimer).toBeNull();
      expect(orchestrator.listenerCount('server:started')).toBe(0);
    });
  });

  describe('Module Exports', () => {
    it('should export MCPOrchestrator class', () => {
      expect(MCPOrchestrator).toBeDefined();
      expect(typeof MCPOrchestrator).toBe('function');
    });

    it('should export SERVER_STATES constant', () => {
      expect(SERVER_STATES).toBeDefined();
      expect(SERVER_STATES.STOPPED).toBe('stopped');
      expect(SERVER_STATES.RUNNING).toBe('running');
    });
  });
});
