/**
 * BambiSleep™ Church MCP Control Tower - Dashboard UI Server
 * Express-based web interface for monitoring and managing 8 MCP servers
 * 🌸 Neon Cyber Goth Aesthetic Dashboard 🌸
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const MCPOrchestrator = require('../mcp/orchestrator');
const Logger = require('../utils/logger');

const logger = new Logger({ context: { component: 'DashboardUI' } });

class DashboardServer {
  constructor(config = {}) {
    this.config = config;
    this.port = config.port || process.env.UI_PORT || 3001;
    this.orchestrator = config.orchestrator;
    
    // Express app
    this.app = express();
    this.server = http.createServer(this.app);
    
    // WebSocket for real-time updates
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    
    logger.info('Dashboard server initialized', { port: this.port });
  }

  setupMiddleware() {
    // Static files
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // JSON parsing
    this.app.use(express.json());
    
    // CORS for development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });
  }

  setupRoutes() {
    // Dashboard home
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // API: Get all server statuses
    this.app.get('/api/servers', (req, res) => {
      const servers = this.orchestrator.getAllServerStatus();
      res.json({ success: true, servers });
    });

    // API: Get specific server status
    this.app.get('/api/servers/:name', (req, res) => {
      const { name } = req.params;
      const status = this.orchestrator.getServerStatus(name);
      
      if (!status) {
        return res.status(404).json({ success: false, error: 'Server not found' });
      }
      
      res.json({ success: true, server: status });
    });

    // API: Start server
    this.app.post('/api/servers/:name/start', async (req, res) => {
      const { name } = req.params;
      
      try {
        await this.orchestrator.startServer(name);
        res.json({ success: true, message: `Server ${name} started` });
      } catch (error) {
        logger.error('Failed to start server', { name, error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // API: Stop server
    this.app.post('/api/servers/:name/stop', async (req, res) => {
      const { name } = req.params;
      
      try {
        await this.orchestrator.stopServer(name);
        res.json({ success: true, message: `Server ${name} stopped` });
      } catch (error) {
        logger.error('Failed to stop server', { name, error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // API: Restart server
    this.app.post('/api/servers/:name/restart', async (req, res) => {
      const { name } = req.params;
      
      try {
        await this.orchestrator.restartServer(name);
        res.json({ success: true, message: `Server ${name} restarted` });
      } catch (error) {
        logger.error('Failed to restart server', { name, error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // API: Start all servers
    this.app.post('/api/servers/start-all', async (req, res) => {
      try {
        await this.orchestrator.startAll();
        res.json({ success: true, message: 'All servers started' });
      } catch (error) {
        logger.error('Failed to start all servers', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // API: Stop all servers
    this.app.post('/api/servers/stop-all', async (req, res) => {
      try {
        await this.orchestrator.stopAll();
        res.json({ success: true, message: 'All servers stopped' });
      } catch (error) {
        logger.error('Failed to stop all servers', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // API: Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
    });
  }

  setupWebSocket() {
    // WebSocket connection handler
    this.wss.on('connection', (ws) => {
      logger.info('WebSocket client connected');
      
      // Send initial server status
      const servers = this.orchestrator.getAllServerStatus();
      ws.send(JSON.stringify({ type: 'init', servers }));
      
      // Handle client messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          logger.error('Invalid WebSocket message', { error: error.message });
        }
      });
      
      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
      });
    });

    // Forward orchestrator events to WebSocket clients
    this.setupOrchestratorEventForwarding();
  }

  setupOrchestratorEventForwarding() {
    const events = [
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

    events.forEach(event => {
      this.orchestrator.on(event, (data) => {
        this.broadcastToClients({
          type: event,
          timestamp: new Date().toISOString(),
          data
        });
      });
    });
  }

  handleWebSocketMessage(ws, message) {
    const { type, data } = message;
    
    switch (type) {
      case 'subscribe':
        // Subscribe to specific server events
        ws.subscribedServers = data.servers || [];
        break;
        
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
        
      default:
        logger.warn('Unknown WebSocket message type', { type });
    }
  }

  broadcastToClients(message) {
    const payload = JSON.stringify(message);
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  start() {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        logger.info('Dashboard server started', {
          port: this.port,
          url: `http://localhost:${this.port}`
        });
        resolve();
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      // Close WebSocket connections
      this.wss.clients.forEach((client) => {
        client.close();
      });
      
      this.wss.close(() => {
        this.server.close(() => {
          logger.info('Dashboard server stopped');
          resolve();
        });
      });
    });
  }
}

module.exports = DashboardServer;
