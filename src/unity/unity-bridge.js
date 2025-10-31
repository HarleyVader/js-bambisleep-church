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
   * Setup process event handlers
   */
  setupProcessHandlers() {
    if (!this.rendererProcess) return;

    this.rendererProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      logger.debug('Unity stdout', { output });
      this.emit('renderer:output', { type: 'stdout', data: output });
      
      // Parse Unity renderer status messages
      if (output.includes('Cathedral Ready')) {
        this.emit('cathedral:ready');
      }
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

      // Send quit command to Unity
      this.sendCommand({ type: 'quit' });
      
      // Also send SIGTERM as fallback
      setTimeout(() => {
        if (this.rendererProcess) {
          this.rendererProcess.kill('SIGTERM');
        }
      }, 2000);
    });
  }

  /**
   * Send command to Unity renderer via stdin
   */
  sendCommand(command) {
    if (!this.isRunning || !this.rendererProcess) {
      logger.warn('Cannot send command, renderer not running');
      return false;
    }

    try {
      const commandJson = JSON.stringify(command) + '\n';
      this.rendererProcess.stdin.write(commandJson);
      logger.debug('Sent command to Unity', { command });
      return true;
    } catch (error) {
      logger.error('Failed to send command to Unity', { error: error.message });
      return false;
    }
  }

  /**
   * Update cathedral rendering parameters
   */
  updateCathedralConfig(config) {
    this.sceneConfig = { ...this.sceneConfig, ...config };
    
    if (this.isRunning) {
      this.sendCommand({
        type: 'updateConfig',
        config: this.sceneConfig
      });
    }

    logger.info('Cathedral config updated', { config: this.sceneConfig });
    this.emit('config:updated', { config: this.sceneConfig });
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
