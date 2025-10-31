/**
 * BambiSleep™ Church - Unity Bridge Service
 * Manages Unity renderer processes for Neon Cyber Goth Cathedral visualization
 * Integrates with MCP orchestration for lifecycle management
 */

const { spawn } = require('child_process');
const path = require('path');
const EventEmitter = require('events');
const Logger = require('../utils/logger');

const logger = new Logger({ context: { component: 'UnityBridge' } });

/**
 * Unity Renderer Types
 */
const RENDERER_TYPES = {
  CATHEDRAL: 'cathedral',
  CHURCH: 'church',
  CYBER_GOTH: 'cyber-goth',
  ELECTRO_NUCLEAR: 'electro-nuclear'
};

/**
 * Unity Bridge - spawns and manages Unity renderer processes
 */
class UnityBridge extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.unityPath = config.unityPath || this.detectUnityPath();
    this.projectPath = config.projectPath || path.join(__dirname, '../../unity-projects/cathedral-renderer');
    this.rendererProcess = null;
    this.isRunning = false;
    this.sceneConfig = config.sceneConfig || {
      style: 'neon-cyber-goth',
      lighting: 'electro-nuclear',
      catholicVibes: true,
      pinkIntensity: 0.8,
      eldritchLevel: 666
    };
    
    logger.info('Unity Bridge initialized', {
      unityPath: this.unityPath,
      projectPath: this.projectPath,
      sceneConfig: this.sceneConfig
    });
  }

  /**
   * Detect Unity installation path based on platform
   */
  detectUnityPath() {
    const platform = process.platform;
    
    if (platform === 'linux') {
      return '/opt/unity/Editor/Unity';
    } else if (platform === 'win32') {
      return 'C:\\Program Files\\Unity\\Hub\\Editor\\6000.2.11f1\\Editor\\Unity.exe';
    } else if (platform === 'darwin') {
      return '/Applications/Unity/Hub/Editor/6000.2.11f1/Unity.app/Contents/MacOS/Unity';
    }
    
    return 'unity'; // Fallback to PATH
  }

  /**
   * Start Unity renderer process
   */
  async startRenderer(rendererType = RENDERER_TYPES.CATHEDRAL) {
    if (this.isRunning) {
      logger.warn('Unity renderer already running');
      return false;
    }

    try {
      logger.info('Starting Unity cathedral renderer', { rendererType });

      // Unity command-line arguments for headless rendering
      const args = [
        '-batchmode',
        '-nographics',
        '-projectPath', this.projectPath,
        '-executeMethod', 'CathedralRenderer.StartServer',
        '-logFile', path.join(this.projectPath, 'Logs/unity-renderer.log'),
        '-rendererType', rendererType,
        '-sceneConfig', JSON.stringify(this.sceneConfig)
      ];

      // Spawn Unity process
      this.rendererProcess = spawn(this.unityPath, args, {
        cwd: this.projectPath,
        env: {
          ...process.env,
          UNITY_RENDERER_PORT: this.config.port || 7777,
          CATHEDRAL_STYLE: this.sceneConfig.style
        }
      });

      this.setupProcessHandlers();
      this.isRunning = true;

      logger.info('Unity renderer started', { 
        pid: this.rendererProcess.pid,
        rendererType 
      });

      this.emit('renderer:started', { 
        pid: this.rendererProcess.pid,
        rendererType 
      });

      return true;
    } catch (error) {
      logger.error('Failed to start Unity renderer', { error: error.message });
      this.emit('renderer:error', { error });
      return false;
    }
  }

  /**
   * Setup process event handlers with IPC message parsing
   */
  setupProcessHandlers() {
    if (!this.rendererProcess) return;

    // Buffer for incomplete JSON messages
    let messageBuffer = '';

    this.rendererProcess.stdout.on('data', (data) => {
      messageBuffer += data.toString();
      
      // Split by newline to process complete messages
      const lines = messageBuffer.split('\n');
      
      // Keep last incomplete line in buffer
      messageBuffer = lines.pop() || '';
      
      // Process each complete message
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        try {
          // Try to parse as JSON IPC message
          const message = JSON.parse(trimmed);
          this.handleIPCMessage(message);
        } catch (error) {
          // Not JSON, treat as regular Unity log output
          logger.debug('Unity stdout', { output: trimmed });
          this.emit('renderer:output', { type: 'stdout', data: trimmed });
          
          // Legacy: Parse Unity status messages
          if (trimmed.includes('Cathedral Ready')) {
            this.emit('cathedral:ready');
          }
        }
      });
    });

    this.rendererProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      logger.error('Unity stderr', { output });
      this.emit('renderer:output', { type: 'stderr', data: output });
    });

    this.rendererProcess.on('exit', (code, signal) => {
      logger.info('Unity renderer exited', { code, signal });
      this.isRunning = false;
      this.rendererProcess = null;
      this.emit('renderer:stopped', { code, signal });
    });

    this.rendererProcess.on('error', (error) => {
      logger.error('Unity renderer process error', { error: error.message });
      this.emit('renderer:error', { error });
    });
  }

  /**
   * Handle IPC message from Unity (Protocol v1.0.0)
   */
  handleIPCMessage(message) {
    if (!message.type) {
      logger.warn('IPC message missing type field', { message });
      return;
    }

    logger.debug('Unity IPC message received', { type: message.type, data: message.data });
    
    // Emit typed event for this message
    this.emit(`unity:${message.type}`, message.data);
    
    // Handle specific message types
    switch (message.type) {
      case 'scene-loaded':
        logger.info('Unity scene loaded', message.data);
        this.emit('cathedral:ready', message.data);
        break;
        
      case 'render-complete':
        logger.info('Unity render complete', message.data);
        break;
        
      case 'update-ack':
        logger.debug('Unity acknowledged update', message.data);
        break;
        
      case 'error':
        logger.error('Unity error', message.data);
        this.emit('renderer:error', { 
          error: new Error(message.data.message),
          errorCode: message.data.errorCode,
          stack: message.data.stack
        });
        break;
        
      case 'heartbeat':
        logger.trace('Unity heartbeat', message.data);
        break;
        
      case 'shutdownComplete':
        logger.info('Unity shutdown complete', message.data);
        break;
    }
  }

  /**
   * Stop Unity renderer process
   */
  async stopRenderer() {
    if (!this.isRunning || !this.rendererProcess) {
      logger.warn('Unity renderer not running');
      return false;
    }

    return new Promise((resolve) => {
      logger.info('Stopping Unity renderer', { pid: this.rendererProcess.pid });

      const timeout = setTimeout(() => {
        logger.warn('Unity renderer did not exit gracefully, force killing');
        this.rendererProcess.kill('SIGKILL');
        resolve(true);
      }, 10000); // 10 second timeout

      this.rendererProcess.once('exit', () => {
        clearTimeout(timeout);
        logger.info('Unity renderer stopped gracefully');
        resolve(true);
      });

      // Send shutdown command via IPC protocol
      this.sendMessage('shutdown', { graceful: true });
      
      // Also send SIGTERM as fallback
      setTimeout(() => {
        if (this.rendererProcess) {
          this.rendererProcess.kill('SIGTERM');
        }
      }, 2000);
    });
  }

  /**
   * Send message to Unity renderer via stdin (IPC Protocol v1.0.0)
   */
  sendMessage(type, data = {}) {
    if (!this.isRunning || !this.rendererProcess) {
      logger.warn('Cannot send message, renderer not running');
      return false;
    }

    try {
      const message = {
        type,
        timestamp: new Date().toISOString(),
        data
      };
      const messageJson = JSON.stringify(message) + '\n';
      this.rendererProcess.stdin.write(messageJson);
      logger.debug('Sent message to Unity', { type, data });
      return true;
    } catch (error) {
      logger.error('Failed to send message to Unity', { error: error.message, type });
      return false;
    }
  }

  /**
   * Legacy method for backwards compatibility
   * @deprecated Use sendMessage(type, data) instead
   */
  sendCommand(command) {
    logger.warn('sendCommand is deprecated, use sendMessage instead');
    return this.sendMessage(command.type, command.data || command);
  }

  /**
   * Update cathedral rendering parameters (IPC Protocol v1.0.0)
   */
  updateCathedralConfig(config) {
    this.sceneConfig = { ...this.sceneConfig, ...config };
    
    if (this.isRunning) {
      this.sendMessage('updateStyle', config);
    }

    logger.info('Cathedral config updated', { config: this.sceneConfig });
    this.emit('config:updated', { config: this.sceneConfig });
  }

  /**
   * Initialize Unity scene with cathedral parameters
   */
  initializeScene(params = {}) {
    const sceneData = {
      sceneName: params.sceneName || 'MainScene',
      style: params.style || this.sceneConfig.style || 'neon-cyber-goth',
      pinkIntensity: params.pinkIntensity ?? this.sceneConfig.pinkIntensity ?? 0.8,
      eldritchLevel: params.eldritchLevel ?? this.sceneConfig.eldritchLevel ?? 666,
      cathedralWidth: params.cathedralWidth || 30,
      cathedralLength: params.cathedralLength || 60,
      cathedralHeight: params.cathedralHeight || 25,
      archCount: params.archCount || 8,
      neonIntensity: params.neonIntensity || 5.0
    };

    this.sendMessage('initialize', sceneData);
    logger.info('Scene initialization sent', { sceneData });
  }

  /**
   * Set camera position and orientation
   */
  setCameraPosition(position, rotation, fov = 60) {
    this.sendMessage('camera', {
      position: position || { x: 0, y: 8, z: -25 },
      rotation: rotation || { x: 15, y: 0, z: 0 },
      fieldOfView: fov
    });
    logger.debug('Camera position updated', { position, rotation, fov });
  }

  /**
   * Render cathedral to file
   */
  renderToFile(outputPath, width = 1920, height = 1080, format = 'PNG') {
    this.sendMessage('render', {
      outputPath,
      width,
      height,
      format
    });
    logger.info('Render requested', { outputPath, width, height, format });
  }

  /**
   * Update post-processing effects
   */
  updatePostProcessing(effects = {}) {
    const effectsData = {
      bloom: effects.bloom ?? 3.0,
      chromaticAberration: effects.chromaticAberration ?? 0.3,
      vignette: effects.vignette ?? 0.4,
      enabled: effects.enabled !== false
    };

    this.sendMessage('postprocessing', effectsData);
    logger.debug('Post-processing updated', { effectsData });
  }

  /**
   * Set rendering paused state
   */
  setPaused(paused = true) {
    this.sendMessage('setPaused', { paused });
    logger.debug('Pause state changed', { paused });
  }

  /**
   * Trigger specific cathedral effects
   */
  triggerEffect(effectType, params = {}) {
    this.sendCommand({
      type: 'triggerEffect',
      effectType,
      params
    });

    logger.info('Triggered cathedral effect', { effectType, params });
  }

  /**
   * Get renderer status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      pid: this.rendererProcess?.pid || null,
      projectPath: this.projectPath,
      sceneConfig: this.sceneConfig
    };
  }
}

// Export class and constants
module.exports = UnityBridge;
module.exports.RENDERER_TYPES = RENDERER_TYPES;
