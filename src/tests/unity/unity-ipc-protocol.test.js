/**
 * BambiSleep™ Church - Unity IPC Protocol Tests (v1.0.0)
 * Comprehensive test coverage for Unity JSON IPC message protocol
 * Tests bidirectional communication: Node.js ↔ Unity
 */

const { EventEmitter } = require('events');
const UnityBridge = require('../../unity/unity-bridge');

// Mock child_process and logger
jest.mock('child_process');
jest.mock('../../utils/logger');

const { spawn } = require('child_process');
const Logger = require('../../utils/logger');

describe('Unity IPC Protocol v1.0.0', () => {
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
      error: jest.fn(),
      trace: jest.fn()
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

  describe('Node.js → Unity Messages', () => {
    beforeEach(async () => {
      unityBridge = new UnityBridge();
      await unityBridge.startRenderer();
      mockProcess.stdin.write.mockClear(); // Clear start messages
    });

    it('should send initialize message with correct format', () => {
      unityBridge.initializeScene({
        sceneName: 'MainScene',
        pinkIntensity: 0.95,
        eldritchLevel: 777,
        cathedralWidth: 30,
        neonIntensity: 7.5
      });

      expect(mockProcess.stdin.write).toHaveBeenCalledTimes(1);
      const writtenData = mockProcess.stdin.write.mock.calls[0][0];
      const message = JSON.parse(writtenData);

      expect(message).toMatchObject({
        type: 'initialize',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        data: expect.objectContaining({
          sceneName: 'MainScene',
          pinkIntensity: 0.95,
          eldritchLevel: 777,
          cathedralWidth: 30,
          neonIntensity: 7.5
        })
      });
    });

    it('should send updateStyle message with partial parameters', () => {
      unityBridge.updateCathedralConfig({
        pinkIntensity: 0.99,
        neonFlickerSpeed: 1.5
      });

      const writtenData = mockProcess.stdin.write.mock.calls[0][0];
      const message = JSON.parse(writtenData);

      expect(message).toMatchObject({
        type: 'updateStyle',
        timestamp: expect.any(String),
        data: {
          pinkIntensity: 0.99,
          neonFlickerSpeed: 1.5
        }
      });
    });

    it('should send camera control message', () => {
      unityBridge.setCameraPosition(
        { x: 10, y: 20, z: -30 },
        { x: 15, y: 0, z: 0 },
        75
      );

      const writtenData = mockProcess.stdin.write.mock.calls[0][0];
      const message = JSON.parse(writtenData);

      expect(message).toMatchObject({
        type: 'camera',
        data: {
          position: { x: 10, y: 20, z: -30 },
          rotation: { x: 15, y: 0, z: 0 },
          fieldOfView: 75
        }
      });
    });

    it('should send render command message', () => {
      unityBridge.renderToFile('/tmp/cathedral.png', 1920, 1080, 'PNG');

      const writtenData = mockProcess.stdin.write.mock.calls[0][0];
      const message = JSON.parse(writtenData);

      expect(message).toMatchObject({
        type: 'render',
        data: {
          outputPath: '/tmp/cathedral.png',
          width: 1920,
          height: 1080,
          format: 'PNG'
        }
      });
    });

    it('should send postprocessing message with effects', () => {
      unityBridge.updatePostProcessing({
        bloom: 4.5,
        chromaticAberration: 0.5,
        vignette: 0.6,
        enabled: true
      });

      const writtenData = mockProcess.stdin.write.mock.calls[0][0];
      const message = JSON.parse(writtenData);

      expect(message).toMatchObject({
        type: 'postprocessing',
        data: {
          bloom: 4.5,
          chromaticAberration: 0.5,
          vignette: 0.6,
          enabled: true
        }
      });
    });

    it('should send setPaused message', () => {
      unityBridge.setPaused(true);

      const writtenData = mockProcess.stdin.write.mock.calls[0][0];
      const message = JSON.parse(writtenData);

      expect(message).toMatchObject({
        type: 'setPaused',
        data: {
          paused: true
        }
      });
    });

    it('should send shutdown message on stopRenderer', async () => {
      const stopPromise = unityBridge.stopRenderer();

      const writtenData = mockProcess.stdin.write.mock.calls[0][0];
      const message = JSON.parse(writtenData);

      expect(message).toMatchObject({
        type: 'shutdown',
        data: {
          graceful: true
        }
      });

      // Simulate exit
      mockProcess.emit('exit', 0);
      await stopPromise;
    });

    it('should use sendMessage method with custom type and data', () => {
      unityBridge.sendMessage('customCommand', { customParam: 123 });

      const writtenData = mockProcess.stdin.write.mock.calls[0][0];
      const message = JSON.parse(writtenData);

      expect(message).toMatchObject({
        type: 'customCommand',
        data: {
          customParam: 123
        }
      });
    });

    it('should support legacy sendCommand method (deprecated)', () => {
      unityBridge.sendCommand({ type: 'legacyCommand', someData: 'test' });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'sendCommand is deprecated, use sendMessage instead'
      );
      expect(mockProcess.stdin.write).toHaveBeenCalled();
    });

    it('should fail gracefully when renderer not running', () => {
      unityBridge.isRunning = false;
      unityBridge.rendererProcess = null;

      const result = unityBridge.sendMessage('test', {});

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Cannot send message, renderer not running'
      );
    });

    it('should handle stdin write errors', () => {
      mockProcess.stdin.write.mockImplementation(() => {
        throw new Error('EPIPE: broken pipe');
      });

      const result = unityBridge.sendMessage('test', {});

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send message to Unity',
        expect.objectContaining({
          error: 'EPIPE: broken pipe',
          type: 'test'
        })
      );
    });
  });

  describe('Unity → Node.js Messages', () => {
    beforeEach(async () => {
      unityBridge = new UnityBridge();
      await unityBridge.startRenderer();
    });

    it('should handle scene-loaded message', (done) => {
      unityBridge.on('unity:scene-loaded', (data) => {
        expect(data.sceneName).toBe('MainScene');
        expect(data.objectCount).toBe(156);
        expect(data.renderTime).toBeCloseTo(234.5);
        done();
      });

      unityBridge.on('cathedral:ready', (data) => {
        expect(data.sceneName).toBe('MainScene');
      });

      const message = JSON.stringify({
        type: 'scene-loaded',
        timestamp: '2024-01-15T12:34:56.789Z',
        data: {
          sceneName: 'MainScene',
          objectCount: 156,
          renderTime: 234.5
        }
      });

      mockProcess.stdout.emit('data', Buffer.from(message + '\n'));
    });

    it('should handle render-complete message', (done) => {
      unityBridge.on('unity:render-complete', (data) => {
        expect(data.outputPath).toBe('/tmp/cathedral.png');
        expect(data.renderTime).toBeCloseTo(1234.5);
        expect(data.width).toBe(1920);
        expect(data.height).toBe(1080);
        done();
      });

      const message = JSON.stringify({
        type: 'render-complete',
        timestamp: '2024-01-15T12:34:57.890Z',
        data: {
          outputPath: '/tmp/cathedral.png',
          renderTime: 1234.5,
          width: 1920,
          height: 1080
        }
      });

      mockProcess.stdout.emit('data', Buffer.from(message + '\n'));
    });

    it('should handle update-ack message', (done) => {
      unityBridge.on('unity:update-ack', (data) => {
        expect(data.success).toBe(true);
        expect(data.pinkIntensity).toBeCloseTo(0.95);
        expect(data.eldritchLevel).toBe(777);
        done();
      });

      const message = JSON.stringify({
        type: 'update-ack',
        timestamp: '2024-01-15T12:34:58.123Z',
        data: {
          success: true,
          pinkIntensity: 0.95,
          eldritchLevel: 777
        }
      });

      mockProcess.stdout.emit('data', Buffer.from(message + '\n'));
    });

    it('should handle error message with all error codes', async () => {
      const errorCodes = [
        'SHADER_COMPILATION_FAILED',
        'SCENE_LOAD_FAILED',
        'RENDER_FAILED',
        'INVALID_MESSAGE',
        'PARAMETER_OUT_OF_RANGE'
      ];

      for (const errorCode of errorCodes) {
        const errorReceived = new Promise((resolve) => {
          unityBridge.once('renderer:error', (errorData) => {
            expect(errorData.error).toBeInstanceOf(Error);
            expect(errorData.errorCode).toBe(errorCode);
            resolve();
          });
        });

        const message = JSON.stringify({
          type: 'error',
          timestamp: new Date().toISOString(),
          data: {
            errorCode,
            message: `Test error: ${errorCode}`,
            stack: 'UnityEngine.Error:Test...'
          }
        });

        mockProcess.stdout.emit('data', Buffer.from(message + '\n'));
        await errorReceived;
      }
    });

    it('should handle heartbeat message', (done) => {
      unityBridge.on('unity:heartbeat', (data) => {
        expect(data.fps).toBe(60);
        expect(data.memoryUsageMB).toBe(512);
        expect(data.activeObjects).toBe(156);
        done();
      });

      const message = JSON.stringify({
        type: 'heartbeat',
        timestamp: '2024-01-15T12:35:00.789Z',
        data: {
          fps: 60,
          memoryUsageMB: 512,
          activeObjects: 156
        }
      });

      mockProcess.stdout.emit('data', Buffer.from(message + '\n'));
    });

    it('should handle shutdownComplete message', (done) => {
      unityBridge.on('unity:shutdownComplete', (data) => {
        expect(data.totalFrames).toBe(5000);
        expect(data.uptime).toBe(300000);
        done();
      });

      const message = JSON.stringify({
        type: 'shutdownComplete',
        timestamp: '2024-01-15T12:35:01.123Z',
        data: {
          totalFrames: 5000,
          uptime: 300000
        }
      });

      mockProcess.stdout.emit('data', Buffer.from(message + '\n'));
    });

    it('should handle multiple messages in single data chunk', async () => {
      const receivedMessages = [];
      
      unityBridge.on('unity:scene-loaded', (data) => 
        receivedMessages.push({ type: 'scene-loaded', data }));
      unityBridge.on('unity:heartbeat', (data) => 
        receivedMessages.push({ type: 'heartbeat', data }));
      unityBridge.on('unity:update-ack', (data) => 
        receivedMessages.push({ type: 'update-ack', data }));

      const messages = [
        { type: 'scene-loaded', timestamp: new Date().toISOString(), 
          data: { sceneName: 'MainScene', objectCount: 100, renderTime: 123.4 } },
        { type: 'heartbeat', timestamp: new Date().toISOString(), 
          data: { fps: 60, memoryUsageMB: 512, activeObjects: 100 } },
        { type: 'update-ack', timestamp: new Date().toISOString(), 
          data: { success: true, pinkIntensity: 0.8, eldritchLevel: 666 } }
      ];

      const combinedData = messages.map(m => JSON.stringify(m)).join('\n') + '\n';
      mockProcess.stdout.emit('data', Buffer.from(combinedData));

      await new Promise(resolve => setImmediate(resolve));

      expect(receivedMessages).toHaveLength(3);
      expect(receivedMessages[0].type).toBe('scene-loaded');
      expect(receivedMessages[1].type).toBe('heartbeat');
      expect(receivedMessages[2].type).toBe('update-ack');
    });

    it('should handle incomplete JSON across multiple data chunks', async () => {
      const receivedData = [];
      unityBridge.on('unity:scene-loaded', (data) => receivedData.push(data));

      const fullMessage = JSON.stringify({
        type: 'scene-loaded',
        timestamp: '2024-01-15T12:35:04.123Z',
        data: { sceneName: 'MainScene', objectCount: 200, renderTime: 456.7 }
      });

      // Split message into three chunks
      const chunk1 = fullMessage.substring(0, 30);
      const chunk2 = fullMessage.substring(30, 80);
      const chunk3 = fullMessage.substring(80) + '\n';

      mockProcess.stdout.emit('data', Buffer.from(chunk1));
      mockProcess.stdout.emit('data', Buffer.from(chunk2));
      mockProcess.stdout.emit('data', Buffer.from(chunk3));

      await new Promise(resolve => setImmediate(resolve));

      expect(receivedData).toHaveLength(1);
      expect(receivedData[0].sceneName).toBe('MainScene');
      expect(receivedData[0].objectCount).toBe(200);
    });

    it('should handle non-JSON Unity log output gracefully', (done) => {
      unityBridge.on('renderer:output', (output) => {
        expect(output.type).toBe('stdout');
        expect(output.data).toBe('Unity Debug Log: Non-JSON message');
        done();
      });

      mockProcess.stdout.emit('data', Buffer.from('Unity Debug Log: Non-JSON message\n'));
    });

    it('should emit cathedral:ready on legacy "Cathedral Ready" message', (done) => {
      unityBridge.on('cathedral:ready', () => {
        done();
      });

      mockProcess.stdout.emit('data', Buffer.from('✨ Cathedral Ready\n'));
    });

    it('should log warning for message missing type field', async () => {
      const invalidMessage = JSON.stringify({
        timestamp: '2024-01-15T12:35:05.456Z',
        data: { test: 'data' }
      });

      mockProcess.stdout.emit('data', Buffer.from(invalidMessage + '\n'));
      await new Promise(resolve => setImmediate(resolve));

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'IPC message missing type field',
        expect.objectContaining({ message: expect.any(Object) })
      );
    });

    it('should handle empty lines in stdout gracefully', async () => {
      const output = '\n\n  \n\n';
      mockProcess.stdout.emit('data', Buffer.from(output));

      await new Promise(resolve => setImmediate(resolve));

      // Should not crash or emit any events
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  describe('Protocol Error Handling', () => {
    beforeEach(async () => {
      unityBridge = new UnityBridge();
      await unityBridge.startRenderer();
    });

    it('should handle malformed JSON gracefully', async () => {
      const malformedJson = '{ "type": "test", "data": { broken';

      mockProcess.stdout.emit('data', Buffer.from(malformedJson + '\n'));
      await new Promise(resolve => setImmediate(resolve));

      // Should treat as regular Unity log output
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Unity stdout',
        expect.objectContaining({ output: expect.any(String) })
      );
    });

    it('should log all IPC messages at debug level', async () => {
      const message = JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        data: { fps: 60, memoryUsageMB: 512, activeObjects: 100 }
      });

      mockProcess.stdout.emit('data', Buffer.from(message + '\n'));
      await new Promise(resolve => setImmediate(resolve));

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Unity IPC message received',
        expect.objectContaining({
          type: 'heartbeat',
          data: expect.any(Object)
        })
      );
    });

    it('should trace heartbeat messages without spamming logs', async () => {
      const message = JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        data: { fps: 60, memoryUsageMB: 512, activeObjects: 100 }
      });

      mockProcess.stdout.emit('data', Buffer.from(message + '\n'));
      await new Promise(resolve => setImmediate(resolve));

      expect(mockLogger.trace).toHaveBeenCalledWith(
        'Unity heartbeat',
        expect.any(Object)
      );
    });
  });

  describe('IPC Message Flow Example', () => {
    beforeEach(async () => {
      unityBridge = new UnityBridge();
      await unityBridge.startRenderer();
      mockProcess.stdin.write.mockClear();
    });

    it('should complete full initialize-render-shutdown flow', async () => {
      const flowEvents = [];

      // Track all events
      unityBridge.on('unity:scene-loaded', (data) => {
        flowEvents.push({ event: 'scene-loaded', data });
      });
      unityBridge.on('unity:update-ack', (data) => {
        flowEvents.push({ event: 'update-ack', data });
      });
      unityBridge.on('unity:render-complete', (data) => {
        flowEvents.push({ event: 'render-complete', data });
      });
      unityBridge.on('unity:shutdownComplete', (data) => {
        flowEvents.push({ event: 'shutdownComplete', data });
      });

      // 1. Initialize scene
      unityBridge.initializeScene({ sceneName: 'MainScene', pinkIntensity: 0.8 });
      
      // 2. Unity responds: scene-loaded
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'scene-loaded',
        timestamp: new Date().toISOString(),
        data: { sceneName: 'MainScene', objectCount: 150, renderTime: 234.5 }
      }) + '\n'));

      // 3. Update style
      unityBridge.updateCathedralConfig({ pinkIntensity: 0.95 });

      // 4. Unity responds: update-ack
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'update-ack',
        timestamp: new Date().toISOString(),
        data: { success: true, pinkIntensity: 0.95, eldritchLevel: 666 }
      }) + '\n'));

      // 5. Render to file
      unityBridge.renderToFile('/tmp/cathedral.png', 1920, 1080);

      // 6. Unity responds: render-complete
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'render-complete',
        timestamp: new Date().toISOString(),
        data: { outputPath: '/tmp/cathedral.png', renderTime: 1234.5, width: 1920, height: 1080 }
      }) + '\n'));

      // 7. Shutdown
      const shutdownPromise = unityBridge.stopRenderer();

      // 8. Unity responds: shutdownComplete
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'shutdownComplete',
        timestamp: new Date().toISOString(),
        data: { totalFrames: 5000, uptime: 300000 }
      }) + '\n'));

      mockProcess.emit('exit', 0);
      await shutdownPromise;

      await new Promise(resolve => setImmediate(resolve));

      // Verify complete flow
      expect(flowEvents).toHaveLength(4);
      expect(flowEvents[0].event).toBe('scene-loaded');
      expect(flowEvents[1].event).toBe('update-ack');
      expect(flowEvents[2].event).toBe('render-complete');
      expect(flowEvents[3].event).toBe('shutdownComplete');

      // Verify all commands sent
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"type":"initialize"')
      );
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"type":"updateStyle"')
      );
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"type":"render"')
      );
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"type":"shutdown"')
      );
    });
  });
});
