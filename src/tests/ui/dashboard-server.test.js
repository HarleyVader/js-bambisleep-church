/**
 * BambiSleep™ Church - Dashboard Server Tests
 * Comprehensive test coverage for Express API and WebSocket functionality
 * Targets: 100% branches, functions, lines, statements
 */

const { EventEmitter } = require('events');
const request = require('supertest');
const WebSocket = require('ws');

// Mock dependencies
jest.mock('../../mcp/orchestrator');
jest.mock('../../utils/logger');

const DashboardServer = require('../../ui/dashboard-server');
const MCPOrchestrator = require('../../mcp/orchestrator');
const Logger = require('../../utils/logger');

describe('DashboardServer', () => {
  let dashboardServer;
  let mockOrchestrator;
  let mockLogger;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

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
    mockOrchestrator.getAllServerStatus = jest.fn().mockReturnValue({
      filesystem: { state: 'RUNNING', pid: 1001 },
      git: { state: 'RUNNING', pid: 1002 },
      github: { state: 'STOPPED', pid: null }
    });
    mockOrchestrator.getServerStatus = jest.fn((name) => {
      const statuses = {
        filesystem: { state: 'RUNNING', pid: 1001 },
        git: { state: 'RUNNING', pid: 1002 }
      };
      return statuses[name] || null;
    });
    mockOrchestrator.startServer = jest.fn().mockResolvedValue(true);
    mockOrchestrator.stopServer = jest.fn().mockResolvedValue(true);
    mockOrchestrator.restartServer = jest.fn().mockResolvedValue(true);
    mockOrchestrator.startAll = jest.fn().mockResolvedValue(3);
    mockOrchestrator.stopAll = jest.fn().mockResolvedValue(3);
    MCPOrchestrator.mockImplementation(() => mockOrchestrator);

    // Create dashboard server instance with mock logger
    dashboardServer = new DashboardServer({
      port: 0, // Use random port for testing
      orchestrator: mockOrchestrator,
      logger: mockLogger
    });
  });

  afterEach(async () => {
    // Always cleanup - server is created in constructor
    if (dashboardServer) {
      if (dashboardServer.server && dashboardServer.server.listening) {
        await dashboardServer.stop();
      } else {
        // Server created but not started - force close
        if (dashboardServer.wss) {
          dashboardServer.wss.clients.forEach(client => client.terminate());
          dashboardServer.wss.close();
        }
        if (dashboardServer.server) {
          dashboardServer.connections.forEach(conn => conn.destroy());
          dashboardServer.server.close();
        }
      }
      dashboardServer = null;
    }
  });

  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      expect(dashboardServer.port).toBeDefined();
      expect(dashboardServer.orchestrator).toBe(mockOrchestrator);
      expect(dashboardServer.app).toBeDefined();
      expect(dashboardServer.server).toBeDefined();
      expect(dashboardServer.wss).toBeDefined();
    });

    it('should respect custom port configuration', () => {
      const customServer = new DashboardServer({
        port: 5000,
        orchestrator: mockOrchestrator
      });
      
      expect(customServer.port).toBe(5000);
      
      customServer.stop();
    });

    it('should use environment variable UI_PORT if set', () => {
      process.env.UI_PORT = '6000';
      
      const envServer = new DashboardServer({
        orchestrator: mockOrchestrator
      });
      
      expect(envServer.port).toBe(6000);
      
      delete process.env.UI_PORT;
      envServer.stop();
    });

    it('should log initialization', () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Dashboard server initialized',
        expect.any(Object)
      );
    });
  });

  describe('Express Middleware', () => {
    it('should serve static files from public directory', async () => {
      await dashboardServer.start();
      
      const response = await request(dashboardServer.app)
        .get('/nonexistent.html')
        .expect(404);
    });

    it('should parse JSON request bodies', async () => {
      await dashboardServer.start();
      
      // This will be tested via POST routes
      expect(dashboardServer.app._router).toBeDefined();
    });

    it('should set CORS headers', async () => {
      await dashboardServer.start();
      
      const response = await request(dashboardServer.app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('API Routes', () => {
    beforeEach(async () => {
      await dashboardServer.start();
    });

    describe('GET /', () => {
      it('should serve index.html', async () => {
        const response = await request(dashboardServer.app)
          .get('/')
          .expect(200);
      });
    });

    describe('GET /api/servers', () => {
      it('should return all server statuses', async () => {
        const response = await request(dashboardServer.app)
          .get('/api/servers')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.servers).toEqual({
          filesystem: { state: 'RUNNING', pid: 1001 },
          git: { state: 'RUNNING', pid: 1002 },
          github: { state: 'STOPPED', pid: null }
        });
      });
    });

    describe('GET /api/servers/:name', () => {
      it('should return specific server status', async () => {
        const response = await request(dashboardServer.app)
          .get('/api/servers/filesystem')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.server).toEqual({
          state: 'RUNNING',
          pid: 1001
        });
      });

      it('should return 404 for non-existent server', async () => {
        const response = await request(dashboardServer.app)
          .get('/api/servers/nonexistent')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Server not found');
      });
    });

    describe('POST /api/servers/:name/start', () => {
      it('should start server successfully', async () => {
        const response = await request(dashboardServer.app)
          .post('/api/servers/filesystem/start')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(mockOrchestrator.startServer).toHaveBeenCalledWith('filesystem');
      });

      it('should handle start errors', async () => {
        mockOrchestrator.startServer.mockRejectedValue(new Error('Start failed'));

        const response = await request(dashboardServer.app)
          .post('/api/servers/filesystem/start')
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Start failed');
        expect(mockLogger.error).toHaveBeenCalled();
      });
    });

    describe('POST /api/servers/:name/stop', () => {
      it('should stop server successfully', async () => {
        const response = await request(dashboardServer.app)
          .post('/api/servers/filesystem/stop')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(mockOrchestrator.stopServer).toHaveBeenCalledWith('filesystem');
      });

      it('should handle stop errors', async () => {
        mockOrchestrator.stopServer.mockRejectedValue(new Error('Stop failed'));

        const response = await request(dashboardServer.app)
          .post('/api/servers/filesystem/stop')
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Stop failed');
      });
    });

    describe('POST /api/servers/:name/restart', () => {
      it('should restart server successfully', async () => {
        const response = await request(dashboardServer.app)
          .post('/api/servers/filesystem/restart')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(mockOrchestrator.restartServer).toHaveBeenCalledWith('filesystem');
      });

      it('should handle restart errors', async () => {
        mockOrchestrator.restartServer.mockRejectedValue(new Error('Restart failed'));

        const response = await request(dashboardServer.app)
          .post('/api/servers/filesystem/restart')
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Restart failed');
      });
    });

    describe('POST /api/servers/start-all', () => {
      it('should start all servers successfully', async () => {
        const response = await request(dashboardServer.app)
          .post('/api/servers/start-all')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(mockOrchestrator.startAll).toHaveBeenCalled();
      });

      it('should handle start-all errors', async () => {
        mockOrchestrator.startAll.mockRejectedValue(new Error('Start all failed'));

        const response = await request(dashboardServer.app)
          .post('/api/servers/start-all')
          .expect(500);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/servers/stop-all', () => {
      it('should stop all servers successfully', async () => {
        const response = await request(dashboardServer.app)
          .post('/api/servers/stop-all')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(mockOrchestrator.stopAll).toHaveBeenCalled();
      });

      it('should handle stop-all errors', async () => {
        mockOrchestrator.stopAll.mockRejectedValue(new Error('Stop all failed'));

        const response = await request(dashboardServer.app)
          .post('/api/servers/stop-all')
          .expect(500);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/health', () => {
      it('should return health status', async () => {
        const response = await request(dashboardServer.app)
          .get('/api/health')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.status).toBe('healthy');
        expect(response.body.uptime).toBeGreaterThan(0);
        expect(response.body.memory).toBeDefined();
      });
    });
  });

  describe('WebSocket', () => {
    let wsClient;

    beforeEach(async () => {
      await dashboardServer.start();
    });

    afterEach(() => {
      if (wsClient) {
        wsClient.close();
      }
    });

    it('should accept WebSocket connections', (done) => {
      const port = dashboardServer.server.address().port;
      wsClient = new WebSocket(`ws://localhost:${port}`);

      wsClient.on('open', () => {
        expect(mockLogger.info).toHaveBeenCalledWith('WebSocket client connected');
        done();
      });
    });

    it('should send initial server status on connection', (done) => {
      const port = dashboardServer.server.address().port;
      wsClient = new WebSocket(`ws://localhost:${port}`);

      wsClient.on('message', (data) => {
        const message = JSON.parse(data);
        
        if (message.type === 'init') {
          expect(message.servers).toBeDefined();
          expect(message.servers.filesystem).toBeDefined();
          done();
        }
      });
    });

    it('should handle ping-pong messages', (done) => {
      const port = dashboardServer.server.address().port;
      wsClient = new WebSocket(`ws://localhost:${port}`);

      wsClient.on('open', () => {
        wsClient.send(JSON.stringify({ type: 'ping' }));
      });

      wsClient.on('message', (data) => {
        const message = JSON.parse(data);
        
        if (message.type === 'pong') {
          expect(message.timestamp).toBeDefined();
          done();
        }
      });
    });

    it('should handle subscribe messages', (done) => {
      const port = dashboardServer.server.address().port;
      wsClient = new WebSocket(`ws://localhost:${port}`);

      wsClient.on('open', () => {
        wsClient.send(JSON.stringify({
          type: 'subscribe',
          data: { servers: ['filesystem', 'git'] }
        }));
        
        // Give time for message processing
        setTimeout(() => {
          expect(wsClient.subscribedServers).toEqual(['filesystem', 'git']);
          done();
        }, 100);
      });
    });

    it('should log unknown message types', (done) => {
      const port = dashboardServer.server.address().port;
      wsClient = new WebSocket(`ws://localhost:${port}`);

      wsClient.on('open', () => {
        wsClient.send(JSON.stringify({ type: 'unknown' }));
        
        setTimeout(() => {
          expect(mockLogger.warn).toHaveBeenCalledWith(
            'Unknown WebSocket message type',
            expect.objectContaining({ type: 'unknown' })
          );
          done();
        }, 100);
      });
    });

    it('should handle invalid JSON messages', (done) => {
      const port = dashboardServer.server.address().port;
      wsClient = new WebSocket(`ws://localhost:${port}`);

      wsClient.on('open', () => {
        wsClient.send('invalid json');
        
        setTimeout(() => {
          expect(mockLogger.error).toHaveBeenCalledWith(
            'Invalid WebSocket message',
            expect.any(Object)
          );
          done();
        }, 100);
      });
    });

    it('should broadcast orchestrator events to clients', (done) => {
      const port = dashboardServer.server.address().port;
      wsClient = new WebSocket(`ws://localhost:${port}`);

      let receivedInit = false;
      
      wsClient.on('message', (data) => {
        const message = JSON.parse(data);
        
        if (message.type === 'init') {
          receivedInit = true;
          // Emit orchestrator event after init received
          mockOrchestrator.emit('server:started', {
            name: 'test-server',
            server: { pid: 9999 }
          });
        } else if (message.type === 'server:started' && receivedInit) {
          expect(message.data.name).toBe('test-server');
          expect(message.timestamp).toBeDefined();
          done();
        }
      });
    });

    it('should log WebSocket client disconnection', (done) => {
      const port = dashboardServer.server.address().port;
      wsClient = new WebSocket(`ws://localhost:${port}`);

      wsClient.on('open', () => {
        wsClient.close();
        
        setTimeout(() => {
          expect(mockLogger.info).toHaveBeenCalledWith('WebSocket client disconnected');
          done();
        }, 100);
      });
    });
  });

  describe('Event Forwarding', () => {
    beforeEach(async () => {
      await dashboardServer.start();
    });

    const orchestratorEvents = [
      'server:registered',
      'server:unregistered',
      'server:starting',
      'server:started',
      'server:stopping',
      'server:stopped',
      'server:error',
      'server:restarting',
      'server:unhealthy',
      'server:output'
    ];

    orchestratorEvents.forEach(event => {
      it(`should forward ${event} event to WebSocket clients`, (done) => {
        const port = dashboardServer.server.address().port;
        const wsClient = new WebSocket(`ws://localhost:${port}`);

        let receivedInit = false;

        wsClient.on('message', (data) => {
          const message = JSON.parse(data);
          
          if (message.type === 'init') {
            receivedInit = true;
            // Emit event after init
            mockOrchestrator.emit(event, { testData: 'test' });
          } else if (message.type === event && receivedInit) {
            expect(message.data.testData).toBe('test');
            expect(message.timestamp).toBeDefined();
            wsClient.close();
            done();
          }
        });
      });
    });
  });

  describe('Server Lifecycle', () => {
    it('should start server and listen on configured port', async () => {
      await dashboardServer.start();

      const port = dashboardServer.server.address().port;
      expect(port).toBeGreaterThan(0);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Dashboard server started',
        expect.objectContaining({ port })
      );
    });

    it('should stop server gracefully', async () => {
      await dashboardServer.start();
      await dashboardServer.stop();

      expect(mockLogger.info).toHaveBeenCalledWith('Dashboard server stopped');
    });

    it('should close all WebSocket connections on stop', async () => {
      await dashboardServer.start();

      const port = dashboardServer.server.address().port;
      const wsClient = new WebSocket(`ws://localhost:${port}`);

      await new Promise(resolve => wsClient.on('open', resolve));

      const closeSpy = jest.spyOn(wsClient, 'close');
      
      await dashboardServer.stop();

      // WebSocket should be closed
      expect(wsClient.readyState).not.toBe(WebSocket.OPEN);
    });
  });

  describe('broadcastToClients', () => {
    it('should send message to all connected WebSocket clients', async () => {
      await dashboardServer.start();

      const port = dashboardServer.server.address().port;
      const wsClient1 = new WebSocket(`ws://localhost:${port}`);
      const wsClient2 = new WebSocket(`ws://localhost:${port}`);

      await Promise.all([
        new Promise(resolve => wsClient1.on('open', resolve)),
        new Promise(resolve => wsClient2.on('open', resolve))
      ]);

      const testMessage = { type: 'test', data: 'broadcast' };
      dashboardServer.broadcastToClients(testMessage);

      const received = await Promise.all([
        new Promise(resolve => {
          wsClient1.once('message', (data) => {
            const msg = JSON.parse(data);
            if (msg.type === 'test') resolve(msg);
          });
        }),
        new Promise(resolve => {
          wsClient2.once('message', (data) => {
            const msg = JSON.parse(data);
            if (msg.type === 'test') resolve(msg);
          });
        })
      ]);

      expect(received[0].data).toBe('broadcast');
      expect(received[1].data).toBe('broadcast');

      wsClient1.close();
      wsClient2.close();
    });

    it('should skip closed WebSocket connections', async () => {
      await dashboardServer.start();

      const port = dashboardServer.server.address().port;
      const wsClient = new WebSocket(`ws://localhost:${port}`);

      await new Promise(resolve => wsClient.on('open', resolve));
      
      wsClient.close();
      await new Promise(resolve => wsClient.on('close', resolve));

      // Should not throw error when broadcasting to closed client
      expect(() => {
        dashboardServer.broadcastToClients({ type: 'test' });
      }).not.toThrow();
    });
  });
});
