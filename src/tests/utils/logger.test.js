/**
 * Tests for Logger utility
 * Target: 100% coverage (branches, functions, lines, statements)
 */

const Logger = require('../../utils/logger');
const fs = require('fs');
const path = require('path');

describe('Logger', () => {
  let testLogFile;
  let logger;

  beforeEach(() => {
    testLogFile = path.join(__dirname, '../../../logs/test.log');
    // Clean up test log file
    if (fs.existsSync(testLogFile)) {
      fs.unlinkSync(testLogFile);
    }
  });

  afterEach(() => {
    // Clean up test log file
    if (fs.existsSync(testLogFile)) {
      fs.unlinkSync(testLogFile);
    }
  });

  describe('Constructor', () => {
    it('should create logger with default options', () => {
      logger = new Logger();
      expect(logger).toBeDefined();
      expect(logger.level).toBe('INFO');
      expect(logger.enableConsole).toBe(true);
    });

    it('should create logger with custom options', () => {
      logger = new Logger({
        level: 'DEBUG',
        logFile: testLogFile,
        enableConsole: false,
        enableFile: true,
        jsonFormat: true,
        includeTimestamp: false,
        includeContext: false,
        context: { app: 'test' }
      });
      
      expect(logger.level).toBe('DEBUG');
      expect(logger.logFile).toBe(testLogFile);
      expect(logger.enableConsole).toBe(false);
      expect(logger.enableFile).toBe(true);
      expect(logger.jsonFormat).toBe(true);
      expect(logger.includeTimestamp).toBe(false);
      expect(logger.includeContext).toBe(false);
      expect(logger.context).toEqual({ app: 'test' });
    });

    it('should create log directory if file logging is enabled', () => {
      const logDir = path.dirname(testLogFile);
      if (fs.existsSync(logDir)) {
        fs.rmdirSync(logDir, { recursive: true });
      }

      logger = new Logger({
        logFile: testLogFile,
        enableFile: true
      });

      expect(fs.existsSync(logDir)).toBe(true);
    });

    it('should respect environment variables', () => {
      process.env.LOG_LEVEL = 'TRACE';
      process.env.LOG_FILE = testLogFile;
      
      logger = new Logger();
      
      expect(logger.level).toBe('TRACE');
      expect(logger.logFile).toBe(testLogFile);

      delete process.env.LOG_LEVEL;
      delete process.env.LOG_FILE;
    });
  });

  describe('Log Levels', () => {
    beforeEach(() => {
      logger = new Logger({ enableConsole: false, enableFile: false });
    });

    it('should get correct numeric log level', () => {
      expect(logger.getLogLevel('ERROR')).toBe(0);
      expect(logger.getLogLevel('WARN')).toBe(1);
      expect(logger.getLogLevel('INFO')).toBe(2);
      expect(logger.getLogLevel('DEBUG')).toBe(3);
      expect(logger.getLogLevel('TRACE')).toBe(4);
    });

    it('should handle case-insensitive log levels', () => {
      expect(logger.getLogLevel('error')).toBe(0);
      expect(logger.getLogLevel('WaRn')).toBe(1);
    });

    it('should default to INFO for unknown log levels', () => {
      expect(logger.getLogLevel('UNKNOWN')).toBe(2);
    });

    it('should correctly determine if message should be logged', () => {
      logger.level = 'INFO';
      expect(logger.shouldLog('ERROR')).toBe(true);
      expect(logger.shouldLog('WARN')).toBe(true);
      expect(logger.shouldLog('INFO')).toBe(true);
      expect(logger.shouldLog('DEBUG')).toBe(false);
      expect(logger.shouldLog('TRACE')).toBe(false);
    });
  });

  describe('Message Formatting', () => {
    beforeEach(() => {
      logger = new Logger({ enableConsole: false, enableFile: false });
    });

    it('should format message with timestamp', () => {
      logger.includeTimestamp = true;
      const message = logger.formatMessage('INFO', 'Test message');
      expect(message).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      expect(message).toContain('[INFO]');
      expect(message).toContain('Test message');
    });

    it('should format message without timestamp', () => {
      logger.includeTimestamp = false;
      const message = logger.formatMessage('INFO', 'Test message');
      expect(message).not.toMatch(/\[\d{4}-\d{2}-\d{2}/);
      expect(message).toContain('[INFO]');
      expect(message).toContain('Test message');
    });

    it('should include context in message', () => {
      logger.includeContext = true;
      logger.context = { app: 'test' };
      const message = logger.formatMessage('INFO', 'Test message', { user: 'john' });
      expect(message).toContain('app:');
      expect(message).toContain('user:');
    });

    it('should format message as JSON', () => {
      logger.jsonFormat = true;
      logger.includeTimestamp = true;
      const message = logger.formatMessage('INFO', 'Test message', { key: 'value' });
      const parsed = JSON.parse(message);
      expect(parsed.level).toBe('INFO');
      expect(parsed.message).toBe('Test message');
      expect(parsed.key).toBe('value');
      expect(parsed.timestamp).toBeDefined();
    });

    it('should format console message with colors', () => {
      const message = logger.formatConsoleMessage('ERROR', 'Test error');
      expect(message).toContain('\x1b[31m'); // Red color
      expect(message).toContain('\x1b[0m');  // Reset
      expect(message).toContain('[ERROR]');
    });
  });

  describe('File Logging', () => {
    it('should write logs to file', () => {
      logger = new Logger({
        logFile: testLogFile,
        enableFile: true,
        enableConsole: false
      });

      logger.info('Test message');

      expect(fs.existsSync(testLogFile)).toBe(true);
      const content = fs.readFileSync(testLogFile, 'utf8');
      expect(content).toContain('Test message');
      expect(content).toContain('[INFO]');
    });

    it('should handle file write errors gracefully', () => {
      logger = new Logger({
        logFile: '/invalid/path/test.log',
        enableFile: true,
        enableConsole: false
      });

      // Should not throw
      expect(() => logger.info('Test message')).not.toThrow();
    });

    it('should not write to file when enableFile is false', () => {
      logger = new Logger({
        logFile: testLogFile,
        enableFile: false,
        enableConsole: false
      });

      logger.info('Test message');

      expect(fs.existsSync(testLogFile)).toBe(false);
    });
  });

  describe('Logging Methods', () => {
    beforeEach(() => {
      logger = new Logger({
        level: 'TRACE',
        enableConsole: false,
        logFile: testLogFile,
        enableFile: true
      });
    });

    it('should log error messages', () => {
      logger.error('Error message', { code: 500 });
      const content = fs.readFileSync(testLogFile, 'utf8');
      expect(content).toContain('[ERROR]');
      expect(content).toContain('Error message');
    });

    it('should log warning messages', () => {
      logger.warn('Warning message');
      const content = fs.readFileSync(testLogFile, 'utf8');
      expect(content).toContain('[WARN]');
      expect(content).toContain('Warning message');
    });

    it('should log info messages', () => {
      logger.info('Info message');
      const content = fs.readFileSync(testLogFile, 'utf8');
      expect(content).toContain('[INFO]');
      expect(content).toContain('Info message');
    });

    it('should log debug messages', () => {
      logger.debug('Debug message');
      const content = fs.readFileSync(testLogFile, 'utf8');
      expect(content).toContain('[DEBUG]');
      expect(content).toContain('Debug message');
    });

    it('should log trace messages', () => {
      logger.trace('Trace message');
      const content = fs.readFileSync(testLogFile, 'utf8');
      expect(content).toContain('[TRACE]');
      expect(content).toContain('Trace message');
    });

    it('should respect log level filtering', () => {
      logger.level = 'WARN';
      
      logger.error('Error');
      logger.warn('Warning');
      logger.info('Info');
      logger.debug('Debug');

      const content = fs.readFileSync(testLogFile, 'utf8');
      expect(content).toContain('Error');
      expect(content).toContain('Warning');
      expect(content).not.toContain('Info');
      expect(content).not.toContain('Debug');
    });
  });

  describe('Child Logger', () => {
    it('should create child logger with additional context', () => {
      logger = new Logger({
        context: { app: 'parent' },
        enableConsole: false,
        logFile: testLogFile,
        enableFile: true
      });

      const childLogger = logger.child({ module: 'child' });
      childLogger.info('Child message');

      const content = fs.readFileSync(testLogFile, 'utf8');
      expect(content).toContain('app:');
      expect(content).toContain('module:');
    });

    it('should inherit parent logger settings', () => {
      logger = new Logger({
        level: 'DEBUG',
        jsonFormat: true,
        enableConsole: false
      });

      const childLogger = logger.child({ id: 123 });
      expect(childLogger.level).toBe('DEBUG');
      expect(childLogger.jsonFormat).toBe(true);
      expect(childLogger.enableConsole).toBe(false);
    });
  });

  describe('Dynamic Configuration', () => {
    beforeEach(() => {
      logger = new Logger({ enableConsole: false, enableFile: false });
    });

    it('should set log level dynamically', () => {
      logger.setLevel('TRACE');
      expect(logger.getLevel()).toBe('TRACE');

      logger.setLevel('ERROR');
      expect(logger.getLevel()).toBe('ERROR');
    });

    it('should get current log level', () => {
      logger.level = 'DEBUG';
      expect(logger.getLevel()).toBe('DEBUG');
    });
  });

  describe('Module Exports', () => {
    it('should export Logger class', () => {
      expect(Logger).toBeDefined();
      expect(typeof Logger).toBe('function');
    });

    it('should export default logger instance', () => {
      expect(Logger.default).toBeDefined();
      expect(Logger.default).toBeInstanceOf(Logger);
    });

    it('should export Logger class as named export', () => {
      expect(Logger.Logger).toBeDefined();
      expect(Logger.Logger).toBe(Logger);
    });

    it('should export LOG_LEVELS constant', () => {
      expect(Logger.LOG_LEVELS).toBeDefined();
      expect(Logger.LOG_LEVELS.ERROR).toBe(0);
      expect(Logger.LOG_LEVELS.TRACE).toBe(4);
    });
  });
});
