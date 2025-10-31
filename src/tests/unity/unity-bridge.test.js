/**
 * BambiSleep™ Church - Unity Bridge Tests
 * Comprehensive test coverage for Unity renderer process management
 * Targets: 100% branches, functions, lines, statements
 */

const { EventEmitter } = require('events');
const UnityBridge = require('../../unity/unity-bridge');

// Mock child_process and logger
jest.mock('child_process');
jest.mock('../../utils/logger');

const { spawn } = require('child_process');
const Logger = require('../../utils/logger');

describe('UnityBridge', () => {
  let unityBridge;
  let mockProcess;
  let mockLogger;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    Logger.mockImplementation(() => mockLogger);

    // Mock child process with EventEmitter
    mockProcess = new EventEmitter();
    mockProcess.pid = 12345;
    mockProcess.kill = jest.fn();
    mockProcess.stdin = {
      write: jest.fn()
    };
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    
    spawn.mockReturnValue(mockProcess);
  });

  afterEach(() => {
    if (unityBridge && unityBridge.isRunning) {
      unityBridge.rendererProcess = null;
      unityBridge.isRunning = false;
    }
  });

  describe('Constructor', () => {
    it('should create UnityBridge with default configuration', () => {
      unityBridge = new UnityBridge();

      expect(unityBridge.isRunning).toBe(false);
      expect(unityBridge.rendererProcess).toBeNull();
      expect(unityBridge.sceneConfig).toEqual({
        style: 'neon-cyber-goth',
        lighting: 'electro-nuclear',
        catholicVibes: true,
        pinkIntensity: 0.8,
        eldritchLevel: 666
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Unity Bridge initialized',
        expect.objectContaining({
          sceneConfig: expect.any(Object)
        })
      );
    });

    it('should create UnityBridge with custom configuration', () => {
      const customConfig = {
        unityPath: '/custom/unity/path',
        projectPath: '/custom/project',
        sceneConfig: {
          style: 'cyber-goth',
          pinkIntensity: 0.95,
          eldritchLevel: 777
        }
      };

      unityBridge = new UnityBridge(customConfig);

      expect(unityBridge.unityPath).toBe('/custom/unity/path');
      expect(unityBridge.projectPath).toBe('/custom/project');
      expect(unityBridge.sceneConfig.pinkIntensity).toBe(0.95);
      expect(unityBridge.sceneConfig.eldritchLevel).toBe(777);
    });

    it('should detect Unity path for Linux platform', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      unityBridge = new UnityBridge();
      
      expect(unityBridge.unityPath).toBe('/opt/unity/Editor/Unity');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should detect Unity path for Windows platform', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      unityBridge = new UnityBridge();
      
      expect(unityBridge.unityPath).toContain('Unity.exe');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should detect Unity path for macOS platform', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      unityBridge = new UnityBridge();
      
      expect(unityBridge.unityPath).toContain('/Applications/Unity/');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('startRenderer', () => {
    beforeEach(() => {
      unityBridge = new UnityBridge();
    });

    it('should start Unity renderer process successfully', async () => {
      const startPromise = unityBridge.startRenderer();

      // Simulate successful start
      setImmediate(() => {
        mockProcess.emit('spawn');
      });

      const result = await startPromise;

      expect(result).toBe(true);
      expect(unityBridge.isRunning).toBe(true);
      expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          '-batchmode',
          '-nographics',
          '-executeMethod',
          'CathedralRenderer.StartServer'
        ]),
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Unity renderer started',
        expect.objectContaining({ pid: 12345 })
      );
    });

    it('should emit renderer:started event on successful start', (done) => {
      unityBridge.on('renderer:started', ({ pid, rendererType }) => {
        expect(pid).toBe(12345);
        expect(rendererType).toBe('cathedral');
        done();
      });

      unityBridge.startRenderer();
    });

    it('should return false if renderer already running', async () => {
      unityBridge.isRunning = true;
      
      const result = await unityBridge.startRenderer();

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith('Unity renderer already running');
      expect(spawn).not.toHaveBeenCalled();
    });

    it('should handle startup errors gracefully', async () => {
      spawn.mockImplementation(() => {
        throw new Error('Unity not found');
      });

      const result = await unityBridge.startRenderer();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to start Unity renderer',
        expect.objectContaining({ error: 'Unity not found' })
      );
    });

    it('should emit renderer:error event on startup failure', (done) => {
      spawn.mockImplementation(() => {
        throw new Error('Unity not found');
      });

      unityBridge.on('renderer:error', ({ error }) => {
        expect(error).toBeDefined();
        expect(error.message).toBe('Unity not found');
        done();
      });

      unityBridge.startRenderer();
    });

    it('should pass correct renderer type argument', async () => {
      await unityBridge.startRenderer('cyber-goth');

      expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['-rendererType', 'cyber-goth']),
        expect.any(Object)
      );
    });

    it('should include sceneConfig in command arguments', async () => {
      await unityBridge.startRenderer();

      const spawnCall = spawn.mock.calls[0];
      const args = spawnCall[1];
      const configIndex = args.indexOf('-sceneConfig');
      
      expect(configIndex).not.toBe(-1);
      expect(args[configIndex + 1]).toBe(JSON.stringify(unityBridge.sceneConfig));
    });
  });

  describe('setupProcessHandlers', () => {
    beforeEach(() => {
      unityBridge = new UnityBridge();
      unityBridge.rendererProcess = mockProcess;
      unityBridge.isRunning = true;
      unityBridge.setupProcessHandlers();
    });

    it('should emit renderer:output event on stdout data', (done) => {
      unityBridge.on('renderer:output', ({ type, data }) => {
        expect(type).toBe('stdout');
        expect(data).toBe('Unity log message');
        done();
      });

      mockProcess.stdout.emit('data', Buffer.from('Unity log message'));
    });

    it('should emit cathedral:ready when Cathedral Ready message detected', (done) => {
      unityBridge.on('cathedral:ready', () => {
        done();
      });

      mockProcess.stdout.emit('data', Buffer.from('🌸 Cathedral Ready ✨'));
    });

    it('should emit renderer:output event on stderr data', (done) => {
      unityBridge.on('renderer:output', ({ type, data }) => {
        expect(type).toBe('stderr');
        expect(data).toBe('Unity error message');
        done();
      });

      mockProcess.stderr.emit('data', Buffer.from('Unity error message'));
    });

    it('should handle process exit event', (done) => {
      unityBridge.on('renderer:stopped', ({ code, signal }) => {
        expect(code).toBe(0);
        expect(signal).toBeNull();
        expect(unityBridge.isRunning).toBe(false);
        expect(unityBridge.rendererProcess).toBeNull();
        done();
      });

      mockProcess.emit('exit', 0, null);
    });

    it('should emit renderer:error on process error', (done) => {
      const testError = new Error('Process error');

      unityBridge.on('renderer:error', ({ error }) => {
        expect(error).toBe(testError);
        done();
      });

      mockProcess.emit('error', testError);
    });

    it('should log stderr messages as errors', () => {
      mockProcess.stderr.emit('data', Buffer.from('Unity error'));

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unity stderr',
        expect.objectContaining({ output: 'Unity error' })
      );
    });
  });

  describe('stopRenderer', () => {
    beforeEach(async () => {
      unityBridge = new UnityBridge();
      unityBridge.rendererProcess = mockProcess;
      unityBridge.isRunning = true;
    });

    it('should stop Unity renderer gracefully', async () => {
      const stopPromise = unityBridge.stopRenderer();

      // Simulate quit command acknowledged
      setImmediate(() => {
        mockProcess.emit('exit', 0, null);
      });

      const result = await stopPromise;

      expect(result).toBe(true);
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"type":"quit"')
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Unity renderer stopped gracefully');
    });

    it('should send SIGTERM after quit command timeout', async () => {
      jest.useFakeTimers();

      const stopPromise = unityBridge.stopRenderer();

      // Advance timers to trigger SIGTERM
      jest.advanceTimersByTime(2000);

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');

      // Simulate exit
      mockProcess.emit('exit', 0, null);
      
      jest.useRealTimers();
      await stopPromise;
    });

    it('should force kill with SIGKILL after 10 second timeout', async () => {
      jest.useFakeTimers();

      const stopPromise = unityBridge.stopRenderer();

      // Advance timers to trigger force kill
      jest.advanceTimersByTime(10000);

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Unity renderer did not exit gracefully, force killing'
      );

      jest.useRealTimers();
      await stopPromise;
    });

    it('should return false if renderer not running', async () => {
      unityBridge.isRunning = false;
      unityBridge.rendererProcess = null;

      const result = await unityBridge.stopRenderer();

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith('Unity renderer not running');
    });

    it('should clear timeout on successful exit', async () => {
      jest.useFakeTimers();
      
      const stopPromise = unityBridge.stopRenderer();

      // Simulate immediate exit
      mockProcess.emit('exit', 0, null);

      await stopPromise;

      // Advance timers - should not trigger force kill
      jest.advanceTimersByTime(15000);

      // Only quit command should have been written
      expect(mockProcess.stdin.write).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });
  });

  describe('sendCommand', () => {
    beforeEach(() => {
      unityBridge = new UnityBridge();
      unityBridge.rendererProcess = mockProcess;
      unityBridge.isRunning = true;
    });

    it('should send JSON command to Unity via stdin', () => {
      const command = { type: 'updateConfig', config: { pinkIntensity: 0.95 } };

      const result = unityBridge.sendCommand(command);

      expect(result).toBe(true);
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        JSON.stringify(command) + '\n'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Sent command to Unity',
        expect.objectContaining({ command })
      );
    });

    it('should return false if renderer not running', () => {
      unityBridge.isRunning = false;

      const result = unityBridge.sendCommand({ type: 'test' });

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Cannot send command, renderer not running'
      );
      expect(mockProcess.stdin.write).not.toHaveBeenCalled();
    });

    it('should handle stdin write errors', () => {
      mockProcess.stdin.write.mockImplementation(() => {
        throw new Error('Broken pipe');
      });

      const result = unityBridge.sendCommand({ type: 'test' });

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send command to Unity',
        expect.objectContaining({ error: 'Broken pipe' })
      );
    });

    it('should append newline to command JSON', () => {
      unityBridge.sendCommand({ type: 'test' });

      const writtenData = mockProcess.stdin.write.mock.calls[0][0];
      expect(writtenData).toMatch(/\n$/);
    });
  });

  describe('updateCathedralConfig', () => {
    beforeEach(() => {
      unityBridge = new UnityBridge();
    });

    it('should update scene config and send command if running', () => {
      unityBridge.rendererProcess = mockProcess;
      unityBridge.isRunning = true;

      const newConfig = { pinkIntensity: 0.95, eldritchLevel: 777 };
      
      unityBridge.updateCathedralConfig(newConfig);

      expect(unityBridge.sceneConfig.pinkIntensity).toBe(0.95);
      expect(unityBridge.sceneConfig.eldritchLevel).toBe(777);
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"type":"updateConfig"')
      );
    });

    it('should update config without sending command if not running', () => {
      unityBridge.isRunning = false;

      const newConfig = { pinkIntensity: 0.5 };
      
      unityBridge.updateCathedralConfig(newConfig);

      expect(unityBridge.sceneConfig.pinkIntensity).toBe(0.5);
      expect(mockProcess.stdin.write).not.toHaveBeenCalled();
    });

    it('should emit config:updated event', (done) => {
      unityBridge.on('config:updated', ({ config }) => {
        expect(config.pinkIntensity).toBe(0.99);
        done();
      });

      unityBridge.updateCathedralConfig({ pinkIntensity: 0.99 });
    });

    it('should merge config with existing values', () => {
      const originalConfig = { ...unityBridge.sceneConfig };
      
      unityBridge.updateCathedralConfig({ pinkIntensity: 0.5 });

      expect(unityBridge.sceneConfig.style).toBe(originalConfig.style);
      expect(unityBridge.sceneConfig.lighting).toBe(originalConfig.lighting);
      expect(unityBridge.sceneConfig.pinkIntensity).toBe(0.5);
    });
  });

  describe('triggerEffect', () => {
    beforeEach(() => {
      unityBridge = new UnityBridge();
      unityBridge.rendererProcess = mockProcess;
      unityBridge.isRunning = true;
    });

    it('should send trigger effect command with parameters', () => {
      unityBridge.triggerEffect('neonPulse', { intensity: 10 });

      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"type":"triggerEffect"')
      );
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"effectType":"neonPulse"')
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Triggered cathedral effect',
        expect.objectContaining({
          effectType: 'neonPulse',
          params: { intensity: 10 }
        })
      );
    });

    it('should send effect command with empty params', () => {
      unityBridge.triggerEffect('holyBlast');

      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"params":{}')
      );
    });
  });

  describe('getStatus', () => {
    it('should return status when renderer is running', () => {
      unityBridge = new UnityBridge();
      unityBridge.rendererProcess = mockProcess;
      unityBridge.isRunning = true;

      const status = unityBridge.getStatus();

      expect(status).toEqual({
        isRunning: true,
        pid: 12345,
        projectPath: expect.any(String),
        sceneConfig: expect.any(Object)
      });
    });

    it('should return status when renderer is not running', () => {
      unityBridge = new UnityBridge();

      const status = unityBridge.getStatus();

      expect(status).toEqual({
        isRunning: false,
        pid: null,
        projectPath: expect.any(String),
        sceneConfig: expect.any(Object)
      });
    });
  });

  describe('RENDERER_TYPES constant', () => {
    it('should export RENDERER_TYPES with correct values', () => {
      const { RENDERER_TYPES } = require('../../unity/unity-bridge');

      expect(RENDERER_TYPES).toEqual({
        CATHEDRAL: 'cathedral',
        CHURCH: 'church',
        CYBER_GOTH: 'cyber-goth',
        ELECTRO_NUCLEAR: 'electro-nuclear'
      });
    });
  });
});
