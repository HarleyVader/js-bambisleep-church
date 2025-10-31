const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const Logger = require('../utils/logger');

const logger = new Logger({ context: { component: 'MCPOrchestrator' } });

const SERVER_STATES = {
  STOPPED: 'stopped',
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  ERROR: 'error',
  UNREACHABLE: 'unreachable'
};

class MCPOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.servers = new Map();
    this.healthCheckInterval = config.healthCheckInterval || 30000;
    this.healthCheckTimer = null;
    this.workspacePath = config.workspacePath || process.cwd();
    this.autoRestart = config.autoRestart !== false;
    this.maxRestartAttempts = config.maxRestartAttempts || 3;
    this.restartDelay = config.restartDelay || 5000;
    
    logger.info('MCP Orchestrator initialized', {
      workspacePath: this.workspacePath,
      autoRestart: this.autoRestart,
      healthCheckInterval: this.healthCheckInterval
    });
  }

  registerServer(name, serverConfig) {
    if (this.servers.has(name)) {
      logger.warn(`Server ${name} already registered`, { name });
      return false;
    }

    const server = {
      name,
      config: serverConfig,
      state: SERVER_STATES.STOPPED,
      process: null,
      restartAttempts: 0,
      lastError: null,
      startTime: null,
      lastHealthCheck: null,
      healthStatus: 'unknown',
      pid: null
    };

    this.servers.set(name, server);
    logger.info(`Registered MCP server: ${name}`, { name, config: serverConfig });
    this.emit('server:registered', { name, server });
    return true;
  }

  async unregisterServer(name) {
    const server = this.servers.get(name);
    if (!server) {
      logger.warn(`Server ${name} not found for unregistration`, { name });
      return false;
    }

    if (server.state === SERVER_STATES.RUNNING) {
      await this.stopServer(name);
    }

    this.servers.delete(name);
    logger.info(`Unregistered MCP server: ${name}`, { name });
    this.emit('server:unregistered', { name });
    return true;
  }

  async startServer(name) {
    const server = this.servers.get(name);
    if (!server) {
      logger.error(`Server ${name} not found`, { name });
      throw new Error(`Server ${name} not registered`);
    }

    if (server.state === SERVER_STATES.RUNNING) {
      logger.warn(`Server ${name} already running`, { name });
      return false;
    }

    server.state = SERVER_STATES.STARTING;
    this.emit('server:starting', { name, server });

    try {
      const { command, args = [] } = server.config;
      const serverProcess = spawn(command, args, {
        cwd: this.workspacePath,
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      server.process = serverProcess;
      server.pid = serverProcess.pid;
      server.startTime = Date.now();
      server.state = SERVER_STATES.RUNNING;
      server.restartAttempts = 0;

      serverProcess.stdout.on('data', (data) => {
        logger.debug(`[${name}] stdout: ${data.toString().trim()}`);
        this.emit('server:output', { name, type: 'stdout', data: data.toString() });
      });

      serverProcess.stderr.on('data', (data) => {
        logger.debug(`[${name}] stderr: ${data.toString().trim()}`);
        this.emit('server:output', { name, type: 'stderr', data: data.toString() });
      });

      serverProcess.on('exit', (code, signal) => {
        logger.info(`Server ${name} exited`, { name, code, signal });
        server.state = code === 0 ? SERVER_STATES.STOPPED : SERVER_STATES.ERROR;
        server.process = null;
        server.pid = null;
        
        this.emit('server:stopped', { name, server, code, signal });

        if (code !== 0 && this.autoRestart && server.restartAttempts < this.maxRestartAttempts) {
          this.scheduleRestart(name);
        }
      });

      serverProcess.on('error', (error) => {
        logger.error(`Server ${name} process error`, { name, error: error.message });
        server.state = SERVER_STATES.ERROR;
        server.lastError = error.message;
        this.emit('server:error', { name, server, error });
      });

      logger.info(`Started MCP server: ${name}`, { name, pid: server.pid });
      this.emit('server:started', { name, server });
      return true;
    } catch (error) {
      server.state = SERVER_STATES.ERROR;
      server.lastError = error.message;
      logger.error(`Failed to start server ${name}`, { name, error: error.message });
      this.emit('server:error', { name, server, error });
      throw error;
    }
  }

  async stopServer(name) {
    const server = this.servers.get(name);
    if (!server) {
      logger.error(`Server ${name} not found`, { name });
      throw new Error(`Server ${name} not registered`);
    }

    if (server.state !== SERVER_STATES.RUNNING) {
      logger.warn(`Server ${name} not running`, { name, state: server.state });
      return false;
    }

    server.state = SERVER_STATES.STOPPING;
    this.emit('server:stopping', { name, server });

    try {
      if (server.process) {
        server.process.kill('SIGTERM');
        
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            if (server.process) {
              logger.warn(`Force killing server ${name}`, { name });
              server.process.kill('SIGKILL');
            }
            resolve();
          }, 5000);

          if (server.process) {
            server.process.once('exit', () => {
              clearTimeout(timeout);
              resolve();
            });
          } else {
            clearTimeout(timeout);
            resolve();
          }
        });
      }

      server.state = SERVER_STATES.STOPPED;
      server.process = null;
      server.pid = null;
      logger.info(`Stopped MCP server: ${name}`, { name });
      this.emit('server:stopped', { name, server });
      return true;
    } catch (error) {
      server.state = SERVER_STATES.ERROR;
      server.lastError = error.message;
      logger.error(`Failed to stop server ${name}`, { name, error: error.message });
      this.emit('server:error', { name, server, error });
      throw error;
    }
  }

  async restartServer(name) {
    logger.info(`Restarting server ${name}`, { name });
    await this.stopServer(name);
    await new Promise(resolve => setTimeout(resolve, this.restartDelay));
    await this.startServer(name);
    return true;
  }

  scheduleRestart(name) {
    const server = this.servers.get(name);
    if (!server) return;

    server.restartAttempts++;
    const delay = this.restartDelay * server.restartAttempts;

    logger.info(`Scheduling restart for ${name}`, {
      name,
      attempt: server.restartAttempts,
      delay,
      maxAttempts: this.maxRestartAttempts
    });

    setTimeout(() => {
      if (server.state === SERVER_STATES.ERROR) {
        this.startServer(name).catch(error => {
          logger.error(`Restart failed for ${name}`, { name, error: error.message });
        });
      }
    }, delay);
  }

  async startAll() {
    logger.info('Starting all MCP servers', { count: this.servers.size });
    const startPromises = [];

    for (const [name] of this.servers) {
      startPromises.push(
        this.startServer(name).catch(error => {
          logger.error(`Failed to start ${name}`, { name, error: error.message });
          return false;
        })
      );
    }

    const results = await Promise.all(startPromises);
    const successCount = results.filter(r => r === true).length;
    
    logger.info(`Started ${successCount}/${this.servers.size} servers`);
    this.emit('orchestrator:started', { total: this.servers.size, success: successCount });
    
    this.startHealthChecks();
    
    return successCount;
  }

  async stopAll() {
    logger.info('Stopping all MCP servers', { count: this.servers.size });
    
    this.stopHealthChecks();
    
    const stopPromises = [];

    for (const [name, server] of this.servers) {
      if (server.state === SERVER_STATES.RUNNING) {
        stopPromises.push(
          this.stopServer(name).catch(error => {
            logger.error(`Failed to stop ${name}`, { name, error: error.message });
            return false;
          })
        );
      }
    }

    const results = await Promise.all(stopPromises);
    const successCount = results.filter(r => r === true).length;
    
    logger.info(`Stopped ${successCount}/${stopPromises.length} servers`);
    this.emit('orchestrator:stopped', { total: stopPromises.length, success: successCount });
    
    return successCount;
  }

  getServerStatus(name) {
    const server = this.servers.get(name);
    if (!server) {
      return null;
    }

    return {
      name: server.name,
      state: server.state,
      pid: server.pid,
      uptime: server.startTime ? Date.now() - server.startTime : 0,
      restartAttempts: server.restartAttempts,
      lastError: server.lastError,
      healthStatus: server.healthStatus,
      lastHealthCheck: server.lastHealthCheck
    };
  }

  getAllStatus() {
    const statuses = {};
    for (const [name] of this.servers) {
      statuses[name] = this.getServerStatus(name);
    }
    return statuses;
  }

  async checkServerHealth(name) {
    const server = this.servers.get(name);
    if (!server) return null;

    try {
      if (server.state === SERVER_STATES.RUNNING && server.process) {
        const isAlive = server.process.exitCode === null;
        server.healthStatus = isAlive ? 'healthy' : 'unhealthy';
        server.lastHealthCheck = Date.now();
        
        if (!isAlive) {
          logger.warn(`Health check failed for ${name}`, { name });
          this.emit('server:unhealthy', { name, server });
        }
        
        return server.healthStatus;
      } else {
        server.healthStatus = 'stopped';
        server.lastHealthCheck = Date.now();
        return server.healthStatus;
      }
    } catch (error) {
      logger.error(`Health check error for ${name}`, { name, error: error.message });
      server.healthStatus = 'error';
      server.lastHealthCheck = Date.now();
      return server.healthStatus;
    }
  }

  async checkAllHealth() {
    const healthPromises = [];
    for (const [name] of this.servers) {
      healthPromises.push(this.checkServerHealth(name));
    }
    return await Promise.all(healthPromises);
  }

  startHealthChecks() {
    if (this.healthCheckTimer) {
      return;
    }

    logger.info('Starting health checks', { interval: this.healthCheckInterval });
    
    this.healthCheckTimer = setInterval(() => {
      this.checkAllHealth().catch(error => {
        logger.error('Health check failed', { error: error.message });
      });
    }, this.healthCheckInterval);
  }

  stopHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      logger.info('Stopped health checks');
    }
  }

  getStats() {
    const stats = {
      totalServers: this.servers.size,
      runningServers: 0,
      stoppedServers: 0,
      errorServers: 0,
      healthyServers: 0,
      unhealthyServers: 0
    };

    for (const [, server] of this.servers) {
      if (server.state === SERVER_STATES.RUNNING) stats.runningServers++;
      if (server.state === SERVER_STATES.STOPPED) stats.stoppedServers++;
      if (server.state === SERVER_STATES.ERROR) stats.errorServers++;
      if (server.healthStatus === 'healthy') stats.healthyServers++;
      if (server.healthStatus === 'unhealthy') stats.unhealthyServers++;
    }

    return stats;
  }

  async shutdown() {
    logger.info('Shutting down MCP Orchestrator');
    this.stopHealthChecks();
    await this.stopAll();
    this.removeAllListeners();
    logger.info('MCP Orchestrator shutdown complete');
  }
}

module.exports = MCPOrchestrator;
module.exports.SERVER_STATES = SERVER_STATES;
