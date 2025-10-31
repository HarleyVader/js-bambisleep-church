/**
 * BambiSleep™ Church - Zathras Agent
 * Autonomous agent with access to 20+ MCP servers and Unity cathedral renderer
 * 
 * "Zathras understand. Zathras do. Zathras good at understanding things." - Babylon 5
 */

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');
const Logger = require('../utils/logger');
const MCPOrchestrator = require('../mcp/orchestrator');
const UnityBridge = require('../unity/unity-bridge');

const logger = new Logger({ context: { component: 'ZathrasAgent' } });

/**
 * Workflow execution states
 */
const WORKFLOW_STATES = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Zathras Agent - Codebase-aware autonomous agent with MCP integration
 */
class ZathrasAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      mcpConfigPath: config.mcpConfigPath || '.vscode/settings.json',
      workspacePath: config.workspacePath || process.cwd(),
      unityEnabled: config.unityEnabled !== false,
      unityPath: config.unityPath,
      logLevel: config.logLevel || 'INFO',
      maxWorkflowSteps: config.maxWorkflowSteps || 50,
      timeout: config.timeout || 300000, // 5 minutes
      ...config
    };
    
    this.orchestrator = null;
    this.unity = null;
    this.mcpServers = new Map();
    this.workflowHistory = [];
    this.isInitialized = false;
    
    logger.info('Zathras Agent created', { config: this.config });
  }

  /**
   * Initialize Zathras Agent - load MCP servers and start Unity bridge
   */
  async initialize() {
    if (this.isInitialized) {
      logger.warn('Zathras already initialized');
      return;
    }

    try {
      logger.info('Initializing Zathras Agent...');
      
      // Load MCP server configuration
      await this.loadMCPConfig();
      
      // Initialize MCP orchestrator
      this.orchestrator = new MCPOrchestrator({
        workspacePath: this.config.workspacePath,
        autoRestart: true,
        healthCheckInterval: 30000
      });
      
      // Register MCP servers from config
      for (const [name, config] of this.mcpServers) {
        this.orchestrator.registerServer(name, config);
      }
      
      // Setup orchestrator event handlers
      this.setupOrchestratorEvents();
      
      // Initialize Unity bridge if enabled
      if (this.config.unityEnabled) {
        await this.initializeUnity();
      }
      
      this.isInitialized = true;
      logger.info('Zathras Agent initialized successfully', {
        mcpServers: this.mcpServers.size,
        unityEnabled: this.config.unityEnabled
      });
      
      this.emit('initialized', {
        mcpServers: Array.from(this.mcpServers.keys()),
        unityEnabled: this.config.unityEnabled
      });
      
    } catch (error) {
      logger.error('Failed to initialize Zathras Agent', { error: error.message });
      this.emit('error', { error, context: 'initialization' });
      throw error;
    }
  }

  /**
   * Load MCP server configuration from VS Code settings
   */
  async loadMCPConfig() {
    try {
      const configPath = path.resolve(this.config.workspacePath, this.config.mcpConfigPath);
      
      if (!fs.existsSync(configPath)) {
        throw new Error(`MCP config not found: ${configPath}`);
      }
      
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      // Parse JSONC (JSON with comments) - strip // and /* */ comments
      let jsonContent = configContent;
      
      // Remove /* */ block comments
      jsonContent = jsonContent.replace(/\/\*[\s\S]*?\*\//g, '');
      
      // Remove // line comments (but not in strings)
      jsonContent = jsonContent.split('\n').map(line => {
        const commentIndex = line.indexOf('//');
        if (commentIndex >= 0) {
          // Check if // is inside a string
          const beforeComment = line.substring(0, commentIndex);
          const quoteCount = (beforeComment.match(/"/g) || []).length;
          // If even number of quotes, comment is outside strings
          if (quoteCount % 2 === 0) {
            return line.substring(0, commentIndex);
          }
        }
        return line;
      }).join('\n');
      
      const config = JSON.parse(jsonContent);
      
      if (!config['mcp.servers']) {
        throw new Error('No mcp.servers configuration found');
      }
      
      // Store MCP server configs
      const servers = config['mcp.servers'];
      for (const [name, serverConfig] of Object.entries(servers)) {
        this.mcpServers.set(name, serverConfig);
      }
      
      logger.info('Loaded MCP configuration', { 
        serverCount: this.mcpServers.size,
        servers: Array.from(this.mcpServers.keys())
      });
      
    } catch (error) {
      logger.error('Failed to load MCP config', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize Unity bridge for cathedral visualization
   */
  async initializeUnity() {
    try {
      this.unity = new UnityBridge({
        unityPath: this.config.unityPath,
        projectPath: path.join(this.config.workspacePath, 'unity-projects/cathedral-renderer')
      });
      
      // Setup Unity event handlers
      this.unity.on('renderer:started', (data) => {
        logger.info('Unity renderer started', data);
        this.emit('unity:started', data);
      });
      
      this.unity.on('renderer:stopped', (data) => {
        logger.info('Unity renderer stopped', data);
        this.emit('unity:stopped', data);
      });
      
      this.unity.on('renderer:error', (data) => {
        logger.error('Unity renderer error', data);
        this.emit('unity:error', data);
      });
      
      // Listen for Unity IPC messages
      this.unity.on('unity:scene-loaded', (data) => {
        this.emit('unity:scene-loaded', data);
      });
      
      this.unity.on('unity:render-complete', (data) => {
        this.emit('unity:render-complete', data);
      });
      
      logger.info('Unity bridge initialized');
      
    } catch (error) {
      logger.error('Failed to initialize Unity bridge', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup MCP orchestrator event handlers
   */
  setupOrchestratorEvents() {
    this.orchestrator.on('server:started', ({ name, server }) => {
      logger.info(`MCP server started: ${name}`, { pid: server.pid });
      this.emit('server:started', { name, server });
    });
    
    this.orchestrator.on('server:stopped', ({ name, server, code, signal }) => {
      logger.info(`MCP server stopped: ${name}`, { code, signal });
      this.emit('server:stopped', { name, server, code, signal });
    });
    
    this.orchestrator.on('server:error', ({ name, server, error }) => {
      logger.error(`MCP server error: ${name}`, { error: error.message });
      this.emit('server:error', { name, server, error });
    });
  }

  /**
   * Call a specific MCP server tool
   */
  async callServer(serverName, tool, parameters = {}) {
    if (!this.isInitialized) {
      throw new Error('Zathras not initialized. Call initialize() first.');
    }
    
    if (!this.mcpServers.has(serverName)) {
      throw new Error(`MCP server not configured: ${serverName}`);
    }
    
    logger.debug('Calling MCP server', { serverName, tool, parameters });
    
    this.emit('server:call', { serverName, tool, parameters });
    
    try {
      // Start server if not running
      const server = this.orchestrator.servers.get(serverName);
      if (!server || server.state !== 'running') {
        logger.info(`Starting server ${serverName}...`);
        await this.orchestrator.startServer(serverName);
        
        // Wait for server to be ready
        await this.waitForServerReady(serverName);
      }
      
      // Execute MCP tool call (this would integrate with actual MCP protocol)
      const result = await this.executeMCPTool(serverName, tool, parameters);
      
      this.emit('server:response', { serverName, tool, result });
      
      return result;
      
    } catch (error) {
      logger.error('MCP server call failed', { 
        serverName, 
        tool, 
        error: error.message 
      });
      this.emit('server:call-error', { serverName, tool, error });
      throw error;
    }
  }

  /**
   * Execute MCP tool call (JSON-RPC 2.0 protocol)
   * NOTE: This is a simplified implementation. Full MCP protocol requires proper JSON-RPC handling.
   */
  async executeMCPTool(serverName, tool, parameters) {
    // Placeholder for actual MCP JSON-RPC 2.0 implementation
    // In production, this would send proper JSON-RPC requests over STDIO or HTTP
    
    logger.debug('Executing MCP tool', { serverName, tool, parameters });
    
    // Mock response for now
    return {
      success: true,
      tool,
      parameters,
      result: `Tool ${tool} executed on ${serverName}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Wait for MCP server to be ready
   */
  async waitForServerReady(serverName, timeout = 10000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const server = this.orchestrator.servers.get(serverName);
      if (server && server.state === 'running') {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Server ${serverName} did not start within ${timeout}ms`);
  }

  /**
   * Execute a multi-step workflow across MCP servers
   */
  async executeWorkflow(workflow) {
    if (!this.isInitialized) {
      throw new Error('Zathras not initialized. Call initialize() first.');
    }
    
    const workflowId = `workflow-${Date.now()}`;
    const workflowState = {
      id: workflowId,
      name: workflow.name,
      steps: workflow.steps,
      state: WORKFLOW_STATES.PENDING,
      results: [],
      startTime: null,
      endTime: null,
      error: null
    };
    
    this.workflowHistory.push(workflowState);
    
    logger.info('Starting workflow', { 
      id: workflowId, 
      name: workflow.name,
      stepCount: workflow.steps.length
    });
    
    this.emit('workflow:started', { workflow: workflowState });
    
    try {
      workflowState.state = WORKFLOW_STATES.RUNNING;
      workflowState.startTime = Date.now();
      
      // Execute each step sequentially
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        
        logger.info(`Executing workflow step ${i + 1}/${workflow.steps.length}`, {
          workflowId,
          step: step.server,
          action: step.action
        });
        
        this.emit('workflow:step', { 
          workflowId, 
          stepIndex: i, 
          step 
        });
        
        // Execute step based on server type
        let result;
        if (step.server === 'cathedral' || step.server === 'unity') {
          result = await this.executeUnityStep(step);
        } else {
          result = await this.callServer(step.server, step.action, step.parameters || step.data);
        }
        
        workflowState.results.push({
          stepIndex: i,
          step,
          result,
          timestamp: new Date().toISOString()
        });
      }
      
      workflowState.state = WORKFLOW_STATES.COMPLETED;
      workflowState.endTime = Date.now();
      
      const duration = workflowState.endTime - workflowState.startTime;
      
      logger.info('Workflow completed', { 
        workflowId, 
        duration,
        resultCount: workflowState.results.length
      });
      
      this.emit('workflow:complete', { 
        workflowId, 
        workflow: workflowState,
        duration
      });
      
      return workflowState;
      
    } catch (error) {
      workflowState.state = WORKFLOW_STATES.FAILED;
      workflowState.error = error.message;
      workflowState.endTime = Date.now();
      
      logger.error('Workflow failed', { 
        workflowId, 
        error: error.message 
      });
      
      this.emit('workflow:failed', { 
        workflowId, 
        workflow: workflowState, 
        error 
      });
      
      throw error;
    }
  }

  /**
   * Execute Unity-specific workflow step
   */
  async executeUnityStep(step) {
    if (!this.unity) {
      throw new Error('Unity bridge not initialized');
    }
    
    const { action, data, parameters } = step;
    const payload = data || parameters || {};
    
    logger.info('Executing Unity step', { action, payload });
    
    switch (action) {
      case 'updateStyle':
        return await this.unityUpdateStyle(payload);
        
      case 'renderSnapshot':
        return await this.unityRenderSnapshot(payload);
        
      case 'initialize':
        return await this.unityCommand('initialize', payload);
        
      case 'shutdown':
        return await this.unityCommand('shutdown', payload);
        
      default:
        return await this.unityCommand(action, payload);
    }
  }

  /**
   * Send command to Unity renderer via IPC
   */
  async unityCommand(command, data = {}) {
    if (!this.unity || !this.unity.isRunning) {
      logger.info('Starting Unity renderer...');
      await this.unity.startRenderer();
      
      // Wait for Unity to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Unity startup timeout')), 30000);
        this.unity.once('cathedral:ready', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
    
    const message = {
      type: `zathras:${command}`,
      timestamp: new Date().toISOString(),
      data
    };
    
    logger.debug('Sending Unity command', message);
    
    // Send via Unity IPC
    return await this.unity.sendCommand(message);
  }

  /**
   * Update Unity cathedral visual style
   */
  async unityUpdateStyle(styleConfig) {
    return await this.unityCommand('updateStyle', styleConfig);
  }

  /**
   * Render Unity cathedral snapshot
   */
  async unityRenderSnapshot(config) {
    return await this.unityCommand('renderSnapshot', config);
  }

  /**
   * Get status of all MCP servers
   */
  getServerStatus() {
    const status = {};
    
    for (const [name, server] of this.orchestrator.servers) {
      status[name] = {
        state: server.state,
        pid: server.pid,
        uptime: server.startTime ? Date.now() - server.startTime : 0,
        healthStatus: server.healthStatus,
        lastError: server.lastError
      };
    }
    
    return status;
  }

  /**
   * Shutdown Zathras Agent - stop all servers and Unity
   */
  async shutdown() {
    logger.info('Shutting down Zathras Agent...');
    
    this.emit('shutdown:started');
    
    try {
      // Stop all MCP servers
      if (this.orchestrator) {
        await this.orchestrator.stopAll();
      }
      
      // Stop Unity renderer
      if (this.unity && this.unity.isRunning) {
        await this.unity.stopRenderer();
      }
      
      this.isInitialized = false;
      
      logger.info('Zathras Agent shutdown complete');
      this.emit('shutdown:complete');
      
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
      this.emit('shutdown:error', { error });
      throw error;
    }
  }
}

module.exports = ZathrasAgent;
