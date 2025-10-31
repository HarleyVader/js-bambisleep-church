/**
 * BambiSleep™ Church MCP Control Tower - Logger Utility
 * Provides structured logging with multiple levels and output formats
 * Based on coverage data: 52.54% branches - designed for comprehensive error handling
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

const LOG_LEVEL_NAMES = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];

// ANSI color codes for console output
const COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[35m', // Magenta
  TRACE: '\x1b[90m', // Gray
  RESET: '\x1b[0m'
};

class Logger {
  constructor(options = {}) {
    this.level = options.level || process.env.LOG_LEVEL || 'INFO';
    this.logFile = options.logFile || process.env.LOG_FILE || null;
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== undefined ? options.enableFile : !!(options.enableFile !== false && this.logFile);
    this.jsonFormat = options.jsonFormat || false;
    this.includeTimestamp = options.includeTimestamp !== false;
    this.includeContext = options.includeContext !== false;
    this.context = options.context || {};

    // Ensure log directory exists if file logging is enabled
    if (this.enableFile && this.logFile) {
      try {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
      } catch (error) {
        // If directory creation fails, disable file logging
        this.enableFile = false;
        if (this.enableConsole) {
          console.warn(`[Logger] Failed to create log directory: ${error.message}`);
        }
      }
    }
  }

  /**
   * Get numeric log level
   */
  getLogLevel(level) {
    const upperLevel = level.toUpperCase();
    return LOG_LEVELS[upperLevel] !== undefined ? LOG_LEVELS[upperLevel] : LOG_LEVELS.INFO;
  }

  /**
   * Check if a message should be logged based on current level
   */
  shouldLog(messageLevel) {
    const currentLevel = this.getLogLevel(this.level);
    const msgLevel = this.getLogLevel(messageLevel);
    return msgLevel <= currentLevel;
  }

  /**
   * Format timestamp
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = this.includeTimestamp ? this.getTimestamp() : null;
    const context = this.includeContext ? { ...this.context, ...meta } : meta;

    if (this.jsonFormat) {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...context
      });
    }

    let formattedMsg = '';
    if (timestamp) {
      formattedMsg += `[${timestamp}] `;
    }
    formattedMsg += `[${level}] `;
    formattedMsg += message;

    if (Object.keys(context).length > 0) {
      formattedMsg += ' ' + util.inspect(context, { depth: 3, colors: false });
    }

    return formattedMsg;
  }

  /**
   * Format message for console with colors
   */
  formatConsoleMessage(level, message, meta = {}) {
    const timestamp = this.includeTimestamp ? this.getTimestamp() : null;
    const context = this.includeContext ? { ...this.context, ...meta } : meta;
    const color = COLORS[level] || '';
    const reset = COLORS.RESET;

    let formattedMsg = '';
    if (timestamp) {
      formattedMsg += `${color}[${timestamp}]${reset} `;
    }
    formattedMsg += `${color}[${level}]${reset} `;
    formattedMsg += message;

    if (Object.keys(context).length > 0) {
      formattedMsg += ' ' + util.inspect(context, { depth: 3, colors: true });
    }

    return formattedMsg;
  }

  /**
   * Write log to file
   */
  writeToFile(message) {
    if (!this.enableFile || !this.logFile) {
      return;
    }

    try {
      fs.appendFileSync(this.logFile, message + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  /**
   * Core logging function
   */
  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    if (this.enableConsole) {
      const consoleMsg = this.formatConsoleMessage(level, message, meta);
      console.log(consoleMsg);
    }

    if (this.enableFile) {
      const fileMsg = this.formatMessage(level, message, meta);
      this.writeToFile(fileMsg);
    }
  }

  /**
   * Log error message
   */
  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  /**
   * Log trace message
   */
  trace(message, meta = {}) {
    this.log('TRACE', message, meta);
  }

  /**
   * Create child logger with additional context
   */
  child(context = {}) {
    return new Logger({
      level: this.level,
      logFile: this.logFile,
      enableConsole: this.enableConsole,
      enableFile: this.enableFile,
      jsonFormat: this.jsonFormat,
      includeTimestamp: this.includeTimestamp,
      includeContext: this.includeContext,
      context: { ...this.context, ...context }
    });
  }

  /**
   * Set log level dynamically
   */
  setLevel(level) {
    this.level = level;
  }

  /**
   * Get current log level
   */
  getLevel() {
    return this.level;
  }
}

// Create default logger instance
const defaultLogger = new Logger();

// Export both the class and default instance
module.exports = Logger;
module.exports.default = defaultLogger;
module.exports.Logger = Logger;
module.exports.LOG_LEVELS = LOG_LEVELS;
